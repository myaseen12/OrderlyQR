import * as React from 'react'
import { cn } from '@/utils/cn'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'sage' | 'mustard' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold font-mono tracking-wider uppercase transition-colors';
  const variants = {
    default: 'bg-primary/10 text-primary border border-primary/20',
    secondary: 'bg-ink/5 text-ink/75 border border-ink/10',
    sage: 'bg-sage/10 text-sage-hover border border-sage/20',
    mustard: 'bg-mustard/15 text-amber-800 border border-mustard/30',
    outline: 'text-ink/70 border border-ink/20 bg-transparent',
  };

  return (
    <span className={cn(baseStyles, variants[variant], className)} {...props} />
  );
}
