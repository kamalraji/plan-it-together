-- Create thread_notifications table for tracking unread thread replies
CREATE TABLE public.thread_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  thread_id UUID NOT NULL REFERENCES public.channel_messages(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES public.workspace_channels(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER NOT NULL DEFAULT 0,
  is_subscribed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, thread_id)
);

-- Add index for fast lookups by user
CREATE INDEX idx_thread_notifications_user_id ON public.thread_notifications(user_id);
CREATE INDEX idx_thread_notifications_workspace_id ON public.thread_notifications(workspace_id);
CREATE INDEX idx_thread_notifications_unread ON public.thread_notifications(user_id, unread_count) WHERE unread_count > 0;

-- Enable Row Level Security
ALTER TABLE public.thread_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own thread notifications
CREATE POLICY "Users can view their own thread notifications"
ON public.thread_notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own thread notifications
CREATE POLICY "Users can create their own thread notifications"
ON public.thread_notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own thread notifications
CREATE POLICY "Users can update their own thread notifications"
ON public.thread_notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own thread notifications
CREATE POLICY "Users can delete their own thread notifications"
ON public.thread_notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to automatically update thread notifications when a reply is added
CREATE OR REPLACE FUNCTION public.update_thread_notification_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process thread replies (messages with parent_message_id)
  IF NEW.parent_message_id IS NOT NULL THEN
    -- Update unread count for all subscribers except the sender
    UPDATE public.thread_notifications
    SET 
      unread_count = unread_count + 1,
      updated_at = now()
    WHERE 
      thread_id = NEW.parent_message_id
      AND user_id != NEW.sender_id
      AND is_subscribed = true;
    
    -- Auto-subscribe the sender if not already subscribed
    INSERT INTO public.thread_notifications (user_id, thread_id, channel_id, workspace_id, last_read_at, unread_count)
    SELECT 
      NEW.sender_id,
      NEW.parent_message_id,
      NEW.channel_id,
      wc.workspace_id,
      now(),
      0
    FROM public.workspace_channels wc
    WHERE wc.id = NEW.channel_id
    ON CONFLICT (user_id, thread_id) 
    DO UPDATE SET last_read_at = now(), unread_count = 0, updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic notification updates
CREATE TRIGGER on_thread_reply_notification
AFTER INSERT ON public.channel_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_thread_notification_count();

-- Create function to subscribe user to thread when they first reply
CREATE OR REPLACE FUNCTION public.subscribe_to_thread(
  p_thread_id UUID,
  p_channel_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_id UUID;
BEGIN
  -- Get workspace_id from channel
  SELECT workspace_id INTO v_workspace_id
  FROM public.workspace_channels
  WHERE id = p_channel_id;
  
  -- Insert or update subscription
  INSERT INTO public.thread_notifications (user_id, thread_id, channel_id, workspace_id, last_read_at)
  VALUES (auth.uid(), p_thread_id, p_channel_id, v_workspace_id, now())
  ON CONFLICT (user_id, thread_id) 
  DO UPDATE SET is_subscribed = true, updated_at = now();
END;
$$;

-- Create function to mark thread as read
CREATE OR REPLACE FUNCTION public.mark_thread_read(p_thread_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.thread_notifications
  SET 
    last_read_at = now(),
    unread_count = 0,
    updated_at = now()
  WHERE 
    user_id = auth.uid()
    AND thread_id = p_thread_id;
END;
$$;