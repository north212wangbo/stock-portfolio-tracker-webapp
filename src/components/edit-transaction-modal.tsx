"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Transaction } from '@/app/page';
import { updateTransaction, UpdateTransactionRequest } from '@/lib/transaction-service';

interface EditTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  onTransactionUpdated: () => void;
  isAuthenticated?: boolean;
}

export function EditTransactionModal({ 
  open, 
  onOpenChange, 
  transaction, 
  onTransactionUpdated, 
  isAuthenticated = false 
}: EditTransactionModalProps) {
  const [type, setType] = useState<"BUY" | "SELL">("BUY");
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    shares: "",
    price: "",
    date: ""
  });

  // Reset form when transaction changes or modal opens
  useEffect(() => {
    if (transaction && open) {
      setType(transaction.action.toUpperCase() as "BUY" | "SELL");
      setShares(transaction.quantity.toString());
      setPrice(transaction.price.toString());
      // Convert date to YYYY-MM-DD format for date input
      const transactionDate = new Date(transaction.date);
      setDate(transactionDate.toISOString().split('T')[0]);
      setError("");
      setFieldErrors({ shares: "", price: "", date: "" });
    }
  }, [transaction, open]);

  const handleClose = () => {
    setError("");
    setFieldErrors({ shares: "", price: "", date: "" });
    onOpenChange(false);
  };

  const validateForm = () => {
    const errors = { shares: "", price: "", date: "" };
    let hasErrors = false;

    // Validate shares
    if (!shares.trim()) {
      errors.shares = "Shares is required";
      hasErrors = true;
    } else if (isNaN(parseFloat(shares)) || parseFloat(shares) <= 0) {
      errors.shares = "Shares must be a positive number";
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

    // Validate date
    if (!date) {
      errors.date = "Date is required";
      hasErrors = true;
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.date = "Please enter date in YYYY-MM-DD format";
      hasErrors = true;
    } else {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime()) || date !== dateObj.toISOString().split('T')[0]) {
        errors.date = "Please enter a valid date";
        hasErrors = true;
      }
    }

    setFieldErrors(errors);
    return !hasErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transaction || !isAuthenticated) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const updateRequest: UpdateTransactionRequest = {
        type,
        shares: parseFloat(shares),
        price: parseFloat(price),
        timestamp: date + "T12:00:00"
      };

      await updateTransaction(transaction.id, updateRequest);
      
      // Success - close modal and refresh data
      handleClose();
      onTransactionUpdated();
      
    } catch (error) {
      console.error('Failed to update transaction:', error);
      
      // Show user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('Authentication required')) {
          setError('Please sign in to edit transactions.');
        } else if (error.message.includes('Access denied')) {
          setError('Access denied. Please check your authentication.');
        } else if (error.message.includes('Transaction not found')) {
          setError('Transaction not found. It may have been deleted.');
        } else {
          setError(`Failed to update transaction: ${error.message}`);
        }
      } else {
        setError('Failed to update transaction. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    switch (field) {
      case 'shares':
        setShares(value);
        setFieldErrors(prev => ({ ...prev, shares: "" }));
        break;
      case 'price':
        setPrice(value);
        setFieldErrors(prev => ({ ...prev, price: "" }));
        break;
      case 'date':
        setDate(value);
        setFieldErrors(prev => ({ ...prev, date: "" }));
        break;
    }
    // Clear general error when user starts typing
    if (error) setError("");
  };

  if (!transaction) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>
            Update the details for {transaction.symbol} transaction from {new Date(transaction.date).toLocaleDateString()}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Transaction Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as "BUY" | "SELL")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BUY">BUY</SelectItem>
                <SelectItem value="SELL">SELL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Shares */}
          <div className="space-y-2">
            <Label htmlFor="shares">Shares</Label>
            <Input
              id="shares"
              type="number"
              step="0.01"
              placeholder="Number of shares"
              value={shares}
              onChange={(e) => handleFieldChange('shares', e.target.value)}
              className={fieldErrors.shares ? "border-red-500" : ""}
              disabled={isSubmitting}
            />
            {fieldErrors.shares && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span>{fieldErrors.shares}</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price per Share</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              placeholder="Price per share"
              value={price}
              onChange={(e) => handleFieldChange('price', e.target.value)}
              className={fieldErrors.price ? "border-red-500" : ""}
              disabled={isSubmitting}
            />
            {fieldErrors.price && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span>{fieldErrors.price}</span>
              </div>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Transaction Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => handleFieldChange('date', e.target.value)}
              className={fieldErrors.date ? "border-red-500" : ""}
              disabled={isSubmitting}
            />
            {fieldErrors.date && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span>{fieldErrors.date}</span>
              </div>
            )}
          </div>

          {/* General Error */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isAuthenticated}
              className="flex-1"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating...</span>
                </div>
              ) : (
                'Update Transaction'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}