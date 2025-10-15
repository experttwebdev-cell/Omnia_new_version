import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface CacheContextType {
  getCache: <T>(key: string) => T | null;
  setCache: <T>(key: string, data: T, ttl?: number) => void;
  clearCache: (key?: string) => void;
  isCached: (key: string) => boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

export function CacheProvider({ children }: { children: ReactNode }) {
  const [cache, setCache] = useState<Map<string, CacheEntry<any>>>(new Map());

  const getCache = useCallback(<T,>(key: string): T | null => {
    const entry = cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      setCache((prev) => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
      return null;
    }

    return entry.data as T;
  }, [cache]);

  const setCacheValue = useCallback(<T,>(key: string, data: T, ttl: number = 5 * 60 * 1000) => {
    setCache((prev) => {
      const newCache = new Map(prev);
      newCache.set(key, {
        data,
        timestamp: Date.now(),
        ttl,
      });
      return newCache;
    });
  }, []);

  const clearCache = useCallback((key?: string) => {
    if (key) {
      setCache((prev) => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
    } else {
      setCache(new Map());
    }
  }, []);

  const isCached = useCallback((key: string): boolean => {
    const entry = cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    return now - entry.timestamp <= entry.ttl;
  }, [cache]);

  return (
    <CacheContext.Provider value={{ getCache, setCache: setCacheValue, clearCache, isCached }}>
      {children}
    </CacheContext.Provider>
  );
}

export function useCache() {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
}
