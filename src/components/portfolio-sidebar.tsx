"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Plus, FolderOpen, Folder } from "lucide-react";
import { UserProfileDropdown } from './user-profile-dropdown';
import { SettingsDropdown } from './settings-dropdown';
import { LoginModal } from './login-modal';
import { cn } from "@/lib/utils";
import { Portfolio } from "@/app/page";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

interface PortfolioSidebarProps {
  portfolios: Portfolio[];
  selectedPortfolio: Portfolio | null;
  onSelectPortfolio: (portfolio: Portfolio) => Promise<void>;
  onAddPortfolio: (name: string) => Promise<void>;
  onReorderPortfolios: (portfolios: Portfolio[]) => void;
  isAuthenticated?: boolean;
}

export function PortfolioSidebar({ portfolios, selectedPortfolio, onSelectPortfolio, onAddPortfolio, onReorderPortfolios, isAuthenticated = false }: PortfolioSidebarProps) {
  const [showNameInput, setShowNameInput] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [isCreatingPortfolio, setIsCreatingPortfolio] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );


  const getTotalValue = (portfolio: Portfolio) => {
    // Use cached value if available, otherwise calculate from current stock data
    return portfolio.cachedTotalValue !== undefined 
      ? portfolio.cachedTotalValue 
      : portfolio.stocks.reduce((sum, stock) => sum + (stock.shares * stock.currentPrice), 0);
  };

  const handleAddPortfolio = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setShowNameInput(true);
    setNewPortfolioName("");
  };

  const handleCreatePortfolio = async () => {
    if (isCreatingPortfolio) return; // Prevent double-click
    
    setIsCreatingPortfolio(true);
    try {
      await onAddPortfolio(newPortfolioName.trim());
      setShowNameInput(false);
      setNewPortfolioName("");
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Portfolio creation failed:', error);
    } finally {
      setIsCreatingPortfolio(false);
    }
  };

  const handleCancelCreate = () => {
    setShowNameInput(false);
    setNewPortfolioName("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreatePortfolio();
    } else if (e.key === 'Escape') {
      handleCancelCreate();
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = portfolios.findIndex((portfolio) => portfolio.id === active.id);
      const newIndex = portfolios.findIndex((portfolio) => portfolio.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedPortfolios = arrayMove(portfolios, oldIndex, newIndex);
        onReorderPortfolios(reorderedPortfolios);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Portfolios</h1>
          <div className="flex gap-1">
            <UserProfileDropdown />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleAddPortfolio}
              title="Add portfolio"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <SettingsDropdown />
          </div>
        </div>
        
      </div>

      {/* Portfolio List */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {/* New Portfolio Name Input */}
        {showNameInput && (
          <Card className="border-2 border-dashed border-primary">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <FolderOpen className="h-5 w-5 text-primary mt-0.5" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">New Portfolio</span>
                  </div>
                  
                  <Input
                    value={newPortfolioName}
                    onChange={(e) => setNewPortfolioName(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Enter portfolio name..."
                    className="mb-3"
                    autoFocus
                  />
                  
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleCreatePortfolio} disabled={isCreatingPortfolio}>
                      {isCreatingPortfolio ? 'Creating...' : 'Create'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelCreate} disabled={isCreatingPortfolio}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={portfolios.map(p => p.id)}
            strategy={verticalListSortingStrategy}
          >
            {portfolios.map((portfolio) => (
              <SortablePortfolioCard
                key={portfolio.id}
                portfolio={portfolio}
                isSelected={selectedPortfolio?.id === portfolio.id}
                totalValue={getTotalValue(portfolio)}
                onSelect={() => onSelectPortfolio(portfolio)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
      
      <LoginModal 
        open={showLoginModal} 
        onOpenChange={setShowLoginModal} 
      />
    </div>
  );
}

interface SortablePortfolioCardProps {
  portfolio: Portfolio;
  isSelected: boolean;
  totalValue: number;
  onSelect: () => void;
}

function SortablePortfolioCard({ portfolio, isSelected, totalValue, onSelect }: SortablePortfolioCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: portfolio.id,
    transition: {
      duration: 150,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = async (e: React.MouseEvent) => {
    // Only trigger selection if we're not in the middle of a drag operation
    if (!isDragging) {
      await onSelect();
    }
  };

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab active:cursor-grabbing transition-colors hover:bg-accent",
        isSelected && "ring-2 ring-primary bg-accent",
        isDragging && "opacity-50"
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {isSelected ? (
            <FolderOpen className="h-5 w-5 text-primary mt-0.5" />
          ) : (
            <Folder className="h-5 w-5 text-muted-foreground mt-0.5" />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm truncate">{portfolio.name}</h3>
              <span className="text-xs text-muted-foreground">
                {portfolio.stocks.length} stocks
              </span>
            </div>
            
            <div className="space-y-1">
              <div className="text-lg font-bold">
                ${totalValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}