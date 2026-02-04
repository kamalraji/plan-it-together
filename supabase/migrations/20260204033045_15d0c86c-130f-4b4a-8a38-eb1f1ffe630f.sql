-- Knowledge Base Categories
CREATE TABLE IF NOT EXISTS public.kb_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Knowledge Base Articles
CREATE TABLE IF NOT EXISTS public.kb_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.kb_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id UUID,
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

-- Knowledge Base FAQs
CREATE TABLE IF NOT EXISTS public.kb_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.kb_categories(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Interactive Tutorials
CREATE TABLE IF NOT EXISTS public.kb_tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  difficulty TEXT DEFAULT 'beginner',
  estimated_minutes INTEGER DEFAULT 5,
  steps JSONB NOT NULL DEFAULT '[]',
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  completion_count INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  target_roles TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tutorial Progress
CREATE TABLE IF NOT EXISTS public.kb_tutorial_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tutorial_id UUID REFERENCES public.kb_tutorials(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 0,
  completed_steps INTEGER[] DEFAULT '{}',
  is_completed BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, tutorial_id)
);

-- Contextual Help
CREATE TABLE IF NOT EXISTS public.kb_contextual_help (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  related_article_id UUID REFERENCES public.kb_articles(id) ON DELETE SET NULL,
  related_tutorial_id UUID REFERENCES public.kb_tutorials(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kb_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_tutorial_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_contextual_help ENABLE ROW LEVEL SECURITY;

-- Policies for public read access
CREATE POLICY "Anyone can view active categories" ON public.kb_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view published articles" ON public.kb_articles FOR SELECT USING (is_published = true);
CREATE POLICY "Anyone can view published FAQs" ON public.kb_faqs FOR SELECT USING (is_published = true);
CREATE POLICY "Anyone can view published tutorials" ON public.kb_tutorials FOR SELECT USING (is_published = true);
CREATE POLICY "Anyone can view active contextual help" ON public.kb_contextual_help FOR SELECT USING (is_active = true);

-- Tutorial progress policies
CREATE POLICY "Users can view their own tutorial progress" ON public.kb_tutorial_progress FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert their own tutorial progress" ON public.kb_tutorial_progress FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update their own tutorial progress" ON public.kb_tutorial_progress FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id);

-- Indexes
CREATE INDEX idx_kb_articles_category ON public.kb_articles(category_id);
CREATE INDEX idx_kb_articles_published ON public.kb_articles(is_published, published_at DESC);
CREATE INDEX idx_kb_articles_tags ON public.kb_articles USING GIN(tags);
CREATE INDEX idx_kb_faqs_category ON public.kb_faqs(category_id);
CREATE INDEX idx_kb_tutorials_category ON public.kb_tutorials(category);
CREATE INDEX idx_kb_tutorial_progress_user ON public.kb_tutorial_progress(user_id);

-- Triggers
CREATE TRIGGER update_kb_categories_updated_at BEFORE UPDATE ON public.kb_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_kb_articles_updated_at BEFORE UPDATE ON public.kb_articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_kb_faqs_updated_at BEFORE UPDATE ON public.kb_faqs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_kb_tutorials_updated_at BEFORE UPDATE ON public.kb_tutorials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_kb_contextual_help_updated_at BEFORE UPDATE ON public.kb_contextual_help FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();