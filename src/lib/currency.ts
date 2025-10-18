// Enhanced currency formatting with Shopify compatibility
export function getCurrencySymbol(currencyCode: string): string {
  const symbolMap: Record<string, string> = {
    'EUR': '€',
    'USD': '$',
    'GBP': '£',
    'JPY': '¥',
    'CAD': 'CA$',
    'AUD': 'A$',
    'CHF': 'CHF',
    'CNY': '¥',
    'SEK': 'kr',
    'NZD': 'NZ$',
    'HKD': 'HK$',
    'SGD': 'S$',
    'KRW': '₩',
    'INR': '₹',
    'BRL': 'R$',
    'RUB': '₽',
    'MXN': 'MX$',
  };

  // Try manual mapping first
  if (symbolMap[currencyCode]) {
    return symbolMap[currencyCode];
  }

  // Fallback using Intl API
  try {
    return (0).toLocaleString('en', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).replace(/[0\s.,]/g, '');
  } catch {
    return currencyCode;
  }
}

export function formatPrice(price: number, currencyCode: string = 'EUR'): string {
  const symbol = getCurrencySymbol(currencyCode);
  const formattedAmount = price.toFixed(2);

  // Shopify's standard formatting patterns
  const symbolFirstCurrencies = ['USD', 'GBP', 'CAD', 'AUD', 'NZD', 'HKD', 'SGD', 'MXN'];
  const symbolAfterWithSpace = ['EUR', 'SEK', 'DKK', 'NOK', 'CHF'];
  const symbolAfterWithoutSpace = ['JPY', 'CNY', 'KRW', 'INR', 'RUB'];

  if (symbolFirstCurrencies.includes(currencyCode)) {
    return `${symbol}${formattedAmount}`;
  }

  if (symbolAfterWithSpace.includes(currencyCode)) {
    return `${formattedAmount} ${symbol}`;
  }

  if (symbolAfterWithoutSpace.includes(currencyCode)) {
    return `${formattedAmount}${symbol}`;
  }

  return `${formattedAmount} ${symbol}`;
}

// Shopify API compatible formatting
export function formatPriceForShopify(price: number, currencyCode: string = 'EUR'): string {
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currencyCode,
    }).format(price);
  } catch (error) {
    return formatPrice(price, currencyCode);
  }
}