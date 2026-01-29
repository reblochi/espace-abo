// Composant Tabs

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabs() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
}

interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

function Tabs({ defaultValue, value, onValueChange, children, className }: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const currentValue = value ?? internalValue;

  const handleValueChange = React.useCallback((newValue: string) => {
    setInternalValue(newValue);
    onValueChange?.(newValue);
  }, [onValueChange]);

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1',
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

function TabsTrigger({ value, children, className, disabled }: TabsTriggerProps) {
  const { value: selectedValue, onValueChange } = useTabs();
  const isSelected = selectedValue === value;

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isSelected}
      disabled={disabled}
      onClick={() => onValueChange(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5',
        'text-sm font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        'disabled:pointer-events-none disabled:opacity-50',
        isSelected
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-600 hover:text-gray-900',
        className
      )}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

function TabsContent({ value, children, className }: TabsContentProps) {
  const { value: selectedValue } = useTabs();

  if (selectedValue !== value) return null;

  return (
    <div
      role="tabpanel"
      className={cn('mt-2 focus-visible:outline-none', className)}
    >
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
