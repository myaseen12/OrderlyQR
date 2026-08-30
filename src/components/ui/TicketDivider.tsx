import * as React from 'react'
import { cn } from '@/utils/cn'

export interface TicketDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  punchSize?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function TicketDivider({ className, punchSize = 'md', color = 'bg-background', ...props }: TicketDividerProps) {
  const sizes = {
    sm: 'h-3 w-3 -mx-1.5',
    md: 'h-4 w-4 -mx-2',
    lg: 'h-6 w-6 -mx-3',
  };

  return (
    <div className={cn('relative my-4 flex items-center w-full overflow-hidden select-none', className)} {...props}>
      {/* Left Punch Hole */}
      <div className={cn('rounded-full absolute left-0 z-10 border border-ticket-edge shadow-[inset_-2px_0_4px_rgba(31,31,36,0.03)]', sizes[punchSize], color)} />
      
      {/* Dashed Line */}
      <div className="w-full border-t-2 border-dashed border-ink/15 mx-1" />
      
      {/* Right Punch Hole */}
      <div className={cn('rounded-full absolute right-0 z-10 border border-ticket-edge shadow-[inset_2px_0_4px_rgba(31,31,36,0.03)]', sizes[punchSize], color)} />
    </div>
  );
}
