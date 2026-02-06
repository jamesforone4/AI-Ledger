import { GoogleGenerativeAI } from "@google/generative-ai";
import { ExtractionResult } from "../types";

// 取得 API Key (Vite 必須以 VITE_ 開頭)
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("Critical: VITE_GEMINI_API_KEY is missing!");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export const extractLedgerInfo = async (input: string): Promise<ExtractionResult[] | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `你是一個精確的記帳助手。請從使用者的輸入中提取消費資訊。
輸入內容: "${input}"
今日日期: ${today}
請歸類為：食、衣、住、行、育、樂。
輸出格式必須是 JSON 陣列。`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "array" as any,
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
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // 拋出具體錯誤讓 App.tsx 捕捉
    throw new Error(error.message || "Gemini 解析失敗");
  }
};
