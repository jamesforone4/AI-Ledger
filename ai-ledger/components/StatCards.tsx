
import React from 'react';
import { LedgerEntry } from '../types';

interface StatCardsProps {
  entries: LedgerEntry[];
}

const StatCards: React.FC<StatCardsProps> = ({ entries }) => {
  const today = new Date().toISOString().split('T')[0];
  const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);
  const todayAmount = entries
    .filter(e => e.date === today)
    .reduce((sum, e) => sum + e.amount, 0);
  const count = entries.length;

  const stats = [
    { 
      label: '累積總支出', 
      value: `$${totalAmount.toLocaleString()}`, 
      iconColor: 'bg-indigo-50 text-indigo-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      label: '今日支出', 
      value: `$${todayAmount.toLocaleString()}`, 
      iconColor: 'bg-orange-50 text-orange-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      label: '記錄總數', 
      value: `${count} 筆`, 
      iconColor: 'bg-green-50 text-green-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, i) => (
        <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className={`p-3 rounded-lg ${stat.iconColor}`}>
            {stat.icon}
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatCards;
