import React from 'react';
import clsx from 'clsx';

interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

function DatePicker({ label, error, helperText, className, ...props }: DatePickerProps) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={props.id} className="mb-1 block text-sm font-medium text-app-soft">
          {label}
        </label>
      )}
      <input
        type="date"
        className={clsx(
          'input text-app [color-scheme:light]',
          error && 'border-red-400/50 focus:ring-red-400/50',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-app-soft">{helperText}</p>}
    </div>
  );
}

export default DatePicker;
