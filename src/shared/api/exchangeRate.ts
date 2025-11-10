// Free exchange rate API integration
// Using exchangerate-api.com free tier

const EXCHANGE_RATE_API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

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

