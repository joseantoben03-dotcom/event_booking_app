import React from 'react';
import { TIME_SLOTS, formatSlotLabel } from '../constants/timeSlots';

// Renders the fixed daily time slots for a venue. Already-requested/booked
// slots (anything not rejected) render disabled in light grey; free slots
// are selectable and highlight in primary color when chosen.
export default function SlotPicker({ bookedTimes, selected, onSelect, loading }) {
  if (loading) {
    return <div className="text-sm text-slate-400 py-4 text-center">Checking availability...</div>;
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {TIME_SLOTS.map((time) => {
        const isBooked = bookedTimes.has(time);
        const isSelected = selected === time;

        return (
          <button
            key={time}
            type="button"
            disabled={isBooked}
            onClick={() => onSelect(time)}
            className={`rounded-lg px-3 py-2.5 text-sm font-medium border transition ${
              isBooked
                ? 'bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed'
                : isSelected
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-slate-700 border-slate-200 hover:border-primary/50'
            }`}
            title={isBooked ? 'Already requested/booked' : 'Available'}
          >
            {formatSlotLabel(time)}
            {isBooked && <div className="text-[10px] mt-0.5 font-normal">Booked</div>}
          </button>
        );
      })}
    </div>
  );
}
