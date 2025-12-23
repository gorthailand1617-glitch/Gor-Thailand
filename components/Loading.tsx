
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useState } from 'react';
import { Sprout, Leaf, Microscope, BookOpen, Search } from 'lucide-react';

interface LoadingProps {
  status: string;
  step: number;
  facts?: string[];
}

const Loading: React.FC<LoadingProps> = ({ status, step, facts = [] }) => {
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  
  useEffect(() => {
    if (facts.length > 0) {
      const interval = setInterval(() => {
        setCurrentFactIndex((prev) => (prev + 1) % facts.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [facts]);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto mt-8 min-h-[400px] rounded-3xl bg-white dark:bg-slate-900 border border-herb-200 dark:border-white/10 shadow-xl overflow-hidden">
      
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-herb-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
        <div className="relative bg-herb-600 p-6 rounded-[2.5rem] shadow-2xl">
           <Sprout className="w-16 h-16 text-white animate-bounce" />
        </div>
        
        {/* Step Icons */}
        <div className="absolute -top-4 -right-4 bg-white dark:bg-slate-800 p-2 rounded-full shadow-lg border border-herb-100 dark:border-white/10">
            {step === 1 ? <Search className="w-5 h-5 text-herb-600 animate-spin" /> : <BookOpen className="w-5 h-5 text-herb-600" />}
        </div>
        <div className="absolute -bottom-4 -left-4 bg-white dark:bg-slate-800 p-2 rounded-full shadow-lg border border-herb-100 dark:border-white/10">
            <Microscope className={`w-5 h-5 text-herb-600 ${step === 2 ? 'animate-pulse' : ''}`} />
        </div>
      </div>

      <div className="text-center px-8 max-w-lg">
        <h3 className="text-herb-600 dark:text-herb-400 font-display font-bold text-lg mb-6 tracking-wide">
          {status}
        </h3>

        <div className="min-h-[100px] flex items-center justify-center">
            {facts.length > 0 ? (
            <div key={currentFactIndex} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <p className="text-xl text-slate-800 dark:text-slate-200 font-medium leading-relaxed italic">
                "{facts[currentFactIndex]}"
                </p>
            </div>
            ) : (
            <div className="flex items-center gap-3 text-slate-400 italic">
                <Leaf className="w-5 h-5 animate-spin" />
                <span>กำลังเตรียมข้อมูลตำรายา...</span>
            </div>
            )}
        </div>
        
        {/* Progress bar */}
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 mt-10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-herb-600 shadow-[0_0_15px_rgba(77,124,77,0.5)] transition-all duration-1000 ease-out"
              style={{ width: `${step * 33 + 10}%` }}
            ></div>
        </div>
      </div>

    </div>
  );
};

export default Loading;
