import { format, parseISO } from 'date-fns';

export const formatCurrency = (
  amount: number,
  currency: string = 'SYP',
  locale: string = 'en'
): string => {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SY' : 'en-US', {
    style: 'currency',
    currency: currency === 'SYP' ? 'SYP' : 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date: string | Date, formatStr: string = 'yyyy-MM-dd'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
};

export const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toFixed(decimals);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

