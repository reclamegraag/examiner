'use client';

import { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className = '', disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-w-0';

    const variants = {
      primary: 'bg-accent text-white hover:bg-accent-hover border-2 border-border-bold shadow-brutal-sm active:shadow-none active:translate-x-[2px] active:translate-y-[2px]',
      secondary: 'bg-card text-foreground border-2 border-border-bold shadow-brutal-sm hover:bg-card-hover active:shadow-none active:translate-x-[2px] active:translate-y-[2px]',
      ghost: 'text-muted hover:text-foreground hover:bg-card border-2 border-transparent',
      danger: 'bg-error-light text-error hover:bg-error/20 border-2 border-error shadow-brutal-sm active:shadow-none active:translate-x-[2px] active:translate-y-[2px]',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-7 py-3.5 text-base',
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : icon}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
