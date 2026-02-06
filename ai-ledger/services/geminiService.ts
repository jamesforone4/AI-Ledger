
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { ExtractionResult } from "../types";

// Always use process.env.API_KEY directly as per guidelines
const ai = new GoogleGenerativeAI({ apiKey: process.env.API_KEY });

export const extractLedgerInfo = async (input: string): Promise<ExtractionResult[] | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `你是一個精確的記帳助手。請從使用者的輸入中提取「所有」消費資訊。
      
使用者可能會在一段話中輸入多筆消費，請將它們全部分離出來。
如果日期未指定，請預設使用今天 (${today})。如果使用者說「昨天」，請計算出正確日期。

請務必將消費歸類為以下六種之一：食、衣、住、行、育、樂。

輸入內容: "${input}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { 
                type: Type.STRING, 
                description: "格式為 YYYY-MM-DD" 
              },
              item: { 
                type: Type.STRING, 
                description: "消費項目名稱" 
              },
              amount: { 
                type: Type.NUMBER, 
                description: "金額（數字）" 
              },
              category: { 
                type: Type.STRING, 
                description: "分類，必須是：食、衣、住、行、育、樂 之一" 
              }
            },
            required: ["date", "item", "amount", "category"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    const results = JSON.parse(text.trim());
    return Array.isArray(results) ? results : [results];
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    return null;
  }
};
