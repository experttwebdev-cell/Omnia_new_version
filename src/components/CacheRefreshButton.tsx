import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { getEnvVar } from '../lib/supabase';

interface CacheRefreshButtonProps {
  onRefreshComplete?: () => void;
}

export function CacheRefreshButton({ onRefreshComplete }: CacheRefreshButtonProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);

    try {
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

      if (result.success) {
        setLastRefresh(new Date());
        onRefreshComplete?.();
      } else {
        throw new Error(result.error || 'Cache refresh failed');
      }
    } catch (err) {
      console.error('Error refreshing cache:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh cache');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition"
        title="Refresh all dashboard caches"
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
