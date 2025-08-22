"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Star, StarOff } from "lucide-react";

const mockStockData = {
  symbol: "AAPL",
  name: "Apple Inc.",
  price: 175.30,
  change: 2.85,
  changePercent: 1.65,
  volume: "48.2M",
  marketCap: "2.73T",
  peRatio: 28.45,
  dayHigh: 176.50,
  dayLow: 172.80,
  yearHigh: 199.62,
  yearLow: 124.17,
  avgVolume: "58.4M",
  beta: 1.24,
  eps: 6.16,
  dividend: 0.96,
  about: "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. The company serves consumers, and small and mid-sized businesses; and the education, enterprise, and government markets."
};

const mockNews = [
  { title: "Apple Reports Strong Q4 Earnings", time: "2 hours ago", source: "Reuters" },
  { title: "iPhone 15 Sales Exceed Expectations", time: "4 hours ago", source: "Bloomberg" },
  { title: "Apple Increases Dividend by 4%", time: "1 day ago", source: "CNBC" },
];

export function StockDetails() {
  const [isWatching, setIsWatching] = useState(false);
  const isPositive = mockStockData.change >= 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{mockStockData.symbol}</h1>
              <Badge variant="secondary">{mockStockData.name}</Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsWatching(!isWatching)}
              >
                {isWatching ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold">${mockStockData.price.toFixed(2)}</div>
          <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            <span className="font-semibold">
              {isPositive ? '+' : ''}${mockStockData.change.toFixed(2)} ({isPositive ? '+' : ''}{mockStockData.changePercent.toFixed(2)}%)
            </span>
          </div>
          <div className="text-sm text-muted-foreground">Today</div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Tabs defaultValue="chart" className="h-full">
          <TabsList className="mx-6 mt-4">
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="p-6 space-y-6">
            {/* Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Price Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-muted-foreground">Chart visualization would go here</div>
                    <div className="text-sm text-muted-foreground mt-2">
                      Integrate with Chart.js or similar library
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Day High</div>
                  <div className="font-semibold">${mockStockData.dayHigh}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Day Low</div>
                  <div className="font-semibold">${mockStockData.dayLow}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Volume</div>
                  <div className="font-semibold">{mockStockData.volume}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Market Cap</div>
                  <div className="font-semibold">${mockStockData.marketCap}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Key Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">P/E Ratio</span>
                    <span className="font-semibold">{mockStockData.peRatio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">EPS</span>
                    <span className="font-semibold">${mockStockData.eps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Beta</span>
                    <span className="font-semibold">{mockStockData.beta}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dividend</span>
                    <span className="font-semibold">${mockStockData.dividend}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Price Range</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">52W High</span>
                    <span className="font-semibold">${mockStockData.yearHigh}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">52W Low</span>
                    <span className="font-semibold">${mockStockData.yearLow}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Volume</span>
                    <span className="font-semibold">{mockStockData.avgVolume}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="news" className="p-6">
            <div className="space-y-4">
              {mockNews.map((article, index) => (
                <Card key={index} className="cursor-pointer hover:bg-accent transition-colors">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">{article.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{article.source}</span>
                      <span>•</span>
                      <span>{article.time}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="about" className="p-6">
            <Card>
              <CardHeader>
                <CardTitle>About {mockStockData.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {mockStockData.about}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}