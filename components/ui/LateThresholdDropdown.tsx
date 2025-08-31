import { ClockAlert } from 'lucide-react';
import React from 'react';

interface LateThresholdDropdownProps {
  value: number;
  onChange: (value: number) => void;
  options?: number[];
}

const defaultOptions = [5, 10, 15, 20, 30];

export const LateThresholdDropdown: React.FC<LateThresholdDropdownProps> = ({
  value,
  onChange,
  options = defaultOptions,
}) => {
  return (
    <div className="flex text-purple-700 space-x-1 text-center md:px-1 md:py-1  md:border md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
      <ClockAlert />
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt} นาที
          </option>
        ))}
      </select>
    </div>
  );
};

export default LateThresholdDropdown;