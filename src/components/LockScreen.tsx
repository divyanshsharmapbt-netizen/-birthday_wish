/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Sparkles, AlertCircle, HelpCircle } from 'lucide-react';

interface LockScreenProps {
  onUnlock: () => void;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPassword = password.trim().toLowerCase();
    
    // Check password matches "26march" or variants like "26 march" or "26-march"
    if (
      cleanPassword === '26march' || 
      cleanPassword === '26-march' || 
      cleanPassword === '26 march'
    ) {
      setError(false);
      onUnlock();
    } else {
      setError(true);
      setPassword('');
      // Shake animation trigger can be bound to state
      setTimeout(() => setError(false), 800);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-4 relative overflow-hidden">
      {/* Dynamic Ambient Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(30,41,59,0.5)_0%,rgba(2,6,23,1)_100%)]" />
      
      {/* Subtle Star twinkle simulation */}
      <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-twinkle opacity-60" />
      <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-yellow-100 rounded-full animate-twinkle opacity-40 [animation-delay:1.5s]" />
      <div className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-white rounded-full animate-twinkle opacity-70 [animation-delay:0.8s]" />
      <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-orange-100 rounded-full animate-twinkle opacity-50 [animation-delay:2.2s]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-panel p-8 md:p-10 rounded-3xl shadow-2xl space-y-8 text-center relative overflow-hidden">
          {/* Accent light decoration */}
          <div className="absolute -top-12 -left-12 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />

          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900/80 border border-slate-800 text-rose-400 mb-2">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="text-3xl font-serif font-light tracking-wide text-slate-100">
              Echoes of June
            </h1>
            <p className="text-sm text-slate-400 font-light leading-relaxed max-w-xs mx-auto">
              This digital space contains memories locked under a quiet key. To enter the walk, please unlock it.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                id="lock-password-field"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className={`w-full px-5 py-4 bg-slate-900 border ${
                  error ? 'border-red-500 animate-[shake_0.5s_ease-in-out]' : 'border-slate-800 focus:border-rose-500/50'
                } rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-rose-500/20 transition-all font-mono text-center tracking-widest text-sm`}
              />
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute -bottom-6 left-0 right-0 flex items-center justify-center gap-1.5 text-red-400 text-xs font-light"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>The memories remain closed. Check the key.</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              id="unlock-button"
              type="submit"
              className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-500/25 to-amber-500/25 border border-rose-500/30 text-rose-200 hover:from-rose-500/35 hover:to-amber-500/35 active:scale-[0.98] transition-all font-sans font-medium text-sm tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-950/20"
            >
              <Sparkles className="w-4 h-4 text-orange-400 animate-spin [animation-duration:8s]" />
              Unlock the Journey
            </button>
          </form>

          <div className="pt-2">
            <button
              id="hint-toggle-button"
              type="button"
              onClick={() => setShowHint(!showHint)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-400 font-light transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Need a hint?</span>
            </button>

            <AnimatePresence>
              {showHint && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-amber-500/80 mt-2 font-mono"
                >
                  "The day she came into the world... format: 26march"
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Outer subtle footer credit (humble/literal labels) */}
        <p className="text-center text-[10px] text-slate-700 font-mono mt-8 tracking-wider">
          PASSWORD REQUIRED: 26MARCH • SEEDING PRIVATE PORTAL
        </p>
      </motion.div>
      
      {/* Custom Shake animation in style block */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
