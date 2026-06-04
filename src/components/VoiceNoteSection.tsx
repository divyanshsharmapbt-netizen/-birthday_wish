/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Radio, Music, MessageSquare, Upload, RefreshCw, CheckCircle, Info, FileAudio } from 'lucide-react';

interface VoiceNoteSectionProps {
  onNext: () => void;
  voiceNoteUrl: string;
  voiceNoteName: string;
  songName: string;
  isVoiceCached: boolean;
  isSongCached: boolean;
  onVoiceNoteUpload: (file: File) => void;
  onSongUpload: (file: File) => void;
  onResetMedia: (type: 'voice' | 'song') => void;
  onPlayChange: (playing: boolean) => void;
}

export default function VoiceNoteSection({ 
  onNext, 
  voiceNoteUrl, 
  voiceNoteName, 
  songName,
  isVoiceCached,
  isSongCached,
  onVoiceNoteUpload, 
  onSongUpload,
  onResetMedia,
  onPlayChange
}: VoiceNoteSectionProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const voiceUploadRef = useRef<HTMLInputElement>(null);
  const songUploadRef = useRef<HTMLInputElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const [isUsingSynth, setIsUsingSynth] = useState(false);
  const synthAudioCtxRef = useRef<AudioContext | null>(null);
  const synthIntervalRef = useRef<any>(null);
  const tickerIntervalRef = useRef<any>(null);

  // Sync audio ref with external changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      setIsPlaying(false);
      setCurrentTime(0);
      setLoadError(false);
      setIsUsingSynth(false);
      stopSynth();
    }
  }, [voiceNoteUrl]);

  // Sync parent playing state for volume fading
  useEffect(() => {
    onPlayChange(isPlaying);
  }, [isPlaying, onPlayChange]);

  // Clean trigger loops on unmount
  useEffect(() => {
    return () => {
      onPlayChange(false);
      stopSynth();
      if (synthAudioCtxRef.current) {
        synthAudioCtxRef.current.close().catch(() => {});
      }
    };
  }, [onPlayChange]);

  const playSynthChord = (ctx: AudioContext, freqs: number[]) => {
    try {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, ctx.currentTime);
      filter.connect(ctx.destination);

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(filter);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        const startTime = ctx.currentTime + (idx * 0.15);
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(isMuted ? 0 : 0.02, startTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.4);
        
        osc.start(startTime);
        osc.stop(startTime + 2.5);
      });
    } catch (err) {
      console.warn("Synth voice play failed: ", err);
    }
  };

  const startSynth = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!synthAudioCtxRef.current) {
        synthAudioCtxRef.current = new AudioContextClass();
      }
      const ctx = synthAudioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const chords = [
        [261.63, 329.63, 392.00, 493.88], // Cmaj7
        [220.00, 261.63, 329.63, 392.00], // Am7
        [174.61, 220.00, 261.63, 349.23], // Fmaj7
        [196.00, 246.94, 293.66, 392.00]  // G6
      ];
      let chordIdx = 0;
      
      playSynthChord(ctx, chords[chordIdx]);
      chordIdx = (chordIdx + 1) % chords.length;

      if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = setInterval(() => {
        if (synthAudioCtxRef.current) {
          playSynthChord(synthAudioCtxRef.current, chords[chordIdx]);
          chordIdx = (chordIdx + 1) % chords.length;
        }
      }, 3000);

      setDuration(30);
      if (tickerIntervalRef.current) clearInterval(tickerIntervalRef.current);
      tickerIntervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.1;
          if (next >= 30) {
            stopSynth();
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 100);
    } catch (err) {
      console.warn("Could not start ambient synthesizer: ", err);
    }
  };

  const stopSynth = () => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
    if (tickerIntervalRef.current) {
      clearInterval(tickerIntervalRef.current);
      tickerIntervalRef.current = null;
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      if (isUsingSynth) {
        stopSynth();
      } else if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      if (loadError || isUsingSynth || !isVoiceCached) {
        setIsUsingSynth(true);
        startSynth();
        setIsPlaying(true);
      } else if (audioRef.current) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch((e) => {
            console.warn("Playback failed, falling back to synthesized ambient note: ", e);
            setLoadError(true);
            setIsUsingSynth(true);
            startSynth();
            setIsPlaying(true);
          });
      }
    }
  };

  const handleReset = () => {
    if (isUsingSynth) {
      stopSynth();
      setCurrentTime(0);
      startSynth();
      setIsPlaying(true);
    } else if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setLoadError(true);
          setIsUsingSynth(true);
          startSynth();
          setIsPlaying(true);
        });
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (isUsingSynth) return;
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (isUsingSynth) return;
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration || 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setCurrentTime(value);
    if (!isUsingSynth && audioRef.current) {
      audioRef.current.currentTime = value;
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleAudioError = () => {
    setLoadError(true);
    setIsUsingSynth(true);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVoiceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onVoiceNoteUpload(file);
    }
  };

  const handleSongFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSongUpload(file);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto py-2">
      {/* Voice Note Audio Tag */}
      <audio
        id="birthdaywish-media-node"
        ref={audioRef}
        src={voiceNoteUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleAudioError}
        playsInline
        className="hidden"
      />

      <div className="text-center space-y-2">
        <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">
          Chapter I • The Whisper
        </span>
        <h2 className="text-3xl md:text-4xl font-serif font-light text-slate-100 tracking-wide">
          A Message in a Bottle
        </h2>
        <p className="text-xs text-slate-400 font-light max-w-sm mx-auto leading-relaxed">
          happy birthday niche dekho ek voice note hai uske baad sabse neeche jakeprocess to cake pr click karna
          <span className="block mt-2 text-[11px] text-rose-300/80 italic font-normal">
            "maybe in another life there only you and me everything gonna perfect"
          </span>
        </p>
      </div>

      {/* Cassette Tape Deck UI */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="glass-panel p-6 md:p-8 rounded-3xl border border-rose-500/10 shadow-2xl space-y-6 relative overflow-hidden"
      >
        {/* Soft glowing ambient reflections */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        {/* Cassette Shape */}
        <div className="bg-slate-900/90 rounded-2xl border-4 border-slate-950 p-4 shadow-inner relative">
          {/* Cassette Window & Reels */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 py-6 px-8 flex justify-between items-center relative overflow-hidden">
            {/* Magnetic Tape Visual in Middle */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-6 bg-slate-900 rounded-md border border-slate-800 flex items-center justify-around px-1.5 opacity-80">
              <div className="w-1.5 h-1.5 bg-slate-800 rounded-full animate-pulse" />
              <div className="text-[8px] font-mono text-slate-600">VOICE_NOTE</div>
              <div className="w-1.5 h-1.5 bg-slate-800 rounded-full animate-pulse [animation-delay:0.5s]" />
            </div>

            {/* Left Roller Reel */}
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-14 h-14 rounded-full border-4 border-dashed border-rose-500/45 flex items-center justify-center ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
                <div className="w-6 h-6 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-950" />
                </div>
              </div>
              <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">A-SIDE</span>
            </div>

            {/* Right Roller Reel */}
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-14 h-14 rounded-full border-4 border-dashed border-amber-500/45 flex items-center justify-center ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
                <div className="w-6 h-6 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-950" />
                </div>
              </div>
              <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">90 MIN</span>
            </div>
          </div>

          {/* Holographic Label */}
          <div className="mt-4 bg-gradient-to-r from-rose-950/20 via-slate-900 to-amber-950/20 border border-slate-800 py-2.5 px-4 rounded-xl flex justify-between items-center text-xs">
            <div className="flex items-center gap-2 text-rose-300 max-w-[70%] overflow-hidden">
              <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400 flex-shrink-0" />
              <span className="font-mono tracking-wide text-[9px] truncate">{isUsingSynth ? "Nostalgic Ambient Synth (Active)" : voiceNoteName}</span>
            </div>
            <div className="text-slate-450 text-[10px] font-mono uppercase tracking-widest flex-shrink-0 text-amber-400">
              {isPlaying ? 'PLAYING' : 'PAUSED'}
            </div>
          </div>
        </div>

        {/* Playback Controls & Seeker */}
        <div className="space-y-4 pt-2">
          {/* Timeline slider and numerical timer */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono text-slate-500">
              <span>{formatTime(currentTime)}</span>
              <span>{duration > 0 ? formatTime(duration) : '00:15'}</span>
            </div>
            <input
              id="cassette-range-slider"
              type="range"
              min="0"
              max={duration > 0 ? duration : 15}
              step="0.05"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-rose-500 border border-slate-850"
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            {/* Left buttons (mute / unmute) */}
            <button
              id="mute-audio-btn"
              onClick={toggleMute}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 hover:text-rose-400 text-slate-400 transition-all border border-slate-850 cursor-pointer"
              title={isMuted ? "Unmute Voice" : "Mute Voice"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Crucial middle Play / Pause and Reset Trigger */}
            <div className="flex items-center gap-3">
              <button
                id="reset-audio-btn"
                onClick={handleReset}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 hover:text-amber-400 text-slate-400 transition-all border border-slate-850 cursor-pointer"
                title="Restart"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                id="play-audio-btn"
                onClick={togglePlay}
                className="w-14 h-14 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 p-0.5 shadow-xl hover:shadow-rose-950/20 active:scale-95 transition-all cursor-pointer"
              >
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-slate-100 hover:bg-transparent transition-colors">
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-orange-300" fill="currentColor" />
                  ) : (
                    <Play className="w-6 h-6 text-rose-300 translate-x-[2px]" fill="currentColor" />
                  )}
                </div>
              </button>
            </div>

            {/* Right button (ambient guide) */}
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-850 text-slate-500 flex gap-1 items-center">
              <Music className={`w-4 h-4 ${isPlaying ? 'animate-bounce text-orange-400' : ''}`} />
            </div>
          </div>
        </div>

        {/* Warning Fallback Information if File Missing */}
        {loadError && (
          <div className="bg-amber-950/20 border border-amber-500/20 px-4 py-3 rounded-2xl text-[11px] text-amber-400 font-sans leading-normal flex items-start gap-2">
            <Info className="w-4.5 h-4.5 translate-y-[2px] flex-shrink-0 text-amber-500" />
            <div className="space-y-1">
              <span className="font-medium">Voice Note File Error:</span>
              <p className="opacity-95 leading-relaxed">
                We couldn't locate pre-loaded <code>birthdaywish.mp4</code>. Please use the <strong>Media Setup Center</strong> below to quickly attach your audio/video and hear it instantly!
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Media Setup Cabinet */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-panel p-6 rounded-3xl border border-slate-900/80 bg-slate-900/20 space-y-5"
      >
        <div className="flex items-center gap-2 pb-1 border-b border-slate-900">
          <FileAudio className="w-4 h-4 text-rose-400" />
          <h3 className="text-xs font-mono font-semibold text-slate-200 tracking-wider uppercase">
            Private Media Cabinet / Setup Center (iska taste mujhe pucho)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* TRACK A: Voice Note */}
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-850/80 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono text-rose-400 font-semibold tracking-wider uppercase">
                  TRACK A: VOICE NOTE
                </span>
                {isVoiceCached ? (
                  <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                    CACHED OFFLINE
                  </span>
                ) : (
                  <span className="text-[9px] bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                    DEFAULT FILE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 font-medium mt-1.5 line-clamp-1">
                {voiceNoteName}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-light">
                This is your custom happy birthday wish recording.
              </p>
            </div>

            <div className="flex gap-2">
              <label className="flex-1 py-1.5 px-3 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl text-[10px] font-mono text-rose-300 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="audio/*,video/*"
                  onChange={handleVoiceFileChange}
                  ref={voiceUploadRef}
                  className="hidden"
                />
              </label>
              {isVoiceCached && (
                <button
                  onClick={() => onResetMedia('voice')}
                  className="p-1 px-2.5 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-mono text-slate-450 hover:text-rose-450 active:scale-95 transition-all text-slate-400 cursor-pointer"
                  title="Restore default"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* TRACK B: Background Song */}
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-850/80 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono text-amber-400 font-semibold tracking-wider uppercase">
                  TRACK B: ATMOSPHERE MUSIC
                </span>
                {isSongCached ? (
                  <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                    CACHED OFFLINE
                  </span>
                ) : (
                  <span className="text-[9px] bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                    DEFAULT FILE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 font-medium mt-1.5 line-clamp-1">
                {songName}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-light">
                Plays looping in background (e.g. &apos;Phir is janam mein...&apos;)
              </p>
            </div>

            <div className="flex gap-2">
              <label className="flex-1 py-1.5 px-3 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 rounded-xl text-[10px] font-mono text-amber-300 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleSongFileChange}
                  ref={songUploadRef}
                  className="hidden"
                />
              </label>
              {isSongCached && (
                <button
                  onClick={() => onResetMedia('song')}
                  className="p-1 px-2.5 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-mono text-slate-450 hover:text-amber-450 active:scale-95 transition-all text-slate-400 cursor-pointer"
                  title="Restore default"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cinematic Deployment Guide */}
        <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-900 text-[11px] text-slate-400 leading-relaxed font-sans space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-200">
            <CheckCircle className="w-4 h-4 text-rose-400" />
            <span className="font-medium">Priyanshi ke phone/PC par automatic chalane ka tareeqa:</span>
          </div>
          <p className="pl-5 text-slate-400 leading-normal">
            Internet links par doosre logon ke browsers direct computer files access nahi kar sakte. Ise globally sync karne ke liye, simply apne edit box block mein humare banaye hue <strong><code>/public</code></strong> directory folder ke andar files upload karein:
          </p>
          <ul className="list-disc pl-10 space-y-1 text-[10.5px] text-slate-300 font-mono">
            <li>Apne voice note ka naam <code>birthdaywish.mp4</code> rakhein aur use <code>public/</code> folder me upload karein.</li>
            <li>Apne birthday background song ka naam <code>phir_iss_janam.mp3</code> rakhein aur use <code>public/</code> folder me daalein.</li>
          </ul>
          <p className="pl-5 text-slate-550 italic text-[10px] text-slate-500">
            *Yeh karne se, jab aap Priyanshi ko apni link whatsapp ya instagram story par share karenge, toh bina kisi file upload ke unke phone par aapki awaaz aur background music perfect chalegi!
          </p>
        </div>
      </motion.div>

      {/* Sweet Caption Overlay styling */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="glass-panel p-6 rounded-2xl border border-slate-900 flex gap-4 items-center"
      >
        <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-900 flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-4.5 h-4.5 text-rose-400" />
        </div>
        <p className="text-xs text-slate-400 italic font-mono leading-relaxed">
          &quot;Pyaar ka pehla khat... ya aakhri tohfa. Sun lena isko, sayad fir kabhi khule na yeh raaste.&quot;
        </p>
      </motion.div>

      {/* Next page indicator */}
      <div className="flex justify-end pt-4">
        <button
          id="skip-to-cake-btn"
          onClick={onNext}
          className="px-6 py-3 rounded-full text-xs font-mono font-medium border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-200 cursor-pointer active:scale-95 transition-all duration-300 shadow-sm"
        >
          Proceed to Cake & Wishes →
        </button>
      </div>
    </div>
  );
}
