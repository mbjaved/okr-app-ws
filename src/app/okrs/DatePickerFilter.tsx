import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DatePickerFilterProps {
  value: string;
  onChange: (dateString: string) => void;
}

// Helper: Format date as YYYY-MM-DD in local time (not UTC)
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const DatePickerFilter: React.FC<DatePickerFilterProps> = ({ value, onChange }) => {
  // Convert YYYY-MM-DD string to Date object (local time)
  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  return (
    <DatePicker
      selected={selectedDate}
      onChange={(date: Date | null) => {
        if (date) {
          onChange(formatDateLocal(date));
        } else {
          onChange('');
        }
      }}
      dateFormat="yyyy-MM-dd"
      placeholderText="Select date"
      isClearable
      className="w-full h-[40px] rounded border px-3 py-2 transition-colors duration-150 hover:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer"
      popperPlacement="bottom-start"
      showPopperArrow={false}
      wrapperClassName="w-full"
    />
  );
};
