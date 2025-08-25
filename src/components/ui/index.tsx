import React, { ReactNode, forwardRef } from 'react';
import QRCode from 'react-qr-code';
import { Transition } from '@headlessui/react';

// Dialog Components
export const DialogContainer: React.FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${className}`}>
    {children}
  </div>
);

interface DialogCardProps {
  children: ReactNode;
  className?: string;
  maxWidth?: string;
}

export const DialogCard = forwardRef<HTMLDivElement, DialogCardProps>(
  ({ children, className = "", maxWidth = "md" }, ref) => {
    // Map string sizes to actual pixel values
    const maxWidthMap: Record<string, string> = {
      'sm': 'max-w-sm', // 384px
      'md': 'max-w-md', // 448px
      'lg': 'max-w-lg', // 512px
      'xl': 'max-w-xl', // 576px
      '2xl': 'max-w-2xl', // 672px
      'full': 'max-w-full' // 100%
    };

    const widthClass = maxWidthMap[maxWidth] || 'max-w-md';

    return (
      <div
        ref={ref}
        className={`card w-full ${widthClass} overflow-hidden relative ${className}`}
      >
        {children}
      </div>
    );
  }
);

DialogCard.displayName = 'DialogCard';

export const DialogHeader: React.FC<{
  title: string;
  onClose: () => void;
}> = ({ title, onClose }) => (
  <div className="flex justify-center items-center mb-4 relative">
    <h2 className="text-xl font-bold text-[rgb(var(--text-white))]">{title}</h2>
    <button
      onClick={onClose}
      className="right-0 top-0 absolute text-[rgb(var(--text-white))] hover:text-[rgb(var(--accent-red))] text-2xl"
    >
      &times;
    </button>
  </div>
);

// Form Components
export const FormGroup: React.FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={`space-y-4 ${className}`}>
    {children}
  </div>
);

export const FormLabel: React.FC<{
  htmlFor: string;
  children: ReactNode;
}> = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-[rgb(var(--text-white))]">
    {children}
  </label>
);

export const FormDescription: React.FC<{
  children: ReactNode;
}> = ({ children }) => (
  <p className="text-sm text-[rgb(var(--text-white))] opacity-70">
    {children}
  </p>
);

export const FormInput: React.FC<{
  id: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}> = ({ id, type = "text", value, onChange, placeholder, min, max, disabled = false, className = "" }) => (
  <input
    id={id}
    type={type}
    value={value}
    onChange={onChange}
    className={`w-full px-3 py-2 mt-1 ${className}`}
    placeholder={placeholder}
    min={min}
    max={max}
    disabled={disabled}
  />
);

export const FormTextarea: React.FC<{
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  rows?: number;
}> = ({ value, onChange, placeholder, disabled = false, className = "", rows = 3 }) => (
  <textarea
    value={value}
    onChange={onChange}
    className={`w-full px-3 py-2 resize-none ${className}`}
    placeholder={placeholder}
    disabled={disabled}
    rows={rows}
  />
);

export const FormError: React.FC<{
  error: string | null;
}> = ({ error }) => {
  if (!error) return null;
  return (
    <p className="text-[rgb(var(--accent-red))] text-sm mt-1">
      {error}
    </p>
  );
};

export const FormHint: React.FC<{
  children: ReactNode;
}> = ({ children }) => (
  <p className="text-xs mt-1 text-[rgb(var(--text-white))] opacity-70">
    {children}
  </p>
);

// Button Components
export const PrimaryButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}> = ({ onClick, disabled = false, children, className = "" }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`button ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
  >
    {children}
  </button>
);

export const SecondaryButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}> = ({ onClick, disabled = false, children, className = "" }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 text-[rgb(var(--text-white))] hover:underline ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
  >
    {children}
  </button>
);

// Payment Information Components
export const PaymentInfoCard: React.FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={`bg-[rgb(var(--card-border))] p-4 rounded-lg space-y-6 ${className}`}>
    {children}
  </div>
);

export const PaymentInfoRow: React.FC<{
  label: string;
  value: string | number;
  isBold?: boolean;
}> = ({ label, value, isBold = false }) => (
  <div className="flex justify-between">
    <span className={`text-[rgb(var(--text-white))] ${isBold ? 'font-bold' : ''}`}>{label}:</span>
    <span className={`text-[rgb(var(--text-white))] ${isBold ? 'font-bold' : 'font-medium'}`}>
      {value}
    </span>
  </div>
);

export const PaymentInfoDivider: React.FC = () => (
  <div className="border-t border-[rgba(255,255,255,0.1)] my-2"></div>
);

// Add this new component for payment details sections
export const PaymentDetailsSection: React.FC<{
  title: string;
  children: ReactNode;
  className?: string;
}> = ({ title, children, className = "" }) => (
  <div className={`space-y-3 mt-4 ${className}`}>
    <h3 className="text-lg font-medium text-[rgb(var(--text-white))]">{title}</h3>
    {children}
  </div>
);

// Also add this collapsible code field component
export const CollapsibleCodeField: React.FC<{
  label: string;
  value: string;
  isVisible: boolean;
  onToggle: () => void;
}> = ({ label, value, isVisible, onToggle }) => (
  <div className="flex flex-col">
    <div className="flex justify-between items-center">
      <span className="text-[rgb(var(--text-white))]">{label}:</span>
      <button
        onClick={onToggle}
        className="text-[rgb(var(--text-white))] text-sm hover:underline flex items-center"
      >
        {isVisible ? 'Hide' : 'Show'}
        <span className={`ml-1 transition-transform ${isVisible ? 'rotate-180' : ''}`}>▾</span>
      </button>
    </div>
    {isVisible && (
      <div className="bg-[rgb(var(--card-border))] p-2 rounded mt-1 overflow-x-auto">
        <code className="text-[rgb(var(--text-white))] font-mono text-xs break-all">
          {value}
        </code>
      </div>
    )}
  </div>
);

// Result Components
export const ResultIcon: React.FC<{
  type: 'success' | 'failure';
}> = ({ type }) => {
  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const icon = type === 'success' ? '✓' : '✗';

  return (
    <div className={`w-16 h-16 rounded-full ${bgColor} flex items-center justify-center text-white text-2xl`}>
      {icon}
    </div>
  );
};

export const ResultMessage: React.FC<{
  title: string;
  description?: string;
}> = ({ title, description }) => (
  <>
    <p className="mt-4 text-lg font-medium text-[rgb(var(--text-white))]">{title}</p>
    {description && (
      <p className="text-sm text-[rgb(var(--text-white))] opacity-70 mt-2">
        {description}
      </p>
    )}
  </>
);

// QR Code Components
export const QRCodeContainer: React.FC<{
  value: string;
  size?: number;
  className?: string;
}> = ({ value, size = 250, className = "" }) => (
  <div className={`p-4 bg-white rounded-lg ${className}`}>
    <QRCode value={value} size={size} />
  </div>
);

export const CopyableText: React.FC<{
  text: string;
}> = ({ text }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Failed to copy: ', err));
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={text}
        readOnly
        className="w-full px-3 py-2 pr-20 bg-[rgb(var(--card-border))] text-[rgb(var(--text-white))] rounded"
      />
      <button
        onClick={handleCopy}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-sm bg-[var(--primary-blue)] text-white rounded hover:bg-[var(--secondary-blue)]"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
};

// Alert Components
export const Alert: React.FC<{
  type: 'info' | 'warning' | 'success' | 'error';
  children: ReactNode;
  className?: string;
}> = ({ type, children, className = "" }) => {
  const colorMap = {
    info: 'bg-blue-100 text-blue-800',
    warning: 'bg-yellow-100 text-yellow-800',
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
  };

  return (
    <div className={`${colorMap[type]} p-3 rounded-md text-sm ${className}`}>
      {children}
    </div>
  );
};

// Layout Components for Step-based Flows
export const StepContainer: React.FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={`relative ${className}`} style={{ minHeight: '240px' }}>
    {children}
  </div>
);

export const StepContent: React.FC<{
  isActive: boolean;
  isLeft: boolean;
  children: ReactNode;
}> = ({ isActive, isLeft, children }) => {
  let transformClass = isActive
    ? 'translate-x-0 opacity-100'
    : isLeft
      ? '-translate-x-full opacity-0'
      : 'translate-x-full opacity-0';

  return (
    <div className={`absolute inset-0 transform transition-all duration-300 ease-in-out ${transformClass}`}>
      {children}
    </div>
  );
};

// Bottom Sheet Modal Components
export const BottomSheetContainer: React.FC<{
  isOpen: boolean;
  children: ReactNode;
  className?: string;
  onClose?: () => void;
}> = ({ isOpen, children, className = "" }) => {

  return (
    <Transition show={isOpen} as="div" className="absolute inset-0 z-50 overflow-hidden">

      {/* Sheet container - slides up and down */}
      <Transition.Child
        as="div"
        enter="transform transition ease-out duration-300"
        enterFrom="translate-y-full"
        enterTo="translate-y-0"
        leave="transform transition ease-in duration-200"
        leaveFrom="translate-y-0"
        leaveTo="translate-y-full"
        className={`mx-auto ${className}`}
        style={{
          height: "100%",
          maxWidth: '100%',
        }}
      >
        {children}
      </Transition.Child>
    </Transition>
  );
};

export const BottomSheetCard = forwardRef<HTMLDivElement, DialogCardProps>(
  ({ children, className = "" }, ref) => {
    return (
      <div
        ref={ref}
        className={`card w-full overflow-hidden relative rounded-t-xl shadow-xl ${className}`}
      >
        {children}
      </div>
    );
  }
);

BottomSheetCard.displayName = 'BottomSheetCard';
