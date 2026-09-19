import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center font-sans">
      <Loader2 className="h-8 w-8 animate-spin text-white" />
      <p className="mt-3 text-xs font-mono text-[#888888]">{message}</p>
    </div>
  );
};
