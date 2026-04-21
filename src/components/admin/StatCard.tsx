import React from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  active?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, active }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    emerald: 'bg-emerald-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
  };

  return (
    <div className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 transition-all hover:shadow-lg flex items-center gap-3 md:gap-4 ${active ? 'border-[#5A5A40] shadow-md scale-[1.02] md:scale-105' : 'border-transparent bg-white shadow-sm'}`}>
      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-white ${colorMap[color] || 'bg-gray-500'} shadow-lg shrink-0`}>
        {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5 md:w-6 h-6' })}
      </div>
      <div className="min-w-0">
        <p className="text-[8px] md:text-[10px] text-gray-400 uppercase font-bold tracking-widest truncate">{title}</p>
        <p className="text-xl md:text-2xl font-serif font-bold text-[#1a1a1a] truncate">{value}</p>
      </div>
    </div>
  );
};
