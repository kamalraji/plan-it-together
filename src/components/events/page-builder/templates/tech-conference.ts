import { Mic2 } from 'lucide-react';
import { TemplateData } from './types';

export const techConferenceTemplate: TemplateData = {
  id: 'tech-conference',
  name: 'Tech Conference',
  category: 'Conference',
  description: 'Modern tech conference with speaker lineup and schedule',
  thumbnail: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop',
  icon: Mic2,
  html: `
    <section style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); padding: 80px 40px; text-align: center; min-height: 80vh; display: flex; flex-direction: column; justify-content: center;">
      <h1 style="font-size: 4rem; font-weight: 800; color: #fff; margin-bottom: 16px; letter-spacing: -0.02em;">TechConf 2025</h1>
      <p style="font-size: 1.5rem; color: rgba(255,255,255,0.8); margin-bottom: 32px;">The Future of Innovation Starts Here</p>
      <p style="font-size: 1.1rem; color: rgba(255,255,255,0.6); margin-bottom: 40px;">March 15-17, 2025 • San Francisco, CA</p>
      <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
        <a href="#register" style="background: #fff; color: #1e1b4b; padding: 16px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; transition: transform 0.2s;">Register Now</a>
        <a href="#speakers" style="background: transparent; color: #fff; padding: 16px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; border: 2px solid rgba(255,255,255,0.3);">View Speakers</a>
      </div>
    </section>
    <section style="padding: 80px 40px; background: #0f0d1a;">
      <h2 style="font-size: 2.5rem; font-weight: 700; color: #fff; text-align: center; margin-bottom: 48px;">Featured Speakers</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 32px; max-width: 1200px; margin: 0 auto;">
        <div style="background: #1a1625; border-radius: 16px; padding: 24px; text-align: center;">
          <div style="width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); margin: 0 auto 16px;"></div>
          <h3 style="color: #fff; font-size: 1.25rem; font-weight: 600; margin-bottom: 4px;">Sarah Chen</h3>
          <p style="color: rgba(255,255,255,0.6); font-size: 0.9rem;">CEO, TechVentures</p>
        </div>
        <div style="background: #1a1625; border-radius: 16px; padding: 24px; text-align: center;">
          <div style="width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, #ec4899, #f43f5e); margin: 0 auto 16px;"></div>
          <h3 style="color: #fff; font-size: 1.25rem; font-weight: 600; margin-bottom: 4px;">Marcus Johnson</h3>
          <p style="color: rgba(255,255,255,0.6); font-size: 0.9rem;">CTO, CloudScale</p>
        </div>
        <div style="background: #1a1625; border-radius: 16px; padding: 24px; text-align: center;">
          <div style="width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, #14b8a6, #06b6d4); margin: 0 auto 16px;"></div>
          <h3 style="color: #fff; font-size: 1.25rem; font-weight: 600; margin-bottom: 4px;">Emily Park</h3>
          <p style="color: rgba(255,255,255,0.6); font-size: 0.9rem;">Head of AI, DataFlow</p>
        </div>
      </div>
    </section>
    <section style="padding: 80px 40px; background: linear-gradient(135deg, #312e81 0%, #4338ca 100%);">
      <div style="max-width: 600px; margin: 0 auto; text-align: center;">
        <h2 style="font-size: 2.5rem; font-weight: 700; color: #fff; margin-bottom: 16px;">Ready to Join?</h2>
        <p style="color: rgba(255,255,255,0.8); margin-bottom: 32px;">Secure your spot at the most anticipated tech event of the year.</p>
        <a href="#register" style="display: inline-block; background: #fff; color: #312e81; padding: 16px 48px; border-radius: 8px; font-weight: 600; text-decoration: none;">Get Your Ticket</a>
      </div>
    </section>
  `,
  css: '',
};
