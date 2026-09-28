/**
 * Tailwind class merge utility (required by shadcn/ui components).
 * Combines clsx (conditional classes) + tailwind-merge (dedup conflicts).
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
