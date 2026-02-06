import { ExtractionResult } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export const extractLedgerInfo = async (input: string): Promise<ExtractionResult[] | null> => {
  try {
    if (!apiKey) throw new Error("找不到 API Key。");

    const today = new Date().toISOString().split('T')[0];
    const prompt = `你是一個記帳助手。請將輸入轉為 JSON 陣列。
今日日期: ${today}
格式: [{"date": "${today}", "item": "品名", "amount": 100, "category": "食/衣/住/行/育/樂"}]
輸入內容: "${input}"`;

    // 定義多個可能的路徑，進行地毯式嘗試
    const endpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`
    ];

    let lastError = "";

    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();

        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          let text = data.candidates[0].content.parts[0].text;
          text = text.replace(/```json/g, '').replace(/```/g, '').trim();
          return JSON.parse(text);
        }
        
        // 如果是 429，直接拋出錯誤，不需要再試其他路徑
        if (response.status === 429) {
          throw new Error("你按得太快了，請等 60 秒再試。");
        }

        lastError = data.error?.message || `HTTP ${response.status}`;
      } catch (e: any) {
        if (e.message.includes("太快了")) throw e;
        continue; // 嘗試下一個路徑
      }
    }

    throw new Error(`所有路徑均失敗。最後一個錯誤: ${lastError}`);

  } catch (error: any) {
    throw new Error(error.message || "連線失敗");
  }
};
