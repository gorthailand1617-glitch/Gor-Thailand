
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { SearchResultItem } from '../types';
import { ExternalLink, BookOpen, Link as LinkIcon } from 'lucide-react';

interface SearchResultsProps {
  results: SearchResultItem[];
}

const SearchResults: React.FC<SearchResultsProps> = ({ results }) => {
  if (!results || results.length === 0) return null;

  return (
    <div className="w-full mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-herb-600 rounded-lg text-white">
            <BookOpen className="w-5 h-5" />
        </div>
        <h3 className="font-display font-bold text-herb-800 dark:text-herb-200 text-lg uppercase tracking-wider">แหล่งอ้างอิงข้อมูล</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((result, index) => (
          <a 
            key={index} 
            href={result.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex flex-col p-5 bg-white dark:bg-slate-900 border border-herb-200 dark:border-white/5 rounded-2xl hover:border-herb-500 transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
               <h4 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-herb-600 transition-colors line-clamp-2">
                 {result.title}
               </h4>
               <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-herb-600 flex-shrink-0" />
            </div>
            
            <div className="mt-auto flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              <LinkIcon className="w-3 h-3" />
              <span className="truncate">
                {new URL(result.url).hostname.replace('www.', '')}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;
