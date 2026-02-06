import { GoogleGenerativeAI } from "@google/generative-ai";
import { ExtractionResult } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export const extractLedgerInfo = async (input: string): Promise<ExtractionResult[] | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    // 使用 flash 模型
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 將要求全部寫在 Prompt 裡面，並強力要求輸出純 JSON
    const prompt = `你是一個精確的記帳助手。請從使用者的輸入中提取消費資訊。
    
今日日期: ${today}
請歸類為：食、衣、住、行、育、樂。

輸出格式必須是嚴格的 JSON 陣列，不要包含任何 Markdown 語法或額外文字。範例格式：
[{"date": "2026-02-07", "item": "拉麵", "amount": 250, "category": "食"}]

使用者輸入內容: "${input}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // 清理可能出現的 Markdown 標籤 (例如 ```json ... ```)
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    if (!text) return null;
    
    const results = JSON.parse(text);
    return Array.isArray(results) ? results : [results];
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Gemini 解析失敗");
  }
};
