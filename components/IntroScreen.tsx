
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { Play, Leaf, Sprout } from 'lucide-react';

interface IntroScreenProps {
  onComplete: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0); 

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase(1), 1200);
    const timer2 = setTimeout(() => setPhase(2), 4000);
    const timer3 = setTimeout(() => setPhase(3), 5500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-herb-900 flex flex-col items-center justify-center overflow-hidden font-display">
      <style>{`
        @keyframes grow-leaf {
          0% { transform: scale(0) rotate(-45deg); opacity: 0; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes float-pollen {
          0% { transform: translate(0, 0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translate(100px, -200px); opacity: 0; }
        }
      `}</style>

      {/* Background FX */}
      <div className="absolute inset-0 bg-gradient-to-br from-herb-950 via-herb-900 to-emerald-950"></div>
      
      {/* Floating Particles */}
      {Array.from({ length: 15 }).map((_, i) => (
        <div 
          key={i} 
          className="absolute w-2 h-2 bg-herb-400/20 rounded-full blur-[1px]"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float-pollen ${3 + Math.random() * 5}s infinite ease-in-out ${Math.random() * 5}s`
          }}
        ></div>
      ))}

      <div className="relative flex items-center justify-center">
        {/* PHASE 0 & 1: SPROUTING */}
        <div className={`relative transition-all duration-1000 ${phase >= 2 ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}>
          <div className="w-32 h-32 md:w-48 md:h-48 flex items-center justify-center bg-white/5 rounded-full border border-herb-400/20 backdrop-blur-xl">
             <Sprout className={`w-16 h-16 md:w-24 md:h-24 text-herb-400 animate-[bounce_3s_infinite] ${phase === 0 ? 'opacity-0' : 'opacity-100'}`} />
          </div>
        </div>

        {/* PHASE 2 & 3: REVEALING BRAND */}
        <div className={`absolute flex flex-col items-center transition-all duration-1000 ease-out ${phase >= 2 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
           <div className="w-24 h-24 bg-white p-5 rounded-[2rem] shadow-2xl shadow-black/40 mb-8 animate-[grow-leaf_1s_ease-out]">
              <Leaf className="w-full h-full text-herb-600" />
           </div>
           
           <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-2 text-center">
              Thai Herb <span className="text-herb-400">Explorer</span>
           </h1>
           <p className="text-herb-300 text-sm md:text-base uppercase tracking-[0.4em] mb-12 font-medium">ห้องเรียนพืชสมุนไพรดิจิทัล</p>
           
           {phase === 3 && (
             <button 
                onClick={onComplete}
                className="group relative px-10 py-4 bg-herb-600 hover:bg-herb-500 rounded-full text-white font-bold tracking-[0.2em] shadow-xl shadow-herb-600/30 transition-all hover:scale-110 flex items-center gap-3"
             >
                <Play className="w-5 h-5 fill-current" />
                เข้าสู่บทเรียน
             </button>
           )}
        </div>
      </div>

      <button onClick={onComplete} className="absolute top-8 right-8 text-xs text-herb-400/60 hover:text-white transition-colors uppercase tracking-widest border border-herb-400/20 px-4 py-2 rounded-full">
        ข้าม
      </button>
    </div>
  );
};

export default IntroScreen;
