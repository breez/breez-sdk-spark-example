import React from 'react';
import LoadingSpinner from '../../../components/LoadingSpinner';

const ProcessingStep: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <LoadingSpinner text="Processing payment..." />
    </div>
  );
};

export default ProcessingStep;
