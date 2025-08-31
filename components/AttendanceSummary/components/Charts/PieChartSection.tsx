import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CustomPieTooltip } from './CustomPieTooltip';
import type { PieChartData } from '../../types';

interface PieChartSectionProps {
  pieData: PieChartData[];
}

export const PieChartSection = ({ pieData }: PieChartSectionProps) => {
  const total = pieData.reduce((s, x) => s + x.value, 0);
  const pieKey = `${total}-${pieData.map(d => `${d.name}:${d.value}`).join('|')}`;

  return (
    <div className="p-4 bg-white rounded-lg border">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart key={pieKey}>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
            outerRadius={60}
            dataKey="value"
          >
            {pieData.map((entry, i) => (
              <Cell key={`${entry.name}-${i}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomPieTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
