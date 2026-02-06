
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
      
      // Using text/plain with no-cors to bypass CORS preflight issues common with Apps Script
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
    setSyncStatus(SyncStatus.SYNCING);
    
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
      setSyncStatus(SyncStatus.ERROR);
      setTimeout(() => setSyncStatus(SyncStatus.IDLE), 3000);
    }
    
    setIsProcessing(false);
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
      alert('✅ 已複製為試算表格式 (TSV)！\n請直接到 Google Sheet 貼上即可。');
    }).catch(err => {
      console.error('Copy failed:', err);
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
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">AI Ledger</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${webhookUrl ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></span>
              <p className="text-xs text-gray-500 font-medium italic">
                {webhookUrl ? '自動雲端同步已開啟 (myledger)' : '離線模式：請設定腳本網址'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleCopyAsTSV}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-all shadow-md active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              <span>備選：剪貼簿快速同步</span>
            </button>
            
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
              <div className={`w-3 h-3 rounded-full ${
                syncStatus === SyncStatus.SYNCING ? 'bg-yellow-400 animate-pulse' : 
                syncStatus === SyncStatus.SUCCESS ? 'bg-green-500' : 
                syncStatus === SyncStatus.ERROR ? 'bg-red-500' : 'bg-gray-300'
              }`} />
              <span className="text-[10px] font-bold text-gray-400 uppercase">
                {syncStatus === SyncStatus.SYNCING ? '雲端同步中' : syncStatus === SyncStatus.SUCCESS ? '同步完成' : syncStatus === SyncStatus.ERROR ? '連線失敗' : '連線就緒'}
              </span>
            </div>
          </div>
        </header>

        <StatCards entries={entries} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-6">
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-700">記帳對話框</h2>
                <div className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded font-bold uppercase tracking-widest">Auto-Sync Enabled</div>
              </div>
              <ChatInput onSend={handleProcessInput} isLoading={isProcessing} />
            </section>
            
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white sticky top-0 z-10 gap-4">
                <h2 className="text-lg font-semibold text-gray-700">最新收支清單</h2>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => handleSyncToCloud(entries)}
                    disabled={entries.length === 0 || !webhookUrl}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    <span>重新連動</span>
                  </button>
                  <button 
                    onClick={handleOpenSheet}
                    className="flex items-center space-x-2 px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-sm active:scale-95"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM7 10H17V12H7V10ZM7 14H17V16H7V14ZM7 6H17V8H7V6Z" fill="currentColor"/>
                    </svg>
                    <span>一鍵查看試算表</span>
                  </button>
                </div>
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
