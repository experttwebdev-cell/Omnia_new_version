import { useState } from 'react';
import { testSupabaseConnection, type ConnectionTestResult } from '../lib/connectionTest';
import { CheckCircle, XCircle, Loader2, Activity } from 'lucide-react';

interface ConnectionDiagnosticsProps {
  onClose: () => void;
}

export function ConnectionDiagnostics({ onClose }: ConnectionDiagnosticsProps) {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<ConnectionTestResult[]>([]);

  const runTests = async () => {
    setTesting(true);
    setResults([]);

    try {
      const testResults = await testSupabaseConnection();
      setResults(testResults);
    } catch (error) {
      console.error('Error running connection tests:', error);
      setResults([{
        success: false,
        stage: 'Test Runner',
        message: 'Failed to run connection tests',
        details: error
      }]);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Connection Diagnostics</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              This tool will test your Supabase connection and help identify any configuration issues.
            </p>
            <button
              onClick={runTests}
              disabled={testing}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
            >
              {testing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Activity className="w-5 h-5" />
                  Run Connection Tests
                </>
              )}
            </button>
          </div>

          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Test Results</h3>
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    result.success
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.success ? (
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{result.stage}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            result.success
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {result.success ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                      <p className={result.success ? 'text-green-700' : 'text-red-700'}>
                        {result.message}
                      </p>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                            View Details
                          </summary>
                          <pre className="mt-2 p-3 bg-white bg-opacity-50 rounded text-xs overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {results.some(r => !r.success) && (
                <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-2">Troubleshooting Steps:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                    <li>Check that your .env file contains valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY</li>
                    <li>Verify your Supabase project is active and not paused</li>
                    <li>Ensure your browser can reach the Supabase URL (check network/firewall)</li>
                    <li>Try refreshing the page to reload configuration</li>
                    <li>Check the browser console for additional error messages</li>
                  </ul>
                </div>
              )}

              {results.every(r => r.success) && (
                <div className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">
                    All connection tests passed! Your Supabase connection is working correctly.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
