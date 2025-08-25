import React from 'react';

const BreezLogo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <img
        width="96"
        height="96"
        src='/assets/logo-breez-header.svg'
        className="mr-2"
      >
      </img>
    </div>
  );
};

export default BreezLogo;
