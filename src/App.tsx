/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Sparkles, Heart, Music, MessageCircle, RefreshCw, Calendar } from 'lucide-react';
import LockScreen from './components/LockScreen';
import VoiceNoteSection from './components/VoiceNoteSection';
import VirtualCakeSection from './components/VirtualCakeSection';
import MemoryTimelineSection from './components/MemoryTimelineSection';
import WishingStarSection from './components/WishingStarSection';
import { PageId } from './types';
import { getMediaFromDB, saveMediaToDB, deleteMediaFromDB } from './utils/audioDb';

const DEFAULT_BG_SONG = 'https://assets.mixkit.co/music/preview/mixkit-sad-lo-fi-piano-2207.mp3';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<PageId>('voicenote');
  const [isMuted, setIsMuted] = useState(false);

  // Dynamic Audio Assets URLs & state
  const [voiceNoteUrl, setVoiceNoteUrl] = useState<string>('/birthdaywish.mp4');
  const [songUrl, setSongUrl] = useState<string>(DEFAULT_BG_SONG);
  const [voiceNoteName, setVoiceNoteName] = useState<string>('birthdaywish.mp4');
  const [songName, setSongName] = useState<string>('Default Lo-Fi Piano');
  const [isVoiceCached, setIsVoiceCached] = useState<boolean>(false);
  const [isSongCached, setIsSongCached] = useState<boolean>(false);

  // Audio refs
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);

  // Load cached files from IndexedDB on startup
  useEffect(() => {
    async function initMediaCache() {
      try {
        const cachedVoice = await getMediaFromDB('voice_note');
        if (cachedVoice) {
          setVoiceNoteUrl(cachedVoice.url);
          setVoiceNoteName('birthdaywish.mp4 (Offline cached)');
          setIsVoiceCached(true);
        }

        const cachedSong = await getMediaFromDB('song');
        if (cachedSong) {
          setSongUrl(cachedSong.url);
          setSongName('phir_iss_janam.mp3 (Offline cached)');
          setIsSongCached(true);
        }
      } catch (err) {
        console.warn('DB initialization failed, falling back to network:', err);
      }
    }
    
    // Load session unlock state
    const savedUnlock = sessionStorage.getItem('echoes_june_unlocked_session');
    if (savedUnlock === 'true') {
      setIsUnlocked(true);
    }

    initMediaCache();
  }, []);

  // Update mute state on HTML5 elements directly
  useEffect(() => {
    if (bgAudioRef.current) {
      bgAudioRef.current.muted = isMuted;
    }
    if (voiceAudioRef.current) {
      voiceAudioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Manage background song and soft fading when VoiceNote plays
  const handleVoicePlayState = (playing: boolean) => {
    if (!bgAudioRef.current) return;
    
    if (playing) {
      // Smooth fade out background music to 12% volume for clear voice
      let vol = bgAudioRef.current.volume;
      const fadeInterval = setInterval(() => {
        if (vol > 0.12) {
          vol = Math.max(0.12, vol - 0.1);
          if (bgAudioRef.current) bgAudioRef.current.volume = vol;
        } else {
          clearInterval(fadeInterval);
        }
      }, 80);
    } else {
      // Smooth fade back to 70% volume
      let vol = bgAudioRef.current.volume;
      const fadeInterval = setInterval(() => {
        if (vol < 0.70) {
          vol = Math.min(0.70, vol + 0.1);
          if (bgAudioRef.current) bgAudioRef.current.volume = vol;
        } else {
          clearInterval(fadeInterval);
        }
      }, 100);
    }
  };

  const handleUnlock = () => {
    setIsUnlocked(true);
    sessionStorage.setItem('echoes_june_unlocked_session', 'true');
    // Start background music immediately since we have user gesture (click unlock)
    setTimeout(() => {
      if (bgAudioRef.current && !isMuted) {
        bgAudioRef.current.volume = 0.70;
        bgAudioRef.current.play().catch(e => console.log('Autoplay blocked:', e));
      }
    }, 150);
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (bgAudioRef.current) {
      bgAudioRef.current.muted = nextMuted;
    }
    if (voiceAudioRef.current) {
      voiceAudioRef.current.muted = nextMuted;
    }
  };

  // Upload handlers
  const handleUploadVoiceNote = async (file: File) => {
    await saveMediaToDB('voice_note', file);
    const objectUrl = URL.createObjectURL(file);
    setVoiceNoteUrl(objectUrl);
    setVoiceNoteName(file.name + ' (Offline cached)');
    setIsVoiceCached(true);
  };

  const handleUploadSong = async (file: File) => {
    await saveMediaToDB('song', file);
    const objectUrl = URL.createObjectURL(file);
    setSongUrl(objectUrl);
    setSongName(file.name + ' (Offline cached)');
    setIsSongCached(true);
    
    // Auto play song on upload
    setTimeout(() => {
      if (bgAudioRef.current) {
        bgAudioRef.current.load();
        bgAudioRef.current.volume = 0.70;
        if (!isMuted) bgAudioRef.current.play().catch(() => {});
      }
    }, 100);
  };

  const handleResetMedia = async (type: 'voice' | 'song') => {
    if (type === 'voice') {
      await deleteMediaFromDB('voice_note');
      setVoiceNoteUrl('/birthdaywish.mp4');
      setVoiceNoteName('birthdaywish.mp4');
      setIsVoiceCached(false);
    } else {
      await deleteMediaFromDB('song');
      setSongUrl(DEFAULT_BG_SONG);
      setSongName('Default Lo-Fi Piano');
      setIsSongCached(false);
      setTimeout(() => {
        if (bgAudioRef.current) {
          bgAudioRef.current.load();
          if (!isMuted) bgAudioRef.current.play().catch(() => {});
        }
      }, 100);
    }
  };

  // Screen/Page mapping
  const renderChapterContent = () => {
    switch (activeTab) {
      case 'voicenote':
        return (
          <VoiceNoteSection 
            onNext={() => setActiveTab('cake')}
            voiceNoteUrl={voiceNoteUrl}
            voiceNoteName={voiceNoteName}
            songName={songName}
            isVoiceCached={isVoiceCached}
            isSongCached={isSongCached}
            onVoiceNoteUpload={handleUploadVoiceNote}
            onSongUpload={handleUploadSong}
            onResetMedia={handleResetMedia}
            onPlayChange={handleVoicePlayState}
          />
        );
      case 'cake':
        return (
          <VirtualCakeSection 
            onNext={() => setActiveTab('timeline')}
            voiceNoteUrl={voiceNoteUrl}
            bgAudioRef={bgAudioRef}
            onPlayChange={handleVoicePlayState}
          />
        );
      case 'timeline':
        return <MemoryTimelineSection onNext={() => setActiveTab('messagejar')} />;
      case 'messagejar':
        return <WishingStarSection />;
      default:
        return (
          <VoiceNoteSection 
            onNext={() => setActiveTab('cake')}
            voiceNoteUrl={voiceNoteUrl}
            voiceNoteName={voiceNoteName}
            songName={songName}
            isVoiceCached={isVoiceCached}
            isSongCached={isSongCached}
            onVoiceNoteUpload={handleUploadVoiceNote}
            onSongUpload={handleUploadSong}
            onResetMedia={handleResetMedia}
            onPlayChange={handleVoicePlayState}
          />
        );
    }
  };

  if (!isUnlocked) {
    return <LockScreen onUnlock={handleUnlock} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      
      {/* Starry Night particles canvas */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(15,23,42,0.6)_0%,rgba(2,6,23,1)_100%)] z-0" />
      <div className="absolute top-[10%] left-[8%] w-1 h-1 bg-white rounded-full animate-twinkle opacity-30" />
      <div className="absolute top-[25%] right-[15%] w-1.5 h-1.5 bg-rose-200 rounded-full animate-twinkle opacity-40 [animation-delay:1.5s]" />
      <div className="absolute bottom-[35%] left-[20%] w-1 h-1 bg-amber-100 rounded-full animate-twinkle opacity-50 [animation-delay:0.8s]" />
      <div className="absolute top-[60%] right-[30%] w-1 h-1 bg-white rounded-full animate-twinkle opacity-20 [animation-delay:2.2s]" />

      {/* Primary Navigation Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-900/60 bg-slate-950/40 backdrop-blur-md">
        
        {/* Subtle Brand details */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <Heart className="w-4 h-4 text-rose-400 fill-rose-500/10" />
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-serif italic tracking-wide text-slate-200">Echoes of June</h1>
            <p className="text-[9px] font-mono text-slate-500">A PRIVATE CELEBRATION • JUNE 5</p>
          </div>
        </div>

        {/* Floating Sound controller toggle */}
        <div className="flex items-center gap-4">
          <button
            id="ambient-radio-mute-btn"
            onClick={toggleMute}
            className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono select-none hover:text-rose-400 cursor-pointer active:scale-95 transition-all"
            title={isMuted ? "Unmute Ambient Melodies" : "Mute Ambient Melodies"}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] text-slate-500">AMBIENT OFF</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span className="text-[10px] text-rose-300">AMBIENT ON</span>
              </>
            )}
          </button>
        </div>

      </header>

      {/* Chapters Horizontal Sub-Progress Tabs */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 pt-8">
        <div className="flex justify-center md:justify-around overflow-x-auto pb-2 gap-1 md:gap-4 border-b border-slate-900/40 no-scrollbar">
          
          {[
            { id: 'voicenote', label: 'I. The Whisper', desc: 'Voice Note' },
            { id: 'cake', label: 'II. The Cake', desc: 'Slicing & Wish' },
            { id: 'timeline', label: 'III. Our Timeline', desc: 'Memory Lane' },
            { id: 'messagejar', label: 'IV. The Star Jar', desc: 'Silent wishes' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                id={`navigation-tab-${tab.id}`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id as PageId)}
                className={`py-2 px-4 rounded-xl text-center flex-shrink-0 transition-all duration-300 cursor-pointer ${
                  isActive 
                    ? 'bg-rose-500/10 border border-rose-500/20 text-rose-200 scale-102' 
                    : 'hover:bg-slate-900/40 text-slate-500 border border-transparent'
                }`}
              >
                <div className="text-[10px] font-mono tracking-widest">{tab.label}</div>
                <div className="text-[9px] font-sans opacity-60 tracking-wider hidden md:block">{tab.desc}</div>
              </button>
            );
          })}

        </div>
      </div>

      {/* Primary Section Canvas */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 md:px-6 py-8 flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full"
          >
            {renderChapterContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Quiet Footer Area */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 border-t border-slate-900/60 flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] font-mono text-slate-700 tracking-wider bg-slate-950/20">
        <div className="text-center md:text-left">
          ECHOES OF JUNE • REMAINING IN THE SILENT SHADOWS
        </div>
        <div className="flex items-center gap-1">
          <span>PORTAL VERIFIED</span>
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        </div>
      </footer>

      {/* HTML5 Background Audio Loop Element */}
      <audio
        id="atmos-bg-music-loop"
        ref={bgAudioRef}
        src={songUrl}
        loop
        playsInline
      />
    </div>
  );
}
