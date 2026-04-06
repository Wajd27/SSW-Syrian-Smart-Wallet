import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

function Input({ label, error, helperText, className, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={props.id} className="block text-sm font-medium text-app-soft mb-1">
          {label}
        </label>
      )}
      <input
        className={clsx(
          'input text-app placeholder:text-muted',
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

export default Input;

