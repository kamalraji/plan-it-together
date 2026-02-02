-- Work Experience table for professional profiles
CREATE TABLE IF NOT EXISTS public.work_experience (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_logo_url TEXT,
  location TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Portfolio Projects table
CREATE TABLE IF NOT EXISTS public.portfolio_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  project_url TEXT,
  skills TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Skill Endorsements table
CREATE TABLE IF NOT EXISTS public.skill_endorsements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endorser_id UUID NOT NULL,
  skill TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endorser_id, skill)
);

-- Study Groups table for student features
CREATE TABLE IF NOT EXISTS public.study_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  college TEXT,
  major TEXT,
  courses TEXT[] DEFAULT '{}',
  max_members INTEGER DEFAULT 10,
  member_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Study Group Members table
CREATE TABLE IF NOT EXISTS public.study_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Add student fields to impact_profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'impact_profiles' AND column_name = 'college') THEN
    ALTER TABLE public.impact_profiles ADD COLUMN college TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'impact_profiles' AND column_name = 'major') THEN
    ALTER TABLE public.impact_profiles ADD COLUMN major TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'impact_profiles' AND column_name = 'graduation_year') THEN
    ALTER TABLE public.impact_profiles ADD COLUMN graduation_year INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'impact_profiles' AND column_name = 'current_courses') THEN
    ALTER TABLE public.impact_profiles ADD COLUMN current_courses TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Enable RLS on all new tables
ALTER TABLE public.work_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for work_experience
CREATE POLICY "Anyone can view work experience" ON public.work_experience FOR SELECT USING (true);
CREATE POLICY "Users can manage own work experience" ON public.work_experience FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for portfolio_projects
CREATE POLICY "Anyone can view portfolio projects" ON public.portfolio_projects FOR SELECT USING (true);
CREATE POLICY "Users can manage own portfolio projects" ON public.portfolio_projects FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for skill_endorsements
CREATE POLICY "Anyone can view endorsements" ON public.skill_endorsements FOR SELECT USING (true);
CREATE POLICY "Users can endorse others" ON public.skill_endorsements FOR INSERT WITH CHECK (auth.uid() = endorser_id AND auth.uid() != user_id);
CREATE POLICY "Users can remove own endorsements" ON public.skill_endorsements FOR DELETE USING (auth.uid() = endorser_id);

-- RLS Policies for study_groups
CREATE POLICY "Anyone can view active study groups" ON public.study_groups FOR SELECT USING (is_active = true);
CREATE POLICY "Users can create study groups" ON public.study_groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update own groups" ON public.study_groups FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for study_group_members
CREATE POLICY "Anyone can view group members" ON public.study_group_members FOR SELECT USING (true);
CREATE POLICY "Users can join groups" ON public.study_group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON public.study_group_members FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_work_experience_updated_at BEFORE UPDATE ON public.work_experience
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portfolio_projects_updated_at BEFORE UPDATE ON public.portfolio_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_study_groups_updated_at BEFORE UPDATE ON public.study_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update study group member count
CREATE OR REPLACE FUNCTION public.update_study_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.study_groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.study_groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_study_group_member_count_trigger
  AFTER INSERT OR DELETE ON public.study_group_members
  FOR EACH ROW EXECUTE FUNCTION public.update_study_group_member_count();