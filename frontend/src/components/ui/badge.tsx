import * as React from 'react';
import { cn } from '@/lib/utils';

// Simple Badge component for product/shop status pills
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline';
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default:     'bg-primary-100 text-primary-600 border-primary-200',
  success:     'bg-green-100 text-green-700 border-green-200',
  warning:     'bg-amber-100 text-amber-700 border-amber-200',
  destructive: 'bg-red-100 text-red-700 border-red-200',
  outline:     'bg-transparent text-foreground border-border',
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
