import React, { useState, useEffect } from 'react';
import { extractLedgerInfo } from './services/geminiService';
import { LedgerEntry, SyncStatus } from './types';
import Sidebar from './components/Sidebar';
import LedgerTable from './components/LedgerTable';
import StatCards from './components/StatCards';
import ChatInput from './components/ChatInput';
import Analytics from './components/Analytics';
import EntryDetailModal from './components/EntryDetailModal';

const App: React.FC = () => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.IDLE);
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);
  const [sheetUrl, setSheetUrl] = useState<string>('');
  const [webhookUrl, setWebhookUrl] = useState<string>('');

  useEffect(() => {
    const savedEntries = localStorage.getItem('ai_ledger_entries');
    if (savedEntries) setEntries(JSON.parse(savedEntries));
    
    const savedUrl = localStorage.getItem('ai_ledger_sheet_url');
    if (savedUrl) setSheetUrl(savedUrl);

    const savedWebhook = localStorage.getItem('ai_ledger_webhook_url');
    if (savedWebhook) setWebhookUrl(savedWebhook);
  }, []);

  useEffect(() => {
    localStorage.setItem('ai_ledger_entries', JSON.stringify(entries));
  }, [entries]);

  const handleUpdateSheetUrl = (url: string) => {
    setSheetUrl(url);
    localStorage.setItem('ai_ledger_sheet_url', url);
  };

  const handleUpdateWebhookUrl = (url: string) => {
    setWebhookUrl(url);
    localStorage.setItem('ai_ledger_webhook_url', url);
  };

  const handleSyncToCloud = async (currentEntries: LedgerEntry[]) => {
    if (!webhookUrl || currentEntries.length === 0) return;
    
    setSyncStatus(SyncStatus.SYNCING);
    try {
      const payload = currentEntries.map(({ date, item, amount, category }) => ({ 
        date, item, amount, category 
      }));
      
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });
      
      setSyncStatus(SyncStatus.SUCCESS);
      setTimeout(() => setSyncStatus(SyncStatus.IDLE), 3000);
    } catch (error) {
      console.error('Webhook sync failed:', error);
      setSyncStatus(SyncStatus.ERROR);
      setTimeout(() => setSyncStatus(SyncStatus.IDLE), 3000);
    }
  };

  const handleProcessInput = async (text: string) => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    setErrorMessage(null);
    setSyncStatus(SyncStatus.SYNCING);
    
    try {
      const results = await extractLedgerInfo(text);
      
      if (results && results.length > 0) {
        const newBatch: LedgerEntry[] = results.map(result => ({
          ...result,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          sourceText: text
        }));
        
        const updatedEntries = [...newBatch, ...entries];
        setEntries(updatedEntries);
        
        if (webhookUrl) {
          await handleSyncToCloud(updatedEntries);
        } else {
          setSyncStatus(SyncStatus.SUCCESS);
          setTimeout(() => setSyncStatus(SyncStatus.IDLE), 3000);
        }
      } else {
        setErrorMessage("AI 無法正確解析內容，請檢查輸入格式或 API 設定。");
        setSyncStatus(SyncStatus.ERROR);
      }
    } catch (err: any) {
      setErrorMessage(`連線出錯: ${err.message || "請檢查網路或 API Key"}`);
      setSyncStatus(SyncStatus.ERROR);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenSheet = () => {
    if (sheetUrl) {
      window.open(sheetUrl, '_blank');
    } else {
      alert('請先在左側選單設定您的 Google 試算表網址。');
    }
  };

  const handleCopyAsTSV = () => {
    if (entries.length === 0) {
      alert('目前沒有資料可以複製。');
      return;
    }
    const headers = ['日期', '項目', '金額', '分類'];
    const rows = entries.map(e => [e.date, e.item, e.amount, e.category].join('\t'));
    const tsvString = [headers.join('\t'), ...rows].join('\n');
    
    navigator.clipboard.writeText(tsvString).then(() => {
      alert('✅ 已複製！請到 Google Sheet 貼上即可。');
    }).catch(err => {
      alert('複製失敗');
    });
  };

  const handleDeleteEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    if (webhookUrl) handleSyncToCloud(updated);
    if (selectedEntry?.id === id) setSelectedEntry(null);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 text-gray-900">
      <Sidebar 
        sheetUrl={sheetUrl} 
        webhookUrl={webhookUrl}
        onUpdateUrl={handleUpdateSheetUrl} 
        onUpdateWebhook={handleUpdateWebhookUrl}
      />
      
      <main className="flex-1 p-4 lg:p-8 space-y-8 overflow-y-auto">
        {errorMessage && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm mb-4">
            <p className="text-red-700 font-bold text-sm">⚠️ 發生錯誤：{errorMessage}</p>
          </div>
        )}

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">AI Ledger</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${webhookUrl ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></span>
              <p className="text-xs text-gray-500 font-medium italic">
                {webhookUrl ? '自動雲端同步已開啟' : '離線模式：請設定腳本網址'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button onClick={handleCopyAsTSV} className="px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-all">
              備選：剪貼簿快速同步
            </button>
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
              <div className={`w-3 h-3 rounded-full ${
                syncStatus === SyncStatus.SYNCING ? 'bg-yellow-400 animate-pulse' : 
                syncStatus === SyncStatus.SUCCESS ? 'bg-green-500' : 
                syncStatus === SyncStatus.ERROR ? 'bg-red-500' : 'bg-gray-300'
              }`} />
              <span className="text-[10px] font-bold text-gray-400 uppercase">{syncStatus}</span>
            </div>
          </div>
        </header>

        <StatCards entries={entries} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-6">
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">記帳對話框</h2>
              <ChatInput onSend={handleProcessInput} isLoading={isProcessing} />
            </section>
            
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <h2 className="text-lg font-semibold text-gray-700">最新收支清單</h2>
                <button onClick={handleOpenSheet} className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700">
                  一鍵查看試算表
                </button>
              </div>
              <LedgerTable entries={entries} onDelete={handleDeleteEntry} onSelect={setSelectedEntry} />
            </section>
          </div>

          <div className="space-y-6">
            <Analytics entries={entries} />
          </div>
        </div>
      </main>

      {selectedEntry && (
        <EntryDetailModal 
          entry={selectedEntry} 
          onClose={() => setSelectedEntry(null)} 
          onDelete={() => handleDeleteEntry(selectedEntry.id)}
        />
      )}
    </div>
  );
};

export default App;
