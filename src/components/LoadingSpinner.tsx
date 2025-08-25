import React from 'react';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  subtext?: string; // Add subtext for additional information
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = 'Loading...',
  subtext,
  size = 'large',
  className = ''
}) => {
  let sizeClasses = '';

  switch (size) {
    case 'small':
      sizeClasses = 'h-4 w-4 -ml-1 mr-2';
      break;
    case 'medium':
      sizeClasses = 'h-8 w-8';
      break;
    case 'large':
    default:
      sizeClasses = 'h-16 w-16';
      break;
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg className={`animate-spin ${sizeClasses} text-[rgb(var(--text-white))]`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      {text && <p className="mt-4 text-[rgb(var(--text-white))] font-medium">{text}</p>}
      {subtext && <p className="mt-1 text-[rgb(var(--text-white))] opacity-70 text-sm">{subtext}</p>}
    </div>
  );
};

export default LoadingSpinner;
