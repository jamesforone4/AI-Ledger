import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { ExtractionResult } from "../types";

// 1. 在 Vite/Vercel 環境中，環境變數要用 import.meta.env 抓取
// 記得在 Vercel 後台設置 VITE_GEMINI_API_KEY
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export const extractLedgerInfo = async (input: string): Promise<ExtractionResult[] | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // 2. 初始化模型的正確語法是 getGenerativeModel
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", // 建議使用穩定版，或 gemini-2.0-flash-exp
    });

    const prompt = `你是一個精確的記帳助手。請從使用者的輸入中提取「所有」消費資訊。
使用者可能會在一段話中輸入多筆消費，請將它們全部分離出來。
如果日期未指定，請預設使用今天 (${today})。如果使用者說「昨天」，請計算出正確日期。
請務必將消費歸類為以下六種之一：食、衣、住、行、育、樂。

輸入內容: "${input}"`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.ARRAY, // 3. 這裡要用 SchemaType 而不是 Type
          items: {
            type: SchemaType.OBJECT,
            properties: {
              date: { type: SchemaType.STRING, description: "格式為 YYYY-MM-DD" },
              item: { type: SchemaType.STRING, description: "消費項目名稱" },
              amount: { type: SchemaType.NUMBER, description: "金額（數字）" },
              category: { type: SchemaType.STRING, description: "食、衣、住、行、育、樂" }
            },
            required: ["date", "item", "amount", "category"]
          }
        }
      }
    });

    const response = await result.response;
    const text = response.text();
    
    if (!text) return null;
    
    const results = JSON.parse(text.trim());
    return Array.isArray(results) ? results : [results];
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    return null;
  }
};
