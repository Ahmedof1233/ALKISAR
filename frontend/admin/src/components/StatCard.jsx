import React from 'react';

/**
 * بطاقة إحصائيات في الـ header
 */
export default function StatCard({ icon, label, value, sub, color = 'brand' }) {
  const colorMap = {
    brand:  'from-brand-500/20 to-brand-600/5 border-brand-500/20  text-brand-400',
    blue:   'from-blue-500/20  to-blue-600/5  border-blue-500/20   text-blue-400',
    green:  'from-green-500/20 to-green-600/5 border-green-500/20  text-green-400',
    yellow: 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/20 text-yellow-400',
    red:    'from-red-500/20   to-red-600/5   border-red-500/20    text-red-400',
  };

  return (
    <div className={`card bg-gradient-to-br ${colorMap[color]} border animate-fade-in`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs text-gray-500 font-medium">{sub}</span>
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}
