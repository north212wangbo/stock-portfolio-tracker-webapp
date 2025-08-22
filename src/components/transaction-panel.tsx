"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Loader2, AlertTriangle, X } from "lucide-react";
import { Portfolio, Transaction } from "@/app/page";
import { fetchStockPrice, StockPrice } from "@/lib/stock-service";
import { createTransaction, addTransactionToPortfolio, CreateTransactionRequest, AddToPortfolioRequest } from "@/lib/transaction-service";
import { LoginModal } from "./login-modal";

interface TransactionPanelProps {
  portfolio: Portfolio | null;
  transactions: Transaction[];
  isLoadingTransactions: boolean;
  onRemoveTransaction?: (transactionId: string, portfolioId: string) => void;
  onTransactionAdded?: () => void;
  isAuthenticated?: boolean;
}

export function TransactionPanel({ portfolio, transactions, isLoadingTransactions, onRemoveTransaction, onTransactionAdded, isAuthenticated = false }: TransactionPanelProps) {
  const [transactionType, setTransactionType] = useState("buy");
  const [symbol, setSymbol] = useState(portfolio?.stocks[0]?.symbol || "");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [useDropdown, setUseDropdown] = useState(portfolio?.stocks.length ? true : false);
  const [transactionDate, setTransactionDate] = useState(() => {
    // Default to today's date in YYYY-MM-DD format
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [isValidatingStock, setIsValidatingStock] = useState(false);
  const [stockValidationError, setStockValidationError] = useState<string | null>(null);
  const [validatedStock, setValidatedStock] = useState<StockPrice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    symbol: "",
    quantity: "",
    price: "",
    date: ""
  });
  const [removingTransactionId, setRemovingTransactionId] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Handle switching between dropdown and custom input
  const handleModeSwitch = (dropdown: boolean) => {
    setUseDropdown(dropdown);
    if (dropdown && portfolio && portfolio.stocks.length > 0) {
      // Switch to dropdown mode, set first stock if current symbol is not in portfolio
      const portfolioSymbols = portfolio.stocks.map(s => s.symbol);
      if (!portfolioSymbols.includes(symbol)) {
        setSymbol(portfolio.stocks[0].symbol);
      }
    }
    // When switching to custom mode, keep current symbol
  };

  // Validate and handle date input
  const handleDateChange = (value: string) => {
    // Allow partial input while typing
    if (value === "" || /^\d{0,4}-?\d{0,2}-?\d{0,2}$/.test(value)) {
      // Check if it's a complete date in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const date = new Date(value);
        // Check if it's a valid date
        if (!isNaN(date.getTime()) && value === date.toISOString().split('T')[0]) {
          setTransactionDate(value);
        } else {
          // Invalid date, clear input
          setTransactionDate("");
        }
      } else {
        // Partial input, allow it
        setTransactionDate(value);
      }
    } else {
      // Invalid format, clear input
      setTransactionDate("");
    }
  };

  // Validate stock symbol with backend API
  const validateStock = useCallback(async (stockSymbol: string) => {
    if (!stockSymbol || stockSymbol.length < 1) {
      setStockValidationError(null);
      setValidatedStock(null);
      return;
    }

    setIsValidatingStock(true);
    setStockValidationError(null);
    
    try {
      const stockData = await fetchStockPrice(stockSymbol);
      if (stockData && stockData.price > 0) {
        setValidatedStock(stockData);
        setStockValidationError(null);
      } else {
        setValidatedStock(null);
        setStockValidationError(`Stock symbol "${stockSymbol}" not found or has no price data.`);
      }
    } catch (_error) {
      setValidatedStock(null);
      setStockValidationError(`Unable to validate stock symbol "${stockSymbol}". Please check the symbol.`);
    } finally {
      setIsValidatingStock(false);
    }
  }, []);

  // Clear validation when switching modes
  useEffect(() => {
    if (useDropdown) {
      // Clear validation when using dropdown mode
      setStockValidationError(null);
      setValidatedStock(null);
      setIsValidatingStock(false);
    }
  }, [useDropdown]);

  // Handle symbol validation on blur or enter
  const handleSymbolValidation = () => {
    if (!useDropdown && symbol) {
      validateStock(symbol);
    }
  };

  // Handle key press in symbol input
  const handleSymbolKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSymbolValidation();
    }
  };

  // Handle symbol input change
  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSymbol = e.target.value.toUpperCase();
    setSymbol(newSymbol);
    
    // Clear previous validation when user starts typing
    if (!useDropdown) {
      setStockValidationError(null);
      setValidatedStock(null);
    }
    
    // Clear field error
    setFieldErrors(prev => ({ ...prev, symbol: "" }));
  };

  // Clear field errors when inputs change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuantity(e.target.value);
    setFieldErrors(prev => ({ ...prev, quantity: "" }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrice(e.target.value);
    setFieldErrors(prev => ({ ...prev, price: "" }));
  };

  const handleDateInputChange = (value: string) => {
    handleDateChange(value);
    setFieldErrors(prev => ({ ...prev, date: "" }));
  };

  // Show empty state if no portfolio is selected
  if (!portfolio) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Add Transaction</h2>
        <div className="text-center text-muted-foreground">
          <p>Select a portfolio to add transactions</p>
        </div>
      </div>
    );
  }

  // Get current price for selected symbol
  const selectedStock = portfolio.stocks.find(stock => stock.symbol === symbol);
  const currentPrice = selectedStock?.currentPrice || (validatedStock?.price || 0);
  const estimatedTotal = quantity && price && parseFloat(price) * parseFloat(quantity);

  // Sort transactions by date (most recent first)
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit'
    });
  };

  const handleSubmitOrder = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    
    // Start submission process
    setIsSubmitting(true);
    
    // Clear previous field errors
    setFieldErrors({
      symbol: "",
      quantity: "",
      price: "",
      date: ""
    });
    
    // Validate all fields
    const errors = {
      symbol: "",
      quantity: "",
      price: "",
      date: ""
    };
    
    let hasErrors = false;
    
    // Validate symbol
    if (!symbol.trim()) {
      errors.symbol = "Stock symbol is required";
      hasErrors = true;
    }
    
    // Validate custom stock symbol if not in dropdown mode
    if (!useDropdown && symbol.trim()) {
      if (isValidatingStock) {
        // Don't submit while validating, but don't show error
        setIsSubmitting(false);
        return;
      }
      
      if (stockValidationError) {
        errors.symbol = stockValidationError;
        hasErrors = true;
      } else if (!validatedStock) {
        // Trigger validation if not done yet
        await validateStock(symbol);
        // Check again after validation
        if (stockValidationError) {
          errors.symbol = stockValidationError;
          hasErrors = true;
        } else if (!validatedStock) {
          errors.symbol = "Unable to validate stock symbol";
          hasErrors = true;
        }
      }
    }
    
    // Validate quantity
    if (!quantity.trim()) {
      errors.quantity = "Quantity is required";
      hasErrors = true;
    } else if (isNaN(parseFloat(quantity)) || parseFloat(quantity) <= 0) {
      errors.quantity = "Quantity must be a positive number";
      hasErrors = true;
    }
    
    // Validate price
    if (!price.trim()) {
      errors.price = "Price is required";
      hasErrors = true;
    } else if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      errors.price = "Price must be a positive number";
      hasErrors = true;
    }
    
    // Validate transaction date
    if (!transactionDate) {
      errors.date = "Transaction date is required";
      hasErrors = true;
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(transactionDate)) {
      errors.date = "Please enter date in YYYY-MM-DD format";
      hasErrors = true;
    } else {
      const dateObj = new Date(transactionDate);
      if (isNaN(dateObj.getTime()) || transactionDate !== dateObj.toISOString().split('T')[0]) {
        errors.date = "Please enter a valid date";
        hasErrors = true;
      }
    }
    
    // If validation fails, show errors and stop submission
    if (hasErrors) {
      setFieldErrors(errors);
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Step 1: Create transaction
      const createTransactionRequest: CreateTransactionRequest = {
        symbol: symbol.trim(),
        price: parseFloat(price),
        type: transactionType.toUpperCase() as "BUY" | "SELL",
        shares: parseFloat(quantity),
        timestamp: transactionDate + "T12:00:00" // Keep in local timezone
      };
      
      const createResponse = await createTransaction(createTransactionRequest);
      
      // Step 2: Add transaction to portfolio
      if (!portfolio) {
        throw new Error('No portfolio selected');
      }
      
      const addToPortfolioRequest: AddToPortfolioRequest = {
        transactionId: createResponse.transactionId,
        portfolioId: portfolio.id
      };
      
      const addToPortfolioResponse = await addTransactionToPortfolio(addToPortfolioRequest);
      
      // Success: Clear form and show success
      // Keep symbol from previous transaction for convenience
      setQuantity("");
      setPrice("");
      // Keep date for convenience
      
      // If user was in custom mode, switch to portfolio mode since the symbol is now in portfolio
      if (!useDropdown) {
        setUseDropdown(true);
      }
      
      // Clear validation states
      setStockValidationError(null);
      setValidatedStock(null);
      
      // Trigger portfolio refresh instead of showing alert
      if (onTransactionAdded) {
        onTransactionAdded();
      }
      
    } catch (error) {
      // API error
      console.error('Transaction creation failed:', error);
      
      // Show specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Authentication required')) {
          alert('Please sign in to add transactions.');
        } else if (error.message.includes('Access denied')) {
          alert('Access denied. Please check your authentication.');
        } else {
          alert(`Failed to add transaction: ${error.message}`);
        }
      } else {
        alert('Failed to add transaction: Unknown error occurred.');
      }
    } finally {
      // Always reset submission state
      setIsSubmitting(false);
    }
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Trade</h2>
      </div>

      <div className="flex-1 overflow-auto px-4">
        <Tabs defaultValue="trade" className="h-full">
          <TabsList className="grid w-full grid-cols-2 mt-4">
            <TabsTrigger value="trade">Add Transaction</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="trade" className="pt-6 space-y-4">
            {/* Stock Selection */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Stock Symbol</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-1">
                  <Button
                    variant={useDropdown ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleModeSwitch(true)}
                  >
                    Portfolio
                  </Button>
                  <Button
                    variant={!useDropdown ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleModeSwitch(false)}
                  >
                    Custom
                  </Button>
                </div>
                {useDropdown ? (
                  portfolio.stocks.length > 0 ? (
                    <Select value={symbol} onValueChange={setSymbol}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select from portfolio" />
                      </SelectTrigger>
                      <SelectContent>
                        {portfolio.stocks.map(stock => (
                          <SelectItem key={stock.symbol} value={stock.symbol}>
                            {stock.symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                      No stocks in portfolio. Switch to Custom mode to add a new stock.
                    </div>
                  )
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        placeholder="Enter stock symbol (e.g., AAPL)"
                        value={symbol}
                        onChange={handleSymbolChange}
                        onBlur={handleSymbolValidation}
                        onKeyPress={handleSymbolKeyPress}
                        className={(stockValidationError || fieldErrors.symbol) ? "border-red-500" : ""}
                      />
                      {isValidatingStock && (
                        <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    {(fieldErrors.symbol || stockValidationError) && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{fieldErrors.symbol || stockValidationError}</span>
                      </div>
                    )}
                    {validatedStock && !fieldErrors.symbol && (
                      <div className="text-sm text-green-600">
                        ✓ {validatedStock.symbol} - Current Price: ${validatedStock.price.toFixed(2)}
                      </div>
                    )}
                  </div>
                )}
                {useDropdown && currentPrice > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Current Price: <span className="font-semibold">${currentPrice.toFixed(2)}</span>
                  </div>
                )}
                {!useDropdown && (
                  <div className="text-sm text-muted-foreground">
                    Enter any stock symbol to trade
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transaction Type */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Transaction Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={transactionType === "buy" ? "default" : "outline"}
                    onClick={() => setTransactionType("buy")}
                    className="w-full"
                  >
                    Buy
                  </Button>
                  <Button
                    variant={transactionType === "sell" ? "default" : "outline"}
                    onClick={() => setTransactionType("sell")}
                    className="w-full"
                  >
                    Sell
                  </Button>
                </div>
              </CardContent>
            </Card>


            {/* Transaction Details */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Transaction Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="Number of shares"
                    value={quantity}
                    onChange={handleQuantityChange}
                    className={fieldErrors.quantity ? "border-red-500" : ""}
                  />
                  {fieldErrors.quantity && (
                    <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{fieldErrors.quantity}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="Price per share"
                    value={price}
                    onChange={handlePriceChange}
                    className={fieldErrors.price ? "border-red-500" : ""}
                  />
                  {fieldErrors.price && (
                    <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{fieldErrors.price}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Transaction Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={transactionDate}
                    onChange={(e) => handleDateInputChange(e.target.value)}
                    className={fieldErrors.date ? "border-red-500" : ""}
                  />
                  {fieldErrors.date && (
                    <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{fieldErrors.date}</span>
                    </div>
                  )}
                </div>

                {estimatedTotal && (
                  <div className="p-2 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Calculator className="h-3 w-3" />
                      <span className="font-medium text-sm">Order Summary</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Shares:</span>
                        <span>{quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Price:</span>
                        <span>${price || "0.00"}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                        <span>Estimated Total:</span>
                        <span>${estimatedTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button 
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
              className={`w-full ${transactionType === "buy" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting...</span>
                </div>
              ) : (
                transactionType === "buy" ? "Add Buy Transaction" : "Add Sell Transaction"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="history" className="pt-6 px-4 space-y-4">
            {isLoadingTransactions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading transactions...</span>
              </div>
            ) : sortedTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-sm">No transactions found</div>
                <div className="text-xs">for {portfolio.name} portfolio</div>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedTransactions.map((transaction) => (
                  <Card key={transaction.id}>
                    <CardContent className="p-2">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-sm">{transaction.symbol}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(transaction.date)}</div>
                        </div>
                        {onRemoveTransaction && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTransaction(transaction.id)}
                            disabled={removingTransactionId === transaction.id}
                            className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {removingTransactionId === transaction.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className={`font-medium ${transaction.action === "buy" ? "text-green-600" : "text-red-600"}`}>
                          {transaction.action.toUpperCase()} {transaction.quantity}
                        </span>
                        <span className="font-semibold">
                          ${(transaction.quantity * transaction.price).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        @${transaction.price.toFixed(2)} per share
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <LoginModal 
        open={showLoginModal} 
        onOpenChange={setShowLoginModal} 
      />
    </div>
  );
}