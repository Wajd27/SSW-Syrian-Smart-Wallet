import { useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastComponent({ toast, onClose }: ToastProps) {

  useEffect(() => {
    const duration = toast.duration || 3000;
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const icons = {
    success: CheckCircleIcon,
    error: ExclamationCircleIcon,
    warning: ExclamationCircleIcon,
    info: InformationCircleIcon,
  };

  const colors = {
    success: 'bg-green-500/20 border-green-400/50 text-green-100',
    error: 'bg-red-500/20 border-red-400/50 text-red-100',
    warning: 'bg-yellow-500/20 border-yellow-400/50 text-yellow-100',
    info: 'bg-blue-500/20 border-blue-400/50 text-blue-100',
  };

  const Icon = icons[toast.type];

  return (
    <div
      className={`glass-card backdrop-blur-xl ${colors[toast.type]} border rounded-lg p-4 shadow-lg animate-fade-in-up flex items-start space-x-3 rtl:space-x-reverse min-w-[300px] max-w-md`}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

export default ToastComponent;

