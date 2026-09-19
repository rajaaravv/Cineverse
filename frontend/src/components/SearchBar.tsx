import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search channels by name, category...',
  className = '',
}) => {
  const [internalVal, setInternalVal] = useState(value);

  useEffect(() => {
    setInternalVal(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onChange(internalVal);
    }, 300);

    return () => clearTimeout(handler);
  }, [internalVal, onChange]);

  return (
    <div className={`relative flex items-center font-sans ${className}`}>
      <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={internalVal}
        onChange={(e) => setInternalVal(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-10 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:border-input focus:outline-none transition shadow-sm"
      />
      {internalVal && (
        <button
          onClick={() => {
            setInternalVal('');
            onChange('');
          }}
          className="absolute right-3 rounded-md p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
