import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { supabase, getEnvVar } from '../lib/supabase';

interface CacheRefreshButtonProps {
  onRefreshComplete?: () => void;
  cacheName?: 'optimization' | 'alt_image' | 'tags' | 'opportunities' | 'stats' | 'all';
  variant?: 'button' | 'icon';
}

export function CacheRefreshButton({
  onRefreshComplete,
  cacheName = 'all',
  variant = 'button'
}: CacheRefreshButtonProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);

    try {
      if (cacheName === 'all') {
        const apiUrl = `${getEnvVar('VITE_SUPABASE_URL')}/functions/v1/refresh-dashboard-cache`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getEnvVar('VITE_SUPABASE_ANON_KEY')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to refresh cache');
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Cache refresh failed');
        }
      } else {
        const { data, error: rpcError } = await supabase.rpc('refresh_seo_cache' as any, {
          cache_name: cacheName
        } as any);

        if (rpcError) throw rpcError;
        console.log('Cache refreshed:', data);
      }

      setLastRefresh(new Date());
      onRefreshComplete?.();
    } catch (err) {
      console.error('Error refreshing cache:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh cache');
    } finally {
      setRefreshing(false);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
        title={`Refresh ${cacheName} cache`}
      >
        <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition"
        title={`Refresh ${cacheName === 'all' ? 'all' : cacheName} cache`}
      >
        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        {refreshing ? 'Refreshing...' : 'Refresh Cache'}
      </button>

      {lastRefresh && !error && (
        <span className="text-sm text-gray-600">
          Last refreshed: {lastRefresh.toLocaleTimeString()}
        </span>
      )}

      {error && (
        <span className="text-sm text-red-600">
          {error}
        </span>
      )}
    </div>
  );
}
