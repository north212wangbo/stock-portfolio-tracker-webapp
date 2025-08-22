import { makeAuthenticatedRequest } from './auth-utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || 'http://localhost:8080';

export interface CreatePortfolioRequest {
  name: string;
}

export interface BackendUser {
  id: string;
  email: string;
  name: string;
}

export interface BackendPortfolio {
  id: string;
  name: string;
  userId: string;
  created_at: string;
  updated_at: string;
  user: BackendUser;
}

export interface CreatePortfolioResponse {
  message: string;
  portfolio: BackendPortfolio;
}

export interface PortfolioStats {
  totalTransactions: number;
  totalBuyValue: number;
  totalSellValue: number;
  netInvestment: number;
  uniqueSymbols: number;
  currentHoldingsCount: number;
  lastTransactionDate: string;
  isEmpty: boolean;
  cachedGainLoss?: number;
  cachedTotalValue?: number;
}

export interface BackendPortfolioWithStats extends BackendPortfolio {
  stats: PortfolioStats;
}

export interface UserSummary {
  totalPortfolios: number;
  totalTransactions: number;
  totalNetInvestment: number;
  emptyPortfolios: number;
  activePortfolios: number;
}

export interface FetchPortfoliosResponse {
  user: BackendUser;
  summary: UserSummary;
  portfolios: BackendPortfolioWithStats[];
}

export interface BackendTransaction {
  id: string;
  symbol: string;
  price: number;
  type: "BUY" | "SELL";
  shares: number;
  value: number;
  timestamp: string;
  created_at: string;
}

export interface TransactionSummary {
  totalTransactions: number;
  totalBuyValue: number;
  totalSellValue: number;
  netInvestment: number;
  uniqueSymbols: number;
  currentHoldings: { [symbol: string]: number };
}

export interface HoldingSummary {
  symbol: string;
  currentShares: number;
  averageBuyPrice: number;
  totalBuyValue: number;
  totalSellValue: number;
}

export interface PortfolioTransactionResponse {
  portfolio: {
    id: string;
    name: string;
    userId: string;
  };
  summary: TransactionSummary;
  transactions: BackendTransaction[];
  holdings: HoldingSummary[];
}

export interface UpdatePortfolioRequest {
  name: string;
  cachedGainLoss: number;
  cachedTotalValue: number;
}

export interface UpdatedPortfolio {
  id: string;
  name: string;
  cachedGainLoss: number;
  cachedTotalValue: number;
  userId: string;
  created_at: string;
  updated_at: string;
  user: BackendUser;
}

export interface UpdatePortfolioResponse {
  message: string;
  portfolio: UpdatedPortfolio;
}

export interface DeletePortfolioResponse {
  message: string;
  deletedPortfolioId: string;
}

export async function createPortfolio(name: string): Promise<CreatePortfolioResponse> {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/portfolio/create`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please sign in.');
      }
      if (response.status === 403) {
        throw new Error('Access denied. Invalid authentication token.');
      }
      
      const errorText = await response.text();
      throw new Error(`Failed to create portfolio: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating portfolio:', error);
    throw error;
  }
}

export async function fetchUserPortfolios(): Promise<FetchPortfoliosResponse> {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/user/portfolios`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please sign in.');
      }
      if (response.status === 403) {
        throw new Error('Access denied. Invalid authentication token.');
      }
      
      const errorText = await response.text();
      throw new Error(`Failed to fetch portfolios: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    throw error;
  }
}

export async function fetchPortfolioTransactions(portfolioId: string): Promise<PortfolioTransactionResponse> {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/portfolio/transactions?portfolioId=${portfolioId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please sign in.');
      }
      if (response.status === 403) {
        throw new Error('Access denied. Invalid authentication token.');
      }
      
      const errorText = await response.text();
      throw new Error(`Failed to fetch transactions: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching portfolio transactions:', error);
    throw error;
  }
}

export async function updatePortfolio(portfolioId: string, updateData: UpdatePortfolioRequest): Promise<UpdatePortfolioResponse> {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/portfolio/update?portfolioId=${portfolioId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please sign in.');
      }
      if (response.status === 403) {
        throw new Error('Access denied. Invalid authentication token.');
      }
      
      const errorText = await response.text();
      const error = new Error(`Failed to update portfolio: ${response.status} - ${errorText}`) as Error & { status: number };
      // Attach status code to error object for easier checking
      error.status = response.status;
      throw error;
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error updating portfolio:', error);
    throw error;
  }
}

export async function deletePortfolio(portfolioId: string): Promise<DeletePortfolioResponse> {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/portfolio/delete?portfolioId=${portfolioId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please sign in.');
      }
      if (response.status === 403) {
        throw new Error('Access denied. Invalid authentication token.');
      }
      if (response.status === 404) {
        throw new Error('Portfolio not found.');
      }
      
      const errorText = await response.text();
      throw new Error(`Failed to delete portfolio: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    throw error;
  }
}