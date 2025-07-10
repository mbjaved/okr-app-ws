import React from "react";
import styles from "./DateRangePicker.module.css";

interface DateRange {
  start: string | null;
  end: string | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  min?: string;
  max?: string;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange, min, max, className = "" }) => {
  return (
    <div className={`flex gap-2 items-center ${className}`}>
      <label className="text-xs text-gray-500">From</label>
      <input
        type="month"
        value={value.start || ""}
        min={min}
        max={value.end || max}
        onChange={e => onChange({ ...value, start: e.target.value })}
        className={`border rounded px-2 py-1 text-sm cursor-pointer focus:ring-2 focus:ring-blue-400 transition-shadow duration-200 ${styles.monthInput}`}
        aria-label="Start month"
      />
      <span className="mx-1 text-gray-400">-</span>
      <label className="text-xs text-gray-500">To</label>
      <input
        type="month"
        value={value.end || ""}
        min={value.start || min}
        max={max}
        onChange={e => onChange({ ...value, end: e.target.value })}
        className={`border rounded px-2 py-1 text-sm cursor-pointer focus:ring-2 focus:ring-blue-400 transition-shadow duration-200 ${styles.monthInput}`}
        aria-label="End month"
      />
    </div>
  );
};
