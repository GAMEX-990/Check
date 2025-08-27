import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Funnel } from 'lucide-react';
import { CustomBarTooltip } from './CustomBarTooltip';
import type { BarChartData, FilterType } from '../../types';
import FilterDropdown from "@/components/ui/FilterDropdown";

interface BarChartSectionProps {
  barData: BarChartData[];
  isViewingDaily: boolean;
  filterType?: FilterType;
  onFilterChange?: (filter: FilterType) => void;
}

// ===== BAR CHART SECTION COMPONENT =====
export const BarChartSection = ({ 
  barData, 
  isViewingDaily, 
  filterType, 
  onFilterChange 
}: BarChartSectionProps) => {
  return (
    <div className="p-4 bg-white rounded-lg border relative">
      {/* Filter dropdown - แสดงเฉพาะใน summary mode */}
      {!isViewingDaily && filterType && onFilterChange && (
        <div className="absolute top-2 right-2 z-10">
          <div className="relative">
            <div className="absolute top-2 right-2 z-10">
              <FilterDropdown value={filterType} onChange={onFilterChange} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Funnel className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      )}

      <div className={isViewingDaily ? "pt-4" : "pt-8"}>
        {barData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip content={<CustomBarTooltip isViewingDaily={isViewingDaily} />} />
              <Bar dataKey="onTime" stackId="a" fill="#10B981" name="ตรงเวลา" />
              <Bar dataKey="late" stackId="a" fill="#F59E0B" name="สาย" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-gray-500">
            {isViewingDaily ? 'ไม่มีข้อมูลการเข้าเรียนในวันนี้' : 'ไม่มีข้อมูลนักเรียนในหมวดหมู่นี้'}
          </div>
        )}
      </div>
    </div>
  );
};