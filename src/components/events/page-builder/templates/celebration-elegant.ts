import { PartyPopper } from 'lucide-react';
import { TemplateData } from './types';

export const celebrationElegantTemplate: TemplateData = {
  id: 'celebration-elegant',
  name: 'Gala Night',
  category: 'Celebration',
  description: 'Elegant design for formal celebrations and galas',
  thumbnail: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400&h=300&fit=crop',
  icon: PartyPopper,
  html: `
    <section style="background: linear-gradient(180deg, #18181b 0%, #09090b 100%); padding: 100px 40px; text-align: center; min-height: 90vh; display: flex; flex-direction: column; justify-content: center; position: relative;">
      <div style="position: absolute; inset: 0; background: radial-gradient(circle at 50% 0%, rgba(212,175,55,0.1) 0%, transparent 50%);"></div>
      <div style="position: relative; z-index: 1;">
        <div style="font-size: 0.75rem; color: #d4af37; text-transform: uppercase; letter-spacing: 0.3em; margin-bottom: 24px;">You are Invited To</div>
        <h1 style="font-size: 5rem; font-weight: 300; color: #fff; margin-bottom: 8px; font-family: serif; letter-spacing: 0.05em;">Annual Gala</h1>
        <div style="width: 100px; height: 1px; background: linear-gradient(90deg, transparent, #d4af37, transparent); margin: 24px auto;"></div>
        <p style="font-size: 1.25rem; color: rgba(255,255,255,0.6); margin-bottom: 8px; font-family: serif; font-style: italic;">An Evening of Elegance</p>
        <p style="font-size: 1rem; color: rgba(255,255,255,0.4); margin-bottom: 48px;">December 31, 2025 • The Grand Ballroom</p>
        <a href="#rsvp" style="display: inline-block; background: transparent; color: #d4af37; padding: 16px 48px; border-radius: 0; font-weight: 400; text-decoration: none; border: 1px solid #d4af37; letter-spacing: 0.1em; font-size: 0.875rem;">REQUEST INVITATION</a>
      </div>
    </section>
    <section style="padding: 80px 40px; background: #09090b;">
      <div style="max-width: 800px; margin: 0 auto; text-align: center;">
        <h2 style="font-size: 1.5rem; font-weight: 300; color: #fff; margin-bottom: 48px; font-family: serif; letter-spacing: 0.1em;">THE EVENING</h2>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 48px;">
          <div>
            <div style="font-size: 0.75rem; color: #d4af37; margin-bottom: 8px;">6:00 PM</div>
            <div style="color: #fff; font-family: serif;">Cocktail Reception</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: #d4af37; margin-bottom: 8px;">7:30 PM</div>
            <div style="color: #fff; font-family: serif;">Gala Dinner</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: #d4af37; margin-bottom: 8px;">10:00 PM</div>
            <div style="color: #fff; font-family: serif;">Dancing & Entertainment</div>
          </div>
        </div>
      </div>
    </section>
  `,
  css: '',
};
