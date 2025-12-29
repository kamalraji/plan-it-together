-- Enable pgcrypto extension required for Supabase auth (gen_random_bytes)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";