-- Function to auto-promote next waitlist entry when a spot opens
CREATE OR REPLACE FUNCTION public.auto_promote_from_waitlist()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_next_entry RECORD;
  v_new_registration_id UUID;
  v_spots_freed INTEGER := 1;
BEGIN
  -- Only trigger on cancellation (status change to CANCELLED or REFUNDED)
  IF TG_OP = 'UPDATE' AND NEW.status IN ('CANCELLED', 'REFUNDED') AND OLD.status NOT IN ('CANCELLED', 'REFUNDED') THEN
    -- Get quantity freed (default to 1)
    v_spots_freed := COALESCE(OLD.quantity, 1);
    
    -- Find next waiting entry for this ticket tier, ordered by priority then position
    FOR v_next_entry IN
      SELECT id, event_id, ticket_tier_id, full_name, email, phone
      FROM public.event_waitlist
      WHERE event_id = OLD.event_id
        AND (ticket_tier_id = OLD.ticket_tier_id OR ticket_tier_id IS NULL)
        AND status = 'waiting'
      ORDER BY 
        CASE priority 
          WHEN 'vip' THEN 1 
          WHEN 'high' THEN 2 
          ELSE 3 
        END,
        position
      LIMIT v_spots_freed
    LOOP
      -- Create a new registration for the promoted person
      INSERT INTO public.registrations (
        event_id,
        user_id,
        ticket_tier_id,
        status,
        quantity,
        form_responses
      ) VALUES (
        v_next_entry.event_id,
        auth.uid(), -- Will be null for system-triggered, that's ok
        v_next_entry.ticket_tier_id,
        'CONFIRMED',
        1,
        jsonb_build_object(
          'auto_promoted_from_waitlist', true,
          'waitlist_entry_id', v_next_entry.id,
          'promoted_at', NOW()
        )
      )
      RETURNING id INTO v_new_registration_id;
      
      -- Create attendee record
      INSERT INTO public.registration_attendees (
        registration_id,
        full_name,
        email,
        phone,
        ticket_tier_id,
        is_primary
      ) VALUES (
        v_new_registration_id,
        v_next_entry.full_name,
        v_next_entry.email,
        v_next_entry.phone,
        v_next_entry.ticket_tier_id,
        true
      );
      
      -- Update waitlist entry status
      UPDATE public.event_waitlist
      SET 
        status = 'promoted',
        promoted_at = NOW(),
        registration_id = v_new_registration_id,
        updated_at = NOW()
      WHERE id = v_next_entry.id;
      
      -- Create notification for the promoted user (if they have a user account)
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        category,
        action_url,
        metadata
      )
      SELECT 
        up.id,
        'WAITLIST_PROMOTED',
        'You''ve been promoted from the waitlist!',
        'Great news! A spot opened up and you''ve been automatically registered for the event.',
        'event',
        '/registrations/' || v_new_registration_id,
        jsonb_build_object(
          'event_id', v_next_entry.event_id,
          'registration_id', v_new_registration_id,
          'ticket_tier_id', v_next_entry.ticket_tier_id
        )
      FROM public.user_profiles up
      WHERE up.email = v_next_entry.email
      LIMIT 1;
    END LOOP;
    
    -- Reorder remaining waitlist positions
    WITH ranked AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY 
        CASE priority WHEN 'vip' THEN 1 WHEN 'high' THEN 2 ELSE 3 END,
        position
      ) as new_position
      FROM public.event_waitlist
      WHERE event_id = OLD.event_id
        AND status = 'waiting'
    )
    UPDATE public.event_waitlist ew
    SET position = ranked.new_position, updated_at = NOW()
    FROM ranked
    WHERE ew.id = ranked.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on registrations table
DROP TRIGGER IF EXISTS trigger_auto_promote_waitlist ON public.registrations;
CREATE TRIGGER trigger_auto_promote_waitlist
  AFTER UPDATE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_promote_from_waitlist();

-- Also handle when registration is deleted entirely
CREATE OR REPLACE FUNCTION public.auto_promote_on_registration_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_next_entry RECORD;
  v_new_registration_id UUID;
BEGIN
  -- Find next waiting entry for this ticket tier
  SELECT id, event_id, ticket_tier_id, full_name, email, phone
  INTO v_next_entry
  FROM public.event_waitlist
  WHERE event_id = OLD.event_id
    AND (ticket_tier_id = OLD.ticket_tier_id OR ticket_tier_id IS NULL)
    AND status = 'waiting'
  ORDER BY 
    CASE priority WHEN 'vip' THEN 1 WHEN 'high' THEN 2 ELSE 3 END,
    position
  LIMIT 1;
  
  IF v_next_entry.id IS NOT NULL THEN
    -- Create registration
    INSERT INTO public.registrations (
      event_id,
      user_id,
      ticket_tier_id,
      status,
      quantity,
      form_responses
    ) VALUES (
      v_next_entry.event_id,
      auth.uid(),
      v_next_entry.ticket_tier_id,
      'CONFIRMED',
      1,
      jsonb_build_object(
        'auto_promoted_from_waitlist', true,
        'waitlist_entry_id', v_next_entry.id
      )
    )
    RETURNING id INTO v_new_registration_id;
    
    -- Create attendee
    INSERT INTO public.registration_attendees (
      registration_id,
      full_name,
      email,
      phone,
      ticket_tier_id,
      is_primary
    ) VALUES (
      v_new_registration_id,
      v_next_entry.full_name,
      v_next_entry.email,
      v_next_entry.phone,
      v_next_entry.ticket_tier_id,
      true
    );
    
    -- Update waitlist entry
    UPDATE public.event_waitlist
    SET 
      status = 'promoted',
      promoted_at = NOW(),
      registration_id = v_new_registration_id,
      updated_at = NOW()
    WHERE id = v_next_entry.id;
    
    -- Notify user
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      category,
      action_url
    )
    SELECT 
      up.id,
      'WAITLIST_PROMOTED',
      'You''ve been promoted from the waitlist!',
      'A spot opened up and you''ve been registered.',
      'event',
      '/registrations/' || v_new_registration_id
    FROM public.user_profiles up
    WHERE up.email = v_next_entry.email
    LIMIT 1;
    
    -- Reorder positions
    WITH ranked AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY 
        CASE priority WHEN 'vip' THEN 1 WHEN 'high' THEN 2 ELSE 3 END,
        position
      ) as new_position
      FROM public.event_waitlist
      WHERE event_id = OLD.event_id AND status = 'waiting'
    )
    UPDATE public.event_waitlist ew
    SET position = ranked.new_position, updated_at = NOW()
    FROM ranked
    WHERE ew.id = ranked.id;
  END IF;
  
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_promote_on_delete ON public.registrations;
CREATE TRIGGER trigger_auto_promote_on_delete
  AFTER DELETE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_promote_on_registration_delete();