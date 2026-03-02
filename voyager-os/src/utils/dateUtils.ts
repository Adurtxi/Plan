import dayjs from 'dayjs';

/**
 * Encapsulated Date utilities to avoid exposing dayjs directly
 * to the rest of the application.
 */

export const parseDate = (date?: string | Date | null) => {
  return dayjs(date);
};

export const addDays = (date: string | Date, days: number): Date => {
  return dayjs(date).add(days, 'day').toDate();
};

export const setDateFromOther = (target: string | Date, source: Date): string => {
  const sourceDate = dayjs(source);
  return dayjs(target)
    .year(sourceDate.year())
    .month(sourceDate.month())
    .date(sourceDate.date())
    .toISOString();
};

export const formatDate = (date: string | Date, format: string): string => {
  return dayjs(date).format(format);
};

export const toISOString = (date: string | Date): string => {
  return dayjs(date).toISOString();
};

export const isSameDay = (date1: string | Date, date2: string | Date): boolean => {
  return dayjs(date1).isSame(dayjs(date2), 'day');
};

export const getNowISO = (): string => {
  return dayjs().toISOString();
};

export const combineDayWithTime = (baseDate: Date, timeString: string): string => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return dayjs(baseDate).hour(hours || 0).minute(minutes || 0).second(0).millisecond(0).toISOString();
};

export const calculateCheckoutDatetime = (checkInDate: Date, nights: number, timeString: string): string => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return dayjs(checkInDate).add(nights, 'day').hour(hours || 0).minute(minutes || 0).second(0).millisecond(0).toISOString();
};

export const extractTimeFromISO = (isoString?: string | null): string => {
  if (!isoString) return '';
  return dayjs(isoString).format('HH:mm');
};
