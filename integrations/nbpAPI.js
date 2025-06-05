const axios = require('axios');
const NodeCache = require('node-cache');

const ratesCache = new NodeCache({ stdTTL: 21600 });
const CACHE_KEY_RATES = 'nbp_rates';
const CACHE_KEY_PREFIX_HISTORY = 'nbp_history_';

const NBP_API_URL = 'https://api.nbp.pl/api';

exports.getExchangeRates = async () => {
  try {
    const cachedRates = ratesCache.get(CACHE_KEY_RATES);
    if (cachedRates) {
      return cachedRates;
    }

    const response = await axios.get(`${NBP_API_URL}/exchangerates/tables/A/?format=json`, {
      headers: { 'Accept': 'application/json' },
      timeout: 10000
    });
    
    if (!response.data || !Array.isArray(response.data) || !response.data[0] || !response.data[0].rates) {
      throw new Error('Unexpected format in NBP API response');
    }
    
    const rates = response.data[0].rates;
    
    const exchangeRates = {
      date: response.data[0].effectiveDate,
      table: response.data[0].no,
      base: 'PLN',
      rates: {}
    };
    
    rates.forEach(rate => {
      exchangeRates.rates[rate.code] = {
        code: rate.code,
        name: rate.currency,
        rate: rate.mid
      };
    });
    
    exchangeRates.rates['PLN'] = {
      code: 'PLN',
      name: 'Polski Złoty',
      rate: 1.0
    };
    
    ratesCache.set(CACHE_KEY_RATES, exchangeRates);
    
    return exchangeRates;
  } catch (error) {
    const fallbackRates = {
      date: new Date().toISOString().split('T')[0],
      base: 'PLN',
      rates: {
        'PLN': { code: 'PLN', name: 'Polski Złoty', rate: 1.0 },
        'EUR': { code: 'EUR', name: 'Euro', rate: 4.3 },
        'USD': { code: 'USD', name: 'Dolar amerykański', rate: 3.9 },
        'GBP': { code: 'GBP', name: 'Funt szterling', rate: 5.1 }
      }
    };
    
    return fallbackRates;
  }
};

exports.convertCurrency = async (amount, fromCurrency, toCurrency) => {
  try {
    if (!amount || isNaN(amount)) {
      throw new Error('Invalid amount');
    }
    
    if (fromCurrency === toCurrency) {
      return {
        originalAmount: amount,
        originalCurrency: fromCurrency,
        convertedAmount: amount,
        convertedCurrency: toCurrency,
        exchangeRate: 1.0
      };
    }
    
    const exchangeRates = await this.getExchangeRates();
    
    if (!exchangeRates.rates[fromCurrency] || !exchangeRates.rates[toCurrency]) {
      throw new Error(`Exchange rate not found for ${fromCurrency} or ${toCurrency}`);
    }
    
    const fromRate = exchangeRates.rates[fromCurrency].rate;
    const toRate = exchangeRates.rates[toCurrency].rate;
    
    let convertedAmount;
    let exchangeRate;
    
    if (fromCurrency === 'PLN') {
      convertedAmount = amount / toRate;
      exchangeRate = 1 / toRate;
    } else if (toCurrency === 'PLN') {
      convertedAmount = amount * fromRate;
      exchangeRate = fromRate;
    } else {
      convertedAmount = amount * fromRate / toRate;
      exchangeRate = fromRate / toRate;
    }
    
    const roundedAmount = Math.round(convertedAmount * 100) / 100;
    
    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: roundedAmount,
      convertedCurrency: toCurrency,
      exchangeRate: exchangeRate,
      date: exchangeRates.date
    };
  } catch (error) {
    throw new Error(`Failed to convert currency: ${error.message}`);
  }
};

exports.getExchangeRateHistory = async (currency, startDate, endDate) => {
  try {
    if (!currency || !startDate || !endDate) {
      throw new Error('Missing required parameters: currency, startDate or endDate');
    }
    
    const formatDate = (date) => {
      if (typeof date === 'string') {
        return date;
      }
      return date.toISOString().split('T')[0];
    };
    
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    
    const cacheKey = `${CACHE_KEY_PREFIX_HISTORY}${currency}_${formattedStartDate}_${formattedEndDate}`;
    const cachedHistory = ratesCache.get(cacheKey);
    
    if (cachedHistory) {
      return cachedHistory;
    }
    
    const response = await axios.get(
      `${NBP_API_URL}/exchangerates/rates/a/${currency}/${formattedStartDate}/${formattedEndDate}/?format=json`,
      {
        headers: { 'Accept': 'application/json' },
        timeout: 10000
      }
    );
    
    if (!response.data || !response.data.rates) {
      throw new Error('Unexpected format in NBP API response');
    }
    
    const rateHistory = {
      currency: response.data.currency,
      code: response.data.code,
      table: response.data.table,
      rates: response.data.rates.map(rate => ({
        date: rate.effectiveDate,
        rate: rate.mid
      }))
    };
    
    ratesCache.set(cacheKey, rateHistory, 3600);
    
    return rateHistory;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 404) {
        throw new Error(`No exchange rate data found for ${currency} in the specified date range`);
      } else if (error.response.status === 400) {
        throw new Error('Invalid request parameters. Please check currency code and date format');
      }
    }
    
    throw new Error(`Failed to fetch exchange rate history: ${error.message}`);
  }
};

exports.clearCache = () => {
  ratesCache.flushAll();
};
