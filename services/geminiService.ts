
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { ComplexityLevel, VisualStyle, ResearchResult, SearchResultItem, Language } from "../types";

const getAi = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const TEXT_MODEL = 'gemini-3-pro-preview';
const IMAGE_MODEL = 'gemini-3-pro-image-preview';
const EDIT_MODEL = 'gemini-3-pro-image-preview';

// แยก Function สำหรับแปลงข้อมูลเป็น JSON (เพื่อเลี่ยงการใช้ปนกับ Google Search)
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
    case 'นักเรียนประถม': return "กลุ่มเป้าหมาย: นักเรียนประถม (6-12 ปี) เน้นภาพสีสันสดใส เข้าใจง่าย";
    case 'นักเรียนมัธยม': return "กลุ่มเป้าหมาย: นักเรียนมัธยม เน้นข้อมูลวิชาการ มีแผนผังชัดเจน";
    case 'ผู้เชี่ยวชาญ': return "กลุ่มเป้าหมาย: ผู้เชี่ยวชาญ/เภสัชกร เน้นรายละเอียดโครงสร้างพืชและสารสำคัญ";
    default: return "กลุ่มเป้าหมาย: บุคคลทั่วไป";
  }
};

export const researchTopicForPrompt = async (
  topic: string, 
  level: ComplexityLevel, 
  style: VisualStyle,
  language: Language
): Promise<ResearchResult> => {
  
  const levelInstr = getLevelInstruction(level);

  // ขั้นตอนที่ 1: ค้นคว้าด้วย Google Search (ห้ามมี tools อื่นปน)
  const searchResponse = await getAi().models.generateContent({
    model: TEXT_MODEL,
    contents: `วิจัยข้อมูลสมุนไพร "${topic}" สำหรับ${levelInstr} สรุปสรรพคุณและระบุ IMAGE_PROMPT สำหรับสร้างภาพสื่อการเรียนรู้`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = searchResponse.text || "";
  const factsMatch = text.match(/FACTS:?\s*([\s\S]*?)(?=IMAGE_PROMPT:|$)/i);
  const facts = factsMatch ? factsMatch[1].trim().split('\n').map(f => f.replace(/^-\s*/, '').trim()).filter(f => f.length > 0) : [];
  const promptMatch = text.match(/IMAGE_PROMPT:?\s*([\s\S]*?)$/i);
  const imagePrompt = promptMatch ? promptMatch[1].trim() : `Botanical illustration of ${topic} Thai herb, educational infographic style.`;

  const searchResults: SearchResultItem[] = [];
  const chunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks) {
    chunks.forEach(chunk => {
      if (chunk.web?.uri && chunk.web?.title) searchResults.push({ title: chunk.web.title, url: chunk.web.uri });
    });
  }

  // ขั้นตอนที่ 2: แปลงเป็นข้อมูล Structured Data (ใช้ Flash เพื่อความเร็ว)
  let structuredData = null;
  try {
    const structResponse = await getAi().models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `จากข้อมูลนี้: "${text}" โปรดจัดหมวดหมู่ข้อมูลสมุนไพรลงในฟังก์ชัน recordHerbResearch`,
      config: {
        tools: [{ functionDeclarations: [saveHerbFunctionDeclaration] }],
      },
    });
    structuredData = structResponse.functionCalls?.find(fc => fc.name === 'recordHerbResearch')?.args;
  } catch (e) {
    console.warn("Failed to extract structured data, skipping...", e);
  }

  return {
    imagePrompt,
    facts,
    searchResults: Array.from(new Map(searchResults.map(item => [item.url, item])).values()),
    structuredData
  };
};

export const generateInfographicImage = async (prompt: string): Promise<string> => {
  const response = await getAi().models.generateContent({
    model: IMAGE_MODEL,
    contents: { parts: [{ text: prompt }] },
    config: { 
      imageConfig: { 
        aspectRatio: "16:9",
        imageSize: "1K" 
      }
      // ลบ responseModalities ออกตามกฎการสร้างรูปภาพ
    }
  });

  // วนลูปหา Part ที่เป็นรูปภาพตามคำแนะนำ
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData?.data) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("API did not return any image data");
};

export const editInfographicImage = async (currentImageBase64: string, editInstruction: string): Promise<string> => {
  const cleanBase64 = currentImageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
  const response = await getAi().models.generateContent({
    model: EDIT_MODEL,
    contents: { 
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } }, 
        { text: editInstruction }
      ] 
    },
    config: {
      imageConfig: { aspectRatio: "16:9" }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData?.data) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Failed to edit image");
};
