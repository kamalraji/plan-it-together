// Template types and categories
export { type TemplateData, type TemplateCategory, TEMPLATE_CATEGORIES } from './types';

// Individual templates
import { techConferenceTemplate } from './tech-conference';
import { hackathonDarkTemplate } from './hackathon-dark';
import { workshopMinimalTemplate } from './workshop-minimal';
import { meetupVibrantTemplate } from './meetup-vibrant';
import { celebrationElegantTemplate } from './celebration-elegant';
import { webinarProfessionalTemplate } from './webinar-professional';
import { saasProductLaunchTemplate } from './saas-product-launch';
import { creativeSummitTemplate } from './creative-summit';
import { startupDemoDayTemplate } from './startup-demo-day';
import { networkingMixerTemplate } from './networking-mixer';

// All templates combined
export const PAGE_TEMPLATES = [
  techConferenceTemplate,
  hackathonDarkTemplate,
  workshopMinimalTemplate,
  meetupVibrantTemplate,
  celebrationElegantTemplate,
  webinarProfessionalTemplate,
  saasProductLaunchTemplate,
  creativeSummitTemplate,
  startupDemoDayTemplate,
  networkingMixerTemplate,
];
