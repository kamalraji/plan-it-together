import { Trophy } from 'lucide-react';
import { TemplateData } from './types';

export const hackathonDarkTemplate: TemplateData = {
  id: 'hackathon-dark',
  name: 'Hackathon Night',
  category: 'Hackathon',
  description: 'High-energy hackathon landing with countdown and prizes',
  thumbnail: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=300&fit=crop',
  icon: Trophy,
  html: `
    <section style="background: linear-gradient(180deg, #000 0%, #0a0a0a 100%); padding: 80px 40px; text-align: center; min-height: 80vh; display: flex; flex-direction: column; justify-content: center; position: relative; overflow: hidden;">
      <div style="position: absolute; inset: 0; background: radial-gradient(circle at 50% 50%, rgba(34,197,94,0.15) 0%, transparent 50%);"></div>
      <div style="position: relative; z-index: 1;">
        <span style="display: inline-block; background: rgba(34,197,94,0.2); color: #22c55e; padding: 8px 16px; border-radius: 100px; font-size: 0.875rem; font-weight: 600; margin-bottom: 24px; border: 1px solid rgba(34,197,94,0.3);">48 HOURS • $50K IN PRIZES</span>
        <h1 style="font-size: 4.5rem; font-weight: 900; color: #fff; margin-bottom: 16px; letter-spacing: -0.03em;">HACK<span style="color: #22c55e;">NIGHT</span> 2025</h1>
        <p style="font-size: 1.25rem; color: rgba(255,255,255,0.6); margin-bottom: 48px; max-width: 600px; margin-left: auto; margin-right: auto;">Build something extraordinary. Compete with the best. Win big prizes.</p>
        <div style="display: flex; gap: 24px; justify-content: center; margin-bottom: 48px;">
          <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px 32px;">
            <div style="font-size: 3rem; font-weight: 800; color: #22c55e;">15</div>
            <div style="color: rgba(255,255,255,0.5); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em;">Days</div>
          </div>
          <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px 32px;">
            <div style="font-size: 3rem; font-weight: 800; color: #22c55e;">08</div>
            <div style="color: rgba(255,255,255,0.5); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em;">Hours</div>
          </div>
          <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px 32px;">
            <div style="font-size: 3rem; font-weight: 800; color: #22c55e;">42</div>
            <div style="color: rgba(255,255,255,0.5); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em;">Mins</div>
          </div>
        </div>
        <a href="#register" style="display: inline-block; background: #22c55e; color: #000; padding: 18px 48px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 1.1rem;">Register Your Team</a>
      </div>
    </section>
    <section style="padding: 80px 40px; background: #0a0a0a;">
      <h2 style="font-size: 2rem; font-weight: 700; color: #fff; text-align: center; margin-bottom: 48px;">Prize Pool</h2>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 900px; margin: 0 auto;">
        <div style="background: linear-gradient(180deg, rgba(234,179,8,0.1) 0%, transparent 100%); border: 1px solid rgba(234,179,8,0.3); border-radius: 16px; padding: 32px; text-align: center;">
          <div style="font-size: 0.75rem; color: #eab308; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">1st Place</div>
          <div style="font-size: 2.5rem; font-weight: 800; color: #fff;">$25,000</div>
        </div>
        <div style="background: linear-gradient(180deg, rgba(156,163,175,0.1) 0%, transparent 100%); border: 1px solid rgba(156,163,175,0.3); border-radius: 16px; padding: 32px; text-align: center;">
          <div style="font-size: 0.75rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">2nd Place</div>
          <div style="font-size: 2.5rem; font-weight: 800; color: #fff;">$15,000</div>
        </div>
        <div style="background: linear-gradient(180deg, rgba(180,83,9,0.1) 0%, transparent 100%); border: 1px solid rgba(180,83,9,0.3); border-radius: 16px; padding: 32px; text-align: center;">
          <div style="font-size: 0.75rem; color: #b45309; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">3rd Place</div>
          <div style="font-size: 2.5rem; font-weight: 800; color: #fff;">$10,000</div>
        </div>
      </div>
    </section>
  `,
  css: '',
};
