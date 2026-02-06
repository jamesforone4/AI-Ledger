import { GoogleGenerativeAI } from "@google/generative-ai";
import { ExtractionResult } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export const extractLedgerInfo = async (input: string): Promise<ExtractionResult[] | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // 關鍵修改：將模型名稱改為 "gemini-pro"
    // 這是 Google 最穩定的模型名稱，支援度最廣
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `你是一個精確的記帳助手。請從使用者的輸入中提取消費資訊。
    
今日日期: ${today}
請歸類為：食、衣、住、行、育、樂。

輸出格式必須是嚴格的 JSON 陣列，不要包含任何 Markdown 語法或額外文字。範例格式：
[{"date": "2026-02-07", "item": "拉麵", "amount": 250, "category": "食"}]

使用者輸入內容: "${input}"`;

    // 使用更通用的呼叫方式
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // 清理 Markdown 標籤
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    if (!text) return null;
    
    const results = JSON.parse(text);
    return Array.isArray(results) ? results : [results];
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // 如果連 gemini-pro 都 404，我們會看到更詳細的錯誤
    throw new Error(error.message || "模型連線失敗");
  }
};
