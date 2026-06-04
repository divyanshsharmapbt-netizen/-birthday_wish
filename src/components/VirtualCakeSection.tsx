/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Scissors, MessageSquare, Mic, MicOff, Check, AlertCircle } from 'lucide-react';

interface VirtualCakeSectionProps {
  onNext: () => void;
  voiceNoteUrl: string;
  bgAudioRef: React.RefObject<HTMLAudioElement | null>;
  onPlayChange: (playing: boolean) => void;
}

export default function VirtualCakeSection({ onNext, voiceNoteUrl, bgAudioRef, onPlayChange }: VirtualCakeSectionProps) {
  const [candleLit, setCandleLit] = useState(true);
  const [blowing, setBlowing] = useState(false);
  const [blowProgress, setBlowProgress] = useState(0); // 0 to 100 over 3 seconds
  const [cakeCut, setCakeCut] = useState(false);
  const [selectedKnife, setSelectedKnife] = useState(false);
  const [letterIndex, setLetterIndex] = useState(0);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Synced audio play state when cutting cake
  const sliceVoiceRef = useRef<HTMLAudioElement | null>(null);
  const [sliceVoicePlaying, setSliceVoicePlaying] = useState(false);
  const [cuttingMusicPlaying, setCuttingMusicPlaying] = useState(false);
  const synthIntervalRef = useRef<any>(null);

  // Emotional quotes provided by the user exactly:
  const heartfeltQuotes = [
    "Hi , it's your birthday 🫠",
    "Happy Birthday 🥀🙃",
    "Pta nhi tum yeh dekh bhi rhi ho ya nahi but agar dekh rhi ho to happy birthday again hamesa khush rho tum tumko woh sab kuch mile jiski tum haqdaar ho , i know cheeze kuch shi nhi h but it's ok it's alright sayad hatho mein lakeere kam pad gyi but tum nhi ho ab yeh soch kr jyada dukhi nhi hota ek time mere the yeh soch kar jyada khush ho jata hu, chorho ab en sab baaton ka kya matlab likhta rha to bhut kuch likh dunga 😅",
    "I hope you doing well , apna khyaal rakhna , khana pr dyaa n dena or Han sir ke pass chaku rakhna mat bhoolna bolna to bhut kuch chata hu but nhi bolunga ,😐",
    "Happy Birthday kuchupuchhu 🥺"
  ];

  // Helper sound synth to play Phir Iss Janam Mein Melancholic notes
  const playNostalgicNote = (freq: number, duration: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!ctxRef.current) {
        ctxRef.current = new AudioCtx();
      }
      const ctx = ctxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.type = 'triangle'; // Soft emotional tone
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration - 0.05);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Synth failed: ", e);
    }
  };

  const ctxRef = useRef<AudioContext | null>(null);

  // Sequence: A melancholic melody loop
  const triggerMelodyLoop = () => {
    if (cuttingMusicPlaying) return;
    setCuttingMusicPlaying(true);
    
    // Play a repeating sequence of bittersweet melody notes representing "Phir Is Janam Mein..."
    const notes = [
      220, 261.63, 329.63, 392, // Am7 (A - C - E - G)
      220, 261.63, 329.63, 440, // A - C - E - A
      196, 246.94, 293.66, 392, // Gmaj (G - B - D - G)
      174.61, 220, 261.63, 349.23 // Fmaj (F - A - C - F)
    ];
    let step = 0;
    
    // Play immediately
    playNostalgicNote(notes[0], 1.2);
    
    synthIntervalRef.current = setInterval(() => {
      step = (step + 1) % notes.length;
      playNostalgicNote(notes[step], 1.2);
    }, 1200);
  };

  useEffect(() => {
    return () => {
      if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
      if (ctxRef.current) ctxRef.current.close().catch(() => {});
      if (sliceVoiceRef.current) {
        sliceVoiceRef.current.pause();
      }
      onPlayChange(false);
    };
  }, [onPlayChange]);

  // Handle active countdown for manual/hold button blowing
  useEffect(() => {
    let interval: any;
    if (blowing && candleLit) {
      interval = setInterval(() => {
        setBlowProgress(prev => {
          if (prev >= 100) {
            setCandleLit(false);
            setBlowing(false);
            clearInterval(interval);
            return 100;
          }
          return prev + 3.4; // takes approx 3 seconds
        });
      }, 100);
    } else {
      if (!candleLit) {
        setBlowProgress(100);
      } else {
        setBlowProgress(0);
      }
    }
    return () => clearInterval(interval);
  }, [blowing, candleLit]);

  // Mic Blowing Sound Handler
  const startMicMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      setIsMicEnabled(true);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      let blowSecCount = 0;

      const checkVolume = () => {
        if (!analyserRef.current || !candleLit) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avVolume = sum / bufferLength;
        setMicVolume(avVolume);
        
        // Threshold for blowing is an average higher frequency sound
        if (avVolume > 50) {
          setBlowing(true);
          blowSecCount += 1;
          
          // Cross-increment blow progress
          setBlowProgress(prev => {
            if (prev >= 100) {
              setCandleLit(false);
              setBlowing(false);
              setIsMicEnabled(false);
              stopMicMonitoring();
              return 100;
            }
            return prev + 3.8;
          });
        } else {
          setBlowing(false);
        }
        
        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };
      
      checkVolume();
    } catch (err) {
      console.warn("Microphone access declined or unavailable", err);
      setIsMicEnabled(false);
    }
  };

  const stopMicMonitoring = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsMicEnabled(false);
    setMicVolume(0);
    setBlowing(false);
  };

  const handleMicToggle = () => {
    if (isMicEnabled) {
      stopMicMonitoring();
    } else {
      startMicMonitoring();
    }
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle voice note play actions and fallback to arpeggios
  const handleSliceVoiceEnded = () => {
    setSliceVoicePlaying(false);
    onPlayChange(false); // Restore background music volume
    triggerMelodyLoop();
  };

  const handleSliceVoiceError = () => {
    console.warn("Slice voice note file missing, triggering fallback synthesiser...");
    triggerMelodyLoop();
  };

  // Handle cutting the cake with knife
  const handleCutCake = () => {
    if (!candleLit) {
      setCakeCut(true);
      
      // Auto play background story music if paused/muted
      if (bgAudioRef.current) {
        bgAudioRef.current.muted = false;
        bgAudioRef.current.volume = 0.70;
        bgAudioRef.current.play().catch(() => {});
      }

      // Try playing the user's uploaded voice note
      if (sliceVoiceRef.current) {
        sliceVoiceRef.current.load();
        sliceVoiceRef.current.play()
          .then(() => {
            setSliceVoicePlaying(true);
            onPlayChange(true); // Soft-fades the looping background song for clear voice
          })
          .catch(err => {
            console.warn("Voice playback blocked:", err);
            triggerMelodyLoop();
          });
      } else {
        triggerMelodyLoop();
      }
    }
  };

  return (
    <div className="space-y-10 max-w-3xl mx-auto py-4 relative">
      {/* Voice Note player during cutting cake */}
      <audio
        ref={sliceVoiceRef}
        src={voiceNoteUrl}
        onEnded={handleSliceVoiceEnded}
        onError={handleSliceVoiceError}
        playsInline
        className="hidden"
      />
      <div className="text-center space-y-2">
        <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">
          Chapter II • The Virtual Cake
        </span>
        <h2 className="text-3xl md:text-4xl font-serif font-light text-slate-100 tracking-wide">
          A Celebration for One
        </h2>
        <p className="text-xs text-slate-400 font-light max-w-sm mx-auto leading-relaxed">
          {candleLit 
            ? "Blow out the flame! Hold the button for 3 seconds or turn on microphone permission to blow into your mic." 
            : !cakeCut
              ? "The fire is gone. Pick up the knife and slice the cake to read what's written inside."
              : "Read the letter written in silent echoes..."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-slate-900/40 p-6 md:p-8 rounded-3xl border border-slate-800/80">
        
        {/* Left Side: Dynamic Cake Render Panel */}
        <div className="md:col-span-6 flex flex-col items-center justify-center p-4 relative min-h-[300px]">
          
          {/* Confetti Explosion Layer when cut */}
          <AnimatePresence>
            {cakeCut && (
              <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                {Array.from({ length: 18 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 1, x: 0, y: 80, scale: 0.5 }}
                    animate={{ 
                      opacity: 0, 
                      x: (Math.random() - 0.5) * 220, 
                      y: (Math.random() - 0.5) * 140 - 20, 
                      scale: Math.random() * 0.8 + 0.4,
                      rotate: Math.random() * 360
                    }}
                    transition={{ duration: 1.8, ease: "easeOut" }}
                    className={`absolute left-1/2 top-1/3 w-3 h-3 rounded-full ${
                      i % 3 === 0 ? 'bg-rose-400' : i % 3 === 1 ? 'bg-amber-400' : 'bg-pink-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Sliced Cake Rendering */}
          <div className="relative w-56 h-56 flex items-end justify-center select-none">
            
            {/* Candle Rendering */}
            <AnimatePresence>
              {(!cakeCut) && (
                <div className="absolute left-1/2 -top-4 -translate-x-1/2 z-20 flex flex-col items-center">
                  {/* Candelflame */}
                  {candleLit && (
                    <motion.div 
                      animate={{ 
                        scale: blowing ? [1, 0.6, 1.2, 0.4] : [1, 1.05, 0.95, 1],
                        y: blowing ? [0, 2, -1, 3] : [0, -1, 1, 0]
                      }}
                      transition={{ repeat: Infinity, duration: 0.6 }}
                      className="w-4 h-8 bg-gradient-to-t from-orange-500 via-amber-400 to-yellow-100 rounded-full blur-[1px] animate-flicker relative"
                    >
                      <div className="absolute -inset-0.5 bg-yellow-400/30 rounded-full blur-md" />
                    </motion.div>
                  )}
                  {/* Candle Wick */}
                  <div className="w-0.5 h-2 bg-slate-700" />
                  {/* Candle Cylinder body */}
                  <div className="w-3 h-14 bg-gradient-to-r from-pink-400 via-rose-300 to-pink-500 rounded-t-sm shadow-md overflow-hidden relative">
                    <div className="absolute top-2 left-0 w-full h-1 bg-rose-500/30 transform rotate-12" />
                    <div className="absolute top-6 left-0 w-full h-1 bg-rose-500/30 transform rotate-12" />
                    <div className="absolute top-10 left-0 w-full h-1 bg-rose-500/30 transform rotate-12" />
                  </div>
                </div>
              )}
            </AnimatePresence>

            {/* Cake Layers container */}
            <div className={`transition-all duration-1000 flex items-end w-full relative h-36 ${cakeCut ? 'gap-6' : 'gap-0'}`}>
              
              {/* Left Cut-half */}
              <div className={`w-1/2 h-full bg-slate-800 transition-all duration-1000 flex flex-col justify-end relative rounded-l-2xl border-l border-b border-rose-500/10 shadow-lg ${
                cakeCut ? '-rotate-12 translate-x-[-12px]' : ''
              }`}>
                {/* Cake Cream Top */}
                <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-r from-rose-200 to-pink-100 rounded-tl-xl border-t border-white/20 relative">
                  <div className="absolute -bottom-1 inset-x-0 h-2 bg-rose-300 rounded-full" />
                </div>
                {/* Sprinkles on left top */}
                <div className="absolute top-5 left-4 w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                <div className="absolute top-7 left-12 w-2 h-1 bg-blue-400 rounded-full transform rotate-45" />
                <div className="absolute top-12 left-6 w-1.5 h-1.5 bg-pink-400 rounded-full" />
                
                {/* Filling inner borders */}
                <div className="h-4 bg-rose-400 border-y border-rose-500/40 w-full my-3" />
                <div className="h-4 bg-rose-400 border-y border-rose-500/40 w-full mb-3" />
                
                {/* Inner exposed cut section (Visible when split) */}
                {cakeCut && (
                  <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-pink-300 to-rose-400 border-r border-rose-500/20" />
                )}
              </div>

              {/* Right Cut-half */}
              <div className={`w-1/2 h-full bg-slate-800 transition-all duration-1000 flex flex-col justify-end relative rounded-r-2xl border-r border-b border-rose-500/10 shadow-lg ${
                cakeCut ? 'rotate-12 translate-x-[12px]' : ''
              }`}>
                {/* Cake Cream Top */}
                <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-r from-pink-100 to-rose-200 rounded-tr-xl border-t border-white/20 relative">
                  <div className="absolute -bottom-1 inset-x-0 h-2 bg-rose-300 rounded-full" />
                </div>
                {/* Sprinkles on right top */}
                <div className="absolute top-6 right-5 w-1.5 h-1.5 bg-amber-450 rounded-full" />
                <div className="absolute top-9 right-14 w-2 h-1 bg-indigo-400 rounded-full transform -rotate-12" />
                <div className="absolute top-11 right-6 w-1.5 h-1.5 bg-yellow-300 rounded-full" />

                {/* Filling inner borders */}
                <div className="h-4 bg-rose-400 border-y border-rose-500/40 w-full my-3" />
                <div className="h-4 bg-rose-400 border-y border-rose-500/40 w-full mb-3" />
                
                {/* Inner exposed cut section (Visible when split) */}
                {cakeCut && (
                  <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-pink-300 to-rose-400 border-l border-rose-500/20" />
                )}
              </div>
            </div>

            {/* Cake Base Plate Plate Stand */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-64 h-3 bg-slate-700 rounded-full border-t border-slate-600 shadow-md flex items-center justify-center">
              <div className="w-24 h-4 bg-slate-850 rounded-b-md border-t border-slate-700" />
            </div>

          </div>

          {/* Interactive tools overlay */}
          <div className="mt-8 flex flex-col items-center gap-4 w-full">
            {candleLit ? (
              <div className="w-full max-w-xs space-y-4">
                
                {/* Microphone trigger option */}
                <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      id="mic-permission-toggle"
                      onClick={handleMicToggle}
                      className={`p-2 rounded-lg cursor-pointer transition-all ${
                        isMicEnabled 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                          : 'bg-slate-900 border border-slate-800 text-slate-500'
                      }`}
                    >
                      {isMicEnabled ? <Mic className="w-4 h-4 animate-pulse" /> : <MicOff className="w-4 h-4" />}
                    </button>
                    <span className="text-[11px] text-slate-400 font-mono">Microphone Blow</span>
                  </div>
                  {isMicEnabled && (
                    <div className="flex gap-0.5 items-end h-4 w-12 bg-slate-900 border border-slate-800 rounded px-1">
                      <div className="w-1.5 bg-rose-400 rounded-t-sm" style={{ height: `${Math.min(micVolume * 1.5, 100)}%` }} />
                      <div className="w-1.5 bg-rose-400 rounded-t-sm" style={{ height: `${Math.min(micVolume * 1.1, 100)}%` }} />
                      <div className="w-1.5 bg-rose-400 rounded-t-sm" style={{ height: `${Math.min(micVolume * 1.8, 100)}%` }} />
                    </div>
                  )}
                </div>

                {/* Main 3Second Exhale Button */}
                <div className="space-y-1.5">
                  <button
                    id="blow-candle-hold-btn"
                    onMouseDown={() => setBlowing(true)}
                    onMouseUp={() => setBlowing(false)}
                    onTouchStart={() => setBlowing(true)}
                    onTouchEnd={() => setBlowing(false)}
                    className="w-full py-3.5 bg-slate-950 border border-slate-850 hover:border-rose-500/30 rounded-xl text-xs font-mono font-medium tracking-wide active:scale-98 transition-all relative overflow-hidden select-none cursor-pointer text-rose-100"
                  >
                    {/* Filling blow progress bar */}
                    <div 
                      className="absolute inset-y-0 left-0 bg-rose-500/20 transition-all duration-100 ease-linear pointer-events-none"
                      style={{ width: `${blowProgress}%` }}
                    />
                    <span className="relative z-10 font-sans">
                      {blowing ? `Blowing... ${Math.round(blowProgress)}%` : "Hold here to blow (3 Secs)"}
                    </span>
                  </button>

                  <div className="flex justify-between text-[9px] font-mono text-slate-600 px-1">
                    <span>BREATH STAGE</span>
                    <span>3S EXHALE</span>
                  </div>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {!cakeCut ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full max-w-xs space-y-3 text-center"
                  >
                    <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-2xl flex items-center gap-2 justify-center text-xs text-rose-300">
                      <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                      <span>Candle Blown! Pick the knife tool.</span>
                    </div>

                    <div className="flex gap-3 justify-center">
                      {/* Pick up Knife Tool */}
                      <button
                        id="choose-knife-btn"
                        onClick={() => setSelectedKnife(!selectedKnife)}
                        className={`px-5 py-3.5 rounded-xl text-xs font-mono font-medium flex items-center gap-2 transition-all cursor-pointer ${
                          selectedKnife 
                            ? 'bg-rose-500 text-slate-950 border border-rose-450 hover:bg-rose-400' 
                            : 'bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Scissors className="w-4 h-4 transform rotate-90" />
                        <span>{selectedKnife ? "Knife Active" : "Take Knife"}</span>
                      </button>

                      {/* Cut Trigger */}
                      <button
                        id="perform-cutting-btn"
                        disabled={!selectedKnife}
                        onClick={handleCutCake}
                        className={`px-5 py-3.5 rounded-xl text-xs font-mono font-medium transition-all ${
                          selectedKnife 
                            ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-bold active:scale-95 cursor-pointer shadow-lg shadow-rose-950/20' 
                            : 'bg-slate-950 border border-slate-900 text-slate-700 cursor-not-allowed'
                        }`}
                      >
                        Cut Cake
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center p-3.5 bg-slate-950 border border-slate-850 rounded-2xl text-xs text-slate-400 font-mono inline-flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4 text-rose-400" />
                    <span>Cake sliced. Music of June is playing...</span>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

        </div>

        {/* Right Side: Step-by-Step Romantic Letter Reveals */}
        <div className="md:col-span-6 space-y-6">
          <div className="glass-panel text-slate-100 p-6 md:p-8 rounded-3xl border border-rose-500/5 shadow-inner relative min-h-[340px] flex flex-col justify-between">
            <div className="absolute top-4 right-4 text-[10px] uppercase font-mono tracking-wider text-slate-600">
              Personal Letter • No. 05
            </div>

            {/* Letter Content container */}
            <div className="space-y-4 pt-4">
              <AnimatePresence mode="wait">
                {cakeCut ? (
                  <motion.div
                    key={letterIndex}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.8 }}
                    className="space-y-4 min-h-[200px] flex flex-col justify-center"
                  >
                    <div className="space-y-3">
                      {/* Renders line-by-line of the nested quote indexes with custom typographic highlights */}
                      {heartfeltQuotes.slice(0, letterIndex + 1).map((quote, idx) => {
                        const isMainPrg = quote.length > 50;
                        const isHighlight = idx === letterIndex;
                        
                        return (
                          <p 
                            key={idx} 
                            className={`handwritten italic font-light text-rose-100/90 leading-relaxed transition-all duration-500 ${
                              isMainPrg ? 'text-xs md:text-sm pl-2 border-l border-rose-500/20' : 'text-base font-serif text-amber-200/90'
                            } ${isHighlight ? 'opacity-100 scale-100' : 'opacity-40 text-slate-400 scale-[0.99]'}`}
                          >
                            {quote}
                          </p>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center py-16 text-slate-600 flex flex-col items-center justify-center space-y-2">
                    <MessageSquare className="w-8 h-8 opacity-40 mb-2" />
                    <p className="text-xs font-mono">The writing is folded inside.</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-700">SLICE THE CAKE TO UNFOLD THE LETTER</p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Multi-step pagination of letters */}
            {cakeCut && (
              <div className="flex justify-between items-center pt-6 border-t border-slate-900">
                <span className="text-[10px] font-mono text-slate-600">
                  PAGE {letterIndex + 1} OF {heartfeltQuotes.length}
                </span>

                <div className="flex gap-2">
                  {letterIndex > 0 && (
                    <button
                      id="prev-letter-btn"
                      onClick={() => setLetterIndex(prev => prev - 1)}
                      className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-lg text-[10px] font-mono text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      Back
                    </button>
                  )}
                  
                  {letterIndex < heartfeltQuotes.length - 1 ? (
                    <button
                      id="next-letter-btn"
                      onClick={() => setLetterIndex(prev => prev + 1)}
                      className="px-4 py-1.5 bg-rose-500 hover:bg-rose-450 text-slate-950 font-bold rounded-lg text-[10px] font-mono cursor-pointer active:scale-95 transition-all"
                    >
                      Read on →
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 text-[10px] font-mono text-amber-400">
                      <Check className="w-3.5 h-3.5" />
                      <span>Letter Read</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress navigation */}
      <div className="flex justify-between pt-4 border-t border-slate-950">
        <span className="text-xs text-slate-600 font-mono flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 text-slate-700" />
          <span>No name is mentioned anywhere.</span>
        </span>
        
        <button
          id="proceed-to-timeline-btn"
          disabled={!cakeCut}
          onClick={onNext}
          className={`px-6 py-3 rounded-full text-xs font-mono font-medium border active:scale-95 transition-all duration-300 ${
            cakeCut 
              ? 'bg-rose-500/5 hover:bg-rose-500/10 text-rose-200 border-rose-500/20 cursor-pointer' 
              : 'bg-slate-950 border-slate-900 text-slate-700 cursor-not-allowed'
          }`}
        >
          Proceed to Memories Timeline →
        </button>
      </div>
    </div>
  );
}
