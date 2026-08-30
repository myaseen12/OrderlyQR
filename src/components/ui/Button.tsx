'use client'

import * as React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/utils/cn'

type MotionButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof HTMLMotionProps<'button'>> & HTMLMotionProps<'button'>;

export interface ButtonProps extends MotionButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'ticket';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer';
    
    const variants = {
      primary: 'bg-primary text-white hover:bg-primary-hover shadow-ticket active:shadow-ticket-press',
      secondary: 'bg-sage text-white hover:bg-sage-hover shadow-ticket active:shadow-ticket-press',
      outline: 'border border-ink/10 bg-transparent text-ink hover:bg-ink/5',
      ghost: 'text-ink hover:bg-ink/5',
      ticket: 'bg-white border border-dashed border-ink/20 text-ink shadow-ticket hover:border-primary/50 hover:text-primary font-mono'
    };

    const sizes = {
      sm: 'h-9 px-3 text-xs',
      md: 'h-11 px-5 text-sm',
      lg: 'h-13 px-8 text-base rounded-xl',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.985 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
)

Button.displayName = 'Button'
