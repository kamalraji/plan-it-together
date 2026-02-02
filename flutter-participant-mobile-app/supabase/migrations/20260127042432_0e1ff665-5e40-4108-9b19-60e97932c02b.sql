-- Insert sample icebreaker prompts for today's date
INSERT INTO icebreaker_prompts (event_id, question, prompt_type, active_date, is_active) 
SELECT 
  e.id as event_id,
  prompt.question,
  prompt.prompt_type,
  CURRENT_DATE as active_date,
  true as is_active
FROM events e
CROSS JOIN (
  VALUES 
    ('What''s one skill you''re hoping to learn at this event?', 'daily'),
    ('If you could have coffee with any speaker here, who would it be and why?', 'daily'),
    ('What brought you to this event today?', 'daily'),
    ('Share your best networking tip in one sentence!', 'topic'),
    ('What''s a recent win (big or small) you''re proud of?', 'topic')
) AS prompt(question, prompt_type)
WHERE e.status = 'PUBLISHED' 
  AND e.end_date >= CURRENT_DATE
LIMIT 15;

-- Also insert prompts for the next few days for testing
INSERT INTO icebreaker_prompts (event_id, question, prompt_type, active_date, is_active) 
SELECT 
  e.id as event_id,
  prompt.question,
  prompt.prompt_type,
  prompt.active_date::date,
  true as is_active
FROM events e
CROSS JOIN (
  VALUES 
    ('What''s the most interesting session you attended so far?', 'daily', CURRENT_DATE + INTERVAL '1 day'),
    ('Who have you connected with today that inspired you?', 'daily', CURRENT_DATE + INTERVAL '2 days'),
    ('What''s one thing you''ll do differently after this event?', 'daily', CURRENT_DATE + INTERVAL '3 days')
) AS prompt(question, prompt_type, active_date)
WHERE e.status = 'PUBLISHED' 
  AND e.end_date >= CURRENT_DATE
LIMIT 9;