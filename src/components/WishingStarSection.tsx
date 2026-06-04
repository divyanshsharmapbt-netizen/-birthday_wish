/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Star, HelpCircle, Check, Sparkles, MessageCircle, Heart } from 'lucide-react';
import { WishMessage } from '../types';

export default function WishingStarSection() {
  const [messages, setMessages] = useState<WishMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSent, setIsSent] = useState(false);

  // Load existing wishes from localStorage
  useEffect(() => {
    const savedWishes = localStorage.getItem('echoes_june_wishes');
    if (savedWishes) {
      try {
        setMessages(JSON.parse(savedWishes));
      } catch (e) {
        console.error("Failed to parse wishes", e);
      }
    } else {
      // Default romantic seeds to fill the space beautifully
      const initialWishes: WishMessage[] = [
        { id: '1', text: 'Hamesha khush raho tum, tumko wo sab mile jiski tum haqdaar ho. 🥀', date: 'June 5', starX: 25, starY: 30, size: 1.2 },
        { id: '2', text: 'I hope you are doing really well. Apna khyaal rakhna hamesha.', date: 'Quiet Wish', starX: 65, starY: 45, size: 1.0 },
        { id: '3', text: 'Pyaar badhta rahe, chahe fasle kitne bhi ho.', date: 'Echo of Dust', starX: 45, starY: 15, size: 1.4 }
      ];
      setMessages(initialWishes);
    }
  }, []);

  const handleSendWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newWish: WishMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      date: 'Today',
      // Generate a coordinate within range
      starX: Math.random() * 80 + 10,
      starY: Math.random() * 70 + 10,
      size: Math.random() * 0.6 + 0.9,
    };

    const updated = [...messages, newWish];
    setMessages(updated);
    localStorage.setItem('echoes_june_wishes', JSON.stringify(updated));
    setInputText('');
    setIsSent(true);
    setTimeout(() => setIsSent(false), 3000);
  };

  const handleClearWishes = () => {
    if (window.confirm("Are you sure you want to clear the starry jar messages?")) {
      setMessages([]);
      localStorage.removeItem('echoes_june_wishes');
    }
  };

  return (
    <div className="space-y-10 max-w-3xl mx-auto py-2">
      
      <div className="text-center space-y-2">
        <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">
          Chapter IV • The Wishing Star Jar
        </span>
        <h2 className="text-3xl md:text-4xl font-serif font-light text-slate-100 tracking-wide">
          Release a Silent Wish
        </h2>
        <p className="text-xs text-slate-400 font-light max-w-sm mx-auto leading-relaxed">
          Type a secret thought, birthday wish, or silent message. Release it into the digital starlight, joining other memories.
        </p>
      </div>

      {/* Stellar Container Canvas */}
      <div className="relative h-[340px] w-full rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center">
        
        {/* Cosmos subtle grid layer */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.06)_0%,transparent_70%)] pointer-events-none" />
        
        {/* Twinkling stars */}
        <AnimatePresence>
          {messages.map((wish) => (
            <motion.div
              key={wish.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: wish.size, opacity: [0.3, 1, 0.3], y: [0, -6, 0] }}
              transition={{ 
                scale: { duration: 0.5 },
                opacity: { duration: 3 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" },
                y: { duration: 5 + Math.random() * 3, repeat: Infinity, ease: "easeInOut" }
              }}
              style={{
                position: 'absolute',
                left: `${wish.starX}%`,
                top: `${wish.starY}%`,
              }}
              className="group cursor-pointer select-none"
            >
              {/* Stars rendering */}
              <div className="relative">
                <Star className="w-5 h-5 text-amber-300 fill-amber-300 filter drop-shadow-[0_0_8px_rgba(253,224,71,0.6)]" />
                
                {/* Floating tooltip hover message */}
                <span className="absolute left-1/2 -translate-x-1/2 top-6 w-48 scale-0 group-hover:scale-100 bg-slate-950/95 border border-slate-850 p-2.5 rounded-xl text-[10px] font-sans text-amber-100 italic leading-relaxed shadow-xl text-center transition-all duration-300 z-30 pointer-events-none">
                  "{wish.text}"
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {messages.length === 0 ? (
          <div className="text-center space-y-2 opacity-35">
            <Star className="w-8 h-8 text-slate-500 mx-auto animate-pulse" />
            <p className="text-[10px] uppercase font-mono tracking-widest text-slate-600">The sky is currently still...</p>
          </div>
        ) : (
          <div className="absolute bottom-4 left-4 text-[9px] font-mono text-slate-600">
            {messages.length} ACTIVE STARS Twinkling • HOVER FOR INLINE SECRETS
          </div>
        )}
      </div>

      {/* Input Form container */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-900 max-w-xl mx-auto">
        <form onSubmit={handleSendWish} className="space-y-4">
          <div className="flex gap-2 relative">
            <input
              id="wish-jar-input-field"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Write a wish for her..."
              maxLength={150}
              className="flex-grow px-4 py-3.5 bg-slate-950 border border-slate-800 focus:border-rose-500/50 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none text-xs transition-colors"
            />
            <button
              id="send-wish-star-btn"
              type="submit"
              className="px-5 py-3.5 rounded-xl bg-rose-500 text-slate-950 hover:bg-rose-400 font-bold text-xs transition-colors duration-300 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Release</span>
            </button>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
            <span>MAXIMUM 150 CHARACTERS</span>

            {messages.length > 0 && (
              <button
                id="clear-wishes-btn"
                type="button"
                onClick={handleClearWishes}
                className="hover:text-red-400/80 transition-colors cursor-pointer"
              >
                Clear stardust
              </button>
            )}
          </div>
        </form>

        <AnimatePresence>
          {isSent && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 p-3 bg-rose-950/20 border border-rose-500/20 text-rose-300 text-[11px] rounded-xl flex items-center gap-1.5 justify-center"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Released! Your secret wish is now a star in the starlight sky.</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Heartfelt Closing Sign-Off (subtle, quiet walk down memory) */}
      <div className="text-center pt-8 border-t border-slate-950 max-w-sm mx-auto space-y-4">
        <Heart className="w-5 h-5 text-rose-400/50 mx-auto animate-pulse" />
        
        <div className="space-y-1.5">
          <p className="handwritten italic text-rose-200 text-sm">
            "Sayad fir kisi janam mein mulakaat ho... par tab tak, hamesha khush rehna tum."
          </p>
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest leading-none pt-2">
            Humble Birthday Wish • June 5
          </p>
        </div>
      </div>

    </div>
  );
}
