
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { LedgerEntry } from '../types';

interface AnalyticsProps {
  entries: LedgerEntry[];
}

// Define explicit interface for chart data items
interface ChartDataItem {
  name: string;
  value: number;
}

const Analytics: React.FC<AnalyticsProps> = ({ entries }) => {
  const categoryData = entries.reduce((acc: Record<string, number>, entry) => {
    acc[entry.category] = (acc[entry.category] || 0) + entry.amount;
    return acc;
  }, {});

  // Fix: Explicitly type 'data' as ChartDataItem[] and ensure values are numbers to resolve arithmetic operation errors
  const data: ChartDataItem[] = Object.entries(categoryData).map(([name, value]) => ({ 
    name, 
    value: Number(value) 
  }));
  
  const COLORS = ['#6366f1', '#f59e0b', '#8b5cf6', '#ec4899', '#10b981', '#06b6d4'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold mb-6 text-gray-700">支出結構分析</h2>
      
      <div className="h-64 w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => `$${value.toLocaleString()}`}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            暫無分析數據
          </div>
        )}
      </div>

      <div className="mt-8 space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">分項細節</h3>
        {/* Fix: Use spread operator to avoid mutating original data and ensure numeric subtraction for sort */}
        {[...data].sort((a, b) => b.value - a.value).map((item, idx) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
              <span className="text-sm text-gray-600">{item.name}</span>
            </div>
            <span className="text-sm font-bold text-gray-800">${item.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Analytics;
