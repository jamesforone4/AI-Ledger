import { ExtractionResult } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export const extractLedgerInfo = async (input: string): Promise<ExtractionResult[] | null> => {
  try {
    if (!apiKey) throw new Error("Vercel 找不到 API Key。");

    // 第一步：先問 Google 到底支援什麼模型
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const listResponse = await fetch(listUrl);
    const listData = await listResponse.json();

    if (!listResponse.ok) {
      throw new Error(`無法獲取清單: ${listData.error?.message || '權限錯誤'}`);
    }

    // 獲取可用的模型名稱
    const availableModels = listData.models?.map((m: any) => m.name) || [];
    console.log("可用模型:", availableModels);

    // 第二步：從清單中挑一個來用，如果清單是空的，代表 Key 根本沒開通
    if (availableModels.length === 0) {
      throw new Error("此 API Key 下沒有任何可用的 Gemini 模型。請重新在 Google AI Studio 申請。");
    }

    // 優先找 flash，找不到就隨便找一個清單裡的
    const targetModel = availableModels.find((m: string) => m.includes("gemini-1.5-flash")) || availableModels[0];
    
    // 第三步：正式呼叫
    const today = new Date().toISOString().split('T')[0];
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/${targetModel}:generateContent?key=${apiKey}`;

    const prompt = `你是一個記帳助手。請從輸入中提取消費資訊。
今日日期: ${today}
請歸類為：食、衣、住、行、育、樂。
輸出嚴格的 JSON 陣列，例如：
[{"date": "${today}", "item": "午餐", "amount": 100, "category": "食"}]

輸入內容: "${input}"`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    let text = data.candidates[0].content.parts[0].text;
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(text);

  } catch (error: any) {
    console.error("Gemini Debug Error:", error);
    throw new Error(`診斷結果: ${error.message}`);
  }
};
