import { ProductStatus } from '../types';

/**
 * Calculates the difference in calendar days between target date (YYYY-MM-DD) and today.
 */
export function calculateDaysRemaining(targetDateStr: string): number {
  if (!targetDateStr) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [year, month, day] = targetDateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Determines product status based on days remaining:
 * > 3 days -> 'normal' (green)
 * 1 to 3 days -> 'vencendo' (yellow)
 * <= 0 days -> 'vencido' (red)
 */
export function getProductStatus(daysRemaining: number): ProductStatus {
  if (daysRemaining <= 0) {
    return 'vencido';
  } else if (daysRemaining <= 3) {
    return 'vencendo';
  } else {
    return 'normal';
  }
}

/**
 * Formats YYYY-MM-DD string to DD/MM/YYYY
 */
export function formatDateToBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Converts JS Date to YYYY-MM-DD string
 */
export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats relative expiration text in Portuguese
 */
export function getRelativeExpirationText(days: number): string {
  if (days < 0) {
    const abs = Math.abs(days);
    return abs === 1 ? 'Vencido ontem' : `Vencido há ${abs} dias`;
  } else if (days === 0) {
    return 'Vence HOJE!';
  } else if (days === 1) {
    return 'Vence amanhã';
  } else {
    return `Vence em ${days} dias`;
  }
}

/**
 * Formats ISO date time string to DD/MM/YYYY HH:mm
 */
export function formatDateTimeBR(isoString: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} às ${hours}:${minutes}`;
}

/**
 * Generates an 8-character random uppercase alphanumeric code (e.g. AB12CD34)
 */
export function generateActivationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // exclude lookalikes I, O, 0, 1
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
