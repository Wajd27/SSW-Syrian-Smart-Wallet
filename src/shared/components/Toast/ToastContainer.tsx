import { useState, useCallback, useEffect } from 'react';
import ToastComponent, { Toast, ToastType } from './Toast';

let toastIdCounter = 0;

const generateToastId = () => `toast-${++toastIdCounter}-${Date.now()}`;

class ToastManager {
  private listeners: Set<(toasts: Toast[]) => void> = new Set();
  private toasts: Toast[] = [];

  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }

  show(message: string, type: ToastType = 'info', duration?: number) {
    const toast: Toast = {
      id: generateToastId(),
      message,
      type,
      duration,
    };
    this.toasts.push(toast);
    this.notify();
  }

  remove(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  success(message: string, duration?: number) {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number) {
    this.show(message, 'error', duration || 5000);
  }

  warning(message: string, duration?: number) {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration?: number) {
    this.show(message, 'info', duration);
  }
}

export const toastManager = new ToastManager();

function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return () => {
      unsubscribe();
    };
  }, []);

  const handleClose = useCallback((id: string) => {
    toastManager.remove(id);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 rtl:right-auto rtl:left-4 flex flex-col items-end rtl:items-start">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} onClose={handleClose} />
      ))}
    </div>
  );
}

export default ToastContainer;

