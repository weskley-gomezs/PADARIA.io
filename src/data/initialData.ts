import { BakeryCompany, Product } from '../types';
import { formatDateToISO, calculateDaysRemaining, getProductStatus } from '../utils/dateUtils';

const today = new Date();

const addDays = (days: number): string => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return formatDateToISO(d);
};

export const INITIAL_COMPANIES: BakeryCompany[] = [];

export const INITIAL_PRODUCTS: Product[] = [];

