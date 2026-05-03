
const EXCHANGE_RATE_BASE = process.env.REACT_APP_EXCHANGE_RATE_API_KEY || '';
const CACHE = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export const fetchExchangeRate = async (fromCurrency, toCurrency = 'USD') => {
  if (fromCurrency === toCurrency) return 1;
  
  const cacheKey = `${fromCurrency}-${toCurrency}`;
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.rate;
  }
  
  try {
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_BASE}/latest/${fromCurrency}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rate for ${fromCurrency}`);
    }
    const data = await response.json();
    const rate = data.conversion_rates?.[toCurrency];
    if (!rate) {
      throw new Error(`Conversion rate not found for ${toCurrency}`);
    }
    CACHE.set(cacheKey, { rate, timestamp: Date.now() });
    return rate;
  } catch (error) {
    console.error('Currency conversion error:', error);
    return 1; // Fallback to 1:1 if API fails
  }
};

export const convertToUSD = async (amount, fromCurrency) => {
  if (!fromCurrency || fromCurrency === 'USD') return amount;
  const rate = await fetchExchangeRate(fromCurrency, 'USD');
  return amount * rate;
};

export const getCurrencySymbol = (currency) => {
  if (!currency) return '$';
  const c = String(currency).toUpperCase().trim();
  const symbols = {
    'EUR': '€', 'JPY': '¥', 'CNY': '¥', 'KZT': '₸', 
    'RUB': '₽', 'INR': '₹', 'USD': '$', 'GBP': '£',
    'CAD': '$', 'AUD': '$', 'CHF': 'Fr', 'BRL': 'R$'
  };
  return symbols[c] || '$';
};