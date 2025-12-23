
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
export type AspectRatio = '16:9' | '9:16' | '1:1';
export type ComplexityLevel = 'นักเรียนประถม' | 'นักเรียนมัธยม' | 'ผู้เชี่ยวชาญ' | 'บุคคลทั่วไป';
export type VisualStyle = 'ภาพวาดพฤกษศาสตร์' | 'ภาพถ่ายจริง' | 'ภาพการ์ตูน' | 'อินโฟกราฟิก' | 'ภาพร่างเทคนิค';
export type Language = 'Thai' | 'English';

export interface GeneratedImage {
  id: string;
  data: string;
  prompt: string;
  timestamp: number;
  level?: ComplexityLevel;
  style?: VisualStyle;
  language?: Language;
  structuredData?: any; // เพิ่มข้อมูลสรุปสำหรับบันทึกลง Sheet
}

export interface SearchResultItem {
  title: string;
  url: string;
}

export interface ResearchResult {
  imagePrompt: string;
  facts: string[];
  searchResults: SearchResultItem[];
  structuredData?: any;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  // เพิ่มการรองรับคำสั่งของ Google Apps Script
  var google: {
    script: {
      run: {
        withSuccessHandler: (func: Function) => any;
        withFailureHandler: (func: Function) => any;
        saveHerbToSheet: (data: any) => void;
      }
    }
  };
}
