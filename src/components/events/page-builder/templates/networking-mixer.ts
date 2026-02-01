import { Calendar } from 'lucide-react';
import { TemplateData } from './types';

export const networkingMixerTemplate: TemplateData = {
  id: 'networking-mixer',
  name: 'Networking Mixer',
  category: 'Meetup',
  description: 'Casual yet professional networking event design',
  thumbnail: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop',
  icon: Calendar,
  html: `
    <section style="background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%); padding: 80px 40px; text-align: center; min-height: 80vh; display: flex; flex-direction: column; justify-content: center; position: relative;">
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 600px; height: 600px; background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%); pointer-events: none;"></div>
      <div style="position: relative; z-index: 1;">
        <div style="display: inline-flex; items-center; gap: 12px; margin-bottom: 32px;">
          <span style="font-size: 2rem;">🍸</span>
          <span style="color: rgba(255,255,255,0.5); font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.2em;">EXCLUSIVE EVENT</span>
          <span style="font-size: 2rem;">✨</span>
        </div>
        <h1 style="font-size: 4rem; font-weight: 700; color: #fff; margin-bottom: 16px; letter-spacing: -0.02em;">Tech Leaders<br/>Mixer</h1>
        <p style="font-size: 1.25rem; color: rgba(255,255,255,0.6); margin-bottom: 8px;">Thursday, February 20th • 6:00 PM</p>
        <p style="font-size: 1rem; color: rgba(255,255,255,0.4); margin-bottom: 48px;">The Rooftop Lounge, Downtown</p>
        <a href="#rsvp" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; padding: 18px 48px; border-radius: 100px; font-weight: 600; text-decoration: none; box-shadow: 0 10px 40px rgba(99,102,241,0.3);">RSVP Now — Limited Spots</a>
      </div>
    </section>
    <section style="padding: 80px 40px; background: #0f0f1a;">
      <div style="max-width: 900px; margin: 0 auto;">
        <h2 style="font-size: 1.5rem; font-weight: 600; color: #fff; text-align: center; margin-bottom: 48px;">What is Included</h2>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; text-align: center;">
          <div>
            <div style="font-size: 3rem; margin-bottom: 16px;">🍷</div>
            <h3 style="color: #fff; font-weight: 600; margin-bottom: 8px;">Open Bar</h3>
            <p style="color: rgba(255,255,255,0.5); font-size: 0.875rem;">Premium drinks included</p>
          </div>
          <div>
            <div style="font-size: 3rem; margin-bottom: 16px;">🍽️</div>
            <h3 style="color: #fff; font-weight: 600; margin-bottom: 8px;">Gourmet Bites</h3>
            <p style="color: rgba(255,255,255,0.5); font-size: 0.875rem;">Chef-curated appetizers</p>
          </div>
          <div>
            <div style="font-size: 3rem; margin-bottom: 16px;">🎵</div>
            <h3 style="color: #fff; font-weight: 600; margin-bottom: 8px;">Live DJ</h3>
            <p style="color: rgba(255,255,255,0.5); font-size: 0.875rem;">Ambient vibes all night</p>
          </div>
          <div>
            <div style="font-size: 3rem; margin-bottom: 16px;">🤝</div>
            <h3 style="color: #fff; font-weight: 600; margin-bottom: 8px;">Speed Networking</h3>
            <p style="color: rgba(255,255,255,0.5); font-size: 0.875rem;">Curated connections</p>
          </div>
        </div>
      </div>
    </section>
    <section style="padding: 60px 40px; background: linear-gradient(135deg, #6366f1, #8b5cf6);">
      <div style="max-width: 600px; margin: 0 auto; text-align: center;">
        <h2 style="font-size: 2rem; font-weight: 700; color: #fff; margin-bottom: 16px;">Only 50 Spots Available</h2>
        <p style="color: rgba(255,255,255,0.8); margin-bottom: 32px;">This is an invite-only event. Secure your spot before it is too late.</p>
        <a href="#rsvp" style="display: inline-block; background: #fff; color: #6366f1; padding: 16px 48px; border-radius: 100px; font-weight: 600; text-decoration: none;">Request Invite</a>
      </div>
    </section>
  `,
  css: '',
};
