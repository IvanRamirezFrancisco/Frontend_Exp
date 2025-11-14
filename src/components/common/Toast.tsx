import { useState, useEffect } from 'react';
import './Toast.css';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  onRemove: (id: string) => void;
}

export function Toast({ id, type, title, message, duration = 5000, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    
    // Auto-remove after duration
    const removeTimer = setTimeout(() => {
      handleRemove();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, [duration]);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => onRemove(id), 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div
      className={`toast toast--${type} ${isVisible ? 'toast--visible' : ''} ${
        isRemoving ? 'toast--removing' : ''
      }`}
    >
      <div className="toast__icon">
        {getIcon()}
      </div>
      <div className="toast__content">
        <div className="toast__title">{title}</div>
        <div className="toast__message">{message}</div>
      </div>
      <button
        className="toast__close"
        onClick={handleRemove}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
}

// Toast Container Component
interface ToastContainerProps {
  toasts: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
  }>;
  onRemoveToast: (id: string) => void;
}

export function ToastContainer({ toasts, onRemoveToast }: ToastContainerProps) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onRemove={onRemoveToast}
        />
      ))}
    </div>
  );
}

// Hook para usar toasts
export function useToast() {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
  }>>([]);

  const addToast = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    duration?: number
  ) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const showSuccess = (title: string, message: string, duration?: number) => {
    addToast('success', title, message, duration);
  };

  const showError = (title: string, message: string, duration?: number) => {
    addToast('error', title, message, duration);
  };

  const showWarning = (title: string, message: string, duration?: number) => {
    addToast('warning', title, message, duration);
  };

  const showInfo = (title: string, message: string, duration?: number) => {
    addToast('info', title, message, duration);
  };

  return {
    toasts,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}