/**
 * Pre-generated AI Background Images for ID Cards
 * These images are generated once and stored in Supabase Storage
 * Users can select from this library for instant, high-quality backgrounds
 */

export interface IDCardImageBackground {
  id: string;
  name: string;
  theme: 'technology' | 'medical' | 'corporate' | 'conference' | 'education' | 'creative' | 'nature' | 'abstract';
  style: 'professional' | 'modern' | 'minimal' | 'vibrant' | 'elegant';
  imageUrl: string;
  thumbnailUrl?: string;
  dominantColors: {
    primary: string;
    secondary: string;
  };
  supportsLandscape: boolean;
  supportsPortrait: boolean;
}

export const IMAGE_BACKGROUND_THEMES = [
  { id: 'all', label: 'All Themes', icon: '🎨' },
  { id: 'technology', label: 'Technology', icon: '💻' },
  { id: 'medical', label: 'Healthcare', icon: '🏥' },
  { id: 'corporate', label: 'Corporate', icon: '🏢' },
  { id: 'conference', label: 'Conference', icon: '🎤' },
  { id: 'education', label: 'Education', icon: '🎓' },
  { id: 'creative', label: 'Creative', icon: '🖌️' },
  { id: 'nature', label: 'Nature', icon: '🌿' },
  { id: 'abstract', label: 'Abstract', icon: '🔷' },
] as const;

export const IMAGE_BACKGROUND_STYLES = [
  { id: 'all', label: 'All Styles' },
  { id: 'professional', label: 'Professional' },
  { id: 'modern', label: 'Modern' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'vibrant', label: 'Vibrant' },
  { id: 'elegant', label: 'Elegant' },
] as const;

// Base URL for Supabase Storage - will be populated by the generate function
const STORAGE_BASE_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/idcard-backgrounds`;

/**
 * Pre-generated AI Background Images Library
 * These are populated when backgrounds are generated and uploaded
 */
export const ID_CARD_IMAGE_BACKGROUNDS: IDCardImageBackground[] = [
  // Technology Theme
  {
    id: 'tech-pro-01',
    name: 'Circuit Board',
    theme: 'technology',
    style: 'professional',
    imageUrl: `${STORAGE_BASE_URL}/technology/professional-01.png`,
    dominantColors: { primary: '#3B82F6', secondary: '#1E3A8A' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'tech-mod-01',
    name: 'Digital Flow',
    theme: 'technology',
    style: 'modern',
    imageUrl: `${STORAGE_BASE_URL}/technology/modern-01.png`,
    dominantColors: { primary: '#06B6D4', secondary: '#0891B2' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'tech-min-01',
    name: 'Clean Tech',
    theme: 'technology',
    style: 'minimal',
    imageUrl: `${STORAGE_BASE_URL}/technology/minimal-01.png`,
    dominantColors: { primary: '#64748B', secondary: '#94A3B8' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'tech-vib-01',
    name: 'Neon Tech',
    theme: 'technology',
    style: 'vibrant',
    imageUrl: `${STORAGE_BASE_URL}/technology/vibrant-01.png`,
    dominantColors: { primary: '#8B5CF6', secondary: '#EC4899' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'tech-ele-01',
    name: 'Tech Elegance',
    theme: 'technology',
    style: 'elegant',
    imageUrl: `${STORAGE_BASE_URL}/technology/elegant-01.png`,
    dominantColors: { primary: '#1E40AF', secondary: '#3B82F6' },
    supportsLandscape: true,
    supportsPortrait: true,
  },

  // Medical Theme
  {
    id: 'med-pro-01',
    name: 'Medical Pro',
    theme: 'medical',
    style: 'professional',
    imageUrl: `${STORAGE_BASE_URL}/medical/professional-01.png`,
    dominantColors: { primary: '#0EA5E9', secondary: '#0284C7' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'med-mod-01',
    name: 'Health Modern',
    theme: 'medical',
    style: 'modern',
    imageUrl: `${STORAGE_BASE_URL}/medical/modern-01.png`,
    dominantColors: { primary: '#10B981', secondary: '#059669' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'med-min-01',
    name: 'Clean Health',
    theme: 'medical',
    style: 'minimal',
    imageUrl: `${STORAGE_BASE_URL}/medical/minimal-01.png`,
    dominantColors: { primary: '#14B8A6', secondary: '#2DD4BF' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'med-vib-01',
    name: 'Vital Care',
    theme: 'medical',
    style: 'vibrant',
    imageUrl: `${STORAGE_BASE_URL}/medical/vibrant-01.png`,
    dominantColors: { primary: '#06B6D4', secondary: '#22D3EE' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'med-ele-01',
    name: 'Medical Elite',
    theme: 'medical',
    style: 'elegant',
    imageUrl: `${STORAGE_BASE_URL}/medical/elegant-01.png`,
    dominantColors: { primary: '#0369A1', secondary: '#0EA5E9' },
    supportsLandscape: true,
    supportsPortrait: true,
  },

  // Corporate Theme
  {
    id: 'corp-pro-01',
    name: 'Business Pro',
    theme: 'corporate',
    style: 'professional',
    imageUrl: `${STORAGE_BASE_URL}/corporate/professional-01.png`,
    dominantColors: { primary: '#1E40AF', secondary: '#3B82F6' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'corp-mod-01',
    name: 'Modern Corp',
    theme: 'corporate',
    style: 'modern',
    imageUrl: `${STORAGE_BASE_URL}/corporate/modern-01.png`,
    dominantColors: { primary: '#475569', secondary: '#64748B' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'corp-min-01',
    name: 'Clean Office',
    theme: 'corporate',
    style: 'minimal',
    imageUrl: `${STORAGE_BASE_URL}/corporate/minimal-01.png`,
    dominantColors: { primary: '#334155', secondary: '#94A3B8' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'corp-vib-01',
    name: 'Dynamic Corp',
    theme: 'corporate',
    style: 'vibrant',
    imageUrl: `${STORAGE_BASE_URL}/corporate/vibrant-01.png`,
    dominantColors: { primary: '#2563EB', secondary: '#3B82F6' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'corp-ele-01',
    name: 'Executive',
    theme: 'corporate',
    style: 'elegant',
    imageUrl: `${STORAGE_BASE_URL}/corporate/elegant-01.png`,
    dominantColors: { primary: '#1E293B', secondary: '#475569' },
    supportsLandscape: true,
    supportsPortrait: true,
  },

  // Conference Theme
  {
    id: 'conf-pro-01',
    name: 'Summit Pro',
    theme: 'conference',
    style: 'professional',
    imageUrl: `${STORAGE_BASE_URL}/conference/professional-01.png`,
    dominantColors: { primary: '#7C3AED', secondary: '#8B5CF6' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'conf-mod-01',
    name: 'Event Modern',
    theme: 'conference',
    style: 'modern',
    imageUrl: `${STORAGE_BASE_URL}/conference/modern-01.png`,
    dominantColors: { primary: '#6366F1', secondary: '#818CF8' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'conf-min-01',
    name: 'Clean Event',
    theme: 'conference',
    style: 'minimal',
    imageUrl: `${STORAGE_BASE_URL}/conference/minimal-01.png`,
    dominantColors: { primary: '#4F46E5', secondary: '#6366F1' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'conf-vib-01',
    name: 'Stage Lights',
    theme: 'conference',
    style: 'vibrant',
    imageUrl: `${STORAGE_BASE_URL}/conference/vibrant-01.png`,
    dominantColors: { primary: '#A855F7', secondary: '#D946EF' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'conf-ele-01',
    name: 'Gala Night',
    theme: 'conference',
    style: 'elegant',
    imageUrl: `${STORAGE_BASE_URL}/conference/elegant-01.png`,
    dominantColors: { primary: '#7C3AED', secondary: '#9333EA' },
    supportsLandscape: true,
    supportsPortrait: true,
  },

  // Education Theme
  {
    id: 'edu-pro-01',
    name: 'Academic Pro',
    theme: 'education',
    style: 'professional',
    imageUrl: `${STORAGE_BASE_URL}/education/professional-01.png`,
    dominantColors: { primary: '#1E40AF', secondary: '#1D4ED8' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'edu-mod-01',
    name: 'Modern Campus',
    theme: 'education',
    style: 'modern',
    imageUrl: `${STORAGE_BASE_URL}/education/modern-01.png`,
    dominantColors: { primary: '#0891B2', secondary: '#06B6D4' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'edu-min-01',
    name: 'Clean Study',
    theme: 'education',
    style: 'minimal',
    imageUrl: `${STORAGE_BASE_URL}/education/minimal-01.png`,
    dominantColors: { primary: '#64748B', secondary: '#94A3B8' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'edu-vib-01',
    name: 'Creative Learn',
    theme: 'education',
    style: 'vibrant',
    imageUrl: `${STORAGE_BASE_URL}/education/vibrant-01.png`,
    dominantColors: { primary: '#F59E0B', secondary: '#FBBF24' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'edu-ele-01',
    name: 'Ivy League',
    theme: 'education',
    style: 'elegant',
    imageUrl: `${STORAGE_BASE_URL}/education/elegant-01.png`,
    dominantColors: { primary: '#1E3A5F', secondary: '#2563EB' },
    supportsLandscape: true,
    supportsPortrait: true,
  },

  // Creative Theme
  {
    id: 'cre-pro-01',
    name: 'Studio Pro',
    theme: 'creative',
    style: 'professional',
    imageUrl: `${STORAGE_BASE_URL}/creative/professional-01.png`,
    dominantColors: { primary: '#EC4899', secondary: '#F472B6' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'cre-mod-01',
    name: 'Art Modern',
    theme: 'creative',
    style: 'modern',
    imageUrl: `${STORAGE_BASE_URL}/creative/modern-01.png`,
    dominantColors: { primary: '#F97316', secondary: '#FB923C' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'cre-min-01',
    name: 'Clean Canvas',
    theme: 'creative',
    style: 'minimal',
    imageUrl: `${STORAGE_BASE_URL}/creative/minimal-01.png`,
    dominantColors: { primary: '#78716C', secondary: '#A8A29E' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'cre-vib-01',
    name: 'Color Splash',
    theme: 'creative',
    style: 'vibrant',
    imageUrl: `${STORAGE_BASE_URL}/creative/vibrant-01.png`,
    dominantColors: { primary: '#EF4444', secondary: '#F59E0B' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'cre-ele-01',
    name: 'Artistic Flow',
    theme: 'creative',
    style: 'elegant',
    imageUrl: `${STORAGE_BASE_URL}/creative/elegant-01.png`,
    dominantColors: { primary: '#BE185D', secondary: '#EC4899' },
    supportsLandscape: true,
    supportsPortrait: true,
  },

  // Nature Theme
  {
    id: 'nat-pro-01',
    name: 'Nature Pro',
    theme: 'nature',
    style: 'professional',
    imageUrl: `${STORAGE_BASE_URL}/nature/professional-01.png`,
    dominantColors: { primary: '#059669', secondary: '#10B981' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'nat-mod-01',
    name: 'Eco Modern',
    theme: 'nature',
    style: 'modern',
    imageUrl: `${STORAGE_BASE_URL}/nature/modern-01.png`,
    dominantColors: { primary: '#16A34A', secondary: '#22C55E' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'nat-min-01',
    name: 'Clean Green',
    theme: 'nature',
    style: 'minimal',
    imageUrl: `${STORAGE_BASE_URL}/nature/minimal-01.png`,
    dominantColors: { primary: '#65A30D', secondary: '#84CC16' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'nat-vib-01',
    name: 'Spring Bloom',
    theme: 'nature',
    style: 'vibrant',
    imageUrl: `${STORAGE_BASE_URL}/nature/vibrant-01.png`,
    dominantColors: { primary: '#22C55E', secondary: '#4ADE80' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'nat-ele-01',
    name: 'Forest Elite',
    theme: 'nature',
    style: 'elegant',
    imageUrl: `${STORAGE_BASE_URL}/nature/elegant-01.png`,
    dominantColors: { primary: '#047857', secondary: '#059669' },
    supportsLandscape: true,
    supportsPortrait: true,
  },

  // Abstract Theme
  {
    id: 'abs-pro-01',
    name: 'Abstract Pro',
    theme: 'abstract',
    style: 'professional',
    imageUrl: `${STORAGE_BASE_URL}/abstract/professional-01.png`,
    dominantColors: { primary: '#6366F1', secondary: '#8B5CF6' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'abs-mod-01',
    name: 'Geo Modern',
    theme: 'abstract',
    style: 'modern',
    imageUrl: `${STORAGE_BASE_URL}/abstract/modern-01.png`,
    dominantColors: { primary: '#14B8A6', secondary: '#06B6D4' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'abs-min-01',
    name: 'Clean Lines',
    theme: 'abstract',
    style: 'minimal',
    imageUrl: `${STORAGE_BASE_URL}/abstract/minimal-01.png`,
    dominantColors: { primary: '#71717A', secondary: '#A1A1AA' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'abs-vib-01',
    name: 'Vivid Shapes',
    theme: 'abstract',
    style: 'vibrant',
    imageUrl: `${STORAGE_BASE_URL}/abstract/vibrant-01.png`,
    dominantColors: { primary: '#F43F5E', secondary: '#EC4899' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
  {
    id: 'abs-ele-01',
    name: 'Abstract Elite',
    theme: 'abstract',
    style: 'elegant',
    imageUrl: `${STORAGE_BASE_URL}/abstract/elegant-01.png`,
    dominantColors: { primary: '#4F46E5', secondary: '#7C3AED' },
    supportsLandscape: true,
    supportsPortrait: true,
  },
];

/**
 * Get filtered backgrounds by theme and style
 */
export function getFilteredImageBackgrounds(
  themeFilter: string,
  styleFilter: string
): IDCardImageBackground[] {
  return ID_CARD_IMAGE_BACKGROUNDS.filter(bg => {
    const matchesTheme = themeFilter === 'all' || bg.theme === themeFilter;
    const matchesStyle = styleFilter === 'all' || bg.style === styleFilter;
    return matchesTheme && matchesStyle;
  });
}
