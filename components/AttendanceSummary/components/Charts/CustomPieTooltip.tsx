import type { PieTooltipProps } from '../../types';

// ===== PIE CHART TOOLTIP COMPONENT =====
export const CustomPieTooltip = ({ active, payload }: PieTooltipProps) => {
  if (!active || !payload?.length) return null;

  const data = payload[0];
  const totalCount = payload.reduce((sum, item) => sum + (item.value || 0), 0);
  const percentage = totalCount > 0 ? ((data.value / totalCount) * 100).toFixed(1) : "0.0";

  return (
    <div className="bg-white p-3 border rounded-lg shadow-lg">
      <p className="font-semibold" style={{ color: data.color }}>
        {data.name}
      </p>
      <p className="text-sm text-gray-600">จำนวน: {data.value}</p>
      <p className="text-sm text-gray-600">สัดส่วน: {percentage}%</p>
    </div>
  );
};