-- Add new event categories to the event_category enum

-- College/University categories
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'SEMINAR';
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'SYMPOSIUM';
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'CULTURAL_FEST';
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'SPORTS_EVENT';
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'ORIENTATION';
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'ALUMNI_MEET';
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'CAREER_FAIR';
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'LECTURE';
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'QUIZ';
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'DEBATE';

-- Company categories
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'PRODUCT_LAUNCH';
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'TOWN_HALL';
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'TEAM_BUILDING';
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'TRAINING';
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'AWARDS_CEREMONY';
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'OFFSITE';
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'NETWORKING';

-- Industry categories
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'TRADE_SHOW';
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'EXPO';
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'SUMMIT';
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'PANEL_DISCUSSION';
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'DEMO_DAY';

-- Non-Profit categories
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'FUNDRAISER';
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'GALA';
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'CHARITY_EVENT';
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'VOLUNTEER_DRIVE';
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'AWARENESS_CAMPAIGN';

-- General categories
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'CONCERT';
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'EXHIBITION';
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'FESTIVAL';
ALTER TYPE public.event_category ADD VALUE IF NOT EXISTS 'SOCIAL_GATHERING';