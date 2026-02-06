import { ExtractionResult } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export const extractLedgerInfo = async (input: string): Promise<ExtractionResult[] | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // 最終手段：使用最基礎的 gemini-pro 名稱
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    const prompt = `你是一個精確的記帳助手。請從輸入中提取消費資訊。
今日日期: ${today}
請歸類為：食、衣、住、行、育、樂。
輸出格式為 JSON 陣列，範例：
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
      // 如果這裡還是報 404，代表 API Key 根本沒權限存取 Gemini 模型
      throw new Error(errorData.error?.message || `狀態碼 ${response.status}`);
    }

    const data = await response.json();
    if (!data.candidates || !data.candidates[0]) {
      throw new Error("AI 沒有回傳任何內容");
    }

    let text = data.candidates[0].content.parts[0].text;
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const results = JSON.parse(text);
    return Array.isArray(results) ? results : [results];
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "連線失敗");
  }
};
