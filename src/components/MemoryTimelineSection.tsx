/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Camera, Calendar, Sparkles, BookOpen, Heart, Trash2, HeartHandshake } from 'lucide-react';
import { Memory } from '../types';

interface MemoryTimelineSectionProps {
  onNext: () => void;
}

export default function MemoryTimelineSection({ onNext }: MemoryTimelineSectionProps) {
  // Built with pre-generated assets as default fallbacks
  const defaultMemories: Memory[] = [
    {
      id: 'encounter',
      title: 'The Silent Beginning',
      date: 'Late Nights in Winter',
      caption: 'A simple hello that changed the gravity of my nights.',
      description: 'Before we knew it, hours dissolved into seconds. Simple text messages turned into long, quiet late-night conversations under the yellow streetlamp glow. I didn\'t know it then, but those virtual corners became my favorite places in the world.',
      image: '/src/assets/images/memory_starry_walk_1780548404518.png',
    },
    {
      id: 'shared_walks',
      title: 'Our Autumn Rain',
      date: 'Sweet Shared Silences',
      caption: 'Matching the quiet rhythm of the rainfall.',
      description: 'We realized that the best conversations were those held in silence. Hovering close, walking together through life\'s passing rain with a single shared hope. Looking back, those walks feel like the calmest walks down the path of memory.',
      image: '/src/assets/images/memory_autumn_rain_1780548388282.png',
    },
    {
      id: 'fairy_lights',
      title: 'An Unfinished Chapter',
      date: 'A Quiet Memory Corner',
      caption: 'Hatho mein lakeere kam pad gyi, but you belong in the stars.',
      description: 'Even if the seasons changed and our paths drifted onto different corners, the warmth we built doesn\'t just disappear. The fairy lights on the balcony still whisper your birthday. It is a beautiful chapter with no sequel, yet perfectly preserved in my heart.',
      image: '/src/assets/images/memory_evening_lights_1780548372459.png',
    }
  ];

  const [memories, setMemories] = useState<Memory[]>([]);

  // Load custom images from localStorage on load
  useEffect(() => {
    const savedCustomImages = localStorage.getItem('echoes_june_custom_photos');
    if (savedCustomImages) {
      try {
        const parsed = JSON.parse(savedCustomImages) as Record<string, string>;
        const updated = defaultMemories.map(m => {
          if (parsed[m.id]) {
            return { ...m, customImage: parsed[m.id] };
          }
          return m;
        });
        setMemories(updated);
      } catch (e) {
        console.error("Local storage photo parsing failed: ", e);
        setMemories(defaultMemories);
      }
    } else {
      setMemories(defaultMemories);
    }
  }, []);

  // Handle custom photo upload on the Polaris Frame
  const handlePhotoUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      
      const savedCustomImages = localStorage.getItem('echoes_june_custom_photos');
      let parsed: Record<string, string> = {};
      if (savedCustomImages) {
        try {
          parsed = JSON.parse(savedCustomImages);
        } catch (err) {}
      }
      parsed[id] = base64String;
      localStorage.setItem('echoes_june_custom_photos', JSON.stringify(parsed));

      setMemories(prev => prev.map(m => {
        if (m.id === id) {
          return { ...m, customImage: base64String };
        }
        return m;
      }));
    };
    reader.readAsDataURL(file);
  };

  // Remove uploaded custom photo and restore the default water art style
  const handleRemovePhoto = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const savedCustomImages = localStorage.getItem('echoes_june_custom_photos');
    let parsed: Record<string, string> = {};
    if (savedCustomImages) {
      try {
        parsed = JSON.parse(savedCustomImages);
      } catch (err) {}
    }
    delete parsed[id];
    localStorage.setItem('echoes_june_custom_photos', JSON.stringify(parsed));

    setMemories(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, customImage: undefined };
      }
      return m;
    }));
  };

  return (
    <div className="space-y-12 max-w-4xl mx-auto py-2">
      
      <div className="text-center space-y-2">
        <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">
          Chapter III • The Echoes Timeline
        </span>
        <h2 className="text-3xl md:text-4xl font-serif font-light text-slate-100 tracking-wide">
          A Quiet Walk Down Memory Lane
        </h2>
        <p className="text-xs text-slate-400 font-light max-w-sm mx-auto leading-relaxed">
          The stars we counted might have scattered, but the timeline we lived remains beautifully written.
        </p>
      </div>

      {/* Decorative prompt for personal customizations */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 leading-normal max-w-xl mx-auto flex items-start gap-2.5">
        <Camera className="w-5 h-5 text-rose-400 flex-shrink-0 translate-y-[2px]" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-300">A Personal Touch (Optional)</p>
          <p className="opacity-95 text-[11px] leading-relaxed">
            These Polaroid frames show hand-designed watercolor scenes as default. If you want to customize this journey on your device, you can click on any card to slide in your own real photos. They are stored safely and privately in your browser storage.
          </p>
        </div>
      </div>

      {/* Vertical Timeline container */}
      <div className="relative border-l border-slate-800 ml-4 md:ml-32 pl-6 md:pl-10 space-y-16 py-6">
        
        {memories.map((memory, index) => {
          const isEven = index % 2 === 0;
          
          return (
            <motion.div
              key={memory.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              {/* Star Node bullet points */}
              <div className="absolute -left-[31px] md:-left-[47px] top-6 w-3 h-3 rounded-full bg-slate-950 border-2 border-rose-400 z-10 flex items-center justify-center">
                <div className="w-1 h-1 bg-amber-400 rounded-full animate-ping" />
              </div>

              {/* Exact calendar label on left side margin (visible on wider viewports) */}
              <div className="hidden md:block absolute -left-36 top-5 w-24 text-right text-xs font-mono text-slate-500 uppercase tracking-widest leading-none">
                {memory.date}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left col: Elegant Polaroid Photo Frame */}
                <div className="lg:col-span-5 flex justify-center">
                  <div className="relative group p-3 bg-slate-900 border border-slate-800 rounded-sm shadow-xl transform hover:rotate-0 transition-transform duration-500 -rotate-2 select-none w-64">
                    
                    {/* Clear overlay tape on top */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-4 bg-white/5 backdrop-blur-[1px] border-x border-dashed border-white/10 rotate-1 rounded-sm shadow-sm" />
                    
                    <div className="aspect-square bg-slate-950 rounded-sm overflow-hidden relative border border-slate-950 flex items-center justify-center">
                      <img
                        src={memory.customImage || memory.image}
                        alt={memory.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-opacity duration-300"
                      />

                      {/* Custom input fields layer triggered by clicking on image frame */}
                      <label 
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-opacity duration-300 text-slate-200 text-xs font-mono"
                        htmlFor={`upload-input-${memory.id}`}
                      >
                        <Camera className="w-5 h-5 text-rose-300" />
                        <span>Update Photo</span>
                        <input
                          id={`upload-input-${memory.id}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(memory.id, e)}
                          className="hidden"
                        />
                      </label>

                      {/* De-clutter trash icon if customized */}
                      {memory.customImage && (
                        <button
                          id={`delete-custom-photo-${memory.id}`}
                          onClick={(e) => handleRemovePhoto(memory.id, e)}
                          className="absolute bottom-2 right-2 p-1.5 bg-slate-950/80 border border-slate-800 rounded-lg hover:text-red-400 text-slate-400 transition-colors z-20"
                          title="Restore Watercolor Sketch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Polarode caption margins */}
                    <div className="mt-4 text-center font-serif text-slate-400 text-sm whitespace-pre-wrap leading-tight">
                      <span className="text-[10px] font-mono block text-slate-600 mb-1 leading-none uppercase">{memory.date}</span>
                      <span className="handwritten italic text-slate-300">"{memory.caption}"</span>
                    </div>

                  </div>
                </div>

                {/* Right col: Intimate descriptions and writings */}
                <div className="lg:col-span-7 space-y-3.5">
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-orange-400/80" />
                    <h3 className="text-xl font-serif font-light text-slate-100 leading-none">
                      {memory.title}
                    </h3>
                  </div>

                  <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-light">
                    {memory.description}
                  </p>

                  <div className="pt-2 flex items-center gap-1.5 text-xs font-mono text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    <span>Silent memories are forever.</span>
                  </div>
                </div>

              </div>
            </motion.div>
          );
        })}

      </div>

      {/* Close Message Jar trigger progress */}
      <div className="flex justify-end pt-6 border-t border-slate-950">
        <button
          id="proceed-to-star-btn"
          onClick={onNext}
          className="px-6 py-3 rounded-full text-xs font-mono font-medium border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-200 cursor-pointer active:scale-95 transition-all duration-300"
        >
          Proceed to Message Star Jar →
        </button>
      </div>

    </div>
  );
}
