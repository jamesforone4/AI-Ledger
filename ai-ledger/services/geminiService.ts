import { ExtractionResult } from "../types";

// 取得 Vite 環境變數
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export const extractLedgerInfo = async (input: string): Promise<ExtractionResult[] | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // 檢查 API Key 是否存在，如果沒讀到會直接噴出錯誤給網頁看到
    if (!apiKey) {
      throw new Error("找不到 API Key。請確認 Vercel 中的 VITE_GEMINI_API_KEY 設定正確並已 Redeploy。");
    }

    // 使用最穩定的 v1beta 路徑與 gemini-1.5-flash 模型
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `你是一個精確的記帳助手。請從輸入中提取消費資訊。
今日日期: ${today}
請歸類為：食、衣、住、行、育、樂。
輸出格式必須是嚴格的 JSON 陣列，不要包含 Markdown 語法或額外文字。範例：
[{"date": "${today}", "item": "午餐", "amount": 100, "category": "食"}]

輸入內容: "${input}"`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    // 處理 HTTP 錯誤
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData.error?.message || `HTTP ${response.status}`;
      
      if (response.status === 404) {
        throw new Error(`(404) 模型路徑不正確或 API Key 尚未生效。請檢查 Vercel 變數名稱是否為 VITE_GEMINI_API_KEY`);
      }
      throw new Error(`API 錯誤: ${msg}`);
    }

    const data = await response.json();
    
    // 檢查 AI 是否有回傳內容
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error("AI 回傳格式異常，請再試一次。");
    }

    let text = data.candidates[0].content.parts[0].text;
    
    // 清理 Markdown 標籤
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const results = JSON.parse(text);
    return Array.isArray(results) ? results : [results];

  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    // 這裡會把錯誤丟回給 App.tsx 顯示在紅框框裡
    throw new Error(error.message || "發生未知連線錯誤");
  }
};
