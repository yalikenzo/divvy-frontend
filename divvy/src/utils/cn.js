import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Утилита для объединения классов с Tailwind CSS
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
