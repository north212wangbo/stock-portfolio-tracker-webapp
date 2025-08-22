import { fetchBulkHistoricalStockPrices, HistoricalDataPoint, BulkHistoricalDataResponse } from './stock-service';
import { Transaction } from '@/app/page';

export interface PortfolioValuePoint {
  date: string;
  absoluteValue: number; // This represents the actual total gain/loss on this date
  displayDate: string;
}

/**
 * Calculate the number of shares held for a specific symbol on a given date
 * based on transaction history up to that date
 */
export function calculateSharesOnDate(
  transactions: Transaction[],
  symbol: string,
  targetDate: string
): number {
  const targetDateObj = new Date(targetDate);
  
  // Filter transactions for this symbol that occurred before or on the target date
  const relevantTransactions = transactions
    .filter(t => t.symbol === symbol)
    .filter(t => new Date(t.date) <= targetDateObj)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  let totalShares = 0;
  
  for (const transaction of relevantTransactions) {
    if (transaction.action === 'buy') {
      totalShares += transaction.quantity;
    } else if (transaction.action === 'sell') {
      totalShares -= transaction.quantity;
    }
  }
  
  return totalShares;
}

/**
 * Get all unique symbols from transactions that have activity up to the target date
 */
export function getSymbolsWithActivityOnDate(
  transactions: Transaction[],
  targetDate: string
): string[] {
  // Get all unique symbols from transactions that occurred before or on the target date
  const targetDateObj = new Date(targetDate);
  
  const symbolsWithActivity = Array.from(new Set(
    transactions
      .filter(t => new Date(t.date) <= targetDateObj)
      .map(t => t.symbol)
  ));
  
  return symbolsWithActivity;
}

/**
 * Calculate total buy value, total sell value, and current market value for a symbol on a specific date
 */
export function calculateSymbolFinancials(
  transactions: Transaction[],
  symbol: string,
  targetDate: string,
  currentPrice: number
): {
  shares: number;
  totalBuyValue: number;
  totalSellValue: number;
  marketValue: number;
  trueCost: number;
  gainLoss: number;
} {
  const targetDateObj = new Date(targetDate);
  
  // Get all transactions for this symbol up to the target date
  const relevantTransactions = transactions
    .filter(t => t.symbol === symbol)
    .filter(t => new Date(t.date) <= targetDateObj);
  
  let shares = 0;
  let totalBuyValue = 0;
  let totalSellValue = 0;
  
  for (const transaction of relevantTransactions) {
    const transactionValue = transaction.quantity * transaction.price;
    
    if (transaction.action === 'buy') {
      shares += transaction.quantity;
      totalBuyValue += transactionValue;
    } else if (transaction.action === 'sell') {
      shares -= transaction.quantity;
      totalSellValue += transactionValue;
    }
  }
  
  const marketValue = shares * currentPrice;
  const trueCost = totalBuyValue - totalSellValue;
  const gainLoss = marketValue - trueCost;
  
  return {
    shares,
    totalBuyValue,
    totalSellValue,
    marketValue,
    trueCost,
    gainLoss
  };
}

/**
 * Calculate portfolio performance over time using real historical stock prices
 */
export async function calculateRealPortfolioPerformance(
  transactions: Transaction[],
  period: '1M' | 'YTD' | '1Y'
): Promise<PortfolioValuePoint[]> {
  const today = new Date();
  let startDate: Date;
  let days: number;
  
  console.log(`\n🔍 Starting portfolio performance calculation for ${period}`);
  console.log(`Total transactions provided: ${transactions.length}`);
  
  // Log transaction summary
  if (transactions.length > 0) {
    console.log('Transaction summary:');
    const transactionsBySymbol = transactions.reduce((acc, t) => {
      if (!acc[t.symbol]) acc[t.symbol] = [];
      acc[t.symbol].push(t);
      return acc;
    }, {} as Record<string, Transaction[]>);
    
    Object.entries(transactionsBySymbol).forEach(([symbol, symbolTransactions]) => {
      console.log(`  ${symbol}: ${symbolTransactions.length} transactions (${symbolTransactions.filter(t => t.action === 'buy').length} buy, ${symbolTransactions.filter(t => t.action === 'sell').length} sell)`);
      console.log(`    Date range: ${symbolTransactions[0]?.date} to ${symbolTransactions[symbolTransactions.length - 1]?.date}`);
    });
  }
  
  // Determine date range based on period
  if (period === '1M') {
    startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - 1);
    days = 30;
  } else if (period === 'YTD') {
    startDate = new Date(today.getFullYear(), 0, 1); // January 1st of current year
    days = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  } else { // '1Y'
    startDate = new Date(today);
    startDate.setFullYear(startDate.getFullYear() - 1);
    days = 365;
  }
  
  console.log(`Date range for ${period}: ${startDate.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]} (${days} days)`);
  
  // Get all unique symbols that appear in transactions
  const allSymbols = Array.from(new Set(transactions.map(t => t.symbol)));
  
  if (allSymbols.length === 0) {
    console.log('❌ No symbols found in transactions');
    return [];
  }
  
  console.log(`Fetching historical data for ${allSymbols.length} symbols over ${days} days using bulk API...`);
  console.log('Symbols to fetch:', allSymbols);
  
  // Fetch historical price data for all symbols using bulk API
  let bulkHistoricalData: BulkHistoricalDataResponse;
  try {
    console.log(`Making bulk API call for ${allSymbols.length} symbols...`);
    bulkHistoricalData = await fetchBulkHistoricalStockPrices(allSymbols, days);
    console.log(`✓ Bulk API call successful. Received data for symbols:`, Object.keys(bulkHistoricalData));
    
    // Log data summary for each symbol
    Object.entries(bulkHistoricalData).forEach(([symbol, data]) => {
      console.log(`  ${symbol}: ${data.length} data points`);
      if (data.length > 0) {
        console.log(`    Date range: ${data[0]?.date} to ${data[data.length - 1]?.date}`);
        console.log(`    First few points:`, data.slice(0, 3).map(p => `${p.date}: $${p.close}`));
      }
    });
    
  } catch (error) {
    console.error(`✗ Failed to fetch bulk historical data:`, error);
    // Create empty result for all symbols
    bulkHistoricalData = {};
    allSymbols.forEach(symbol => {
      bulkHistoricalData[symbol] = [];
    });
  }
  
  // Convert bulk response to the format expected by the rest of the code
  const historicalDataResults = allSymbols.map(symbol => ({
    symbol,
    data: bulkHistoricalData[symbol] || []
  }));
  
  // Create a map of symbol -> historical data points
  const symbolDataMap = new Map<string, HistoricalDataPoint[]>();
  historicalDataResults.forEach(({ symbol, data }) => {
    symbolDataMap.set(symbol, data);
    console.log(`Mapped ${symbol}: ${data.length} data points`);
  });
  
  // Get all unique dates from all symbols' historical data
  const allDatesSet = new Set<string>();
  symbolDataMap.forEach((data, symbol) => {
    data.forEach(point => allDatesSet.add(point.date));
    console.log(`${symbol} contributed dates:`, data.slice(0, 5).map(p => p.date));
  });
  
  console.log(`Total unique dates from all symbols: ${allDatesSet.size}`);
  
  // Convert to sorted array and filter to our date range
  const allDates = Array.from(allDatesSet)
    .filter(date => {
      const dateObj = new Date(date);
      return dateObj >= startDate && dateObj <= today;
    })
    .sort();
  
  console.log(`After filtering to date range (${startDate.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}): ${allDates.length} dates`);
  console.log('First 10 filtered dates:', allDates.slice(0, 10));
  console.log('Last 10 filtered dates:', allDates.slice(-10));
  
  const portfolioValues: PortfolioValuePoint[] = [];
  
  // Calculate portfolio gain/loss for each date
  for (const date of allDates) {
    const symbolsWithActivity = getSymbolsWithActivityOnDate(transactions, date);
    
    if (symbolsWithActivity.length === 0) {
      console.log(`Skipping ${date}: No transaction activity by this date`);
      continue;
    }
    
    // Check if we have price data for ALL symbols with activity on this date
    const symbolsWithPrices = [];
    const symbolsWithoutPrices = [];
    
    for (const symbol of symbolsWithActivity) {
      const symbolData = symbolDataMap.get(symbol) || [];
      const hasPrice = symbolData.some(point => point.date === date);
      if (hasPrice) {
        symbolsWithPrices.push(symbol);
      } else {
        symbolsWithoutPrices.push(symbol);
      }
    }
    
    if (symbolsWithoutPrices.length > 0) {
      console.log(`Skipping ${date}: Missing prices for ${symbolsWithoutPrices.join(', ')} (have prices for: ${symbolsWithPrices.join(', ')})`);
      continue;
    }
    
    // Calculate total portfolio gain/loss for this date
    let totalGainLoss = 0;
    const dateCalculations = [];
    
    for (const symbol of symbolsWithActivity) {
      const symbolData = symbolDataMap.get(symbol) || [];
      const pricePoint = symbolData.find(point => point.date === date);
      
      if (pricePoint) {
        const financials = calculateSymbolFinancials(transactions, symbol, date, pricePoint.close);
        totalGainLoss += financials.gainLoss;
        
        dateCalculations.push(`${symbol}: ${financials.shares} shares, MV=$${financials.marketValue.toFixed(2)}, TC=$${financials.trueCost.toFixed(2)}, G/L=$${financials.gainLoss.toFixed(2)}`);
      }
    }
    
    console.log(`✓ ${date}: Total Gain/Loss = $${totalGainLoss.toFixed(2)}`);
    console.log(`  Calculations: ${dateCalculations.join(' | ')}`);
    
    // Add to results
    const dateObj = new Date(date);
    portfolioValues.push({
      date,
      absoluteValue: totalGainLoss,
      displayDate: dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        ...(period === '1Y' ? { year: '2-digit' } : {})
      })
    });
  }
  
  console.log(`Calculated portfolio gain/loss for ${portfolioValues.length} dates`);
  
  // Sort by date to ensure chronological order
  portfolioValues.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  console.log('Total gain/loss data points:');
  portfolioValues.forEach((point, index) => {
    const sign = point.absoluteValue >= 0 ? '+' : '';
    console.log(`  ${index + 1}. ${point.date} (${point.displayDate}): ${sign}$${point.absoluteValue.toFixed(2)}`);
  });
  
  // Chart Summary using absolute total gain/loss values
  if (portfolioValues.length > 0) {
    const values = portfolioValues.map(p => p.absoluteValue);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const startValue = portfolioValues[0].absoluteValue;
    const endValue = portfolioValues[portfolioValues.length - 1].absoluteValue;
    
    console.log(`📊 Chart Summary for ${period}:`);
    console.log(`   Period: ${portfolioValues[0].date} to ${portfolioValues[portfolioValues.length - 1].date}`);
    console.log(`   Total points: ${portfolioValues.length}`);
    console.log(`   Start G/L: ${startValue >= 0 ? '+' : ''}$${startValue.toFixed(2)}`);
    console.log(`   End G/L: ${endValue >= 0 ? '+' : ''}$${endValue.toFixed(2)}`);
    console.log(`   Min G/L: ${minValue >= 0 ? '+' : ''}$${minValue.toFixed(2)}`);
    console.log(`   Max G/L: ${maxValue >= 0 ? '+' : ''}$${maxValue.toFixed(2)}`);
    console.log(`   Total G/L change over ${period}: ${(endValue - startValue) >= 0 ? '+' : ''}$${(endValue - startValue).toFixed(2)}`);
  }
  
  return portfolioValues;
}