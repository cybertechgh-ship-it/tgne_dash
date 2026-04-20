import React from 'react';
import { differenceInCalendarDays, parseISO } from 'date-fns';

/**
 * AlertCenter Component
 * A grid-based management dashboard for renewals, schedules, and digital tasks.
 */
const AlertCenter = ({ alerts = [], onEditAlert, onNewReminder, onExport }) => {
  return (
    <div className="w-full p-8 bg-[#ECF1F3] font-['Inter',_sans-serif] min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-[#4A7289] tracking-tight mb-2">TGNE Alert Center</h1>
          <p className="text-slate-500 font-medium">Centralized tracking for renewals and digital management.</p>
        </div>
        <button 
          onClick={onNewReminder}
          className="bg-[#8585E3] text-white px-6 py-4 rounded-2xl font-black text-sm shadow-xl shadow-[#8585E3]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          New Reminder
        </button>
      </div>

      {/* Filters Section */}
      <div className="flex flex-wrap gap-3 mb-8">
        {['All Alerts', 'Web Management', 'Domain Renewals', 'Hosting Renewals'].map((tab, idx) => (
          <button 
            key={tab}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${idx === 0 ? 'bg-[#4A7289] text-white shadow-lg shadow-[#4A7289]/20' : 'bg-white text-[#4A7289] hover:bg-slate-50 border border-slate-200'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Alert Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {alerts.map((item) => {
          const dueDate = item.dueDate ? parseISO(item.dueDate) : new Date();
          const daysLeft = differenceInCalendarDays(dueDate, new Date());
          const isOverdue = daysLeft < 0;
          const isUrgent = daysLeft <= 7;

          return (
            <div key={item.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] group relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="flex items-center justify-between mb-6">
                <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg tracking-widest uppercase ${isOverdue ? 'bg-red-50 text-red-500' : 'bg-[#8585E3]/10 text-[#8585E3]'}`}>
                  {isOverdue ? 'OVERDUE' : isUrgent ? 'URGENT' : 'PLANNED'}
                </span>
                
                <div className="flex items-center gap-2">
                  {/* Same Quick Edit Button used in Marquee/Vault */}
                  <button 
                    onClick={() => onEditAlert?.(item)}
                    className="p-2.5 bg-slate-50 hover:bg-[#8585E3] hover:text-white rounded-xl text-[#8585E3] border border-slate-100 transition-all duration-300 shadow-sm active:scale-90"
                    title="Edit Reminder"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  
                  <button 
                    onClick={() => onExport?.(item)}
                    className="p-2.5 bg-slate-50 hover:bg-[#4A7289] hover:text-white rounded-xl text-slate-400 border border-slate-100 transition-all duration-300 shadow-sm"
                    title="Export Data"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-black text-slate-800 tracking-tight leading-tight mb-1 group-hover:text-[#8585E3] transition-colors">
                  {item.clientName || 'Renew Domain'}
                </h3>
                <p className="text-xs font-bold text-[#4A7289]/60 italic truncate">
                  {item.serviceType || 'Digital Management'}
                </p>
              </div>

              <div className="pt-6 mt-2 border-t border-slate-50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter leading-none mb-1">Scheduled</span>
                  <span className="text-sm font-black text-slate-700">{item.dueDate}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-[#8585E3] uppercase bg-[#8585E3]/5 px-2 py-1 rounded-md">
                    {item.category || 'Domain'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlertCenter;