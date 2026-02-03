import { Calendar } from 'lucide-react';
import { TemplateData } from './types';

export const meetupVibrantTemplate: TemplateData = {
  id: 'meetup-vibrant',
  name: 'Community Meetup',
  category: 'Meetup',
  description: 'Vibrant and welcoming design for local meetups',
  thumbnail: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop',
  icon: Calendar,
  html: `
    <section style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fbbf24 100%); padding: 80px 40px; text-align: center; min-height: 70vh; display: flex; flex-direction: column; justify-content: center;">
      <span style="display: inline-block; background: rgba(0,0,0,0.1); color: #92400e; padding: 8px 16px; border-radius: 100px; font-size: 0.875rem; font-weight: 600; margin-bottom: 24px;">MONTHLY MEETUP</span>
      <h1 style="font-size: 3.5rem; font-weight: 800; color: #78350f; margin-bottom: 16px;">Design & Coffee ☕</h1>
      <p style="font-size: 1.25rem; color: #92400e; margin-bottom: 8px;">Every first Friday of the month</p>
      <p style="font-size: 1rem; color: rgba(120,53,15,0.7); margin-bottom: 40px;">The Roastery, 123 Main St, Downtown</p>
      <a href="#rsvp" style="display: inline-block; background: #78350f; color: #fff; padding: 16px 40px; border-radius: 100px; font-weight: 600; text-decoration: none;">RSVP for Next Meetup</a>
    </section>
    <section style="padding: 80px 40px; background: #fffbeb;">
      <div style="max-width: 800px; margin: 0 auto; text-align: center;">
        <h2 style="font-size: 2rem; font-weight: 700; color: #78350f; margin-bottom: 16px;">What to Expect</h2>
        <p style="color: #92400e; margin-bottom: 48px;">A relaxed environment to connect with fellow designers, share ideas, and learn from each other.</p>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px;">
          <div style="padding: 24px;">
            <div style="font-size: 3rem; margin-bottom: 16px;">💬</div>
            <h3 style="font-weight: 600; color: #78350f; margin-bottom: 8px;">Networking</h3>
            <p style="color: #92400e; font-size: 0.9rem;">Meet designers from all backgrounds</p>
          </div>
          <div style="padding: 24px;">
            <div style="font-size: 3rem; margin-bottom: 16px;">🎤</div>
            <h3 style="font-weight: 600; color: #78350f; margin-bottom: 8px;">Lightning Talks</h3>
            <p style="color: #92400e; font-size: 0.9rem;">5-minute talks from community members</p>
          </div>
          <div style="padding: 24px;">
            <div style="font-size: 3rem; margin-bottom: 16px;">🎁</div>
            <h3 style="font-weight: 600; color: #78350f; margin-bottom: 8px;">Swag & Prizes</h3>
            <p style="color: #92400e; font-size: 0.9rem;">Exclusive meetup goodies</p>
          </div>
        </div>
      </div>
    </section>
  `,
  css: '',
};
