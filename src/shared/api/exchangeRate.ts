/**
 * Exchange Rate API Configuration
 * 
 * This module handles fetching live exchange rates from a free API service.
 * 
 * API Configuration:
 * - Service: exchangerate-api.com (free tier, no API key required)
 * - Endpoint: https://api.exchangerate-api.com/v4/latest/USD
 * - Updates: Rates are updated daily
 * - Rate Limit: Free tier allows reasonable usage
 * 
 * To change the API:
 * 1. Update EXCHANGE_RATE_API_URL below
 * 2. Update the response parsing logic in getLatestRate() if needed
 * 3. Update the fallback rate if the new API uses a different default
 * 
 * Note: Live exchange rates are for reference only. The app uses the user's
 * last_exchange_rate from the database as the default for new transactions,
 * as live rates may not be accurate for the user's actual transactions.
 */

const EXCHANGE_RATE_API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

/**
 * Default/Fallback Exchange Rate
 * 
 * This is used when:
 * - The API request fails
 * - The API doesn't return a SYP rate
 * - The user hasn't set a last_exchange_rate yet
 * 
 * To change the default rate, update the fallback value in getLatestRate()
 * (currently 13000 SYP per USD)
 */

export interface ExchangeRateResponse {
  rates: {
    [currency: string]: number;
  };
  base: string;
  date: string;
}

export const exchangeRateApi = {
  async getLatestRate(): Promise<number> {
    try {
      const response = await fetch(EXCHANGE_RATE_API_URL);
      const data: ExchangeRateResponse = await response.json();
      // Get SYP rate (Syrian Pound)
      return data.rates.SYP || 13000; // Fallback to approximate rate
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      // Return fallback rate
      return 13000;
    }
  },
};

