import { Mic2 } from 'lucide-react';
import { TemplateData } from './types';

export const creativeSummitTemplate: TemplateData = {
  id: 'creative-summit',
  name: 'Creative Summit',
  category: 'Conference',
  description: 'Bold artistic design for creative industry events',
  thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
  icon: Mic2,
  html: `
    <section style="background: #000; padding: 60px 40px; min-height: 100vh; display: flex; align-items: center; position: relative; overflow: hidden;">
      <div style="position: absolute; top: 0; right: 0; width: 60%; height: 100%; background: linear-gradient(45deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3); opacity: 0.8; clip-path: polygon(30% 0, 100% 0, 100% 100%, 0% 100%);"></div>
      <div style="position: relative; z-index: 1; max-width: 600px;">
        <span style="display: inline-block; color: #fff; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3em; margin-bottom: 24px; border-left: 4px solid #ff6b6b; padding-left: 16px;">APRIL 20-22, 2025</span>
        <h1 style="font-size: 5rem; font-weight: 900; color: #fff; margin-bottom: 24px; line-height: 0.95; text-transform: uppercase;">Create.<br/>Inspire.<br/>Transform.</h1>
        <p style="font-size: 1.1rem; color: rgba(255,255,255,0.7); margin-bottom: 40px; line-height: 1.7;">Three days of groundbreaking talks, hands-on workshops, and unforgettable networking with the world's most innovative creatives.</p>
        <div style="display: flex; gap: 16px;">
          <a href="#tickets" style="background: #fff; color: #000; padding: 18px 36px; font-weight: 700; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em;">Get Tickets</a>
          <a href="#speakers" style="background: transparent; color: #fff; padding: 18px 36px; font-weight: 700; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em; border: 2px solid #fff;">Speakers</a>
        </div>
      </div>
    </section>
    <section style="padding: 100px 40px; background: #111;">
      <div style="max-width: 1200px; margin: 0 auto;">
        <h2 style="font-size: 1rem; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 48px;">Featured Speakers</h2>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;">
          <div style="position: relative; aspect-ratio: 3/4; overflow: hidden;">
            <div style="position: absolute; inset: 0; background: linear-gradient(180deg, transparent 50%, #000 100%);"></div>
            <div style="position: absolute; bottom: 24px; left: 24px;">
              <h3 style="color: #fff; font-size: 1.25rem; font-weight: 700; margin-bottom: 4px;">Maya Chen</h3>
              <p style="color: #ff6b6b; font-size: 0.875rem;">Creative Director</p>
            </div>
          </div>
          <div style="position: relative; aspect-ratio: 3/4; overflow: hidden; background: linear-gradient(135deg, #ff6b6b, #feca57);">
            <div style="position: absolute; inset: 0; background: linear-gradient(180deg, transparent 50%, #000 100%);"></div>
            <div style="position: absolute; bottom: 24px; left: 24px;">
              <h3 style="color: #fff; font-size: 1.25rem; font-weight: 700; margin-bottom: 4px;">James Okafor</h3>
              <p style="color: #feca57; font-size: 0.875rem;">Brand Strategist</p>
            </div>
          </div>
          <div style="position: relative; aspect-ratio: 3/4; overflow: hidden; background: linear-gradient(135deg, #48dbfb, #0abde3);">
            <div style="position: absolute; inset: 0; background: linear-gradient(180deg, transparent 50%, #000 100%);"></div>
            <div style="position: absolute; bottom: 24px; left: 24px;">
              <h3 style="color: #fff; font-size: 1.25rem; font-weight: 700; margin-bottom: 4px;">Sofia Rodriguez</h3>
              <p style="color: #48dbfb; font-size: 0.875rem;">Motion Designer</p>
            </div>
          </div>
          <div style="position: relative; aspect-ratio: 3/4; overflow: hidden; background: linear-gradient(135deg, #ff9ff3, #f368e0);">
            <div style="position: absolute; inset: 0; background: linear-gradient(180deg, transparent 50%, #000 100%);"></div>
            <div style="position: absolute; bottom: 24px; left: 24px;">
              <h3 style="color: #fff; font-size: 1.25rem; font-weight: 700; margin-bottom: 4px;">Alex Kim</h3>
              <p style="color: #ff9ff3; font-size: 0.875rem;">UX Lead</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  css: '',
};
