// components/FilterDropdown.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { Funnel } from "lucide-react";
import type { FilterType } from "@/types/SummaryTypes"; // ถ้าคุณเก็บไว้ตรงนั้น

const filters = [
  { label: "ทั้งหมด", value: "all" },
  { label: "ขาด 1 ครั้ง", value: "absent-1" },
  { label: "ขาด 2 ครั้ง", value: "absent-2" },
  { label: "ขาด 3+ ครั้ง", value: "absent-3+" },
] as const;

interface Props {
  value: FilterType;
  onChange: (val: FilterType) => void;
}

export default function FilterDropdown({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleClickOutside = (e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="border p-1.5 rounded-lg"
      >
        <Funnel className="w-4 h-4 text-gray-600" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                onChange(f.value);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                f.value === value ? "bg-blue-100 text-blue-600 font-semibold" : "text-gray-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}