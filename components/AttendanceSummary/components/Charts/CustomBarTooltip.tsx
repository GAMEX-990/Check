import type { BarTooltipProps } from '../../types';

// ===== BAR CHART TOOLTIP COMPONENT =====
export const CustomBarTooltip = ({ 
  active, 
  payload, 
  isViewingDaily 
}: BarTooltipProps & { isViewingDaily: boolean }) => {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  return (
    <div className="bg-white p-3 border rounded-lg shadow-lg">
      <p className="font-semibold">{data.fullName}</p>
      <p className="text-sm">รหัส: {data.studentId}</p>
      <p className="text-sm text-green-600">ตรงเวลา: {data.onTime} วัน</p>
      <p className="text-sm text-yellow-600">สาย: {data.late} วัน</p>
      {!isViewingDaily && <p className="text-sm text-red-600">ขาด: {data.absent} วัน</p>}
      <p className="text-sm text-blue-600">รวมเข้าเรียน: {data.total} วัน</p>
    </div>
  );
};