
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { GeneratedImage, ComplexityLevel, VisualStyle, Language, SearchResultItem } from './types';
import { 
  researchTopicForPrompt, 
  generateInfographicImage, 
  editInfographicImage,
} from './services/geminiService';
import Infographic from './components/Infographic';
import Loading from './components/Loading';
import IntroScreen from './components/IntroScreen';
import SearchResults from './components/SearchResults';
import { Search, AlertCircle, History, Leaf, Palette, Microscope, Sun, Moon, Key, CreditCard, ExternalLink, GraduationCap, Sprout, BookOpen, Database, CheckCircle2 } from 'lucide-react';

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [topic, setTopic] = useState('');
  const [complexityLevel, setComplexityLevel] = useState<ComplexityLevel>('นักเรียนมัธยม');
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('อินโฟกราฟิก');
  const [language, setLanguage] = useState<Language>('Thai');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [loadingFacts, setLoadingFacts] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [imageHistory, setImageHistory] = useState<GeneratedImage[]>([]);
  const [currentSearchResults, setCurrentSearchResults] = useState<SearchResultItem[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // API Key State
  const [hasApiKey, setHasApiKey] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    const checkKey = async () => {
      try {
        if (window.aistudio && window.aistudio.hasSelectedApiKey) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(hasKey);
        } else setHasApiKey(true);
      } catch (e) {
        setHasApiKey(true);
      } finally {
        setCheckingKey(false);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
      setError(null);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !topic.trim()) return;

    setIsLoading(true);
    setError(null);
    setSaveMessage(null);
    setLoadingStep(1);
    setLoadingFacts([]);
    setCurrentSearchResults([]);
    setLoadingMessage(`กำลังค้นคว้าข้อมูลสมุนไพร: ${topic}...`);

    try {
      const researchResult = await researchTopicForPrompt(topic, complexityLevel, visualStyle, language);
      setLoadingFacts(researchResult.facts);
      setCurrentSearchResults(researchResult.searchResults);
      setLoadingStep(2);
      setLoadingMessage(`กำลังสร้างอินโฟกราฟิก...`);
      
      let base64Data = await generateInfographicImage(researchResult.imagePrompt);
      
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        data: base64Data,
        prompt: topic,
        timestamp: Date.now(),
        level: complexityLevel,
        style: visualStyle,
        language: language,
        structuredData: researchResult.structuredData
      };
      setImageHistory([newImage, ...imageHistory]);
    } catch (err: any) {
      setError('ไม่สามารถสร้างสื่อการเรียนรู้ได้ในขณะนี้');
    } finally {
      setIsLoading(false);
      setLoadingStep(0);
    }
  };

  const handleSaveToSheet = () => {
    if (imageHistory.length === 0 || isSaving) return;
    const current = imageHistory[0];
    
    // เตรียมข้อมูลสำหรับส่งไป Code.gs
    const dataToSave = {
      name: current.prompt,
      properties: current.structuredData?.properties || current.prompt,
      category: current.structuredData?.category || 'ทั่วไป',
      level: current.level,
      sources: currentSearchResults[0]?.url || 'N/A'
    };

    setIsSaving(true);
    setSaveMessage(null);

    // เรียกฟังก์ชันใน Code.gs
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run
        .withSuccessHandler((res: any) => {
          setIsSaving(false);
          setSaveMessage(res.message);
          setTimeout(() => setSaveMessage(null), 5000);
        })
        .withFailureHandler((err: any) => {
          setIsSaving(false);
          setError('ไม่สามารถบันทึกลง Sheets ได้: ' + err.toString());
        })
        .saveHerbToSheet(dataToSave);
    } else {
      // Mockup สำหรับกรณีไม่ได้รันบน GAS จริง
      setTimeout(() => {
        setIsSaving(false);
        setSaveMessage('บันทึกข้อมูลเรียบร้อยแล้ว (จำลอง)');
        console.log('Saved to sheet mockup:', dataToSave);
        setTimeout(() => setSaveMessage(null), 3000);
      }, 1000);
    }
  };

  const handleEdit = async (editPrompt: string) => {
    if (imageHistory.length === 0) return;
    setIsLoading(true);
    setLoadingStep(2);
    setLoadingMessage(`กำลังปรับปรุงภาพตามคำสั่ง...`);
    try {
      const base64Data = await editInfographicImage(imageHistory[0].data, editPrompt);
      const newImage: GeneratedImage = {
        ...imageHistory[0],
        id: Date.now().toString(),
        data: base64Data,
        prompt: editPrompt
      };
      setImageHistory([newImage, ...imageHistory]);
    } catch (err) {
      setError('ไม่สามารถปรับปรุงภาพได้');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    {!checkingKey && !hasApiKey && (
      <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border-2 border-herb-500 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
              <CreditCard className="w-16 h-16 text-herb-600 mx-auto mb-4" />
              <h2 className="text-2xl font-display font-bold mb-4">ต้องใช้ API Key แบบชำระเงิน</h2>
              <button onClick={handleSelectKey} className="w-full py-3 bg-herb-600 text-white rounded-xl font-bold shadow-lg">เลือก API Key</button>
          </div>
      </div>
    )}

    {showIntro ? (
      <IntroScreen onComplete={() => setShowIntro(false)} />
    ) : (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-sans pb-20 transition-colors">
      <div className="fixed inset-0 bg-botanical opacity-[0.03] dark:opacity-[0.05] pointer-events-none"></div>

      <header className="border-b border-herb-200 dark:border-white/10 sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-herb-600 p-2 rounded-xl shadow-lg"><Leaf className="w-6 h-6 text-white" /></div>
            <div className="flex flex-col">
                <span className="font-display font-bold text-xl md:text-2xl text-herb-800 dark:text-herb-100 leading-none">Thai Herb Explorer</span>
                <span className="text-[10px] uppercase tracking-widest text-herb-600 dark:text-herb-400 font-bold">GAS & AI Edition</span>
            </div>
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-full bg-herb-50 dark:bg-slate-800 border border-herb-200 dark:border-white/10">
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="px-4 py-8 relative z-10">
        <div className={`max-w-6xl mx-auto transition-all duration-500 ${imageHistory.length > 0 ? 'mb-8' : 'min-h-[60vh] flex flex-col justify-center'}`}>
          {!imageHistory.length && (
            <div className="text-center mb-12 space-y-6">
              <h1 className="text-4xl md:text-7xl font-display font-bold text-slate-900 dark:text-white leading-tight">วิจัยสมุนไพร <span className="text-herb-600">ไทย</span><br/>ลง Google Sheets ทันที</h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">เพียงพิมพ์ชื่อสมุนไพร AI จะค้นข้อมูล สร้างภาพ และจัดเตรียมตารางให้คุณบันทึกเก็บไว้</p>
            </div>
          )}

          <form onSubmit={handleGenerate} className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-900 border border-herb-200 dark:border-white/10 p-2 rounded-3xl shadow-xl">
                <div className="flex items-center px-4 py-2">
                    <Search className="w-6 h-6 text-herb-500 mr-4" />
                    <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="ระบุสมุนไพรที่ต้องการวิจัย..." className="w-full py-4 bg-transparent outline-none text-xl font-medium" />
                    <button type="submit" disabled={isLoading} className="hidden md:flex bg-herb-600 hover:bg-herb-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg transition-all disabled:opacity-50">
                       {isLoading ? 'กำลังวิจัย...' : 'เริ่มวิจัย'}
                    </button>
                </div>
            </div>
          </form>
        </div>

        {isLoading && <Loading status={loadingMessage} step={loadingStep} facts={loadingFacts} />}
        {error && <div className="max-w-2xl mx-auto mt-8 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-2xl flex items-center gap-4 text-red-800 dark:text-red-200"><AlertCircle className="w-6 h-6" /><p>{error}</p></div>}

        {imageHistory.length > 0 && !isLoading && (
            <div className="space-y-12">
                <div className="relative group max-w-6xl mx-auto">
                    <Infographic image={imageHistory[0]} onEdit={handleEdit} isEditing={isLoading} />
                    
                    {/* Floating Save Button */}
                    <div className="absolute bottom-10 right-4 md:right-10 flex flex-col items-end gap-3 z-50">
                      {saveMessage && (
                        <div className="bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                          <CheckCircle2 className="w-4 h-4" /> {saveMessage}
                        </div>
                      )}
                      <button 
                        onClick={handleSaveToSheet} 
                        disabled={isSaving}
                        className="flex items-center gap-3 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-2xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
                      >
                        {isSaving ? <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></span> : <Database className="w-6 h-6" />}
                        {isSaving ? 'กำลังบันทึก...' : 'บันทึกลง Google Sheets'}
                      </button>
                    </div>
                </div>
                
                <div className="max-w-6xl mx-auto">
                    <SearchResults results={currentSearchResults} />
                </div>
            </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 mt-20 text-center text-slate-400 text-sm">
         <p>© 2024 Thai Herb Explorer x Google Apps Script</p>
      </footer>
    </div>
    )}
    </>
  );
};

export default App;
