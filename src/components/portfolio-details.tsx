"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, MoreHorizontal, ChevronDown, ChevronRight, Calendar, DollarSign, Loader2, RefreshCw, X, Upload, Download, Trash2, Edit } from "lucide-react";
import { Portfolio, Transaction } from "@/app/page";
import { bulkCreateTransactions, BulkTransaction } from "@/lib/transaction-service";
import { updatePortfolio, deletePortfolio } from "@/lib/portfolio-service";
import { cn } from "@/lib/utils";
import { PortfolioPerformanceModal } from "./portfolio-performance-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoginModal } from "./login-modal";
import { EditTransactionModal } from "./edit-transaction-modal";

interface PortfolioDetailsProps {
  portfolio: Portfolio | null;
  transactions: Transaction[];
  isLoadingPrices?: boolean;
  onRefreshPrices?: () => void;
  onRemoveTransaction?: (transactionId: string, portfolioId: string) => void;
  onUpdatePortfolio?: (portfolioId: string, updatedPortfolio: Portfolio) => void;
  onDeletePortfolio?: (portfolioId: string) => void;
  isAuthenticated?: boolean;
}


export function PortfolioDetails({ portfolio, transactions, isLoadingPrices = false, onRefreshPrices, onRemoveTransaction, onUpdatePortfolio, onDeletePortfolio, isAuthenticated = false }: PortfolioDetailsProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [removingTransactionId, setRemovingTransactionId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isDeletingPortfolio, setIsDeletingPortfolio] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Show empty state if no portfolio is selected
  if (!portfolio) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground mb-2">No Portfolio Selected</h2>
          <p className="text-muted-foreground">Select a portfolio from the sidebar or create a new one to get started.</p>
        </div>
      </div>
    );
  }

  // Use cached values if available, otherwise calculate from current stock data
  const totalValue = portfolio.cachedTotalValue !== undefined 
    ? portfolio.cachedTotalValue 
    : portfolio.stocks.reduce((sum, stock) => sum + (stock.shares * stock.currentPrice), 0);
    
  const totalGainLoss = portfolio.cachedGainLoss !== undefined 
    ? portfolio.cachedGainLoss 
    : portfolio.stocks.reduce((sum, stock) => {
        const marketValue = stock.shares * stock.currentPrice;
        const trueCost = stock.trueCost || 0;
        const stockGainLoss = marketValue - trueCost;
        return sum + stockGainLoss;
      }, 0);
  

  // Function to get transactions for a specific stock symbol
  const getTransactionsForSymbol = (symbol: string) => {
    return transactions
      .filter(t => t.symbol === symbol)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Calculate total today's gain/loss for all stocks in portfolio
  const totalTodaysGainLoss = portfolio.stocks.reduce((sum, stock) => {
    // Reuse the same calculation logic as in the table
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const transactionsBeforeToday = getTransactionsForSymbol(stock.symbol).filter(t => {
      const transactionDate = new Date(t.date);
      transactionDate.setHours(0, 0, 0, 0);
      return transactionDate < today;
    });
    
    let sharesYesterday = 0;
    let trueCostYesterday = 0;
    transactionsBeforeToday.forEach(transaction => {
      if (transaction.action === 'buy') {
        sharesYesterday += transaction.quantity;
        trueCostYesterday += transaction.quantity * transaction.price;
      } else {
        sharesYesterday -= transaction.quantity;
        trueCostYesterday -= transaction.quantity * transaction.price;
      }
    });
    
    const previousDayPrice = stock.currentPrice - stock.change;
    const marketValue = stock.shares * stock.currentPrice;
    const trueCost = stock.trueCost || 0;
    const totalGainLossToday = marketValue - trueCost;
    const marketValueYesterday = sharesYesterday * previousDayPrice;
    const totalGainLossYesterday = marketValueYesterday - trueCostYesterday;
    const todaysGainLoss = totalGainLossToday - totalGainLossYesterday;
    
    return sum + todaysGainLoss;
  }, 0);



  const toggleRowExpansion = (symbol: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(symbol)) {
      newExpanded.delete(symbol);
    } else {
      newExpanded.add(symbol);
    }
    setExpandedRows(newExpanded);
  };

  const formatDate = (dateStr: string) => {
    // Extract just the date part (YYYY-MM-DD) from ISO string to avoid timezone issues
    const datePart = dateStr.split('T')[0];
    const [year, month, day] = datePart.split('-');
    
    // Create date in local timezone
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateStr);
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };


  const handleRemoveTransaction = async (transactionId: string) => {
    if (!portfolio || !onRemoveTransaction) return;
    
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    
    // Confirm deletion
    if (!confirm('Are you sure you want to remove this transaction? This action cannot be undone.')) {
      return;
    }
    
    setRemovingTransactionId(transactionId);
    
    try {
      await onRemoveTransaction(transactionId, portfolio.id);
    } catch (error) {
      console.error('Error removing transaction:', error);
    } finally {
      setRemovingTransactionId(null);
    }
  };

  const parseCsvLine = (line: string): { symbol: string; shares: number; price: number; timestamp?: string } | null => {
    const parts = line.split(',').map(part => part.trim());
    
    if (parts.length < 3) {
      return null;
    }
    
    const [symbol, sharesStr, priceStr, timestampStr] = parts;
    
    // Validate symbol
    if (!symbol || symbol.length === 0) {
      return null;
    }
    
    // Validate shares (can be negative for SELL)
    const shares = parseFloat(sharesStr);
    if (isNaN(shares) || shares === 0) {
      return null;
    }
    
    // Validate price
    const price = parseFloat(priceStr);
    if (isNaN(price) || price <= 0) {
      return null;
    }
    
    // Parse timestamp if provided (MM-DD-YYYY format)
    let timestamp: string | undefined;
    if (timestampStr && timestampStr.trim() !== '') {
      const dateMatch = timestampStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
      if (dateMatch) {
        const [, month, day, year] = dateMatch;
        // Convert to ISO string format (YYYY-MM-DDTHH:mm:ssZ)
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        timestamp = date.toISOString();
      }
    }
    
    return {
      symbol: symbol.toUpperCase(),
      shares, // Keep original value to determine BUY/SELL type
      price,
      timestamp
    };
  };

  const handleImportTransactions = () => {
    if (!portfolio) return;
    
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    
    // Create file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';
    fileInput.style.display = 'none';
    
    fileInput.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (!file) return;
      
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('Please select a CSV file.');
        return;
      }
      
      setIsImporting(true);
      
      try {
        // Read file content
        const text = await file.text();
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        if (lines.length === 0) {
          alert('The CSV file is empty.');
          return;
        }
        
        // Parse and validate each line
        const transactions: BulkTransaction[] = [];
        const errors: string[] = [];
        
        lines.forEach((line, index) => {
          const parsed = parseCsvLine(line);
          
          if (!parsed) {
            errors.push(`Line ${index + 1}: Invalid format or data`);
            return;
          }
          
          const transaction: BulkTransaction = {
            symbol: parsed.symbol,
            price: parsed.price,
            type: parsed.shares > 0 ? "BUY" : "SELL", // Positive = BUY, Negative = SELL
            shares: Math.abs(parsed.shares), // API expects positive shares value
            timestamp: parsed.timestamp
          };
          
          transactions.push(transaction);
        });
        
        // Check if we have any valid transactions
        if (transactions.length === 0) {
          alert('No valid transactions found in the CSV file.\n\nExpected format: symbol,shares,price,timestamp(MM-DD-YYYY)\nExample: AAPL,10,150.50,08-06-2025');
          return;
        }
        
        // Show validation summary if there are errors
        if (errors.length > 0) {
          const continueImport = confirm(
            `Found ${errors.length} invalid lines:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}\n\nContinue importing ${transactions.length} valid transactions?`
          );
          
          if (!continueImport) {
            return;
          }
        }
        
        // Call API to import transactions
        await bulkCreateTransactions({
          portfolioId: portfolio.id,
          transactions
        });
        
        // Success - refresh portfolio data
        alert(`Successfully imported ${transactions.length} transactions from ${file.name}!`);
        
        // Refresh portfolio data
        if (onRefreshPrices) {
          await onRefreshPrices();
        }
        
      } catch (error) {
        console.error('Import failed:', error);
        
        // Show specific error messages
        if (error instanceof Error) {
          if (error.message.includes('Authentication required')) {
            alert('Please sign in to import transactions.');
          } else if (error.message.includes('Access denied')) {
            alert('Access denied. Please check your authentication.');
          } else {
            alert(`Failed to import transactions: ${error.message}`);
          }
        } else {
          alert('Failed to import transactions. Please try again.');
        }
      } finally {
        setIsImporting(false);
        // Clean up
        document.body.removeChild(fileInput);
      }
    };
    
    // Add to DOM and trigger click
    document.body.appendChild(fileInput);
    fileInput.click();
  };

  const handleStartEditingName = () => {
    if (!portfolio || !isAuthenticated) return;
    setIsEditingName(true);
    setEditingName(portfolio.name);
    setNameError(null); // Clear any previous errors
  };

  const handleCancelEditingName = () => {
    setIsEditingName(false);
    setEditingName('');
    setNameError(null);
  };

  const handleSavePortfolioName = async () => {
    if (!portfolio || !onUpdatePortfolio || !isAuthenticated) {
      handleCancelEditingName();
      return;
    }

    const trimmedName = editingName.trim();
    
    // Check if name actually changed
    if (trimmedName === portfolio.name || trimmedName === '') {
      handleCancelEditingName();
      return;
    }

    setIsUpdatingName(true);
    
    try {
      // Call API to update portfolio name
      await updatePortfolio(portfolio.id, {
        name: trimmedName,
        cachedGainLoss: portfolio.cachedGainLoss || 0,
        cachedTotalValue: portfolio.cachedTotalValue || 0
      });

      // Update portfolio in parent component
      const updatedPortfolio = { ...portfolio, name: trimmedName };
      onUpdatePortfolio(portfolio.id, updatedPortfolio);
      
      // Reset editing state
      setIsEditingName(false);
      setEditingName('');
      
    } catch (error) {
      console.error('Failed to update portfolio name:', error);
      
      // Check for specific duplicate name error (409 status code)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update portfolio name';
      const statusCode = (error as Error & { status?: number })?.status;
      
      if (statusCode === 409) {
        setNameError('A portfolio with this name already exists. Please choose a different name.');
        // Stay in edit mode to allow user to try a different name
      } else {
        // For all other errors, show alert and revert as before
        alert(`Error: ${errorMessage}`);
        
        // Reset to original name and exit edit mode
        setEditingName(portfolio.name);
        setIsEditingName(false);
        setNameError(null);
      }
      
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSavePortfolioName();
    } else if (e.key === 'Escape') {
      handleCancelEditingName();
    }
  };

  const handleNameChange = (value: string) => {
    setEditingName(value);
    // Clear error when user starts typing
    if (nameError) {
      setNameError(null);
    }
  };

  const handleDeletePortfolio = async () => {
    if (!portfolio || !onDeletePortfolio || !isAuthenticated) {
      return;
    }

    // Confirm deletion
    const confirmMessage = `Are you sure you want to delete the portfolio "${portfolio.name}"?\n\nThis will permanently delete the portfolio and all its transactions. This action cannot be undone.`;
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsDeletingPortfolio(true);
    
    try {
      await deletePortfolio(portfolio.id);
      
      // Notify parent component to handle portfolio deletion and selection
      onDeletePortfolio(portfolio.id);
      
    } catch (error) {
      console.error('Failed to delete portfolio:', error);
      
      // Show user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('Authentication required')) {
          alert('Please sign in to delete portfolios.');
        } else if (error.message.includes('Access denied')) {
          alert('Access denied. Please check your authentication.');
        } else if (error.message.includes('Portfolio not found')) {
          alert('Portfolio not found. It may have already been deleted.');
        } else {
          alert(`Failed to delete portfolio: ${error.message}`);
        }
      } else {
        alert('Failed to delete portfolio. Please try again.');
      }
      
    } finally {
      setIsDeletingPortfolio(false);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    
    setEditingTransaction(transaction);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingTransaction(null);
  };

  const handleTransactionUpdated = () => {
    // Refresh portfolio data after successful update
    if (onRefreshPrices) {
      onRefreshPrices();
    }
  };

  const handleExportTransactions = () => {
    if (!portfolio) return;

    // Get transactions for this portfolio
    const portfolioTransactions = transactions.filter(t => t.symbol);
    
    // Create CSV header
    const csvHeader = 'Symbol,Side,Qty,Fill Price,Commision,Closing Time\n';
    
    // Convert transactions to CSV format
    const csvRows = portfolioTransactions.map(transaction => {
      const symbol = transaction.symbol || '';
      const side = transaction.action === 'buy' ? 'Buy' : 'Sell';
      const qty = transaction.quantity || '';
      const price = transaction.price || '';
      const commission = ''; // No commission data available
      const timestamp = transaction.date ? new Date(transaction.date).toISOString().split('T')[0] + ' 00:00:00' : '';
      
      return `${symbol},${side},${qty},${price},${commission},${timestamp}`;
    }).join('\n');
    
    // Combine header and rows
    const csvContent = csvHeader + csvRows;
    
    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      // Create download URL
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${portfolio.name}_transactions.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Portfolio Header */}
      <div className="p-6 border-b bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isEditingName ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Input
                    value={editingName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onKeyDown={handleNameKeyPress}
                    onBlur={handleSavePortfolioName}
                    className={cn(
                      "text-2xl font-bold h-10 border-2",
                      nameError ? "border-red-500 focus:border-red-500" : "border-primary"
                    )}
                    disabled={isUpdatingName}
                    autoFocus
                    placeholder="Portfolio name"
                  />
                  {isUpdatingName && (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  )}
                </div>
                {nameError && (
                  <p className="text-sm text-red-600 mt-1">{nameError}</p>
                )}
              </div>
            ) : (
              <h1 
                className={cn(
                  "text-2xl font-bold cursor-pointer hover:text-primary transition-colors",
                  !isAuthenticated && "cursor-default hover:text-current"
                )}
                onClick={handleStartEditingName}
                title={isAuthenticated ? "Click to edit portfolio name" : "Sign in to edit portfolio name"}
              >
                {portfolio.name}
              </h1>
            )}
            <Badge variant="secondary">{portfolio.stocks.length} stocks</Badge>
          </div>
          <div className="flex items-center gap-2">
            {onRefreshPrices && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onRefreshPrices}
                disabled={isLoadingPrices}
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingPrices ? 'animate-spin' : ''}`} />
                {isLoadingPrices ? 'Updating...' : 'Refresh'}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleImportTransactions}
                  disabled={isImporting}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {isImporting ? 'Importing...' : 'Import CSV'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleExportTransactions}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDeletePortfolio}
                  disabled={isDeletingPortfolio || !isAuthenticated}
                  className="flex items-center gap-2 cursor-pointer text-red-600 hover:text-red-700 focus:text-red-700"
                >
                  {isDeletingPortfolio ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {isDeletingPortfolio ? 'Deleting...' : 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Portfolio Value Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Total Market Value</div>
              <div className="text-3xl font-bold">
                ${totalValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setShowPerformanceModal(true)}
          >
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Cumulative Gain/Loss</div>
              <div className={cn(
                "text-3xl font-bold flex items-center gap-2",
                totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {totalGainLoss >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Click to view performance chart</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Today&apos;s Gain/Loss</div>
              <div className={cn(
                "text-3xl font-bold flex items-center gap-2",
                totalTodaysGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {totalTodaysGainLoss >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                {totalTodaysGainLoss >= 0 ? '+' : ''}${totalTodaysGainLoss.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stock Holdings */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Holdings</h2>
          
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                  <TableHead className="text-right">Current Price</TableHead>
                  <TableHead className="text-right">Today&apos;s Gain/Loss</TableHead>
                  <TableHead className="text-right">Market Value</TableHead>
                  <TableHead className="text-right">True Cost</TableHead>
                  <TableHead className="text-right">Avg True Cost</TableHead>
                  <TableHead className="text-right">Gain/Loss</TableHead>
                  <TableHead className="text-right">Return %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolio.stocks.map((stock) => {
                  const marketValue = stock.shares * stock.currentPrice;
                  const trueCost = stock.trueCost || 0;
                  const gainLoss = marketValue - trueCost;
                  
                  // Calculate return percentage as: (totalSellValue + currentMarketValue - totalBuyValue) / totalBuyValue
                  const totalBuyValue = stock.totalBuyValue || 0;
                  const totalSellValue = stock.totalSellValue || 0;
                  const gainLossPercent = totalBuyValue !== 0 ? 
                    ((totalSellValue + marketValue - totalBuyValue) / totalBuyValue * 100) : 0;
                  
                  // Calculate today's gain/loss
                  // Filter transactions to only include those before today
                  const today = new Date();
                  today.setHours(0, 0, 0, 0); // Start of today
                  const transactionsBeforeToday = getTransactionsForSymbol(stock.symbol).filter(t => {
                    const transactionDate = new Date(t.date);
                    transactionDate.setHours(0, 0, 0, 0);
                    return transactionDate < today;
                  });
                  
                  // Calculate shares and true cost as of yesterday
                  let sharesYesterday = 0;
                  let trueCostYesterday = 0;
                  transactionsBeforeToday.forEach(transaction => {
                    if (transaction.action === 'buy') {
                      sharesYesterday += transaction.quantity;
                      trueCostYesterday += transaction.quantity * transaction.price;
                    } else {
                      sharesYesterday -= transaction.quantity;
                      trueCostYesterday -= transaction.quantity * transaction.price;
                    }
                  });
                  
                  // Calculate previous day price using change field (dollar amount)
                  const previousDayPrice = stock.currentPrice - stock.change;
                  
                  // Total gain/loss as of today (current)
                  const totalGainLossToday = gainLoss;
                  
                  // Total gain/loss as of previous day
                  const marketValueYesterday = sharesYesterday * previousDayPrice;
                  const totalGainLossYesterday = marketValueYesterday - trueCostYesterday;
                  
                  // Today's gain/loss = today's total - yesterday's total
                  const todaysGainLoss = totalGainLossToday - totalGainLossYesterday;

                  const isExpanded = expandedRows.has(stock.symbol);

                  return (
                    <React.Fragment key={stock.symbol}>
                      <TableRow 
                        className="hover:bg-accent/50 cursor-pointer"
                        onClick={() => toggleRowExpansion(stock.symbol)}
                      >
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">{stock.symbol}</div>
                        </TableCell>
                        <TableCell className="text-right">{stock.shares}</TableCell>
                        <TableCell className="text-right">
                          <div className="font-semibold">${stock.currentPrice.toFixed(2)}</div>
                          <div className={`text-xs ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </div>
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${
                          todaysGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {todaysGainLoss >= 0 ? '+' : ''}${todaysGainLoss.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ${marketValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ${(stock.trueCost || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          ${stock.shares !== 0 ? (trueCost / stock.shares).toFixed(2) : '0.00'}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${
                          gainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {gainLoss >= 0 ? '+' : ''}${gainLoss.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${
                          gainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {gainLoss >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%
                        </TableCell>
                      </TableRow>
                      
                      {/* Transaction History Row */}
                      {isExpanded && (
                        <TableRow key={`${stock.symbol}-history`}>
                          <TableCell colSpan={10} className="p-0">
                            <div className="px-6 py-4 bg-muted/30">
                              <div className="mb-3">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Transaction History for {stock.symbol}
                                </h4>
                              </div>
                              
                              <div className="space-y-2">
                                {getTransactionsForSymbol(stock.symbol).map((transaction) => (
                                  <div 
                                    key={transaction.id}
                                    className="flex items-center justify-between py-2 px-3 bg-background rounded-lg border"
                                  >
                                    <div className="flex items-center gap-3">
                                      <Badge 
                                        variant={transaction.action === 'buy' ? 'default' : 'destructive'}
                                        className="text-xs"
                                      >
                                        {transaction.action.toUpperCase()}
                                      </Badge>
                                      <span className="text-sm">
                                        {transaction.quantity} shares
                                      </span>
                                      <span className="text-sm text-muted-foreground">at</span>
                                      <div className="flex items-center gap-1">
                                        <DollarSign className="h-3 w-3" />
                                        <span className="font-semibold text-sm">
                                          {transaction.price.toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                      <span className="text-sm text-muted-foreground">
                                        {formatDate(transaction.date)}
                                      </span>
                                      <div className="text-sm font-semibold">
                                        ${(transaction.quantity * transaction.price).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditTransaction(transaction);
                                          }}
                                          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                          title="Edit transaction"
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        {onRemoveTransaction && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRemoveTransaction(transaction.id);
                                            }}
                                            disabled={removingTransactionId === transaction.id}
                                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            title="Delete transaction"
                                          >
                                            {removingTransactionId === transaction.id ? (
                                              <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                              <X className="h-3 w-3" />
                                            )}
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              {getTransactionsForSymbol(stock.symbol).length === 0 && (
                                <div className="text-sm text-muted-foreground text-center py-4">
                                  No transaction history available for {stock.symbol}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </div>

      </div>

      {/* Performance Modal */}
      <PortfolioPerformanceModal
        isOpen={showPerformanceModal}
        onClose={() => setShowPerformanceModal(false)}
        portfolio={portfolio}
        transactions={transactions}
      />
      
      <LoginModal 
        open={showLoginModal} 
        onOpenChange={setShowLoginModal} 
      />
      
      <EditTransactionModal
        open={showEditModal}
        onOpenChange={handleCloseEditModal}
        transaction={editingTransaction}
        onTransactionUpdated={handleTransactionUpdated}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
}