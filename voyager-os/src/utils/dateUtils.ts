import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Encapsulated Date utilities to avoid exposing dayjs directly
 * to the rest of the application.
 */

export const parseDate = (date?: string | Date | null, tz?: string) => {
  if (tz) return dayjs.tz(date, tz);
  return dayjs(date);
};

export const addDays = (date: string | Date, days: number, tz?: string): Date => {
  if (tz) return dayjs.tz(date, tz).add(days, 'day').toDate();
  return dayjs(date).add(days, 'day').toDate();
};

export const setDateFromOther = (target: string | Date, source: Date, tz?: string): string => {
  const sourceDate = tz ? dayjs.tz(source, tz) : dayjs(source);
  return (tz ? dayjs.tz(target, tz) : dayjs(target))
    .year(sourceDate.year())
    .month(sourceDate.month())
    .date(sourceDate.date())
    .toISOString();
};

export const formatDate = (date: string | Date, format: string, tz?: string): string => {
  if (tz) return dayjs.tz(date, tz).format(format);
  return dayjs(date).format(format);
};

export const toISOString = (date: string | Date, tz?: string): string => {
  if (tz) return dayjs.tz(date, tz).toISOString();
  return dayjs(date).toISOString();
};

export const isSameDay = (date1: string | Date, date2: string | Date, tz?: string): boolean => {
  if (tz) return dayjs.tz(date1, tz).isSame(dayjs.tz(date2, tz), 'day');
  return dayjs(date1).isSame(dayjs(date2), 'day');
};

export const getNowISO = (): string => {
  return dayjs().toISOString();
};

export const combineDayWithTime = (baseDate: Date | string, timeString: string, tz?: string): string => {
  const [hours, minutes] = timeString.split(':').map(Number);
  if (tz) {
    const dateStr = dayjs(baseDate).format('YYYY-MM-DD');
    return dayjs.tz(`${dateStr}T${timeString}:00`, tz).toISOString();
  }
  return dayjs(baseDate).hour(hours || 0).minute(minutes || 0).second(0).millisecond(0).toISOString();
};

export const calculateCheckoutDatetime = (checkInDate: Date | string, nights: number, timeString: string, tz?: string): string => {
  const [hours, minutes] = timeString.split(':').map(Number);
  if (tz) {
    const checkOutDay = dayjs(checkInDate).add(nights, 'day').format('YYYY-MM-DD');
    return dayjs.tz(`${checkOutDay}T${timeString}:00`, tz).toISOString();
  }
  return dayjs(checkInDate).add(nights, 'day').hour(hours || 0).minute(minutes || 0).second(0).millisecond(0).toISOString();
};

export const extractTimeFromISO = (isoString?: string | null, tz?: string): string => {
  if (!isoString) return '';
  if (tz) return dayjs.tz(isoString, tz).format('HH:mm');
  return dayjs(isoString).format('HH:mm');
};
