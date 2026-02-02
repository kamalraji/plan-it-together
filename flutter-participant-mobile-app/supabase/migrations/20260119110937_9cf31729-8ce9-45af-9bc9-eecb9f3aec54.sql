-- =============================================
-- Insert Sample Data for Zone Tab Testing
-- ArenaGreenClover U Event: 5e26a63c-207c-4875-bb27-cff83d7a0b00
-- =============================================

-- Insert sample event sessions (valid status: upcoming, live, ended)
INSERT INTO public.event_sessions (event_id, title, description, speaker_name, speaker_avatar, start_time, end_time, location, room, status, tags)
VALUES
  -- Live sessions
  ('5e26a63c-207c-4875-bb27-cff83d7a0b00', 'Flutter State Management Deep Dive', 'Explore advanced state management patterns including Riverpod, Bloc, and Provider.', 'Priya Sharma', 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya', NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '30 minutes', 'Main Hall', 'Hall A', 'live', ARRAY['flutter', 'state-management', 'advanced']),
  
  ('5e26a63c-207c-4875-bb27-cff83d7a0b00', 'Building Accessible Apps', 'Best practices for creating inclusive mobile experiences.', 'Rahul Verma', 'https://api.dicebear.com/7.x/avataaars/svg?seed=rahul', NOW() - INTERVAL '15 minutes', NOW() + INTERVAL '45 minutes', 'Workshop Zone', 'Room B', 'live', ARRAY['accessibility', 'ux', 'mobile']),
  
  -- Upcoming sessions
  ('5e26a63c-207c-4875-bb27-cff83d7a0b00', 'Supabase + Flutter Integration', 'Learn how to build real-time apps with Supabase and Flutter.', 'Aisha Khan', 'https://api.dicebear.com/7.x/avataaars/svg?seed=aisha', NOW() + INTERVAL '1 hour', NOW() + INTERVAL '2 hours', 'Tech Stage', 'Hall A', 'upcoming', ARRAY['supabase', 'backend', 'realtime']),
  
  ('5e26a63c-207c-4875-bb27-cff83d7a0b00', 'UI/UX for Mobile Developers', 'Design principles that every mobile developer should know.', 'Vikram Patel', 'https://api.dicebear.com/7.x/avataaars/svg?seed=vikram', NOW() + INTERVAL '2 hours', NOW() + INTERVAL '3 hours', 'Design Corner', 'Room C', 'upcoming', ARRAY['design', 'ui', 'ux']),
  
  ('5e26a63c-207c-4875-bb27-cff83d7a0b00', 'Performance Optimization Tips', 'Make your Flutter apps blazing fast with these optimization techniques.', 'Deepa Nair', 'https://api.dicebear.com/7.x/avataaars/svg?seed=deepa', NOW() + INTERVAL '3 hours', NOW() + INTERVAL '4 hours', 'Main Hall', 'Hall A', 'upcoming', ARRAY['performance', 'optimization', 'flutter']),
  
  ('5e26a63c-207c-4875-bb27-cff83d7a0b00', 'Networking Lunch & Connect', 'Grab lunch and connect with fellow developers.', NULL, NULL, NOW() + INTERVAL '4 hours', NOW() + INTERVAL '5 hours', 'Cafeteria', 'Open Area', 'upcoming', ARRAY['networking', 'lunch', 'social']);

-- Insert sample polls
INSERT INTO public.event_polls (event_id, question, is_active, expires_at)
VALUES
  ('5e26a63c-207c-4875-bb27-cff83d7a0b00', 'Which state management solution do you prefer?', true, NOW() + INTERVAL '2 hours'),
  ('5e26a63c-207c-4875-bb27-cff83d7a0b00', 'What topic should we cover in the next workshop?', true, NOW() + INTERVAL '4 hours'),
  ('5e26a63c-207c-4875-bb27-cff83d7a0b00', 'Rate your experience so far!', true, NOW() + INTERVAL '6 hours');

-- Insert poll options
INSERT INTO public.event_poll_options (poll_id, text, vote_count)
SELECT id, 'Riverpod', 12 FROM public.event_polls WHERE question = 'Which state management solution do you prefer?' AND event_id = '5e26a63c-207c-4875-bb27-cff83d7a0b00'
UNION ALL
SELECT id, 'Bloc', 8 FROM public.event_polls WHERE question = 'Which state management solution do you prefer?' AND event_id = '5e26a63c-207c-4875-bb27-cff83d7a0b00'
UNION ALL
SELECT id, 'Provider', 15 FROM public.event_polls WHERE question = 'Which state management solution do you prefer?' AND event_id = '5e26a63c-207c-4875-bb27-cff83d7a0b00'
UNION ALL
SELECT id, 'GetX', 5 FROM public.event_polls WHERE question = 'Which state management solution do you prefer?' AND event_id = '5e26a63c-207c-4875-bb27-cff83d7a0b00';

INSERT INTO public.event_poll_options (poll_id, text, vote_count)
SELECT id, 'Firebase Integration', 10 FROM public.event_polls WHERE question = 'What topic should we cover in the next workshop?' AND event_id = '5e26a63c-207c-4875-bb27-cff83d7a0b00'
UNION ALL
SELECT id, 'Testing & CI/CD', 7 FROM public.event_polls WHERE question = 'What topic should we cover in the next workshop?' AND event_id = '5e26a63c-207c-4875-bb27-cff83d7a0b00'
UNION ALL
SELECT id, 'Animations & Motion', 14 FROM public.event_polls WHERE question = 'What topic should we cover in the next workshop?' AND event_id = '5e26a63c-207c-4875-bb27-cff83d7a0b00';

INSERT INTO public.event_poll_options (poll_id, text, vote_count)
SELECT id, '⭐ Amazing!', 20 FROM public.event_polls WHERE question = 'Rate your experience so far!' AND event_id = '5e26a63c-207c-4875-bb27-cff83d7a0b00'
UNION ALL
SELECT id, '👍 Good', 8 FROM public.event_polls WHERE question = 'Rate your experience so far!' AND event_id = '5e26a63c-207c-4875-bb27-cff83d7a0b00'
UNION ALL
SELECT id, '😐 Okay', 2 FROM public.event_polls WHERE question = 'Rate your experience so far!' AND event_id = '5e26a63c-207c-4875-bb27-cff83d7a0b00'
UNION ALL
SELECT id, '👎 Needs Improvement', 1 FROM public.event_polls WHERE question = 'Rate your experience so far!' AND event_id = '5e26a63c-207c-4875-bb27-cff83d7a0b00';

-- Insert sample announcements
INSERT INTO public.event_announcements (event_id, title, content, type, is_pinned, is_active, author_name, author_avatar)
VALUES
  ('5e26a63c-207c-4875-bb27-cff83d7a0b00', '🎉 Welcome to ArenaGreenClover U!', 'We are thrilled to have you here! Check out the schedule and don''t miss the networking sessions. WiFi password: GreenClover2026', 'info', true, true, 'Event Team', 'https://api.dicebear.com/7.x/bottts/svg?seed=team'),
  
  ('5e26a63c-207c-4875-bb27-cff83d7a0b00', '🍕 Lunch Available Now!', 'Head to the cafeteria for complimentary lunch. Vegetarian and vegan options available!', 'update', false, true, 'Catering Team', 'https://api.dicebear.com/7.x/bottts/svg?seed=catering'),
  
  ('5e26a63c-207c-4875-bb27-cff83d7a0b00', '⚠️ Room Change Alert', 'The "Supabase + Flutter Integration" session has been moved from Room B to Hall A due to high demand.', 'alert', true, true, 'Operations', 'https://api.dicebear.com/7.x/bottts/svg?seed=ops'),
  
  ('5e26a63c-207c-4875-bb27-cff83d7a0b00', '🎁 Swag Booth Open!', 'Visit the swag booth near the entrance to collect your exclusive ArenaGreenClover merchandise. First come, first served!', 'info', false, true, 'Sponsors', 'https://api.dicebear.com/7.x/bottts/svg?seed=sponsors'),
  
  ('5e26a63c-207c-4875-bb27-cff83d7a0b00', '📸 Photo Booth Active', 'Capture memories at our photo booth! Share with #ArenaGreenCloverU to win prizes.', 'info', false, true, 'Media Team', 'https://api.dicebear.com/7.x/bottts/svg?seed=media');