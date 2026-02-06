import { GoogleGenerativeAI } from "@google/generative-ai";
import { ExtractionResult } from "../types";

// 確保 Vercel 後台有 VITE_GEMINI_API_KEY
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export const extractLedgerInfo = async (input: string): Promise<ExtractionResult[] | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `你是一個精確的記帳助手。請從使用者的輸入中提取消費資訊。
輸入內容: "${input}"
今日日期: ${today}
請歸類為：食、衣、住、行、育、樂。`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "array" as any, // 這裡直接用字串，繞過導出問題
          items: {
            type: "object" as any,
            properties: {
              date: { type: "string" as any },
              item: { type: "string" as any },
              amount: { type: "number" as any },
              category: { type: "string" as any }
            },
            required: ["date", "item", "amount", "category"]
          }
        }
      }
    });

    const text = result.response.text();
    if (!text) return null;
    
    const results = JSON.parse(text);
    return Array.isArray(results) ? results : [results];
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};
