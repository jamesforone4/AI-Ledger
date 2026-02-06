import { ExtractionResult } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export const extractLedgerInfo = async (input: string): Promise<ExtractionResult[] | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    if (!apiKey) {
      throw new Error("找不到 API Key。請在 Vercel 設定 VITE_GEMINI_API_KEY 並 Redeploy。");
    }

    // 我們直接嘗試最標準的 v1 版本，這是目前最正式的端點
    const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `你是一個精確的記帳助手。請從輸入中提取消費資訊。
今日日期: ${today}
請歸類為：食、衣、住、行、育、樂。
輸出格式為 JSON 陣列，例如：
[{"date": "${today}", "item": "午餐", "amount": 100, "category": "食"}]

輸入內容: "${input}"`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // 如果 v1 還是 404，我們拋出更詳細的資訊
      throw new Error(`Google API 回應錯誤 (${response.status}): ${errorData.error?.message || '路徑不存在'}`);
    }

    const data = await response.json();
    let text = data.candidates[0].content.parts[0].text;
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const results = JSON.parse(text);
    return Array.isArray(results) ? results : [results];

  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error(error.message || "連線失敗");
  }
};
