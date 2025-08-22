"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";

export function SettingsDropdown() {
  const { theme, setTheme } = useTheme();

  const getThemeIcon = (themeOption: string) => {
    switch (themeOption) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'system':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getThemeLabel = (themeOption: string) => {
    switch (themeOption) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'System';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Theme
        </DropdownMenuLabel>
        
        {(['light', 'dark', 'system'] as const).map((themeOption) => (
          <DropdownMenuItem
            key={themeOption}
            onClick={() => setTheme(themeOption)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="flex items-center gap-2 flex-1">
              {getThemeIcon(themeOption)}
              {getThemeLabel(themeOption)}
            </div>
            {theme === themeOption && (
              <div className="h-2 w-2 bg-primary rounded-full" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}