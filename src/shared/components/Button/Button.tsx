import React from 'react';
import clsx from 'clsx';
import { useFeedback } from '@/shared/hooks/useFeedback';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const variantClasses = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  outline: 'btn-outline',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
};

function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className,
  onClick,
  ...props
}: ButtonProps) {
  const { triggerFeedback } = useFeedback();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Trigger feedback based on variant
    if (!disabled && !isLoading) {
      if (variant === 'danger') {
        triggerFeedback('warning');
      } else if (variant === 'primary') {
        triggerFeedback('click');
      } else {
        triggerFeedback('click');
      }
    }

    // Call original onClick handler
    onClick?.(e);
  };

  return (
    <button
      className={clsx(
        'btn',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || isLoading}
      onClick={handleClick}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white/40 border-t-white mr-2" />
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;

