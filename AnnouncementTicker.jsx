import React from 'react';
import { differenceInCalendarDays, parseISO } from 'date-fns';

/**
 * AnnouncementTicker Component
 * A slim, top-level moving bar to keep the admin informed of urgent renewals and schedules.
 */
const AnnouncementTicker = ({ reminders = [] }) => {
  // Process and filter for upcoming items (e.g., within 30 days)
  const tickerItems = reminders
    .map(item => {
      const dueDate = item.dueDate ? parseISO(item.dueDate) : new Date();
      const daysLeft = item.daysLeft ?? differenceInCalendarDays(dueDate, new Date());
      return { ...item, daysLeft };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  if (tickerItems.length === 0) return null;

  // Tripling the array ensures smooth flow even with few items
  const scrollItems = [...tickerItems, ...tickerItems, ...tickerItems];

  return (
    <div className="w-full bg-[#4A7289] text-white py-2.5 overflow-hidden relative shadow-md border-b border-[#8585E3]/30 z-50 font-['Inter',_sans-serif]">
      <div className="flex items-center relative">
        {/* Fixed Badge */}
        <div className="bg-[#8585E3] text-[10px] font-black px-3 py-1 ml-4 rounded-lg z-20 flex-shrink-0 shadow-lg tracking-widest flex items-center gap-1.5 border border-white/10">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
          LIVE UPDATES
        </div>
        
        {/* Gradient Fades for depth */}
        <div className="absolute left-[120px] top-0 bottom-0 w-12 bg-gradient-to-r from-[#4A7289] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#4A7289] to-transparent z-10" />

        {/* Ticker Animation */}
        <div className="flex animate-ticker pause-ticker whitespace-nowrap items-center">
          {scrollItems.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="flex items-center mx-10 group cursor-default">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded mr-3 ${item.daysLeft <= 7 ? 'bg-red-500 text-white' : 'bg-[#ECF1F3]/20 text-white/80'}`}>
                {item.daysLeft <= 0 ? 'OVERDUE' : item.daysLeft <= 7 ? 'URGENT' : 'UPCOMING'}
              </span>
              <span className="text-[12px] font-bold tracking-tight">
                {item.clientName}
              </span>
              <span className="mx-2 text-white/40">•</span>
              <span className="text-[11px] font-medium opacity-90 italic">
                {item.serviceType} {item.daysLeft < 0 ? 'was due' : 'due in'} {Math.abs(item.daysLeft)} days
              </span>
              <span className="ml-3 text-[10px] font-black text-[#8585E3] tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                {item.dueDate}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .animate-ticker {
          animation: ticker 45s linear infinite;
          display: flex;
          width: fit-content;
        }
        .pause-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default AnnouncementTicker;