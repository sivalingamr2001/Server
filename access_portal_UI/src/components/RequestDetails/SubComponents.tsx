import React from 'react';
import type { InfoRowProps, ApprovalCardProps } from './types';

export const InfoRow: React.FC<InfoRowProps> = ({ label, value, fullWidth = false, isMono = false, isCode = false }) => (
  <div className={fullWidth ? 'md:col-span-2' : ''}>
    <label className="text-xs text-gray-400 font-medium block mb-1 uppercase tracking-wider">{label}</label>
    {isCode ? (
      <div className="text-sm font-mono font-medium text-gray-800 dark:text-zinc-100 bg-gray-50 dark:bg-zinc-900 px-3 py-2 rounded-lg break-all border dark:border-zinc-800 shadow-sm">
        {value || '-'}
      </div>
    ) : (
      <div className={`text-sm font-semibold text-gray-900 dark:text-zinc-100 ${isMono ? 'font-mono' : ''}`}>
        {value || '-'}
      </div>
    )}
  </div>
);

export const ApprovalCard: React.FC<ApprovalCardProps> = ({ title, name, email, isCurrent = false }) => (
  <div className={`rounded-lg p-4 border transition-all ${
    isCurrent ? 'bg-blue-50/50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/50' : 'bg-white border-gray-200 dark:bg-zinc-950 dark:border-zinc-800'
  }`}>
    <div className="flex items-center gap-2 mb-2">
      <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-blue-500' : 'bg-gray-400 dark:bg-zinc-600'}`}></div>
      <span className={`text-xs font-bold uppercase ${isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>
        {title}
      </span>
    </div>
    <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{name || '-'}</div>
    <div className="text-xs text-gray-500 dark:text-zinc-400 mt-1 truncate">{email || '-'}</div>
  </div>
);
