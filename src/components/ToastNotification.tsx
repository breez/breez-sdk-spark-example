import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastNotificationProps {
  type: ToastType;
  message: string;
  detail?: string;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  type,
  message,
  detail,
  onClose,
  autoClose = true,
  duration = 5000
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Allow animation to complete
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return {
          icon: '✓',
          bgColor: 'bg-green-500',
          textColor: 'text-white'
        };
      case 'error':
        return {
          icon: '✗',
          bgColor: 'bg-red-500',
          textColor: 'text-white'
        };
      case 'warning':
        return {
          icon: '!',
          bgColor: 'bg-yellow-500',
          textColor: 'text-white'
        };
      case 'info':
      default:
        return {
          icon: 'ℹ',
          bgColor: 'bg-blue-500',
          textColor: 'text-white'
        };
    }
  };

  const { icon, bgColor, textColor } = getIconAndColor();

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg transform transition-all duration-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        } ${bgColor} ${textColor}`}
    >
      <div className="flex-shrink-0 mr-3">
        <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-xl">
          {icon}
        </div>
      </div>
      <div className="mr-4">
        <h3 className="font-semibold">{message}</h3>
        {detail && <p className="text-sm opacity-90">{detail}</p>}
      </div>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="text-xl opacity-70 hover:opacity-100"
      >
        &times;
      </button>
    </div>
  );
};

export default ToastNotification;
