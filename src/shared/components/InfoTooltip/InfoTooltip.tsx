import { useState, useRef, useEffect } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface InfoTooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

function InfoTooltip({ content, position = 'top', className = '', size = 'md' }: InfoTooltipProps) {
  const { i18n } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  useEffect(() => {
    if (isVisible && tooltipRef.current && containerRef.current) {
      const tooltip = tooltipRef.current;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Auto-adjust position based on viewport
      let finalPosition = position;
      let top = 0;
      let left = 0;

      if (position === 'top') {
        top = -tooltipRect.height - 8;
        left = (rect.width - tooltipRect.width) / 2;
        if (rect.top - tooltipRect.height < 0) {
          finalPosition = 'bottom';
          top = rect.height + 8;
        }
      } else if (position === 'bottom') {
        top = rect.height + 8;
        left = (rect.width - tooltipRect.width) / 2;
        if (rect.bottom + tooltipRect.height > viewportHeight) {
          finalPosition = 'top';
          top = -tooltipRect.height - 8;
        }
      } else if (position === 'left') {
        top = (rect.height - tooltipRect.height) / 2;
        left = -tooltipRect.width - 8;
        if (rect.left - tooltipRect.width < 0) {
          finalPosition = 'right';
          left = rect.width + 8;
        }
      } else if (position === 'right') {
        top = (rect.height - tooltipRect.height) / 2;
        left = rect.width + 8;
        if (rect.right + tooltipRect.width > viewportWidth) {
          finalPosition = 'left';
          left = -tooltipRect.width - 8;
        }
      }

      // Adjust for RTL
      if (i18n.dir() === 'rtl') {
        if (finalPosition === 'left') {
          left = rect.width + 8;
        } else if (finalPosition === 'right') {
          left = -tooltipRect.width - 8;
        }
      }

      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;
    }
  }, [isVisible, position, i18n]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onTouchStart={() => setIsVisible(!isVisible)}
    >
      <InformationCircleIcon
        className={`${sizeClasses[size]} text-primary-500 hover:text-primary-600 cursor-help transition-colors`}
        aria-label="Information"
      />
      {isVisible && (
        <div
          ref={tooltipRef}
          className="absolute z-50 px-3 py-2 text-sm text-app bg-white/95 backdrop-blur-sm border border-app-border rounded-xl shadow-lg max-w-xs pointer-events-none animate-fade-in"
          style={{
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
          }}
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-white/95 border border-gray-200 transform rotate-45 ${
              position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-0 border-r-0' :
              position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2 border-b-0 border-l-0' :
              position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2 border-l-0 border-b-0' :
              'left-[-4px] top-1/2 -translate-y-1/2 border-r-0 border-t-0'
            }`}
          />
        </div>
      )}
    </div>
  );
}

export default InfoTooltip;

