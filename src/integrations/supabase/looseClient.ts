import { createClient } from '@supabase/supabase-js';

// Loose Supabase client that does not rely on Vite env variables.
// We hardcode the public URL and anon key for the current Lovable Cloud backend.
// These are public values and safe to expose in client-side code.

const SUPABASE_URL = 'https://ltsniuflqfahdcirrmjh.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0c25pdWZscWZhaGRjaXJybWpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NDQ4NTQsImV4cCI6MjA4MjMyMDg1NH0.ofwvsm9RpnEiP_r0NOIY-_0_MBNtieGqMzKSs7BoWI8';

export const supabase: any = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
