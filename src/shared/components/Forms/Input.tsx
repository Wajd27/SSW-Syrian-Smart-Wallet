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
        <label htmlFor={props.id} className="block text-sm font-medium text-white/90 mb-1 drop-shadow-sm">
          {label}
        </label>
      )}
      <input
        className={clsx(
          'input text-white placeholder:text-white/50',
          error && 'border-red-400/50 focus:ring-red-400/50',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-300 drop-shadow-sm">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-white/70 drop-shadow-sm">{helperText}</p>}
    </div>
  );
}

export default Input;

