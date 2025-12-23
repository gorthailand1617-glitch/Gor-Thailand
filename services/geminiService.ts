
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Modality, Type, FunctionDeclaration } from "@google/genai";
import { ComplexityLevel, VisualStyle, ResearchResult, SearchResultItem, Language } from "../types";

const getAi = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const TEXT_MODEL = 'gemini-3-pro-preview';
const IMAGE_MODEL = 'gemini-3-pro-image-preview';
const EDIT_MODEL = 'gemini-3-pro-image-preview';

// คำสั่งสำหรับบันทึกข้อมูล (Function Declaration)
const saveHerbFunctionDeclaration: FunctionDeclaration = {
  name: 'recordHerbResearch',
  parameters: {
    type: Type.OBJECT,
    description: 'บันทึกข้อมูลการวิจัยสมุนไพรลงในระบบฐานข้อมูล',
    properties: {
      name: { type: Type.STRING, description: 'ชื่อสมุนไพร' },
      properties: { type: Type.STRING, description: 'สรุปสรรพคุณสั้นๆ' },
      category: { type: Type.STRING, description: 'หมวดหมู่การใช้งาน' },
      level: { type: Type.STRING, description: 'ระดับกลุ่มเป้าหมาย' },
      sources: { type: Type.STRING, description: 'URL อ้างอิงหลัก' },
    },
    required: ['name', 'properties', 'category', 'level'],
  },
};

const getLevelInstruction = (level: ComplexityLevel): string => {
  switch (level) {
    case 'นักเรียนประถม': return "กลุ่มเป้าหมาย: นักเรียนประถม (6-12 ปี) เน้นภาพสีสันสดใส เข้าใจง่าย ตัวหนังสือภาษาไทยขนาดใหญ่";
    case 'นักเรียนมัธยม': return "กลุ่มเป้าหมาย: นักเรียนมัธยม เน้นข้อมูลที่ถูกต้องตามหลักวิชาการ มีแผนผังและคำอธิบายประกอบที่ชัดเจน";
    case 'ผู้เชี่ยวชาญ': return "กลุ่มเป้าหมาย: ผู้เชี่ยวชาญ/เภสัชกร เน้นรายละเอียดโครงสร้างพืช สารสำคัญทางเคมี และสรรพคุณทางยาเชิงลึก";
    default: return "กลุ่มเป้าหมาย: บุคคลทั่วไป เน้นความสวยงามและประโยชน์ที่นำไปใช้ได้จริงในชีวิตประจำวัน";
  }
};

const getStyleInstruction = (style: VisualStyle): string => {
  switch (style) {
    case 'ภาพวาดพฤกษศาสตร์': return "สไตล์: ภาพวาดพฤกษศาสตร์คลาสสิก (Botanical Illustration)";
    case 'ภาพถ่ายจริง': return "สไตล์: ภาพถ่ายจริงคุณภาพสูง (Realistic Photo) แสงธรรมชาติ";
    case 'ภาพการ์ตูน': return "สไตล์: การ์ตูนเพื่อการศึกษา สีสันสดใส";
    case 'อินโฟกราฟิก': return "สไตล์: อินโฟกราฟิกสมัยใหม่ สะอาดตา";
    default: return "สไตล์: ภาพวาดดิจิทัลเพื่อการศึกษาสมัยใหม่";
  }
};

export const researchTopicForPrompt = async (
  topic: string, 
  level: ComplexityLevel, 
  style: VisualStyle,
  language: Language
): Promise<ResearchResult> => {
  
  const levelInstr = getLevelInstruction(level);
  const styleInstr = getStyleInstruction(style);

  const systemPrompt = `
    คุณคือผู้เชี่ยวชาญด้านพฤกษาศาสตร์และสมุนไพรไทย
    เป้าหมายของคุณคือวิจัยข้อมูลเกี่ยวกับ: "${topic}" เพื่อสร้างสื่อการเรียนรู้
    
    **คำสั่งสำคัญ: ใช้ Google Search เพื่อหาข้อมูลที่ถูกต้องที่สุดในภาษาไทย**
    
    โปรดระบุข้อมูลในรูปแบบต่อไปนี้:
    FACTS: สรุปสรรพคุณ 3-5 ข้อ
    IMAGE_PROMPT: คำบรรยายภาพเป็นภาษาอังกฤษที่ละเอียดมาก
  `;

  const response = await getAi().models.generateContent({
    model: TEXT_MODEL,
    contents: systemPrompt,
    config: {
      tools: [{ googleSearch: {} }, { functionDeclarations: [saveHerbFunctionDeclaration] }],
    },
  });

  const text = response.text || "";
  const factsMatch = text.match(/FACTS:\s*([\s\S]*?)(?=IMAGE_PROMPT:|$)/i);
  const facts = factsMatch ? factsMatch[1].trim().split('\n').map(f => f.replace(/^-\s*/, '').trim()).filter(f => f.length > 0) : [];
  const promptMatch = text.match(/IMAGE_PROMPT:\s*([\s\S]*?)$/i);
  const imagePrompt = promptMatch ? promptMatch[1].trim() : `Botanical illustration of ${topic}`;

  const searchResults: SearchResultItem[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks) {
    chunks.forEach(chunk => {
      if (chunk.web?.uri && chunk.web?.title) searchResults.push({ title: chunk.web.title, url: chunk.web.uri });
    });
  }

  // ดึงข้อมูล structured สำหรับบันทึกลง Sheet (ถ้าโมเดลสร้างให้)
  const structuredData = response.functionCalls?.find(fc => fc.name === 'recordHerbResearch')?.args;

  return {
    imagePrompt,
    facts,
    searchResults: Array.from(new Map(searchResults.map(item => [item.url, item])).values()),
    structuredData // เพิ่มข้อมูลส่วนนี้เพื่อส่งต่อให้ UI บันทึกลง Sheet
  };
};

export const generateInfographicImage = async (prompt: string): Promise<string> => {
  const response = await getAi().models.generateContent({
    model: IMAGE_MODEL,
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio: "16:9" }, responseModalities: [Modality.IMAGE] }
  });
  const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (part?.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
  throw new Error("Failed to generate image");
};

export const editInfographicImage = async (currentImageBase64: string, editInstruction: string): Promise<string> => {
  const cleanBase64 = currentImageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
  const response = await getAi().models.generateContent({
    model: EDIT_MODEL,
    contents: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } }, { text: editInstruction }] },
    config: { responseModalities: [Modality.IMAGE] }
  });
  const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (part?.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
  throw new Error("Failed to edit image");
};
