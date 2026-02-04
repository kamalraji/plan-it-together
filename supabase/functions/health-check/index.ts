/**
 * Health Check Edge Function
 * Production monitoring endpoint for system health
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: CheckResult;
    auth: CheckResult;
    storage: CheckResult;
  };
  uptime: number;
}

interface CheckResult {
  status: 'pass' | 'fail' | 'warn';
  latencyMs: number;
  message?: string;
}

const startTime = Date.now();

async function checkDatabase(supabase: any): Promise<CheckResult> {
  const start = Date.now();
  try {
    const { error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    const latencyMs = Date.now() - start;
    
    if (error) {
      return {
        status: latencyMs > 1000 ? 'fail' : 'warn',
        latencyMs,
        message: error.message,
      };
    }
    
    return {
      status: latencyMs > 500 ? 'warn' : 'pass',
      latencyMs,
    };
  } catch (err) {
    return {
      status: 'fail',
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

async function checkAuth(supabase: any): Promise<CheckResult> {
  const start = Date.now();
  try {
    // Simple auth service check - getting session doesn't require auth
    const { error } = await supabase.auth.getSession();
    const latencyMs = Date.now() - start;
    
    if (error) {
      return {
        status: 'warn',
        latencyMs,
        message: error.message,
      };
    }
    
    return {
      status: latencyMs > 500 ? 'warn' : 'pass',
      latencyMs,
    };
  } catch (err) {
    return {
      status: 'fail',
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

async function checkStorage(supabase: any): Promise<CheckResult> {
  const start = Date.now();
  try {
    const { error } = await supabase.storage.listBuckets();
    const latencyMs = Date.now() - start;
    
    if (error) {
      return {
        status: 'warn',
        latencyMs,
        message: error.message,
      };
    }
    
    return {
      status: latencyMs > 500 ? 'warn' : 'pass',
      latencyMs,
    };
  } catch (err) {
    return {
      status: 'fail',
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

function determineOverallStatus(checks: HealthStatus['checks']): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = Object.values(checks).map(c => c.status);
  
  if (statuses.some(s => s === 'fail')) {
    return 'unhealthy';
  }
  if (statuses.some(s => s === 'warn')) {
    return 'degraded';
  }
  return 'healthy';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Run all checks in parallel
    const [database, auth, storage] = await Promise.all([
      checkDatabase(supabase),
      checkAuth(supabase),
      checkStorage(supabase),
    ]);

    const checks = { database, auth, storage };
    const status = determineOverallStatus(checks);
    
    const healthStatus: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      version: Deno.env.get('FUNCTION_VERSION') || '1.0.0',
      checks,
      uptime: Math.floor((Date.now() - startTime) / 1000),
    };

    // Return appropriate HTTP status based on health
    const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;

    return new Response(JSON.stringify(healthStatus, null, 2), {
      status: httpStatus,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: errorMessage,
      }),
      {
        status: 503,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
