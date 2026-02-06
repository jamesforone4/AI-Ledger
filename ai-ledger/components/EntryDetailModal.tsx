
import React from 'react';
import { LedgerEntry } from '../types';

interface EntryDetailModalProps {
  entry: LedgerEntry;
  onClose: () => void;
  onDelete: () => void;
}

const EntryDetailModal: React.FC<EntryDetailModalProps> = ({ entry, onClose, onDelete }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-slate-50 p-6 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800">消費詳細資訊</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-gray-500 font-semibold uppercase mb-1">日期 (A 欄)</p>
              <p className="text-lg font-bold text-slate-800">{entry.date}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-gray-500 font-semibold uppercase mb-1">金額 (C 欄)</p>
              <p className="text-lg font-bold text-indigo-600">${entry.amount.toLocaleString()}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase mb-2">消費項目 (B 欄)</p>
            <p className="text-lg font-medium text-slate-800 bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
              {entry.item}
            </p>
          </div>

          <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-indigo-600 font-bold uppercase tracking-tight">AI 智能分類 (D 欄)</span>
            </div>
            <span className="px-3 py-1 bg-white text-indigo-700 text-sm font-bold rounded-full shadow-sm border border-indigo-100">
              {entry.category}
            </span>
          </div>

          {entry.sourceText && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-500 font-semibold uppercase mb-2 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                您的原始輸入
              </p>
              <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded-lg">
                「{entry.sourceText}」
              </p>
            </div>
          )}

          <div className="bg-slate-800 p-4 rounded-xl text-white">
            <p className="text-xs text-slate-400 font-bold uppercase mb-2">Google Sheets 同步狀態</p>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <p className="text-xs font-mono">Synced to [我的記帳本] &gt; Sheet1</p>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-mono">Row Index: {entry.id.substring(0,4)} | Range: A:D</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 flex space-x-3">
          <button 
            onClick={onClose}
            className="flex-1 py-2.5 bg-white border border-gray-200 text-slate-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            關閉
          </button>
          <button 
            onClick={() => {
              if (confirm('確定要刪除此筆記錄嗎？試算表中的對應列也會被標記為無效。')) {
                onDelete();
              }
            }}
            className="px-4 py-2.5 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EntryDetailModal;
