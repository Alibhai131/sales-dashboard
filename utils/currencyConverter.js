const currencySymbols = {
  USD: '$',
  GBP: '£',
  PKR: '₨',
  INR: '₹',
  EUR: '€',
  AED: 'د.إ'
};

const exchangeRates = {
  USD: 1,
  GBP: 0.79,
  PKR: 278.50,
  INR: 83.12,
  EUR: 0.92,
  AED: 3.67
};

const formatCurrency = (amount, currency = 'USD') => {
  const symbol = currencySymbols[currency] || '$';
  const formatted = Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${symbol}${formatted}`;
};

const convertCurrency = (amount, from, to) => {
  if (from === to) return amount;
  const inUSD = amount / exchangeRates[from];
  return inUSD * exchangeRates[to];
};

const getCurrencySymbol = (currency) => {
  return currencySymbols[currency] || '$';
};

const getAllCurrencies = () => {
  return Object.keys(currencySymbols).map(code => ({
    code,
    symbol: currencySymbols[code],
    name: {
      USD: 'US Dollar',
      GBP: 'British Pound',
      PKR: 'Pakistani Rupee',
      INR: 'Indian Rupee',
      EUR: 'Euro',
      AED: 'UAE Dirham'
    }[code]
  }));
};

module.exports = { formatCurrency, convertCurrency, getCurrencySymbol, getAllCurrencies, currencySymbols, exchangeRates };