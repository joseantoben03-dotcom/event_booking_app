import React from 'react';
import { COLOR_STYLES } from '../constants/colors';
import { CheckIcon } from './icons/Icons';

export default function VenueCard({ venue, selected, onSelect }) {
  const style = COLOR_STYLES[venue.color] || COLOR_STYLES.indigo;

  return (
    <button
      type="button"
      onClick={() => onSelect(venue.name)}
      className={`text-left rounded-xl border p-5 min-h-[96px] transition flex items-start gap-3 ${
        selected
          ? 'border-primary bg-primary-light shadow-card'
          : 'border-slate-200 bg-white hover:border-primary/40'
      }`}
    >
      <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${style.dot}`} />
      <div className="flex-1 min-w-0">
        <div className={`font-semibold text-sm ${selected ? 'text-white' : 'text-slate-800'}`}>{venue.name}</div>
        <div className={`text-xs mt-0.5 ${selected ? 'text-white' : 'text-slate-500'}`}>{venue.description}</div>
      </div>
      {selected && (
        <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
          <CheckIcon className="w-3.5 h-3.5" strokeWidth="3" />
        </span>
      )}
    </button>
  );
}
