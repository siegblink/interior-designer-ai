"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { HistoryItem } from '../components/History';

const STORAGE_KEY = 'interior_designer_history';
const MAX_HISTORY_ITEMS = 10; // Limit the number of items we store
const MAX_STORAGE_SIZE_MB = 4; // Maximum storage size in MB

interface HistoryContextType {
  historyItems: HistoryItem[];
  addHistoryItem: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  storageError: string | null;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      const savedHistory = localStorage.getItem(STORAGE_KEY);
      if (savedHistory) {
        try {
          const parsedHistory = JSON.parse(savedHistory);
          setHistoryItems(parsedHistory);
        } catch (error) {
          console.error('Error loading history:', error);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      try {
        const historyString = JSON.stringify(historyItems);
        const sizeInMB = new Blob([historyString]).size / (1024 * 1024);
        
        if (sizeInMB > MAX_STORAGE_SIZE_MB) {
          // If size exceeds limit, remove oldest items until under limit
          const newHistory = [...historyItems];
          while (new Blob([JSON.stringify(newHistory)]).size / (1024 * 1024) > MAX_STORAGE_SIZE_MB && newHistory.length > 0) {
            newHistory.pop(); // Remove oldest item
          }
          setHistoryItems(newHistory);
          setStorageError('Some older history items were removed due to storage limits');
          return;
        }

        localStorage.setItem(STORAGE_KEY, historyString);
        setStorageError(null);
      } catch (error) {
        console.error('Error saving history:', error);
        setStorageError('Unable to save history due to storage limits');
        
        // Try to save a reduced history
        const reducedHistory = historyItems.slice(0, Math.max(1, historyItems.length - 1));
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedHistory));
          setHistoryItems(reducedHistory);
        } catch (e) {
          // If still failing, clear history
          console.error('Failed to save reduced history:', e);
          clearHistory();
        }
      }
    }
  }, [historyItems, isInitialized]);

  const addHistoryItem = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };
    setHistoryItems(prev => [newItem, ...prev]);
  };

  const clearHistory = () => {
    setHistoryItems([]);
    setStorageError(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <HistoryContext.Provider value={{ historyItems, addHistoryItem, clearHistory, storageError }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
} 