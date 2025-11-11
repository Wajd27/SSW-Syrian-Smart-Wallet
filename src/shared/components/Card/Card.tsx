import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  actions?: React.ReactNode;
  style?: React.CSSProperties;
}

function Card({ children, className, title, actions, style }: CardProps) {
  return (
    <div className={clsx('card animate-fade-in-up', className)} style={style}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-lg font-semibold text-white drop-shadow-md">{title}</h3>}
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className="text-white/90">
        {children}
      </div>
    </div>
  );
}

export default Card;

