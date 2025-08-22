"use client";

import { useState, useEffect } from "react";
import { PortfolioSidebar } from "@/components/portfolio-sidebar";
import { PortfolioDetails } from "@/components/portfolio-details";
import { TransactionPanel } from "@/components/transaction-panel";
import { fetchStockPrice } from "@/lib/stock-service";
import { createPortfolio, fetchUserPortfolios, fetchPortfolioTransactions, updatePortfolio, PortfolioTransactionResponse, BackendTransaction, HoldingSummary } from "@/lib/portfolio-service";
import { fetchAllTransactions, PortfolioTransactions, removeTransactionFromPortfolio, RemoveFromPortfolioRequest } from "@/lib/transaction-service";
import { useAuth } from "@/contexts/auth-context";

export type Transaction = {
  id: string;
  action: "buy" | "sell";
  quantity: number;
  price: number;
  date: string;
  symbol: string;
};

export type Portfolio = {
  id: string;
  name: string;
  stocks: Array<{
    symbol: string;
    name: string;
    shares: number;
    avgPrice: number;
    currentPrice: number;
    change: number;
    changePercent: number;
    trueCost?: number;
    totalBuyValue?: number;
    totalSellValue?: number;
  }>;
  cachedGainLoss?: number;
  cachedTotalValue?: number;
};

const mockPortfolios: Portfolio[] = [
  {
    id: "investment",
    name: "Investment",
    stocks: [
      { 
        symbol: "AAPL", 
        name: "Apple Inc.", 
        shares: 50, 
        avgPrice: 150.25, 
        currentPrice: 175.30, 
        change: 16.7,
        changePercent: 10.52,
        trueCost: 7512.50,
        totalBuyValue: 7512.50,
        totalSellValue: 0,
      },
      { 
        symbol: "MSFT", 
        name: "Microsoft Corp.", 
        shares: 40, 
        avgPrice: 280.00, 
        currentPrice: 295.80, 
        change: 5.6,
        changePercent: 1.93,
        trueCost: 11200.00,
        totalBuyValue: 11200.00,
        totalSellValue: 0,
      },
      { 
        symbol: "GOOGL", 
        name: "Alphabet Inc.", 
        shares: 25, 
        avgPrice: 128.00, 
        currentPrice: 202.75, 
        change: 5.3,
        changePercent: 2.68,
        trueCost: 3200.00,
        totalBuyValue: 3200.00,
        totalSellValue: 0,
      },
      { 
        symbol: "BRK-B", 
        name: "Berkshire Hathaway Inc.", 
        shares: 25, 
        avgPrice: 402.00, 
        currentPrice: 455.75, 
        change: 5.3,
        changePercent: 1.18,
        trueCost: 10050.00,
        totalBuyValue: 10050.00,
        totalSellValue: 0,
      },
    ]
  },
  {
    id: "crypto",
    name: "Crypto",
    stocks: [
      { 
        symbol: "COIN", 
        name: "Coinbase Global Inc.", 
        shares: 30, 
        avgPrice: 85.50, 
        currentPrice: 92.75, 
        change: 8.5,
        changePercent: 10.08,
        trueCost: 2565.00,
        totalBuyValue: 2565.00,
        totalSellValue: 0,
      },
      { 
        symbol: "MSTR", 
        name: "MicroStrategy Inc.", 
        shares: 15, 
        avgPrice: 180.00, 
        currentPrice: 195.20, 
        change: 8.4,
        changePercent: 4.49,
        trueCost: 2700.00,
        totalBuyValue: 2700.00,
        totalSellValue: 0,
      },
      { 
        symbol: "BTC-USD", 
        name: "Bit Coin", 
        shares: 2, 
        avgPrice: 68013.00, 
        currentPrice: 108900.20, 
        change: 8.4,
        changePercent: 0.008,
        trueCost: 136026.00,
        totalBuyValue: 136026.00,
        totalSellValue: 0,
      },
      { 
        symbol: "ETH-USD", 
        name: "Ethereum", 
        shares: 5, 
        avgPrice: 3278.78, 
        currentPrice: 108900.20, 
        change: 8.4,
        changePercent: 0.008,
        trueCost: 16393.90,
        totalBuyValue: 16393.90,
        totalSellValue: 0,
      },
    ]
  },
  {
    id: "retirement",
    name: "Retirement",
    stocks: [
      { 
        symbol: "VTI", 
        name: "Vanguard Total Stock Market ETF", 
        shares: 200, 
        avgPrice: 220.00, 
        currentPrice: 235.80, 
        change: 7.2,
        changePercent: 3.15,
        trueCost: 44000.00,
        totalBuyValue: 44000.00,
        totalSellValue: 0,
      },
      { 
        symbol: "VXUS", 
        name: "Vanguard Total International Stock ETF", 
        shares: 100, 
        avgPrice: 58.50, 
        currentPrice: 61.25, 
        change: 4.7,
        changePercent: 8.31,
        trueCost: 5850.00,
        totalBuyValue: 5850.00,
        totalSellValue: 0,
      },
      { 
        symbol: "BND", 
        name: "Vanguard Total Bond Market ETF", 
        shares: 150, 
        avgPrice: 75.80, 
        currentPrice: 74.90, 
        change: -1.2,
        changePercent: -1.58,
        trueCost: 11370.00,
        totalBuyValue: 11370.00,
        totalSellValue: 0,
      },
    ]
  },
  {
    id: "growth",
    name: "Growth Stocks",
    stocks: [
      { 
        symbol: "TSLA", 
        name: "Tesla Inc.", 
        shares: 30, 
        avgPrice: 180.50, 
        currentPrice: 165.20, 
        change: -8.5,
        changePercent: -4.89,
        trueCost: 5415.00,
        totalBuyValue: 5415.00,
        totalSellValue: 0,
      },
      { 
        symbol: "NVDA", 
        name: "NVIDIA Corporation", 
        shares: 20, 
        avgPrice: 450.00, 
        currentPrice: 520.75, 
        change: 15.7,
        changePercent: 3.11,
        trueCost: 9000.00,
        totalBuyValue: 9000.00,
        totalSellValue: 0,
      },
      { 
        symbol: "AMD", 
        name: "Advanced Micro Devices", 
        shares: 45, 
        avgPrice: 95.00, 
        currentPrice: 102.30, 
        change: 7.7,
        changePercent: 8.14,
        trueCost: 4275.00,
        totalBuyValue: 4275.00,
        totalSellValue: 0,
      },
    ]
  },
];

export default function Home() {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [allTransactions, setAllTransactions] = useState<PortfolioTransactions[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isLoadingPortfolios, setIsLoadingPortfolios] = useState(false);
  const [loadedPortfolioIds, setLoadedPortfolioIds] = useState<Set<string>>(new Set());

  // Get transactions for the selected portfolio
  const selectedPortfolioTransactions = selectedPortfolio 
    ? allTransactions.find(pt => pt.portfolioId === selectedPortfolio.id)?.transactions || []
    : [];

  // Function to update portfolio cache with calculated values
  const updatePortfolioCache = async (portfolio: Portfolio) => {
    if (!user) return; // Only update cache for authenticated users
    
    try {
      // Calculate total value and gain/loss from current portfolio stocks
      const totalValue = portfolio.stocks.reduce((sum, stock) => sum + (stock.shares * stock.currentPrice), 0);
      const totalGainLoss = portfolio.stocks.reduce((sum, stock) => {
        const marketValue = stock.shares * stock.currentPrice;
        const trueCost = stock.trueCost || 0;
        return sum + (marketValue - trueCost);
      }, 0);

      // Update portfolio cache via API
      await updatePortfolio(portfolio.id, {
        name: portfolio.name,
        cachedGainLoss: totalGainLoss,
        cachedTotalValue: totalValue
      });

      // Update frontend state with fresh calculated values
      setPortfolios(prevPortfolios => 
        prevPortfolios.map(p => p.id === portfolio.id ? {
          ...p,
          cachedGainLoss: totalGainLoss,
          cachedTotalValue: totalValue
        } : p)
      );

      // Update selected portfolio if it matches
      if (selectedPortfolio?.id === portfolio.id) {
        setSelectedPortfolio(prev => prev ? {
          ...prev,
          cachedGainLoss: totalGainLoss,
          cachedTotalValue: totalValue
        } : null);
      }

      console.log(`Portfolio cache updated: ${portfolio.name} - Total: $${totalValue.toFixed(2)}, G/L: $${totalGainLoss.toFixed(2)}`);
    } catch (error) {
      console.error('Error updating portfolio cache:', error);
      // Don't show error to user as this is a background operation
    }
  };

  // Function to convert backend transaction data to frontend format and build stocks
  const convertBackendDataToPortfolio = (backendData: PortfolioTransactionResponse, portfolioId: string): { portfolio: Portfolio, transactions: Transaction[] } => {
    // Convert transactions
    const frontendTransactions: Transaction[] = backendData.transactions.map((backendTx: BackendTransaction) => ({
      id: backendTx.id,
      action: backendTx.type.toLowerCase() as "buy" | "sell",
      symbol: backendTx.symbol,
      quantity: backendTx.shares,
      price: backendTx.price,
      date: backendTx.timestamp,
      portfolioId: portfolioId,
    }));

    // Build stocks from holdings array (includes all stocks with 0, positive, or negative shares)
    const stocks = backendData.holdings.map((holding: HoldingSummary) => {
      const totalShares = holding.currentShares || 0;
      // Use the buy price as average price for current holdings
      // For stocks with 0 shares, this represents the last known average price
      const avgPrice = holding.averageBuyPrice || 0;
      // Calculate true cost as totalBuyValue - totalSellValue
      const totalBuyValue = holding.totalBuyValue || 0;
      const totalSellValue = holding.totalSellValue || 0;
      const trueCost = totalBuyValue - totalSellValue;

      return {
        symbol: holding.symbol,
        name: holding.symbol, // Will be updated by stock price API
        shares: totalShares,
        avgPrice,
        currentPrice: avgPrice, // Will be updated by stock price API
        change: 0, // Will be updated by stock price API
        changePercent: 0, // Will be updated by stock price API
        trueCost,
        totalBuyValue,
        totalSellValue,
      };
    });

    // Create updated portfolio with stocks
    const updatedPortfolio: Portfolio = {
      id: portfolioId,
      name: backendData.portfolio.name,
      stocks,
    };

    return { portfolio: updatedPortfolio, transactions: frontendTransactions };
  };

  // Function to update stock prices for specific symbols in a portfolio
  const updateIndividualStockPrices = async (portfolioId: string, symbols: string[]) => {
    try {
      // Fetch individual stock prices for each symbol
      const pricePromises = symbols.map(symbol => 
        fetchStockPrice(symbol).catch(error => {
          console.error(`Error fetching price for ${symbol}:`, error);
          return null; // Return null for failed requests
        })
      );

      const stockPrices = await Promise.all(pricePromises);

      // Update portfolio with new prices
      setPortfolios(prevPortfolios => 
        prevPortfolios.map(portfolio => {
          if (portfolio.id !== portfolioId) return portfolio;

          const updatedStocks = portfolio.stocks.map(stock => {
            const priceData = stockPrices.find((price, index) => 
              price && symbols[index] === stock.symbol
            );

            if (priceData && priceData.price > 0) {
              return {
                ...stock,
                currentPrice: priceData.price,
                change: priceData.change,
                changePercent: priceData.changePercent,
                name: stock.symbol, // Use symbol as name for now, could be enhanced later
              };
            }
            return stock;
          });

          const updatedPortfolio = { 
            ...portfolio, 
            stocks: updatedStocks
          };
          
          // Update portfolio cache with calculated values
          updatePortfolioCache(updatedPortfolio);
          
          return updatedPortfolio;
        })
      );

      // Update selected portfolio if it matches
      if (selectedPortfolio?.id === portfolioId) {
        setSelectedPortfolio(prevSelected => {
          if (!prevSelected) return null;
          
          const updatedStocks = prevSelected.stocks.map(stock => {
            const priceData = stockPrices.find((price, index) => 
              price && symbols[index] === stock.symbol
            );

            if (priceData && priceData.price > 0) {
              return {
                ...stock,
                currentPrice: priceData.price,
                change: priceData.changePercent,
                name: stock.symbol,
              };
            }
            return stock;
          });

          return { ...prevSelected, stocks: updatedStocks };
        });
      }
    } catch (error) {
      console.error('Error updating individual stock prices:', error);
    }
  };

  // Function to load transactions for a specific portfolio
  const loadPortfolioTransactions = async (portfolio: Portfolio) => {
    // Skip if transactions already loaded for this portfolio
    if (loadedPortfolioIds.has(portfolio.id)) {
      return;
    }

    setIsLoadingTransactions(true);
    try {
      const backendData = await fetchPortfolioTransactions(portfolio.id);
      const { portfolio: updatedPortfolio, transactions } = convertBackendDataToPortfolio(backendData, portfolio.id);
      
      // Update the portfolio with stocks data
      setPortfolios(prevPortfolios => 
        prevPortfolios.map(p => p.id === portfolio.id ? updatedPortfolio : p)
      );

      // Update transactions
      setAllTransactions(prevTransactions => {
        const filtered = prevTransactions.filter(pt => pt.portfolioId !== portfolio.id);
        return [...filtered, { portfolioId: portfolio.id, transactions }];
      });

      // Mark portfolio as loaded
      setLoadedPortfolioIds(prev => new Set(prev).add(portfolio.id));

      // Update selected portfolio if it's the current one
      if (selectedPortfolio?.id === portfolio.id) {
        setSelectedPortfolio(updatedPortfolio);
      }

      // Fetch individual stock prices for all unique symbols
      const symbols = backendData.holdings.map((holding: HoldingSummary) => holding.symbol);
      await updateIndividualStockPrices(portfolio.id, symbols);

    } catch (error) {
      console.error('Error loading portfolio transactions:', error);
      
      // Show error to user
      if (error instanceof Error && 
          (error.message.includes('Authentication required') || 
           error.message.includes('Access denied'))) {
        alert(`Transaction loading failed: ${error.message}\nPlease sign in to view transactions.`);
      } else {
        alert(`Failed to load transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Function to fetch portfolios from backend
  const loadPortfolios = async () => {
    if (!user) {
      // If user is not logged in, use mock data with real stock prices
      setPortfolios(mockPortfolios);
      setSelectedPortfolio(mockPortfolios[0]);
      
      // Load mock transaction data for all portfolios
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
            { id: "7", action: "buy", quantity: 10, price: 142.00, date: "2024-01-30", symbol: "GOOGL" },
            { id: "8", action: "buy", quantity: 15, price: 147.00, date: "2024-04-12", symbol: "GOOGL" },
            { id: "9", action: "buy", quantity: 10, price: 305.14, date: "2022-01-22", symbol: "BRK-B" },
            { id: "10", action: "buy", quantity: 15, price: 492.97, date: "2026-06-24", symbol: "BRK-B" },
          ]
        },
        {
          portfolioId: "crypto",
          transactions: [
            { id: "10", action: "buy", quantity: 20, price: 82.30, date: "2024-03-05", symbol: "COIN" },
            { id: "11", action: "buy", quantity: 10, price: 91.90, date: "2024-07-20", symbol: "COIN" },
            { id: "12", action: "buy", quantity: 15, price: 180.00, date: "2024-05-25", symbol: "MSTR" },
            { id: "13", action: "buy", quantity: 1, price: 68013.00, date: "2024-08-25", symbol: "BTC-USD" },
            { id: "14", action: "buy", quantity: 2, price: 16393.90, date: "2024-09-15", symbol: "ETH-USD" },
          ]
        },
        {
          portfolioId: "retirement",
          transactions: [
            { id: "15", action: "buy", quantity: 100, price: 215.50, date: "2024-01-03", symbol: "VTI" },
            { id: "16", action: "buy", quantity: 50, price: 225.30, date: "2024-04-01", symbol: "VTI" },
            { id: "17", action: "buy", quantity: 50, price: 222.75, date: "2024-07-01", symbol: "VTI" },
            { id: "18", action: "buy", quantity: 75, price: 57.80, date: "2024-02-15", symbol: "VXUS" },
            { id: "19", action: "buy", quantity: 25, price: 60.60, date: "2024-06-15", symbol: "VXUS" },
            { id: "20", action: "buy", quantity: 100, price: 76.20, date: "2024-01-10", symbol: "BND" },
            { id: "21", action: "buy", quantity: 50, price: 75.00, date: "2024-05-10", symbol: "BND" },
          ]
        },
        {
          portfolioId: "growth",
          transactions: [
            { id: "22", action: "buy", quantity: 20, price: 185.00, date: "2024-02-20", symbol: "TSLA" },
            { id: "23", action: "buy", quantity: 15, price: 175.50, date: "2024-06-30", symbol: "TSLA" },
            { id: "24", action: "sell", quantity: 5, price: 170.00, date: "2024-08-15", symbol: "TSLA" },
            { id: "25", action: "buy", quantity: 10, price: 420.00, date: "2024-03-10", symbol: "NVDA" },
            { id: "26", action: "buy", quantity: 10, price: 480.00, date: "2024-07-08", symbol: "NVDA" },
            { id: "27", action: "buy", quantity: 30, price: 92.50, date: "2024-01-25", symbol: "AMD" },
            { id: "28", action: "buy", quantity: 15, price: 100.00, date: "2024-04-28", symbol: "AMD" },
          ]
        }
      ];
      
      setAllTransactions(mockTransactionData);
      setLoadedPortfolioIds(new Set(mockPortfolios.map(p => p.id)));
      
      // Fetch real stock prices for mock portfolios
      await updateStockPrices();
      
      return;
    }

    setIsLoadingPortfolios(true);
    try {
      const response = await fetchUserPortfolios();
      
      // Convert backend portfolio data to frontend format
      const frontendPortfolios: Portfolio[] = response.portfolios.map(backendPortfolio => ({
        id: backendPortfolio.id,
        name: backendPortfolio.name,
        stocks: [], // Will be populated from transactions or separate API call
        cachedGainLoss: backendPortfolio.stats.cachedGainLoss,
        cachedTotalValue: backendPortfolio.stats.cachedTotalValue
      }));

      setPortfolios(frontendPortfolios);
      
      // Load summary data for all portfolios to show stock counts and values
      const portfolioSummariesPromises = frontendPortfolios.map(async (portfolio) => {
        try {
          const backendData = await fetchPortfolioTransactions(portfolio.id);
          const { portfolio: updatedPortfolio } = convertBackendDataToPortfolio(backendData, portfolio.id);
          // Preserve cached values from the original portfolio
          return {
            ...updatedPortfolio,
            cachedGainLoss: portfolio.cachedGainLoss,
            cachedTotalValue: portfolio.cachedTotalValue
          };
        } catch (error) {
          console.error(`Error loading summary for portfolio ${portfolio.id}:`, error);
          return portfolio; // Return original portfolio if summary loading fails
        }
      });

      const portfolioSummaries = await Promise.all(portfolioSummariesPromises);
      setPortfolios(portfolioSummaries);

      // Cache transactions for all portfolios and mark them as loaded
      const allTransactionsData: PortfolioTransactions[] = [];
      for (let i = 0; i < frontendPortfolios.length; i++) {
        const portfolio = frontendPortfolios[i];
        try {
          const backendData = await fetchPortfolioTransactions(portfolio.id);
          const { transactions } = convertBackendDataToPortfolio(backendData, portfolio.id);
          allTransactionsData.push({ portfolioId: portfolio.id, transactions });
        } catch (error) {
          console.error(`Error loading transactions for portfolio ${portfolio.id}:`, error);
        }
      }
      
      setAllTransactions(allTransactionsData);
      setLoadedPortfolioIds(new Set(frontendPortfolios.map(p => p.id)));

      // Set first portfolio as selected and fetch its stock prices
      if (portfolioSummaries.length > 0) {
        const firstPortfolio = portfolioSummaries[0];
        setSelectedPortfolio(firstPortfolio);
        
        // Fetch individual stock prices for the first portfolio
        const firstPortfolioSymbols = firstPortfolio.stocks.map(s => s.symbol);
        if (firstPortfolioSymbols.length > 0) {
          await updateIndividualStockPrices(firstPortfolio.id, firstPortfolioSymbols);
        }
      } else {
        setSelectedPortfolio(null);
      }
      
    } catch (error) {
      console.error('Error loading portfolios:', error);
      
      // Show error to user
      if (error instanceof Error && 
          (error.message.includes('Authentication required') || 
           error.message.includes('Access denied'))) {
        alert(`Portfolio loading failed: ${error.message}\nPlease sign in to view portfolios.`);
        // Fall back to empty state for unauthenticated users
        setPortfolios([]);
        setSelectedPortfolio(null);
      } else {
        // For other errors, show error but keep existing state
        alert(`Failed to load portfolios: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setIsLoadingPortfolios(false);
    }
  };

  // Function to refresh current portfolio data and stock prices
  const refreshCurrentPortfolio = async () => {
    if (!selectedPortfolio) {
      return;
    }

    setIsLoadingPrices(true);
    
    if (!user) {
      // For non-authenticated users, just refresh stock prices on mock data
      try {
        await updateStockPrices();
      } catch (error) {
        console.error('Error refreshing stock prices:', error);
      } finally {
        setIsLoadingPrices(false);
      }
      return;
    }

    setIsLoadingTransactions(true);

    try {
      // Step 1: Refresh portfolio transaction data (authenticated users only)
      const backendData = await fetchPortfolioTransactions(selectedPortfolio.id);
      const { portfolio: updatedPortfolio, transactions } = convertBackendDataToPortfolio(backendData, selectedPortfolio.id);
      
      // Preserve existing stock price data to avoid showing default values during refresh
      const portfolioWithPreservedPrices = {
        ...updatedPortfolio,
        stocks: updatedPortfolio.stocks.map(updatedStock => {
          const existingStock = selectedPortfolio.stocks.find(s => s.symbol === updatedStock.symbol);
          if (existingStock) {
            // Preserve price data from existing stock, update other fields from backend
            return {
              ...updatedStock,
              currentPrice: existingStock.currentPrice,
              change: existingStock.change,
              changePercent: existingStock.changePercent,
              name: existingStock.name
            };
          }
          return updatedStock;
        })
      };
      
      // Update the portfolio with fresh transaction data but preserved price data
      setPortfolios(prevPortfolios => 
        prevPortfolios.map(p => p.id === selectedPortfolio.id ? portfolioWithPreservedPrices : p)
      );

      // Update transactions cache
      setAllTransactions(prevTransactions => {
        const filtered = prevTransactions.filter(pt => pt.portfolioId !== selectedPortfolio.id);
        return [...filtered, { portfolioId: selectedPortfolio.id, transactions }];
      });

      // Update selected portfolio
      setSelectedPortfolio(portfolioWithPreservedPrices);

      // Step 2: Refresh stock prices for all symbols in this portfolio
      const symbols = backendData.holdings.map((holding: HoldingSummary) => holding.symbol);
      if (symbols.length > 0) {
        await updateIndividualStockPrices(selectedPortfolio.id, symbols);
      }

    } catch (error) {
      console.error('Error refreshing portfolio:', error);
      
      // Show error to user
      if (error instanceof Error && 
          (error.message.includes('Authentication required') || 
           error.message.includes('Access denied'))) {
        alert(`Failed to refresh portfolio: ${error.message}\nPlease sign in to view updated data.`);
      } else {
        alert(`Failed to refresh portfolio: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setIsLoadingPrices(false);
      setIsLoadingTransactions(false);
    }
  };

  // Function to update stock prices
  const updateStockPrices = async () => {
    setIsLoadingPrices(true);
    try {
      // Get all unique symbols from all portfolios
      const allSymbols = Array.from(
        new Set(portfolios.flatMap(portfolio => portfolio.stocks.map(stock => stock.symbol)))
      );

      if (allSymbols.length === 0) {
        setIsLoadingPrices(false);
        return;
      }

      // Fetch individual stock prices for each symbol
      const pricePromises = allSymbols.map(symbol => 
        fetchStockPrice(symbol).catch(error => {
          console.error(`Error fetching price for ${symbol}:`, error);
          return null; // Return null for failed requests
        })
      );

      const stockPrices = await Promise.all(pricePromises);

      // Create a map for quick lookup, filtering out failed requests
      const priceMap = new Map();
      stockPrices.forEach((price, index) => {
        if (price && price.price > 0) {
          priceMap.set(allSymbols[index], price);
        }
      });

      // Update portfolios with new prices
      const updatedPortfolios = portfolios.map(portfolio => ({
        ...portfolio,
        stocks: portfolio.stocks.map(stock => {
          const newPrice = priceMap.get(stock.symbol);
          if (newPrice) {
            return {
              ...stock,
              currentPrice: newPrice.price,
              change: newPrice.change,
              changePercent: newPrice.changePercent,
            };
          }
          return stock;
        }),
        // Preserve cached values during price updates
        cachedGainLoss: portfolio.cachedGainLoss,
        cachedTotalValue: portfolio.cachedTotalValue
      }));

      setPortfolios(updatedPortfolios);
      
      // Update selected portfolio if it exists in the updated portfolios
      const updatedSelectedPortfolio = updatedPortfolios.find(p => p.id === selectedPortfolio?.id);
      if (updatedSelectedPortfolio) {
        setSelectedPortfolio(updatedSelectedPortfolio);
      }
    } catch (error) {
      console.error('Error updating stock prices:', error);
      
      // Show API key error to user
      if (error instanceof Error && error.message.includes('Invalid API key')) {
        alert(`Stock price update failed: ${error.message}\nPlease check API key configuration.`);
      }
    } finally {
      setIsLoadingPrices(false);
    }
  };

  // Load initial data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      // Load portfolios first (this will also load transactions and stock prices for the first portfolio)
      await loadPortfolios();
    };

    loadInitialData();
    
    // Set up interval for price updates every 5 minutes
    const interval = setInterval(updateStockPrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Watch for user login/logout changes
  useEffect(() => {
    loadPortfolios();
  }, [user]);

  // Sync selectedPortfolio with portfolios state when portfolios are updated
  useEffect(() => {
    if (selectedPortfolio) {
      const updatedSelectedPortfolio = portfolios.find(p => p.id === selectedPortfolio.id);
      if (updatedSelectedPortfolio) {
        setSelectedPortfolio(updatedSelectedPortfolio);
      }
    }
  }, [portfolios]);

  const handleAddPortfolio = async (name: string) => {
    try {
      // Call backend API to create portfolio
      const backendResponse = await createPortfolio(name || 'New Portfolio');
      
      // Create frontend portfolio object with backend data
      const newPortfolio: Portfolio = {
        id: backendResponse.portfolio.id,
        name: backendResponse.portfolio.name,
        stocks: []
      };
      
      const updatedPortfolios = [newPortfolio, ...portfolios];
      setPortfolios(updatedPortfolios);
      setSelectedPortfolio(newPortfolio);
      
    } catch (error) {
      console.error('Failed to create portfolio:', error);
      
      // Show error to user
      if (error instanceof Error && 
          (error.message.includes('Authentication required') || 
           error.message.includes('Access denied'))) {
        alert(`Portfolio creation failed: ${error.message}\nPlease sign in to create portfolios.`);
      } else {
        alert(`Failed to create portfolio: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handleReorderPortfolios = (portfolios: Portfolio[]) => {
    setPortfolios(portfolios);
  };

  const handleSelectPortfolio = async (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio);
    
    // If transactions already loaded for this portfolio, just fetch fresh prices
    if (loadedPortfolioIds.has(portfolio.id)) {
      const portfolioSymbols = portfolio.stocks.map(s => s.symbol);
      if (portfolioSymbols.length > 0) {
        await updateIndividualStockPrices(portfolio.id, portfolioSymbols);
      }
    } else {
      // Load transactions for the selected portfolio if not already loaded
      await loadPortfolioTransactions(portfolio);
    }
  };

  // Function to handle portfolio updates (name changes)
  const handleUpdatePortfolio = (portfolioId: string, updatedPortfolio: Portfolio) => {
    // Update portfolios list
    setPortfolios(prevPortfolios => 
      prevPortfolios.map(p => p.id === portfolioId ? updatedPortfolio : p)
    );
    
    // Update selected portfolio if it matches
    if (selectedPortfolio?.id === portfolioId) {
      setSelectedPortfolio(updatedPortfolio);
    }
  };

  // Function to handle portfolio deletion
  const handleDeletePortfolio = (portfolioId: string) => {
    // Remove portfolio from list
    const updatedPortfolios = portfolios.filter(p => p.id !== portfolioId);
    setPortfolios(updatedPortfolios);
    
    // Remove transactions for deleted portfolio
    setAllTransactions(prevTransactions => 
      prevTransactions.filter(pt => pt.portfolioId !== portfolioId)
    );
    
    // Remove from loaded portfolio IDs
    setLoadedPortfolioIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(portfolioId);
      return newSet;
    });
    
    // Handle portfolio selection after deletion
    if (selectedPortfolio?.id === portfolioId) {
      if (updatedPortfolios.length > 0) {
        // Find the next portfolio to select
        const currentIndex = portfolios.findIndex(p => p.id === portfolioId);
        let nextPortfolio;
        
        if (currentIndex < updatedPortfolios.length) {
          // Select the next portfolio (same index position)
          nextPortfolio = updatedPortfolios[currentIndex];
        } else {
          // If it was the last portfolio, select the first one
          nextPortfolio = updatedPortfolios[0];
        }
        
        setSelectedPortfolio(nextPortfolio);
        
        // Load transactions for the newly selected portfolio if not already loaded
        if (!loadedPortfolioIds.has(nextPortfolio.id)) {
          loadPortfolioTransactions(nextPortfolio);
        }
      } else {
        // No portfolios left
        setSelectedPortfolio(null);
      }
    }
  };

  // Function to handle transaction removal
  const handleRemoveTransaction = async (transactionId: string, portfolioId: string) => {
    if (!selectedPortfolio) return;
    
    try {
      const request: RemoveFromPortfolioRequest = {
        transactionId,
        portfolioId
      };
      
      const response = await removeTransactionFromPortfolio(request);
      
      // Remove transaction from local state
      setAllTransactions(prevTransactions => 
        prevTransactions.map(pt => {
          if (pt.portfolioId === portfolioId) {
            return {
              ...pt,
              transactions: pt.transactions.filter(t => t.id !== transactionId)
            };
          }
          return pt;
        })
      );
      
      // Refresh the portfolio data to update stock holdings
      await loadPortfolioTransactions(selectedPortfolio);
      
    } catch (error) {
      console.error('Transaction removal failed:', error);
      
      // Show specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Authentication required')) {
          alert('Please sign in to remove transactions.');
        } else if (error.message.includes('Access denied')) {
          alert('Access denied. Please check your authentication.');
        } else {
          alert(`Failed to remove transaction: ${error.message}`);
        }
      } else {
        alert('Failed to remove transaction: Unknown error occurred.');
      }
    }
  };

  // Show loading state while portfolios are being fetched
  if (isLoadingPortfolios) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading portfolios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Portfolio List - Hidden on mobile, visible on lg+ */}
      <div className="hidden lg:block w-80 border-r border-border bg-card">
        <PortfolioSidebar 
          portfolios={portfolios}
          selectedPortfolio={selectedPortfolio}
          onSelectPortfolio={handleSelectPortfolio}
          onAddPortfolio={handleAddPortfolio}
          onReorderPortfolios={handleReorderPortfolios}
          isAuthenticated={!!user}
        />
      </div>
      
      {/* Middle Section - Portfolio Details - Full width on mobile, flex-1 on lg+ */}
      <div className="flex-1 flex flex-col min-w-0">
        <PortfolioDetails 
          portfolio={selectedPortfolio} 
          transactions={selectedPortfolioTransactions}
          isLoadingPrices={isLoadingPrices || isLoadingTransactions}
          onRefreshPrices={refreshCurrentPortfolio}
          onRemoveTransaction={handleRemoveTransaction}
          onUpdatePortfolio={handleUpdatePortfolio}
          onDeletePortfolio={handleDeletePortfolio}
          isAuthenticated={!!user}
        />
      </div>
      
      {/* Right Panel - Transaction Entry - Hidden on mobile/tablet, visible on xl+ */}
      <div className="hidden xl:block w-96 border-l border-border bg-card">
        <TransactionPanel 
          portfolio={selectedPortfolio}
          transactions={selectedPortfolioTransactions}
          isLoadingTransactions={isLoadingTransactions}
          onRemoveTransaction={handleRemoveTransaction}
          onTransactionAdded={refreshCurrentPortfolio}
          isAuthenticated={!!user}
        />
      </div>
    </div>
  );
}
