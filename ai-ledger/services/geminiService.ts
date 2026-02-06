import { ExtractionResult } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export const extractLedgerInfo = async (input: string): Promise<ExtractionResult[] | null> => {
  try {
    if (!apiKey) throw new Error("找不到 API Key。");

    // 1. 先去獲取目前「真實可用」的模型清單
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const listResponse = await fetch(listUrl);
    const listData = await listResponse.json();

    if (!listResponse.ok) {
      throw new Error(`無法獲取模型清單: ${listData.error?.message || '權限錯誤'}`);
    }

    // 2. 在清單中尋找包含 'gemini' 且支援 'generateContent' 的模型
    const availableModel = listData.models?.find((m: any) => 
      m.name.includes("gemini") && m.supportedGenerationMethods.includes("generateContent")
    );

    if (!availableModel) {
      throw new Error("此 API Key 下目前沒有可用的 Gemini 模型，請檢查 Google AI Studio 權限。");
    }

    const modelName = availableModel.name; // 這會拿到完整的路徑，例如 "models/gemini-1.5-flash"
    
    // 3. 使用抓到的正確名稱發送請求
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;
    const today = new Date().toISOString().split('T')[0];
    const prompt = `你是一個記帳助手。請將輸入轉為 JSON 陣列。今日日期: ${today}
格式: [{"date": "${today}", "item": "品名", "amount": 100, "category": "食/衣/住/行/育/樂"}]
輸入內容: "${input}"`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "生成失敗");

    const text = data.candidates[0].content.parts[0].text;
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);

  } catch (error: any) {
    console.error("Critical Error:", error);
    throw new Error(`自動偵測結果: ${error.message}`);
  }
};
