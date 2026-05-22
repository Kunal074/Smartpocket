'use client';

import { useState, useRef, useEffect } from 'react';
import { CaretDown as ChevronDown } from '@phosphor-icons/react';

export default function Select({ 
  value, 
  onChange, 
  options, 
  placeholder = 'Select an option',
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-sm font-medium transition hover:bg-accent/40 focus:border-primary focus:outline-none"
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      <div 
        className={`absolute z-50 mt-2 max-h-60 w-full min-w-[150px] overflow-auto rounded-xl border border-border bg-popover p-1 shadow-elevated backdrop-blur-md transition-all duration-300 ease-out ${
          isOpen 
            ? 'pointer-events-auto translate-y-0 opacity-100' 
            : 'pointer-events-none -translate-y-2 opacity-0'
        }`}
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              onChange(opt.value);
              setIsOpen(false);
            }}
            className={`flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
              value === opt.value ? 'bg-primary/10 font-medium text-primary' : ''
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
