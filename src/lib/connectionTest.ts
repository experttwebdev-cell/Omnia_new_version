import { supabase } from './supabase';

export interface ConnectionTestResult {
  success: boolean;
  stage: string;
  message: string;
  details?: any;
}

export async function testSupabaseConnection(): Promise<ConnectionTestResult[]> {
  const results: ConnectionTestResult[] = [];

  // Test 1: Check environment variables
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
      results.push({
        success: false,
        stage: 'Environment Variables',
        message: 'VITE_SUPABASE_URL is not configured properly',
        details: { url: supabaseUrl }
      });
      return results;
    }

    if (!supabaseKey || supabaseKey === 'placeholder-key') {
      results.push({
        success: false,
        stage: 'Environment Variables',
        message: 'VITE_SUPABASE_ANON_KEY is not configured properly',
        details: { keyLength: supabaseKey?.length }
      });
      return results;
    }

    results.push({
      success: true,
      stage: 'Environment Variables',
      message: 'Environment variables are configured',
      details: {
        url: supabaseUrl,
        keyLength: supabaseKey.length
      }
    });
  } catch (error) {
    results.push({
      success: false,
      stage: 'Environment Variables',
      message: 'Error reading environment variables',
      details: error
    });
    return results;
  }

  // Test 2: Check Supabase client initialization
  try {
    if (!supabase) {
      results.push({
        success: false,
        stage: 'Client Initialization',
        message: 'Supabase client is not initialized'
      });
      return results;
    }

    results.push({
      success: true,
      stage: 'Client Initialization',
      message: 'Supabase client is initialized'
    });
  } catch (error) {
    results.push({
      success: false,
      stage: 'Client Initialization',
      message: 'Error with Supabase client',
      details: error
    });
    return results;
  }

  // Test 3: Test database connection with a simple query
  try {
    const { data, error } = await supabase
      .from('shopify_products')
      .select('count', { count: 'exact', head: true });

    if (error) {
      results.push({
        success: false,
        stage: 'Database Query',
        message: `Database query failed: ${error.message}`,
        details: error
      });
      return results;
    }

    results.push({
      success: true,
      stage: 'Database Query',
      message: 'Successfully connected to database',
      details: { count: data }
    });
  } catch (error) {
    results.push({
      success: false,
      stage: 'Database Query',
      message: 'Network or query error',
      details: error
    });
    return results;
  }

  // Test 4: Test fetching actual data
  try {
    const { data, error } = await supabase
      .from('shopify_products')
      .select('id, title')
      .limit(1)
      .maybeSingle();

    if (error) {
      results.push({
        success: false,
        stage: 'Data Fetch',
        message: `Failed to fetch product data: ${error.message}`,
        details: error
      });
      return results;
    }

    results.push({
      success: true,
      stage: 'Data Fetch',
      message: data ? 'Successfully fetched product data' : 'No products found in database',
      details: { hasData: !!data }
    });
  } catch (error) {
    results.push({
      success: false,
      stage: 'Data Fetch',
      message: 'Error fetching product data',
      details: error
    });
    return results;
  }

  return results;
}

export function getConnectionErrorMessage(results: ConnectionTestResult[]): string {
  const failedTest = results.find(r => !r.success);

  if (!failedTest) {
    return 'All connection tests passed successfully';
  }

  switch (failedTest.stage) {
    case 'Environment Variables':
      return 'Configuration Error: Supabase credentials are missing or invalid. Please check your .env file.';
    case 'Client Initialization':
      return 'Initialization Error: Failed to create Supabase client. Check your configuration.';
    case 'Database Query':
      return `Database Error: ${failedTest.message}. Check if your Supabase project is active.`;
    case 'Data Fetch':
      return `Data Error: ${failedTest.message}`;
    default:
      return `Connection Error: ${failedTest.message}`;
  }
}
