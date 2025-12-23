
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { GeneratedImage } from '../types';
import { Download, Sparkles, Edit3, Maximize2, X, ZoomIn, ZoomOut } from 'lucide-react';

interface InfographicProps {
  image: GeneratedImage;
  onEdit: (prompt: string) => void;
  isEditing: boolean;
}

const Infographic: React.FC<InfographicProps> = ({ image, onEdit, isEditing }) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPrompt.trim()) return;
    onEdit(editPrompt);
    setEditPrompt('');
  };

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto animate-in fade-in zoom-in duration-700">
      
      <div className="relative group w-full bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800">
        <img 
          src={image.data} 
          alt={image.prompt} 
          onClick={() => setIsFullscreen(true)}
          className="w-full h-auto object-contain max-h-[75vh] cursor-zoom-in"
        />
        
        <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => setIsFullscreen(true)}
            className="bg-black/50 backdrop-blur-md text-white p-3 rounded-2xl hover:bg-herb-600 transition-colors"
          >
            <Maximize2 className="w-6 h-6" />
          </button>
          <a 
            href={image.data} 
            download={`${image.prompt}.png`}
            className="bg-black/50 backdrop-blur-md text-white p-3 rounded-2xl hover:bg-herb-600 transition-colors"
          >
            <Download className="w-6 h-6" />
          </a>
        </div>
      </div>

      {/* Edit Bar */}
      <div className="w-full max-w-3xl -mt-10 relative z-40 px-4">
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl p-3 rounded-[2rem] shadow-2xl border border-herb-200 dark:border-white/10 flex items-center gap-4">
            <div className="pl-4 text-herb-600 hidden sm:block">
                <Edit3 className="w-6 h-6" />
            </div>
            <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
                <input
                    type="text"
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="ปรับปรุงภาพ (เช่น 'เพิ่มคำบรรยายสรรพคุณ', 'เปลี่ยนเป็นภาพถ่ายจริง')..."
                    className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400 px-2 py-3 font-medium text-lg"
                    disabled={isEditing}
                />
                <button
                    type="submit"
                    disabled={isEditing || !editPrompt.trim()}
                    className="bg-herb-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-herb-700 disabled:opacity-50 transition-all"
                >
                    {isEditing ? <span className="animate-spin w-5 h-5 block border-2 border-white/30 border-t-white rounded-full"></span> : <><Sparkles className="w-4 h-4" /> <span>ปรับปรุง</span></>}
                </button>
            </form>
        </div>
      </div>
      
      <div className="mt-8 text-center px-4">
        <p className="text-sm text-herb-600 font-bold uppercase tracking-widest">
            หัวข้อ: {image.prompt}
        </p>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-slate-100/95 dark:bg-slate-950/95 backdrop-blur-xl flex flex-col animate-in fade-in">
            <div className="p-6 flex justify-between items-center bg-white/50 dark:bg-slate-900/50">
                <div className="flex gap-4">
                    <button onClick={() => setZoomLevel(Math.max(zoomLevel - 0.5, 0.5))} className="p-3 bg-white dark:bg-slate-800 rounded-xl"><ZoomOut className="w-6 h-6" /></button>
                    <button onClick={() => setZoomLevel(1)} className="p-3 bg-herb-600 text-white rounded-xl font-bold">{Math.round(zoomLevel * 100)}%</button>
                    <button onClick={() => setZoomLevel(Math.min(zoomLevel + 0.5, 4))} className="p-3 bg-white dark:bg-slate-800 rounded-xl"><ZoomIn className="w-6 h-6" /></button>
                </div>
                <button onClick={() => {setIsFullscreen(false); setZoomLevel(1);}} className="p-4 bg-red-500 text-white rounded-2xl shadow-lg"><X className="w-8 h-8" /></button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center p-8">
                <img 
                    src={image.data} 
                    alt={image.prompt}
                    style={{ transform: `scale(${zoomLevel})` }}
                    className="max-w-full max-h-full object-contain shadow-2xl transition-transform duration-200"
                />
            </div>
        </div>
      )}
    </div>
  );
};

export default Infographic;
