// Utility functions for timezone handling

/**
 * Convert a date to Indian Standard Time (IST)
 * @param date - The date to convert
 * @returns Date object adjusted to IST
 */
export function toIST(date: Date): Date {
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  return new Date(date.getTime() + istOffset);
}

/**
 * Format a date for display in IST
 * @param date - The date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string in IST
 */
export function formatDateIST(date: Date | string, options: Intl.DateTimeFormatOptions = {}): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    ...options
  });
}

/**
 * Format a time for display in IST
 * @param date - The date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted time string in IST
 */
export function formatTimeIST(date: Date | string, options: Intl.DateTimeFormatOptions = {}): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    ...options
  });
}

/**
 * Format both date and time for display in IST
 * @param date - The date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted datetime string in IST
 */
export function formatDateTimeIST(date: Date | string, options: Intl.DateTimeFormatOptions = {}): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    ...options
  });
}

// Common formatting presets
export const DateFormats = {
  short: { year: 'numeric', month: 'short', day: 'numeric' } as const,
  long: { year: 'numeric', month: 'long', day: 'numeric' } as const,
  time: { hour: '2-digit', minute: '2-digit', hour12: true } as const,
  datetime: { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  } as const,
};
