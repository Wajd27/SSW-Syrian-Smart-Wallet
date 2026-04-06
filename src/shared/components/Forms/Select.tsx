import React from 'react';
import clsx from 'clsx';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
}

function Select({ label, error, helperText, options, className, ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={props.id} className="block text-sm font-medium text-app-soft mb-1">
          {label}
        </label>
      )}
      <select
        className={clsx(
          'input text-app',
          error && 'border-red-400/50 focus:ring-red-400/50',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-white text-app">
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-app-soft">{helperText}</p>}
    </div>
  );
}

export default Select;

