// No longer need auth headers for stock API

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/stock";

export interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  marketCap?: string;
  pe?: number;
  eps?: number;
  dividend?: number;
  yearHigh?: number;
  yearLow?: number;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  marketCap?: string;
  pe?: number;
  eps?: number;
  dividend?: number;
  yearHigh?: number;
  yearLow?: number;
}

export async function fetchStockPrice(symbol: string): Promise<StockPrice> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_STOCK_API_KEY || 'your-api-key-here';
    const url = `${BASE_URL}?symbol=${encodeURIComponent(symbol)}&apiKey=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Invalid API key.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Parse the response based on the new API format
    return {
      symbol: data.symbol || symbol.toUpperCase(),
      price: data.price || 0,
      change: data.change || 0,
      changePercent: data.percentChange || 0,
      previousClose: (data.price || 0) - (data.change || 0),
      dayHigh: 0,
      dayLow: 0,
      volume: 0,
    };
  } catch (error) {
    console.error(`Error fetching stock price for ${symbol}:`, error);
    
    // If it's an API key error, re-throw it so the UI can handle it
    if (error instanceof Error && error.message.includes('Invalid API key')) {
      throw error;
    }
    
    // Return fallback data for other errors
    return {
      symbol: symbol.toUpperCase(),
      price: 0,
      change: 0,
      changePercent: 0,
      previousClose: 0,
      dayHigh: 0,
      dayLow: 0,
      volume: 0,
    };
  }
}

export async function fetchMultipleStockPrices(symbols: string[]): Promise<StockPrice[]> {
  try {
    // Fetch all stocks in parallel
    const promises = symbols.map(symbol => fetchStockPrice(symbol));
    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Error fetching stock price for ${symbols[index]}:`, result.reason);
        
        // If any stock has API key error, re-throw it
        if (result.reason instanceof Error && 
            result.reason.message.includes('Invalid API key')) {
          throw result.reason;
        }
        
        // Return fallback data for other errors
        return {
          symbol: symbols[index].toUpperCase(),
          price: 0,
          change: 0,
          changePercent: 0,
          previousClose: 0,
          dayHigh: 0,
          dayLow: 0,
          volume: 0,
        };
      }
    });
  } catch (error) {
    console.error('Error fetching multiple stock prices:', error);
    
    // If it's an API key error, re-throw it
    if (error instanceof Error && error.message.includes('Invalid API key')) {
      throw error;
    }
    
    return symbols.map(symbol => ({
      symbol: symbol.toUpperCase(),
      price: 0,
      change: 0,
      changePercent: 0,
      previousClose: 0,
      dayHigh: 0,
      dayLow: 0,
      volume: 0,
    }));
  }
}

export function calculateStockMetrics(
  shares: number,
  avgPrice: number,
  currentPrice: number,
  trueCost?: number
) {
  const marketValue = shares * currentPrice;
  const totalCost = shares * avgPrice;
  
  // Use true cost if provided, otherwise fall back to calculated total cost
  const costBasis = trueCost !== undefined ? trueCost : totalCost;
  const gainLoss = marketValue - costBasis;
  const gainLossPercent = costBasis !== 0 ? (gainLoss / costBasis) * 100 : 0;
  
  return {
    marketValue,
    totalCost,
    gainLoss,
    gainLossPercent,
    trueCost: costBasis,
  };
}

export interface HistoricalDataPoint {
  date: string;
  close: number;
}

export interface HistoricalDataResponse {
  summary: {
    symbol: string;
    requestedDays: number;
    actualRecords: number;
    dateRange: {
      cutoffDate: string;
      today: string;
    };
    priceRange: {
      earliest: {
        date: string;
        price: number;
      };
      latest: {
        date: string;
        price: number;
      };
      min: number;
      max: number;
      change: number;
      changePercent: number;
    };
  };
  data: HistoricalDataPoint[];
}

export async function fetchHistoricalStockPrice(symbol: string, days: number): Promise<HistoricalDataResponse> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_STOCK_API_KEY || 'your-api-key-here';
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
    const url = `${baseUrl}/api/stock/history?symbol=${encodeURIComponent(symbol)}&days=${days}&apiKey=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Invalid API key.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching historical price for ${symbol}:`, error);
    
    if (error instanceof Error && error.message.includes('Invalid API key')) {
      throw error;
    }
    
    // Return empty data for errors
    return {
      summary: {
        symbol: symbol.toUpperCase(),
        requestedDays: days,
        actualRecords: 0,
        dateRange: {
          cutoffDate: new Date().toISOString().split('T')[0],
          today: new Date().toISOString().split('T')[0]
        },
        priceRange: {
          earliest: { date: new Date().toISOString().split('T')[0], price: 0 },
          latest: { date: new Date().toISOString().split('T')[0], price: 0 },
          min: 0,
          max: 0,
          change: 0,
          changePercent: 0
        }
      },
      data: []
    };
  }
}

export interface BulkHistoricalDataRequest {
  symbols: string[];
  days: number;
  apiKey: string;
}

export interface BulkHistoricalDataResponse {
  [symbol: string]: HistoricalDataPoint[];
}

export async function fetchBulkHistoricalStockPrices(symbols: string[], days: number): Promise<BulkHistoricalDataResponse> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
    const url = `${baseUrl}/api/stock/history-bulk`;
    
    const requestBody: BulkHistoricalDataRequest = {
      symbols,
      days,
      apiKey: process.env.NEXT_PUBLIC_STOCK_API_KEY || 'your-api-key-here'
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Invalid API key.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching bulk historical prices for symbols: ${symbols.join(', ')}:`, error);
    
    if (error instanceof Error && error.message.includes('Invalid API key')) {
      throw error;
    }
    
    // Return empty data for all symbols on error
    const emptyResult: BulkHistoricalDataResponse = {};
    symbols.forEach(symbol => {
      emptyResult[symbol] = [];
    });
    return emptyResult;
  }
}