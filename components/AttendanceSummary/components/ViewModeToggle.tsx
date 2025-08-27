import { BarChart3 } from 'lucide-react';
import { formatDateThai } from '../utils/dateHelpers';
import type { ViewModeToggleProps } from '../types';

// ===== VIEW MODE TOGGLE COMPONENT =====
export const ViewModeToggle = ({ 
  viewMode, 
  setViewMode, 
  availableDates, 
  selectedDate, 
  setSelectedDate 
}: ViewModeToggleProps) => (
  <div className="flex gap-2">
    <button
      onClick={() => {
        setViewMode('summary');
        setSelectedDate(null); // รีเซ็ตวันที่เมื่อเปลี่ยนเป็น summary mode
      }}
      className={`flex items-center p-2 rounded-lg text-sm transition-all ${
        viewMode === 'summary' 
          ? 'bg-purple-600 text-white shadow-lg' 
          : 'text-purple-600 hover:bg-purple-200 shadow-lg'
      }`}
    >
      <BarChart3 size={16} />
      สรุปทั้งหมด
    </button>
    
    {availableDates.length > 0 && (
      <div className="relative">
        <select
          value={selectedDate || ''}
          onChange={(e) => {
            const date = e.target.value;
            setSelectedDate(date);
            if (date) setViewMode('daily');
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-purple-600  shadow-lg outline-none cursor-pointer"
        >
          <option value="">เลือกวันที่</option>
          {availableDates.map((date) => (
            <option key={date} value={date}>
              {formatDateThai(date)}
            </option>
          ))}
        </select>
      </div>
    )}
  </div>
);