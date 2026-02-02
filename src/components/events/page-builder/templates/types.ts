import { LucideIcon } from 'lucide-react';

export interface TemplateData {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  thumbnail: string;
  icon: LucideIcon;
  html: string;
  css: string;
}

export type TemplateCategory = 
  | 'Conference' 
  | 'Hackathon' 
  | 'Workshop' 
  | 'Meetup' 
  | 'Celebration' 
  | 'Webinar';

export const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'All Templates' },
  { id: 'Conference', label: 'Conference' },
  { id: 'Hackathon', label: 'Hackathon' },
  { id: 'Workshop', label: 'Workshop' },
  { id: 'Meetup', label: 'Meetup' },
  { id: 'Celebration', label: 'Celebration' },
  { id: 'Webinar', label: 'Webinar' },
] as const;
