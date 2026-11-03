import { api as apiClient } from '@/api';

export interface ExchangeRate {
  id: string;
  currency_code: string;
  currency_name: string;
  currency_symbol: string;
  rate_to_usd: number;
  updated_at: string;
}

let cachedRates: ExchangeRate[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getExchangeRates(): Promise<ExchangeRate[]> {
  if (cachedRates && Date.now() - cacheTime < CACHE_TTL) return cachedRates;
  const { data } = await apiClient.from('exchange_rates').select('*') as { data: ExchangeRate[] | null };
  cachedRates = data || [];
  cacheTime = Date.now();
  return cachedRates;
}

export function invalidateRatesCache() {
  cachedRates = null;
  cacheTime = 0;
}

export async function getRateForCurrency(currencyCode: string): Promise<number> {
  const rates = await getExchangeRates();
  const rate = rates.find(r => r.currency_code === currencyCode);
  return rate?.rate_to_usd || 1;
}

export function convertToUsd(localAmount: number, rateToUsd: number): number {
  return Math.round(localAmount * rateToUsd * 100) / 100;
}

export function convertFromUsd(usdAmount: number, rateToUsd: number): number {
  if (rateToUsd === 0) return 0;
  return Math.round((usdAmount / rateToUsd) * 100) / 100;
}

export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'KES', name: 'Kenya Shilling', symbol: 'KSh' },
  { code: 'SOS', name: 'Somali Shilling', symbol: 'SSh' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'TZS', name: 'Tanzania Shilling', symbol: 'TSh' },
  { code: 'UGX', name: 'Uganda Shilling', symbol: 'USh' },
];
