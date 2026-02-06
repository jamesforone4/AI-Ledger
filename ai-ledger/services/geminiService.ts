import { ExtractionResult } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export const extractLedgerInfo = async (input: string): Promise<ExtractionResult[] | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    if (!apiKey) {
      throw new Error("Vercel 找不到 API Key，請檢查環境變數設定。");
    }

    // 終極對策：使用 gemini-1.5-flash-latest 這是 Google 最推薦的動態標籤
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const prompt = `你是一個精確的記帳助手。請從輸入中提取消費資訊。
今日日期: ${today}
請歸類為：食、衣、住、行、育、樂。
輸出格式必須是嚴格的 JSON 陣列，例如：
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
      const errorMsg = errorData.error?.message || "未知錯誤";
      // 這裡會顯示具體的 Google 報錯原因
      throw new Error(`Google 伺服器回傳 (${response.status}): ${errorMsg}`);
    }

    const data = await response.json();
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error("AI 回傳了空的結果，請換個說法試試。");
    }

    let text = data.candidates[0].content.parts[0].text;
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const results = JSON.parse(text);
    return Array.isArray(results) ? results : [results];

  } catch (error: any) {
    console.error("Gemini Final Error:", error);
    throw new Error(error.message || "連線失敗，請檢查網路或 API Key。");
  }
};
