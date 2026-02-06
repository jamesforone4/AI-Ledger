import { ExtractionResult } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export const extractLedgerInfo = async (input: string): Promise<ExtractionResult[] | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // 這裡我們手動拼對接網址，指定 v1beta 版本 (目前最穩定的路徑)
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `你是一個精確的記帳助手。請從使用者的輸入中提取消費資訊。
今日日期: ${today}
請歸類為：食、衣、住、行、育、樂。
輸出格式必須是嚴格的 JSON 陣列，不要包含任何 Markdown 語法或額外文字。範例：
[{"date": "2026-02-07", "item": "拉麵", "amount": 250, "category": "食"}]

輸入內容: "${input}"`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP 錯誤 ${response.status}`);
    }

    const data = await response.json();
    let text = data.candidates[0].content.parts[0].text;
    
    // 清理可能的 Markdown 標籤
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const results = JSON.parse(text);
    return Array.isArray(results) ? results : [results];
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "API 連線失敗");
  }
};
