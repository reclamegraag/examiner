'use client';

import { forwardRef, useEffect, useRef, useState } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-bold text-foreground mb-1.5 uppercase tracking-wide">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full bg-card border-2 border-border-bold rounded-xl px-4 py-2.5 text-foreground
              placeholder:text-muted/60 focus:outline-none focus:border-accent focus:shadow-brutal-sm
              transition-all duration-150
              ${icon ? 'pl-10' : ''}
              ${error ? 'border-error focus:border-error' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-error mt-1 font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-bold text-foreground mb-1.5 uppercase tracking-wide">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full bg-card border-2 border-border-bold rounded-xl px-4 py-2.5 text-foreground
            placeholder:text-muted/60 focus:outline-none focus:border-accent focus:shadow-brutal-sm
            transition-all duration-150 resize-none
            ${error ? 'border-error focus:border-error' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-sm text-error mt-1 font-medium">{error}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  error?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

function Select({
  label,
  error,
  options,
  value,
  onChange,
  disabled,
  className = '',
  placeholder = 'Selecteer...',
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find(o => o.value === value);
  const selectedIndex = options.findIndex(o => o.value === value);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const openMenu = () => {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  // Keep the active option scrolled into view
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const choose = (index: number) => {
    const opt = options[index];
    if (!opt) return;
    onChange?.(opt.value);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) openMenu();
        else setActiveIndex(i => Math.min(i + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) openMenu();
        else setActiveIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (open) choose(activeIndex);
        else openMenu();
        break;
      case 'Escape':
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  };

  return (
    <div className="w-full" ref={rootRef}>
      {label && (
        <label className="block text-sm font-bold text-foreground mb-1.5 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => !disabled && (open ? setOpen(false) : openMenu())}
          onKeyDown={onKeyDown}
          className={`
            flex w-full items-center justify-between gap-2 bg-card border-2 border-border-bold rounded-xl
            px-4 py-2.5 text-left text-foreground transition-all duration-150 cursor-pointer
            focus:outline-none focus:border-accent focus:shadow-brutal-sm
            disabled:opacity-50 disabled:cursor-not-allowed
            ${open ? 'border-accent shadow-brutal-sm' : ''}
            ${error ? 'border-error focus:border-error' : ''}
            ${className}
          `}
        >
          <span className={selected ? 'truncate' : 'truncate text-muted/60'}>
            {selected ? selected.label : placeholder}
          </span>
          <svg
            className={`h-4 w-4 shrink-0 text-muted transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 7.5 10 12.5 15 7.5" />
          </svg>
        </button>

        {open && (
          <ul
            ref={listRef}
            role="listbox"
            className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border-2 border-border-bold bg-card p-1 shadow-brutal"
          >
            {options.map((opt, i) => {
              const isSelected = opt.value === value;
              const isActive = i === activeIndex;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => choose(i)}
                  className={`
                    flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium
                    ${isActive ? 'bg-accent text-white' : 'text-foreground'}
                  `}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <svg
                      className="h-4 w-4 shrink-0"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m5 10 4 4 6-8" />
                    </svg>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {error && <p className="text-sm text-error mt-1 font-medium">{error}</p>}
    </div>
  );
}

export { Input, TextArea, Select };
