-- Add new chat notification preference columns to notification_preferences table
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS chat_mute_until TEXT,
ADD COLUMN IF NOT EXISTS custom_sound_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_sound_name TEXT;

-- Add new chat security columns to chat_security_settings table
ALTER TABLE chat_security_settings
ADD COLUMN IF NOT EXISTS hide_typing_indicator BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hide_read_receipts BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS screenshot_notify BOOLEAN DEFAULT false;