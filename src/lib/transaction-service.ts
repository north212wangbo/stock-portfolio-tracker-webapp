import { Transaction } from "@/app/page";
import { makeAuthenticatedRequest } from './auth-utils';

export interface PortfolioTransactions {
  portfolioId: string;
  transactions: Transaction[];
}

// Mock transaction data for each portfolio
const mockTransactionData: PortfolioTransactions[] = [
  {
    portfolioId: "investment",
    transactions: [
      { id: "1", action: "buy", quantity: 30, price: 145.50, date: "2024-01-15", symbol: "AAPL" },
      { id: "2", action: "buy", quantity: 20, price: 157.75, date: "2024-03-22", symbol: "AAPL" },
      { id: "3", action: "sell", quantity: 10, price: 162.30, date: "2024-06-10", symbol: "AAPL" },
      { id: "4", action: "buy", quantity: 10, price: 148.90, date: "2024-08-05", symbol: "AAPL" },
      { id: "5", action: "buy", quantity: 25, price: 275.20, date: "2024-02-08", symbol: "MSFT" },
      { id: "6", action: "buy", quantity: 15, price: 288.50, date: "2024-05-18", symbol: "MSFT" },
      { id: "7", action: "buy", quantity: 10, price: 2420.00, date: "2024-01-30", symbol: "GOOGL" },
      { id: "8", action: "buy", quantity: 15, price: 2470.00, date: "2024-04-12", symbol: "GOOGL" },
    ]
  },
  {
    portfolioId: "crypto",
    transactions: [
      { id: "9", action: "buy", quantity: 20, price: 82.30, date: "2024-03-05", symbol: "COIN" },
      { id: "10", action: "buy", quantity: 10, price: 91.90, date: "2024-07-20", symbol: "COIN" },
      { id: "11", action: "buy", quantity: 15, price: 180.00, date: "2024-05-25", symbol: "MSTR" },
    ]
  },
  {
    portfolioId: "retirement",
    transactions: [
      { id: "12", action: "buy", quantity: 100, price: 215.50, date: "2024-01-03", symbol: "VTI" },
      { id: "13", action: "buy", quantity: 50, price: 225.30, date: "2024-04-01", symbol: "VTI" },
      { id: "14", action: "buy", quantity: 50, price: 222.75, date: "2024-07-01", symbol: "VTI" },
      { id: "15", action: "buy", quantity: 75, price: 57.80, date: "2024-02-15", symbol: "VXUS" },
      { id: "16", action: "buy", quantity: 25, price: 60.60, date: "2024-06-15", symbol: "VXUS" },
      { id: "17", action: "buy", quantity: 100, price: 76.20, date: "2024-01-10", symbol: "BND" },
      { id: "18", action: "buy", quantity: 50, price: 75.00, date: "2024-05-10", symbol: "BND" },
    ]
  },
  {
    portfolioId: "growth",
    transactions: [
      { id: "19", action: "buy", quantity: 20, price: 185.00, date: "2024-02-20", symbol: "TSLA" },
      { id: "20", action: "buy", quantity: 15, price: 175.50, date: "2024-06-30", symbol: "TSLA" },
      { id: "21", action: "sell", quantity: 5, price: 170.00, date: "2024-08-15", symbol: "TSLA" },
      { id: "22", action: "buy", quantity: 10, price: 420.00, date: "2024-03-10", symbol: "NVDA" },
      { id: "23", action: "buy", quantity: 10, price: 480.00, date: "2024-07-08", symbol: "NVDA" },
      { id: "24", action: "buy", quantity: 30, price: 92.50, date: "2024-01-25", symbol: "AMD" },
      { id: "25", action: "buy", quantity: 15, price: 100.00, date: "2024-04-28", symbol: "AMD" },
    ]
  }
];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchAllTransactions(): Promise<PortfolioTransactions[]> {
  try {
    // Simulate API call delay
    await delay(800);
    
    // In a real implementation, this would be an actual API call
    // const response = await fetch('/api/transactions');
    // const data = await response.json();
    // return data;
    
    return mockTransactionData;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

export async function fetchPortfolioTransactions(portfolioId: string): Promise<Transaction[]> {
  try {
    // Simulate API call delay
    await delay(500);
    
    // In a real implementation, this would be:
    // const response = await fetch(`/api/transactions/${portfolioId}`);
    // const data = await response.json();
    // return data;
    
    const portfolioData = mockTransactionData.find(p => p.portfolioId === portfolioId);
    return portfolioData?.transactions || [];
  } catch (error) {
    console.error(`Error fetching transactions for portfolio ${portfolioId}:`, error);
    return [];
  }
}

export function getTransactionsBySymbol(transactions: Transaction[], symbol: string): Transaction[] {
  return transactions
    .filter(t => t.symbol === symbol)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function calculatePortfolioMetrics(transactions: Transaction[]) {
  const totalBuyValue = transactions
    .filter(t => t.action === 'buy')
    .reduce((sum, t) => sum + (t.quantity * t.price), 0);
    
  const totalSellValue = transactions
    .filter(t => t.action === 'sell')
    .reduce((sum, t) => sum + (t.quantity * t.price), 0);
    
  const netInvested = totalBuyValue - totalSellValue;
  const totalTransactions = transactions.length;
  const buyTransactions = transactions.filter(t => t.action === 'buy').length;
  const sellTransactions = transactions.filter(t => t.action === 'sell').length;
  
  return {
    totalBuyValue,
    totalSellValue,
    netInvested,
    totalTransactions,
    buyTransactions,
    sellTransactions,
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || 'http://localhost:8080';

// Types for API requests and responses
export interface CreateTransactionRequest {
  symbol: string;
  price: number;
  type: "BUY" | "SELL";
  shares: number;
  timestamp?: string; // Optional ISO string
}

export interface CreateTransactionResponse {
  message: string;
  transactionId: string;
  transaction: {
    id: string;
    symbol: string;
    price: number;
    type: "BUY" | "SELL";
    shares: number;
    timestamp: string;
    created_at: string;
  };
}

export interface AddToPortfolioRequest {
  transactionId: string;
  portfolioId: string;
}

export interface AddToPortfolioResponse {
  message: string;
  transactionId: string;
  portfolioId: string;
  portfolioName: string;
}

export interface RemoveFromPortfolioRequest {
  transactionId: string;
  portfolioId: string;
}

export interface RemoveFromPortfolioResponse {
  message: string;
  transactionId: string;
  portfolioId: string;
  portfolioName: string;
  transactionDeleted: boolean;
  remainingPortfolios: number;
}

export interface BulkTransaction {
  symbol: string;
  price: number;
  type: "BUY" | "SELL";
  shares: number;
  timestamp?: string;
}

export interface BulkCreateTransactionsRequest {
  portfolioId: string;
  transactions: BulkTransaction[];
}

export interface BulkCreateTransactionsResponse {
  message: string;
  portfolioId: string;
  portfolioName?: string;
}

export interface UpdateTransactionRequest {
  price: number;
  type: "BUY" | "SELL";
  shares: number;
  timestamp: string; // ISO date string
}

export interface UpdateTransactionResponse {
  message: string;
  transactionId: string;
  transaction: {
    id: string;
    symbol: string;
    price: number;
    type: "BUY" | "SELL";
    shares: number;
    timestamp: string;
    updated_at: string;
  };
}

// Create transaction API call
export async function createTransaction(request: CreateTransactionRequest): Promise<CreateTransactionResponse> {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/transaction/create`, {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please sign in.');
      }
      if (response.status === 403) {
        throw new Error('Access denied. Invalid authentication token.');
      }
      
      const errorText = await response.text();
      throw new Error(`Failed to create transaction: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

// Add transaction to portfolio API call
export async function addTransactionToPortfolio(request: AddToPortfolioRequest): Promise<AddToPortfolioResponse> {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/transaction/add-to-portfolio`, {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please sign in.');
      }
      if (response.status === 403) {
        throw new Error('Access denied. Invalid authentication token.');
      }
      
      const errorText = await response.text();
      throw new Error(`Failed to add transaction to portfolio: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error adding transaction to portfolio:', error);
    throw error;
  }
}

// Remove transaction from portfolio API call
export async function removeTransactionFromPortfolio(request: RemoveFromPortfolioRequest): Promise<RemoveFromPortfolioResponse> {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/transaction/delete-from-portfolio`, {
      method: 'DELETE',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please sign in.');
      }
      if (response.status === 403) {
        throw new Error('Access denied. Invalid authentication token.');
      }
      
      const errorText = await response.text();
      throw new Error(`Failed to remove transaction from portfolio: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error removing transaction from portfolio:', error);
    throw error;
  }
}

// Update transaction API call
export async function updateTransaction(transactionId: string, request: UpdateTransactionRequest): Promise<UpdateTransactionResponse> {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/transaction/update?transactionId=${transactionId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please sign in.');
      }
      if (response.status === 403) {
        throw new Error('Access denied. Invalid authentication token.');
      }
      if (response.status === 404) {
        throw new Error('Transaction not found.');
      }
      
      const errorText = await response.text();
      throw new Error(`Failed to update transaction: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
}

// Bulk create transactions API call
export async function bulkCreateTransactions(request: BulkCreateTransactionsRequest): Promise<BulkCreateTransactionsResponse> {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/transaction/bulk-create`, {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please sign in.');
      }
      if (response.status === 403) {
        throw new Error('Access denied. Invalid authentication token.');
      }
      
      const errorText = await response.text();
      throw new Error(`Failed to import transactions: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error importing transactions:', error);
    throw error;
  }
}