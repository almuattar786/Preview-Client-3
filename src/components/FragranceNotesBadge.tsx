import React from 'react';
import { FragranceNotes } from '../types';

interface FragranceNotesBadgeProps {
  notes: FragranceNotes;
  compact?: boolean;
}

export const FragranceNotesBadge: React.FC<FragranceNotesBadgeProps> = ({ notes, compact = false }) => {
  if (compact) {
    const topNotePreview = notes.top.slice(0, 2).join(', ');
    const baseNotePreview = notes.base.slice(0, 1).join('');
    return (
      <div className="text-[11px] text-stone-600 dark:text-zinc-400 font-light flex items-center gap-1 line-clamp-1">
        <span className="text-[#9a7229] dark:text-[#c5a059] font-semibold uppercase tracking-wider text-[10px]">Notes:</span>
        <span>{topNotePreview} {baseNotePreview ? `• ${baseNotePreview}` : ''}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 bg-[#f2ede2] dark:bg-[#141414] p-4 rounded-xl border border-[#9a7229]/20 dark:border-[#c5a059]/20">
      <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a7229] dark:text-[#c5a059] border-b border-[#9a7229]/20 dark:border-[#c5a059]/20 pb-2">
        Scent Pyramid
      </h4>
      <div className="space-y-2 text-xs">
        <div>
          <span className="font-semibold text-[#9a7229] dark:text-[#c5a059] uppercase tracking-wider text-[10px]">Top Notes: </span>
          <span className="text-stone-800 dark:text-[#f5f5f1]/90 font-light">{notes.top.join(', ')}</span>
        </div>
        <div>
          <span className="font-semibold text-[#9a7229]/80 dark:text-[#c5a059]/80 uppercase tracking-wider text-[10px]">Heart Notes: </span>
          <span className="text-stone-800 dark:text-[#f5f5f1]/90 font-light">{notes.heart.join(', ')}</span>
        </div>
        <div>
          <span className="font-semibold text-[#9a7229] dark:text-[#c5a059] uppercase tracking-wider text-[10px]">Base Notes: </span>
          <span className="text-stone-800 dark:text-[#f5f5f1]/90 font-light">{notes.base.join(', ')}</span>
        </div>
      </div>
    </div>
  );
};
