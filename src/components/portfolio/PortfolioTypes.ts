export interface PublicPortfolioProfile {
  id: string;
  full_name: string | null;
  organization: string | null;
  bio: string | null;
  website: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  github_url: string | null;
  avatar_url: string | null;
  portfolio_accent_color: string | null;
  portfolio_layout: 'stacked' | 'grid';
  portfolio_sections: string[];
  created_at: string;
}
