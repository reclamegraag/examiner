'use client';

import { forwardRef } from 'react';

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

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-bold text-foreground mb-1.5 uppercase tracking-wide">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full bg-card border-2 border-border-bold rounded-xl px-4 py-2.5 text-foreground
            focus:outline-none focus:border-accent focus:shadow-brutal-sm
            transition-all duration-150 cursor-pointer appearance-none
            ${error ? 'border-error focus:border-error' : ''}
            ${className}
          `}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-sm text-error mt-1 font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Input, TextArea, Select };
