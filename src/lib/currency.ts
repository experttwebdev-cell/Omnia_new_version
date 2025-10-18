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
    // Additional common currencies
    'HKD': 'HK$',
    'SGD': 'S$',
    'KRW': '₩',
    'INR': '₹',
    'BRL': 'R$',
    'RUB': '₽',
    'MXN': 'MX$',
  };

  // Try to get symbol from map first
  if (symbolMap[currencyCode]) {
    return symbolMap[currencyCode];
  }

  // Fallback using Intl API for unknown currencies
  try {
    return (0).toLocaleString('en', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).replace(/[0\s.,]/g, '');
  } catch {
    return currencyCode; // Final fallback
  }
}

export function formatPrice(price: number, currencyCode: string = 'EUR'): string {
  const symbol = getCurrencySymbol(currencyCode);
  const formattedAmount = price.toFixed(2);

  // Define currency formatting patterns based on Shopify's standards
  const symbolFirstCurrencies = [
    'USD', 'GBP', 'CAD', 'AUD', 'NZD', 'HKD', 'SGD', 'MXN'
  ];
  
  const symbolAfterWithSpace = [
    'EUR', 'SEK', 'DKK', 'NOK', 'CHF'
  ];
  
  const symbolAfterWithoutSpace = [
    'JPY', 'CNY', 'KRW', 'INR', 'RUB'
  ];

  // Apply the appropriate formatting pattern
  if (symbolFirstCurrencies.includes(currencyCode)) {
    return `${symbol}${formattedAmount}`;
  }

  if (symbolAfterWithSpace.includes(currencyCode)) {
    return `${formattedAmount} ${symbol}`;
  }

  if (symbolAfterWithoutSpace.includes(currencyCode)) {
    return `${formattedAmount}${symbol}`;
  }

  // Default fallback - symbol after with space (most common worldwide)
  return `${formattedAmount} ${symbol}`;
}

// Enhanced version with locale support
export function formatPriceWithLocale(
  price: number, 
  currencyCode: string = 'EUR', 
  locale: string = 'en'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    }).format(price);
  } catch (error) {
    // Fallback to custom formatter if Intl fails
    return formatPrice(price, currencyCode);
  }
}

// Shopify-specific formatting for different contexts
export function formatPriceForShopify(
  price: number, 
  currencyCode: string = 'EUR', 
  context: 'storefront' | 'admin' = 'storefront'
): string {
  if (context === 'admin') {
    // In admin, often show with currency code for clarity
    return `${formatPrice(price, currencyCode)} ${currencyCode}`;
  }
  
  // In storefront, use the standard formatting
  return formatPrice(price, currencyCode);
}