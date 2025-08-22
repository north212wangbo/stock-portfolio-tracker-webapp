"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Portfolio, Transaction } from "@/app/page";
import { calculateRealPortfolioPerformance, PortfolioValuePoint } from "@/lib/portfolio-performance-service";

interface PortfolioPerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolio: Portfolio;
  transactions: Transaction[];
}



const SimpleLineChart = ({ data, period }: { data: PortfolioValuePoint[], period: string }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">No gain/loss data available for this period</p>
          <p className="text-xs mt-1">Historical prices may not be available for all symbols with transactions</p>
        </div>
      </div>
    );
  }
  
  // Calculate normalized values for chart display (subtract start value)
  const startValue = data[0].absoluteValue;
  const normalizedData = data.map(d => d.absoluteValue - startValue);
  
  const maxValue = Math.max(...normalizedData);
  const minValue = Math.min(...normalizedData);
  const valueRange = maxValue - minValue || 1;
  
  // Generate SVG path with actual temporal positions
  const width = 1000;
  const height = 420;
  const chartHeight = 420; // Reduced to make room for labels
  const padding = 60;
  
  // Calculate actual date range for temporal positioning
  const startDate = new Date(data[0].date).getTime();
  const endDate = new Date(data[data.length - 1].date).getTime();
  const dateRange = endDate - startDate || 1; // Avoid division by zero
  
  // Create points based on actual temporal positions
  const points = data.map((point, index) => {
    // X position based on actual date (temporal spacing)
    const pointDate = new Date(point.date).getTime();
    const dateProgress = (pointDate - startDate) / dateRange;
    const x = padding + dateProgress * (width - 2 * padding);
    // Y position based on normalized value
    const normalizedValue = point.absoluteValue - startValue;
    const y = (height - padding) - ((normalizedValue - minValue) / valueRange) * (chartHeight - 2 * padding);
    return `${x},${y}`;
  }).join(' ');
  
  const endValue = data[data.length - 1].absoluteValue - startValue;
  const isPositive = endValue >= 0;
  
  // Calculate date labels - use actual dates if fewer than 6, otherwise use calculated intervals
  const calculatedLabels = [];
  
  if (data.length > 0) {
    const startDate = new Date(data[0].date);
    const endDate = new Date(data[data.length - 1].date);
    
    if (data.length < 6) {
      // Use actual data points when we have fewer than 6 dates
      data.forEach(point => {
        const pointDate = new Date(point.date);
        const dateProgress = (pointDate.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime());
        
        calculatedLabels.push({
          date: point.date,
          displayDate: point.displayDate,
          x: padding + dateProgress * (width - 2 * padding)
        });
      });
    } else {
      // Use calculated intervals when we have 6 or more dates
      const numLabels = 6;
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const intervalDays = totalDays / (numLabels - 1);
      
      for (let i = 0; i < numLabels; i++) {
        const labelDate = new Date(startDate.getTime() + (i * intervalDays * 24 * 60 * 60 * 1000));
        const dateProgress = (labelDate.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime());
        
        calculatedLabels.push({
          date: labelDate.toISOString().split('T')[0],
          displayDate: labelDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            ...(period === '1Y' ? { year: '2-digit' } : {})
          }),
          x: padding + dateProgress * (width - 2 * padding)
        });
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <div className="text-center">
          <div className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <TrendingUp className="h-6 w-6 inline mr-2" /> : <TrendingDown className="h-6 w-6 inline mr-2" />}
            {endValue >= 0 ? '+' : ''}${endValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>
      
      <div className="relative">
        <svg width="100%" height="320" viewBox={`0 0 ${width} ${height}`} className="border rounded-lg bg-background">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 30" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          
          {/* Line chart */}
          <polyline
            fill="none"
            stroke={isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
            strokeWidth="2"
            points={points}
          />
          
          {/* Area fill */}
          <polygon
            fill={isPositive ? "url(#greenGradient)" : "url(#redGradient)"}
            points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
            opacity="0.1"
          />
          
          {/* Gradients */}
          <defs>
            <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="redGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(239, 68, 68)" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="rgb(239, 68, 68)" stopOpacity="0"/>
            </linearGradient>
          </defs>
          
          {/* Data points */}
          {data.map((point, index) => {
            if (index % Math.ceil(data.length / 10) === 0) { // Show every nth point
              // X position based on actual date (temporal spacing)
              const pointDate = new Date(point.date).getTime();
              const dateProgress = (pointDate - startDate) / dateRange;
              const x = padding + dateProgress * (width - 2 * padding);
              const normalizedValue = point.absoluteValue - startValue;
              const y = (height - padding) - ((normalizedValue - minValue) / valueRange) * (chartHeight - 2 * padding);
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="3"
                  fill={isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
                  className="hover:r-4 transition-all"
                >
                  <title>{`${point.displayDate}: ${normalizedValue >= 0 ? '+' : ''}$${normalizedValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}`}</title>
                </circle>
              );
            }
            return null;
          })}
          
          {/* Highest and lowest value markers */}
          {(() => {
            // Find highest and lowest points using absolute values
            const highestPoint = data.reduce((max, current) => current.absoluteValue > max.absoluteValue ? current : max);
            const lowestPoint = data.reduce((min, current) => current.absoluteValue < min.absoluteValue ? current : min);
            
            // Calculate positions for both points
            const markers = [
              { point: highestPoint, label: 'High', color: 'rgb(34, 197, 94)' },
              { point: lowestPoint, label: 'Low', color: 'rgb(239, 68, 68)' }
            ];
            
            return markers.map(({ point, label, color }, index) => {
              const pointDate = new Date(point.date).getTime();
              const dateProgress = (pointDate - startDate) / dateRange;
              const x = padding + dateProgress * (width - 2 * padding);
              const normalizedValue = point.absoluteValue - startValue;
              const y = (height - padding) - ((normalizedValue - minValue) / valueRange) * (chartHeight - 2 * padding);
              
              // Determine label position (above for high, below for low with more space)
              const labelY = label === 'High' ? y - 25 : y + 35;
              const labelAnchor = 'middle';
              
              return (
                <g key={`${label}-${index}`}>
                  {/* Marker circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r="5"
                    fill={color}
                    stroke="white"
                    strokeWidth="2"
                  />
                  {/* Value label */}
                  <text
                    x={x}
                    y={labelY}
                    textAnchor={labelAnchor}
                    className="text-3xl fill-current font-semibold"
                    style={{ fill: color }}
                  >
                    {point.absoluteValue >= 0 ? '+' : ''}${point.absoluteValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </text>
                </g>
              );
            });
          })()}
          
          {/* X-axis date labels */}
          {calculatedLabels.map((label, index) => {
            return (
              <g key={index}>
                <text
                  x={label.x}
                  y={height - padding + 70}
                  textAnchor="middle"
                  className="text-2xl fill-muted-foreground font-semibold"
                >
                  {label.displayDate}
                </text>
                <line
                  x1={label.x}
                  y1={height - padding}
                  x2={label.x}
                  y2={height - padding + 5}
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="1"
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export function PortfolioPerformanceModal({ isOpen, onClose, portfolio, transactions }: PortfolioPerformanceModalProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'1M' | 'YTD' | '1Y'>('1M');
  const [performanceData, setPerformanceData] = useState<{
    '1M': PortfolioValuePoint[] | null;
    'YTD': PortfolioValuePoint[] | null;
    '1Y': PortfolioValuePoint[] | null;
  }>({
    '1M': null,
    'YTD': null,
    '1Y': null
  });
  const [loadingStates, setLoadingStates] = useState<{
    '1M': boolean;
    'YTD': boolean;
    '1Y': boolean;
  }>({
    '1M': false,
    'YTD': false,
    '1Y': false
  });
  const [errorStates, setErrorStates] = useState<{
    '1M': string | null;
    'YTD': string | null;
    '1Y': string | null;
  }>({
    '1M': null,
    'YTD': null,
    '1Y': null
  });
  
  // Load performance data for a specific period
  const loadPeriodData = async (period: '1M' | 'YTD' | '1Y') => {
    // Skip if already loaded or currently loading
    if (performanceData[period] !== null || loadingStates[period] || transactions.length === 0) {
      return;
    }
    
    setLoadingStates(prev => ({ ...prev, [period]: true }));
    setErrorStates(prev => ({ ...prev, [period]: null }));
    
    try {
      console.log(`Loading real historical performance data for ${period}...`);
      
      const periodData = await calculateRealPortfolioPerformance(transactions, period);
      
      setPerformanceData(prev => ({
        ...prev,
        [period]: periodData
      }));
      
      console.log(`Historical performance data for ${period} loaded successfully`);
      
    } catch (error) {
      console.error(`Failed to load historical performance data for ${period}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrorStates(prev => ({ 
        ...prev, 
        [period]: `Failed to load performance data: ${errorMessage}` 
      }));
      
      // Set empty array so we don't try to load again
      setPerformanceData(prev => ({
        ...prev,
        [period]: []
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [period]: false }));
    }
  };
  
  // Load data for the selected period when modal opens or period changes
  React.useEffect(() => {
    if (isOpen) {
      loadPeriodData(selectedPeriod);
    }
  }, [isOpen, selectedPeriod]);
  
  // Reset cached data when modal is closed to ensure fresh data on reopen
  React.useEffect(() => {
    if (!isOpen) {
      setPerformanceData({
        '1M': null,
        'YTD': null,
        '1Y': null
      });
      setLoadingStates({
        '1M': false,
        'YTD': false,
        '1Y': false
      });
      setErrorStates({
        '1M': null,
        'YTD': null,
        '1Y': null
      });
    }
  }, [isOpen]);
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    const newPeriod = value as '1M' | 'YTD' | '1Y';
    setSelectedPeriod(newPeriod);
    // Data will be loaded by the useEffect above
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {portfolio.name} Performance
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Tabs value={selectedPeriod} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="1M">1 Month</TabsTrigger>
              <TabsTrigger value="YTD">Year to Date</TabsTrigger>
              <TabsTrigger value="1Y">1 Year</TabsTrigger>
            </TabsList>
            
            <TabsContent value="1M" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>1 Month Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingStates['1M'] ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-sm text-muted-foreground">Loading 1 month performance data...</p>
                        <p className="text-xs text-muted-foreground mt-1">Fetching historical prices</p>
                      </div>
                    </div>
                  ) : errorStates['1M'] ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center text-red-600">
                        <p className="text-sm font-medium">Error Loading Data</p>
                        <p className="text-xs mt-1 text-muted-foreground">{errorStates['1M']}</p>
                      </div>
                    </div>
                  ) : (
                    <SimpleLineChart data={performanceData['1M'] || []} period="1M" />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="YTD" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Year to Date Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingStates['YTD'] ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-sm text-muted-foreground">Loading year-to-date performance data...</p>
                        <p className="text-xs text-muted-foreground mt-1">Fetching historical prices</p>
                      </div>
                    </div>
                  ) : errorStates['YTD'] ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center text-red-600">
                        <p className="text-sm font-medium">Error Loading Data</p>
                        <p className="text-xs mt-1 text-muted-foreground">{errorStates['YTD']}</p>
                      </div>
                    </div>
                  ) : (
                    <SimpleLineChart data={performanceData['YTD'] || []} period="YTD" />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="1Y" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>1 Year Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingStates['1Y'] ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-sm text-muted-foreground">Loading 1 year performance data...</p>
                        <p className="text-xs text-muted-foreground mt-1">Fetching historical prices</p>
                      </div>
                    </div>
                  ) : errorStates['1Y'] ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center text-red-600">
                        <p className="text-sm font-medium">Error Loading Data</p>
                        <p className="text-xs mt-1 text-muted-foreground">{errorStates['1Y']}</p>
                      </div>
                    </div>
                  ) : (
                    <SimpleLineChart data={performanceData['1Y'] || []} period="1Y" />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}