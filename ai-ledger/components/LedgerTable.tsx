
import React from 'react';
import { LedgerEntry } from '../types';

interface LedgerTableProps {
  entries: LedgerEntry[];
  onDelete: (id: string) => void;
  onSelect: (entry: LedgerEntry) => void;
}

const LedgerTable: React.FC<LedgerTableProps> = ({ entries, onDelete, onSelect }) => {
  if (entries.length === 0) {
    return (
      <div className="p-12 text-center text-gray-400">
        目前尚無記錄。
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <th className="px-6 py-4 font-semibold border-b">日期</th>
            <th className="px-6 py-4 font-semibold border-b">消費項目</th>
            <th className="px-6 py-4 font-semibold border-b text-right">金額</th>
            <th className="px-6 py-4 font-semibold border-b">AI 分類</th>
            <th className="px-6 py-4 font-semibold border-b text-center">詳細</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entries.map((entry) => (
            <tr 
              key={entry.id} 
              className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
              onClick={() => onSelect(entry)}
            >
              <td className="px-6 py-4 text-sm text-gray-600 font-medium whitespace-nowrap">
                {entry.date}
              </td>
              <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                {entry.item}
              </td>
              <td className="px-6 py-4 text-sm text-right font-bold text-slate-900">
                ${entry.amount.toLocaleString()}
              </td>
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 text-xs rounded-full font-semibold ${
                  getCategoryColor(entry.category)
                }`}>
                  {entry.category}
                </span>
              </td>
              <td className="px-6 py-4 text-center">
                <button 
                  className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(entry);
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    '食': 'bg-orange-100 text-orange-700',
    '衣': 'bg-purple-100 text-purple-700',
    '住': 'bg-cyan-100 text-cyan-700',
    '行': 'bg-blue-100 text-blue-700',
    '育': 'bg-green-100 text-green-700',
    '樂': 'bg-pink-100 text-pink-700',
    '其他': 'bg-gray-100 text-gray-700',
  };
  return colors[category] || colors['其他'];
}

export default LedgerTable;
