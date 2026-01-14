/**
 * Pre-generated AI Background Images for Certificates
 * These images are generated once and stored in Supabase Storage
 * Users can select from this library for instant, high-quality backgrounds
 */

export interface CertificateImageBackground {
  id: string;
  name: string;
  theme: 'formal' | 'celebration' | 'corporate' | 'academic' | 'tech' | 'creative' | 'nature' | 'awards';
  style: 'elegant' | 'modern' | 'minimal' | 'vibrant' | 'classic';
  imageUrl: string;
  thumbnailUrl?: string;
  dominantColors: {
    primary: string;
    secondary: string;
  };
}

export const IMAGE_BACKGROUND_THEMES = [
  { id: 'all', label: 'All Themes', icon: '🎨' },
  { id: 'formal', label: 'Formal', icon: '🏛️' },
  { id: 'celebration', label: 'Celebration', icon: '🎉' },
  { id: 'corporate', label: 'Corporate', icon: '🏢' },
  { id: 'academic', label: 'Academic', icon: '🎓' },
  { id: 'tech', label: 'Technology', icon: '💻' },
  { id: 'creative', label: 'Creative', icon: '🖌️' },
  { id: 'nature', label: 'Nature', icon: '🌿' },
  { id: 'awards', label: 'Awards', icon: '🏆' },
] as const;

export const IMAGE_BACKGROUND_STYLES = [
  { id: 'all', label: 'All Styles' },
  { id: 'elegant', label: 'Elegant' },
  { id: 'modern', label: 'Modern' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'vibrant', label: 'Vibrant' },
  { id: 'classic', label: 'Classic' },
] as const;

// Base URL for Supabase Storage - will be populated by the generate function
const STORAGE_BASE_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/certificate-backgrounds`;

/**
 * Pre-generated AI Background Images Library
 * These are populated when backgrounds are generated and uploaded
 */
export const CERTIFICATE_IMAGE_BACKGROUNDS: CertificateImageBackground[] = [
  // Formal Theme
  {
    id: 'formal-ele-01',
    name: 'Regal Gold',
    theme: 'formal',
    style: 'elegant',
    imageUrl: `${STORAGE_BASE_URL}/formal/elegant-01.png`,
    dominantColors: { primary: '#1a365d', secondary: '#c9a227' },
  },
  {
    id: 'formal-mod-01',
    name: 'Modern Formal',
    theme: 'formal',
    style: 'modern',
    imageUrl: `${STORAGE_BASE_URL}/formal/modern-01.png`,
    dominantColors: { primary: '#1E40AF', secondary: '#3B82F6' },
  },
  {
    id: 'formal-min-01',
    name: 'Clean Formal',
    theme: 'formal',
    style: 'minimal',
    imageUrl: `${STORAGE_BASE_URL}/formal/minimal-01.png`,
    dominantColors: { primary: '#374151', secondary: '#9CA3AF' },
  },
  {
    id: 'formal-vib-01',
    name: 'Vibrant Ceremony',
    theme: 'formal',
    style: 'vibrant',
    imageUrl: `${STORAGE_BASE_URL}/formal/vibrant-01.png`,
    dominantColors: { primary: '#7C3AED', secondary: '#A855F7' },
  },
  {
    id: 'formal-cla-01',
    name: 'Classic Formal',
    theme: 'formal',
    style: 'classic',
    imageUrl: `${STORAGE_BASE_URL}/formal/classic-01.png`,
    dominantColors: { primary: '#1F2937', secondary: '#D4AF37' },
  },

  // Celebration Theme
  {
    id: 'cele-ele-01',
    name: 'Elegant Gala',
    theme: 'celebration',
    style: 'elegant',
    imageUrl: `${STORAGE_BASE_URL}/celebration/elegant-01.png`,
    dominantColors: { primary: '#BE185D', secondary: '#F472B6' },
  },
  {
    id: 'cele-mod-01',
    name: 'Modern Party',
    theme: 'celebration',
    style: 'modern',
    imageUrl: `${STORAGE_BASE_URL}/celebration/modern-01.png`,
    dominantColors: { primary: '#EC4899', secondary: '#F9A8D4' },
  },
  {
    id: 'cele-min-01',
    name: 'Simple Joy',
    theme: 'celebration',
    style: 'minimal',
    imageUrl: `${STORAGE_BASE_URL}/celebration/minimal-01.png`,
    dominantColors: { primary: '#F59E0B', secondary: '#FCD34D' },
  },
  {
    id: 'cele-vib-01',
    name: 'Festive Colors',
    theme: 'celebration',
    style: 'vibrant',
    imageUrl: `${STORAGE_BASE_URL}/celebration/vibrant-01.png`,
    dominantColors: { primary: '#EF4444', secondary: '#F97316' },
  },
  {
    id: 'cele-cla-01',
    name: 'Classic Celebration',
    theme: 'celebration',
    style: 'classic',
    imageUrl: `${STORAGE_BASE_URL}/celebration/classic-01.png`,
    dominantColors: { primary: '#B45309', secondary: '#FCD34D' },
  },

  // Corporate Theme
  {
    id: 'corp-ele-01',
    name: 'Executive',
    theme: 'corporate',
    style: 'elegant',
    imageUrl: `${STORAGE_BASE_URL}/corporate/elegant-01.png`,
    dominantColors: { primary: '#1E293B', secondary: '#475569' },
  },
  {
    id: 'corp-mod-01',
    name: 'Modern Business',
    theme: 'corporate',
    style: 'modern',
    imageUrl: `${STORAGE_BASE_URL}/corporate/modern-01.png`,
    dominantColors: { primary: '#3B82F6', secondary: '#60A5FA' },
  },
  {
    id: 'corp-min-01',
    name: 'Clean Corporate',
    theme: 'corporate',
    style: 'minimal',
    imageUrl: `${STORAGE_BASE_URL}/corporate/minimal-01.png`,
    dominantColors: { primary: '#64748B', secondary: '#94A3B8' },
  },
  {
    id: 'corp-vib-01',
    name: 'Dynamic Corp',
    theme: 'corporate',
    style: 'vibrant',
    imageUrl: `${STORAGE_BASE_URL}/corporate/vibrant-01.png`,
    dominantColors: { primary: '#2563EB', secondary: '#3B82F6' },
  },
  {
    id: 'corp-cla-01',
    name: 'Classic Business',
    theme: 'corporate',
    style: 'classic',
    imageUrl: `${STORAGE_BASE_URL}/corporate/classic-01.png`,
    dominantColors: { primary: '#1F2937', secondary: '#374151' },
  },

  // Academic Theme
  {
    id: 'acad-ele-01',
    name: 'Ivy League',
    theme: 'academic',
    style: 'elegant',
    imageUrl: `${STORAGE_BASE_URL}/academic/elegant-01.png`,
    dominantColors: { primary: '#1E3A5F', secondary: '#C9A227' },
  },
  {
    id: 'acad-mod-01',
    name: 'Modern Campus',
    theme: 'academic',
    style: 'modern',
    imageUrl: `${STORAGE_BASE_URL}/academic/modern-01.png`,
    dominantColors: { primary: '#0891B2', secondary: '#06B6D4' },
  },
  {
    id: 'acad-min-01',
    name: 'Clean Study',
    theme: 'academic',
    style: 'minimal',
    imageUrl: `${STORAGE_BASE_URL}/academic/minimal-01.png`,
    dominantColors: { primary: '#4B5563', secondary: '#9CA3AF' },
  },
  {
    id: 'acad-vib-01',
    name: 'Vibrant Learning',
    theme: 'academic',
    style: 'vibrant',
    imageUrl: `${STORAGE_BASE_URL}/academic/vibrant-01.png`,
    dominantColors: { primary: '#7C3AED', secondary: '#8B5CF6' },
  },
  {
    id: 'acad-cla-01',
    name: 'Traditional Academic',
    theme: 'academic',
    style: 'classic',
    imageUrl: `${STORAGE_BASE_URL}/academic/classic-01.png`,
    dominantColors: { primary: '#1E40AF', secondary: '#1D4ED8' },
  },

  // Tech Theme
  {
    id: 'tech-ele-01',
    name: 'Tech Elegance',
    theme: 'tech',
    style: 'elegant',
    imageUrl: `${STORAGE_BASE_URL}/tech/elegant-01.png`,
    dominantColors: { primary: '#1E40AF', secondary: '#3B82F6' },
  },
  {
    id: 'tech-mod-01',
    name: 'Digital Flow',
    theme: 'tech',
    style: 'modern',
    imageUrl: `${STORAGE_BASE_URL}/tech/modern-01.png`,
    dominantColors: { primary: '#06B6D4', secondary: '#0891B2' },
  },
  {
    id: 'tech-min-01',
    name: 'Clean Tech',
    theme: 'tech',
    style: 'minimal',
    imageUrl: `${STORAGE_BASE_URL}/tech/minimal-01.png`,
    dominantColors: { primary: '#64748B', secondary: '#94A3B8' },
  },
  {
    id: 'tech-vib-01',
    name: 'Neon Tech',
    theme: 'tech',
    style: 'vibrant',
    imageUrl: `${STORAGE_BASE_URL}/tech/vibrant-01.png`,
    dominantColors: { primary: '#8B5CF6', secondary: '#EC4899' },
  },
  {
    id: 'tech-cla-01',
    name: 'Classic Tech',
    theme: 'tech',
    style: 'classic',
    imageUrl: `${STORAGE_BASE_URL}/tech/classic-01.png`,
    dominantColors: { primary: '#0F172A', secondary: '#3B82F6' },
  },

  // Creative Theme
  {
    id: 'crea-ele-01',
    name: 'Artistic Flow',
    theme: 'creative',
    style: 'elegant',
    imageUrl: `${STORAGE_BASE_URL}/creative/elegant-01.png`,
    dominantColors: { primary: '#BE185D', secondary: '#EC4899' },
  },
  {
    id: 'crea-mod-01',
    name: 'Modern Art',
    theme: 'creative',
    style: 'modern',
    imageUrl: `${STORAGE_BASE_URL}/creative/modern-01.png`,
    dominantColors: { primary: '#F97316', secondary: '#FB923C' },
  },
  {
    id: 'crea-min-01',
    name: 'Clean Canvas',
    theme: 'creative',
    style: 'minimal',
    imageUrl: `${STORAGE_BASE_URL}/creative/minimal-01.png`,
    dominantColors: { primary: '#78716C', secondary: '#A8A29E' },
  },
  {
    id: 'crea-vib-01',
    name: 'Color Splash',
    theme: 'creative',
    style: 'vibrant',
    imageUrl: `${STORAGE_BASE_URL}/creative/vibrant-01.png`,
    dominantColors: { primary: '#EF4444', secondary: '#F59E0B' },
  },
  {
    id: 'crea-cla-01',
    name: 'Classic Creative',
    theme: 'creative',
    style: 'classic',
    imageUrl: `${STORAGE_BASE_URL}/creative/classic-01.png`,
    dominantColors: { primary: '#9333EA', secondary: '#C084FC' },
  },

  // Nature Theme
  {
    id: 'natu-ele-01',
    name: 'Forest Elite',
    theme: 'nature',
    style: 'elegant',
    imageUrl: `${STORAGE_BASE_URL}/nature/elegant-01.png`,
    dominantColors: { primary: '#047857', secondary: '#059669' },
  },
  {
    id: 'natu-mod-01',
    name: 'Eco Modern',
    theme: 'nature',
    style: 'modern',
    imageUrl: `${STORAGE_BASE_URL}/nature/modern-01.png`,
    dominantColors: { primary: '#16A34A', secondary: '#22C55E' },
  },
  {
    id: 'natu-min-01',
    name: 'Clean Green',
    theme: 'nature',
    style: 'minimal',
    imageUrl: `${STORAGE_BASE_URL}/nature/minimal-01.png`,
    dominantColors: { primary: '#65A30D', secondary: '#84CC16' },
  },
  {
    id: 'natu-vib-01',
    name: 'Spring Bloom',
    theme: 'nature',
    style: 'vibrant',
    imageUrl: `${STORAGE_BASE_URL}/nature/vibrant-01.png`,
    dominantColors: { primary: '#22C55E', secondary: '#4ADE80' },
  },
  {
    id: 'natu-cla-01',
    name: 'Classic Nature',
    theme: 'nature',
    style: 'classic',
    imageUrl: `${STORAGE_BASE_URL}/nature/classic-01.png`,
    dominantColors: { primary: '#15803D', secondary: '#16A34A' },
  },

  // Awards Theme
  {
    id: 'awar-ele-01',
    name: 'Golden Trophy',
    theme: 'awards',
    style: 'elegant',
    imageUrl: `${STORAGE_BASE_URL}/awards/elegant-01.png`,
    dominantColors: { primary: '#1F2937', secondary: '#D4AF37' },
  },
  {
    id: 'awar-mod-01',
    name: 'Modern Award',
    theme: 'awards',
    style: 'modern',
    imageUrl: `${STORAGE_BASE_URL}/awards/modern-01.png`,
    dominantColors: { primary: '#6366F1', secondary: '#818CF8' },
  },
  {
    id: 'awar-min-01',
    name: 'Simple Honor',
    theme: 'awards',
    style: 'minimal',
    imageUrl: `${STORAGE_BASE_URL}/awards/minimal-01.png`,
    dominantColors: { primary: '#4F46E5', secondary: '#6366F1' },
  },
  {
    id: 'awar-vib-01',
    name: 'Champion',
    theme: 'awards',
    style: 'vibrant',
    imageUrl: `${STORAGE_BASE_URL}/awards/vibrant-01.png`,
    dominantColors: { primary: '#DC2626', secondary: '#F59E0B' },
  },
  {
    id: 'awar-cla-01',
    name: 'Classic Award',
    theme: 'awards',
    style: 'classic',
    imageUrl: `${STORAGE_BASE_URL}/awards/classic-01.png`,
    dominantColors: { primary: '#7C3AED', secondary: '#9333EA' },
  },
];

/**
 * Get filtered backgrounds by theme and style
 */
export function getFilteredImageBackgrounds(
  themeFilter: string,
  styleFilter: string
): CertificateImageBackground[] {
  return CERTIFICATE_IMAGE_BACKGROUNDS.filter(bg => {
    const matchesTheme = themeFilter === 'all' || bg.theme === themeFilter;
    const matchesStyle = styleFilter === 'all' || bg.style === styleFilter;
    return matchesTheme && matchesStyle;
  });
}
