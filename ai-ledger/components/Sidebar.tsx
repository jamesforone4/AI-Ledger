
import React, { useState } from 'react';

interface SidebarProps {
  sheetUrl: string;
  webhookUrl: string;
  onUpdateUrl: (url: string) => void;
  onUpdateWebhook: (url: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sheetUrl, webhookUrl, onUpdateUrl, onUpdateWebhook }) => {
  const [isEditing, setIsEditing] = useState<'sheet' | 'webhook' | null>(null);
  const [tempSheetUrl, setTempSheetUrl] = useState(sheetUrl);
  const [tempWebhookUrl, setTempWebhookUrl] = useState(webhookUrl);
  const [showGuide, setShowGuide] = useState(false);

  const scriptCode = `function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = "myledger";
    var sheet = ss.getSheetByName(sheetName);
    
    // 如果找不到 myledger 工作表則創建它
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    var contents = e.postData.contents;
    var data = JSON.parse(contents);
    
    sheet.clear();
    sheet.appendRow(['日期', '項目', '金額', '分類']);
    
    if (data && data.length > 0) {
      var rows = data.map(function(item) {
        return [item.date, item.item, item.amount, item.category];
      });
      sheet.getRange(2, 1, rows.length, 4).setValues(rows);
    }
    
    return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}`;

  return (
    <aside className="w-full lg:w-72 bg-slate-900 text-white flex flex-col p-6 space-y-8 overflow-y-auto">
      <div className="flex items-center space-x-3">
        <div className="bg-emerald-500 p-2 rounded-lg shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </div>
        <span className="text-xl font-bold tracking-tight">AI Ledger</span>
      </div>

      <nav className="flex-1 space-y-2">
        <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest">雲端設定</div>
        
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">試算表網址</p>
            <button onClick={() => setIsEditing(isEditing === 'sheet' ? null : 'sheet')} className="text-[10px] hover:text-emerald-400 underline">
              {isEditing === 'sheet' ? '取消' : '修改'}
            </button>
          </div>
          {isEditing === 'sheet' ? (
            <div className="space-y-2">
              <input value={tempSheetUrl} onChange={e => setTempSheetUrl(e.target.value)} placeholder="試算表連結..." className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-[10px] focus:ring-1 focus:ring-emerald-500 outline-none" />
              <button onClick={() => { onUpdateUrl(tempSheetUrl); setIsEditing(null); }} className="w-full bg-emerald-600 py-1.5 rounded text-[10px] font-bold">儲存</button>
            </div>
          ) : (
            <p className="text-[10px] truncate opacity-80 italic">{sheetUrl || '未設定查看網址'}</p>
          )}
        </div>

        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">Webhook (自動寫入 myledger)</p>
            <button onClick={() => setIsEditing(isEditing === 'webhook' ? null : 'webhook')} className="text-[10px] hover:text-sky-400 underline">
              {isEditing === 'webhook' ? '取消' : '設定'}
            </button>
          </div>
          {isEditing === 'webhook' ? (
            <div className="space-y-2">
              <input value={tempWebhookUrl} onChange={e => setTempWebhookUrl(e.target.value)} placeholder="部署網址..." className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-[10px] focus:ring-1 focus:ring-sky-500 outline-none" />
              <button onClick={() => { onUpdateWebhook(tempWebhookUrl); setIsEditing(null); }} className="w-full bg-sky-600 py-1.5 rounded text-[10px] font-bold">啟用</button>
              <button onClick={() => setShowGuide(true)} className="w-full bg-slate-700 py-1.5 rounded text-[10px]">查看腳本代碼</button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${webhookUrl ? 'bg-sky-500 shadow-[0_0_5px_#38bdf8]' : 'bg-slate-600'}`}></div>
              <p className="text-[10px] font-medium">{webhookUrl ? '雲端寫入已就緒' : '未連動'}</p>
            </div>
          )}
        </div>
      </nav>

      {showGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-lg font-bold text-sky-400">Google 試算表連動設定 (myledger)</h3>
            <div className="text-sm text-slate-300 space-y-3 leading-relaxed">
              <p>1. 開啟試算表，點選 <b>「擴充功能 > Apps Script」</b>。</p>
              <p>2. 貼入以下代碼 (會自動對準 <b>myledger</b> 工作表)：</p>
              <pre className="bg-black p-3 rounded text-[10px] text-emerald-400 overflow-x-auto border border-slate-800">{scriptCode}</pre>
              <p>3. 點選 <b>「部署 > 新增部署」</b>。</p>
              <p>4. 種類選 <b>「網頁應用程式」</b>，關鍵：<b>「誰可以存取」必選「所有人 (Anyone)」</b>。</p>
              <p>5. 複製網址，貼回左側 Webhook 欄位。</p>
            </div>
            <button onClick={() => setShowGuide(false)} className="w-full bg-emerald-600 py-3 rounded-xl font-bold">我已複製並部署</button>
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-slate-800 text-center">
        <p className="text-[10px] text-slate-500 italic">資料將自動寫入名為「myledger」的分頁</p>
      </div>
    </aside>
  );
};

export default Sidebar;
