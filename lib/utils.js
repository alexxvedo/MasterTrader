import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Safely format a number or string value
 * @param {number|string} value - The value to format
 * @param {number} [decimals=2] - Number of decimal places
 * @param {boolean} [showZero=true] - Whether to show zero values or return empty string
 * @returns {string} Formatted value
 */
export function safeFormat(value, decimals = 2, showZero = true) {
  if (value === null || value === undefined || (value === 0 && !showZero)) {
    return '';
  }
  
  if (typeof value === 'number') {
    return value.toFixed(decimals);
  }
  
  return String(value);
}
