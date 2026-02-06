import { ExtractionResult } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export const extractLedgerInfo = async (input: string): Promise<ExtractionResult[] | null> => {
  try {
    if (!apiKey) throw new Error("找不到 API Key，請檢查 Vercel 設定。");

    const model = "gemini-1.5-flash";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const today = new Date().toISOString().split('T')[0];
    const prompt = `你是一個精確的記帳助手。請將輸入內容轉為 JSON 陣列。
今日日期: ${today}
格式: [{"date": "${today}", "item": "品名", "amount": 100, "category": "食/衣/住/行/育/樂"}]
輸入內容: "${input}"`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();

    // 如果 Google 回傳錯誤代碼 (例如 429)
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("你按太快了！Google 免費版限制每分鐘請求次數，請等 60 秒再試。");
      }
      throw new Error(`Google 伺服器錯誤 (${response.status}): ${data.error?.message || "未知原因"}`);
    }

    // 檢查 candidates 是否存在，避免出現 undefined is not an object
    if (!data.candidates || data.candidates.length === 0) {
      const blockReason = data.promptFeedback?.blockReason || "內容可能違反安全政策被阻擋";
      throw new Error(`AI 拒絕回答。原因: ${blockReason}`);
    }

    const text = data.candidates[0].content.parts[0].text;
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanText);

  } catch (error: any) {
    console.error("Gemini Critical Error:", error);
    // 這裡丟出的錯誤會直接顯示在網頁紅框框裡，讓你一眼看懂
    throw new Error(error.message || "發生連線錯誤");
  }
};
