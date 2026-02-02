-- Add missing columns to user_encryption_keys if needed
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_encryption_keys' 
        AND column_name = 'key_type'
    ) THEN
        ALTER TABLE public.user_encryption_keys ADD COLUMN key_type TEXT NOT NULL DEFAULT 'identity';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_encryption_keys' 
        AND column_name = 'revoked_at'
    ) THEN
        ALTER TABLE public.user_encryption_keys ADD COLUMN revoked_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create index for fast active key lookups if not exists
CREATE INDEX IF NOT EXISTS idx_user_encryption_keys_active ON public.user_encryption_keys(user_id, is_active) WHERE is_active = true;

-- Create group_encryption_keys table if not exists
CREATE TABLE IF NOT EXISTS public.group_encryption_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
    member_id UUID NOT NULL,
    encrypted_key TEXT NOT NULL,
    key_version INTEGER NOT NULL DEFAULT 1,
    sender_public_key TEXT,
    nonce TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (group_id, member_id, key_version)
);

-- Create indexes for group encryption keys
CREATE INDEX IF NOT EXISTS idx_group_encryption_keys_group ON public.group_encryption_keys(group_id);
CREATE INDEX IF NOT EXISTS idx_group_encryption_keys_member ON public.group_encryption_keys(member_id);

-- Enable RLS on group_encryption_keys
ALTER TABLE public.group_encryption_keys ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to avoid conflicts
DROP POLICY IF EXISTS "Members can read their own group keys" ON public.group_encryption_keys;
DROP POLICY IF EXISTS "Group admins can insert group keys" ON public.group_encryption_keys;
DROP POLICY IF EXISTS "Group admins can update group keys" ON public.group_encryption_keys;

CREATE POLICY "Members can read their own group keys"
ON public.group_encryption_keys
FOR SELECT
TO authenticated
USING (auth.uid() = member_id);

CREATE POLICY "Group admins can insert group keys"
ON public.group_encryption_keys
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.chat_group_members
        WHERE chat_group_members.group_id = group_encryption_keys.group_id
        AND chat_group_members.user_id = auth.uid()
        AND chat_group_members.role IN ('owner', 'admin')
    )
);

CREATE POLICY "Group admins can update group keys"
ON public.group_encryption_keys
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.chat_group_members
        WHERE chat_group_members.group_id = group_encryption_keys.group_id
        AND chat_group_members.user_id = auth.uid()
        AND chat_group_members.role IN ('owner', 'admin')
    )
);

-- Add encryption columns to messages table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'messages' 
        AND column_name = 'encryption_metadata'
    ) THEN
        ALTER TABLE public.messages ADD COLUMN encryption_metadata JSONB;
    END IF;
END $$;

-- Add sender_key_id to channel_messages for key rotation support
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'channel_messages' 
        AND column_name = 'sender_key_id'
    ) THEN
        ALTER TABLE public.channel_messages ADD COLUMN sender_key_id TEXT;
    END IF;
END $$;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_group_encryption_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger
DROP TRIGGER IF EXISTS update_group_encryption_keys_updated_at ON public.group_encryption_keys;
CREATE TRIGGER update_group_encryption_keys_updated_at
BEFORE UPDATE ON public.group_encryption_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_group_encryption_keys_updated_at();