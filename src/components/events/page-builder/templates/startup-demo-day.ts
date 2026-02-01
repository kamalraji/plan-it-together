import { Trophy } from 'lucide-react';
import { TemplateData } from './types';

export const startupDemoDayTemplate: TemplateData = {
  id: 'startup-demo-day',
  name: 'Startup Demo Day',
  category: 'Hackathon',
  description: 'Modern startup pitch event with investor focus',
  thumbnail: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=300&fit=crop',
  icon: Trophy,
  html: `
    <section style="background: #fff; padding: 80px 40px; min-height: 85vh; display: flex; align-items: center;">
      <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center;">
        <div>
          <div style="display: inline-flex; align-items: center; gap: 8px; background: #fef3c7; color: #92400e; padding: 8px 16px; border-radius: 100px; font-size: 0.875rem; font-weight: 600; margin-bottom: 24px;">
            <span>🏆</span> 50+ Startups Pitching
          </div>
          <h1 style="font-size: 4rem; font-weight: 800; color: #111; margin-bottom: 24px; line-height: 1.05; letter-spacing: -0.03em;">Demo Day<br/>Spring 2025</h1>
          <p style="font-size: 1.25rem; color: #666; margin-bottom: 32px; line-height: 1.6;">Watch the next generation of unicorns pitch to top VCs and angel investors. Do not miss your chance to discover the future.</p>
          <div style="display: flex; gap: 24px; margin-bottom: 40px;">
            <div>
              <div style="font-size: 2.5rem; font-weight: 800; color: #111;">$2M+</div>
              <div style="color: #666; font-size: 0.875rem;">In Prizes</div>
            </div>
            <div style="width: 1px; background: #e5e7eb;"></div>
            <div>
              <div style="font-size: 2.5rem; font-weight: 800; color: #111;">100+</div>
              <div style="color: #666; font-size: 0.875rem;">Investors</div>
            </div>
            <div style="width: 1px; background: #e5e7eb;"></div>
            <div>
              <div style="font-size: 2.5rem; font-weight: 800; color: #111;">2K</div>
              <div style="color: #666; font-size: 0.875rem;">Attendees</div>
            </div>
          </div>
          <div style="display: flex; gap: 16px;">
            <a href="#register" style="background: #111; color: #fff; padding: 18px 36px; border-radius: 12px; font-weight: 600; text-decoration: none;">Register Now</a>
            <a href="#startups" style="background: #f3f4f6; color: #111; padding: 18px 36px; border-radius: 12px; font-weight: 600; text-decoration: none;">View Startups</a>
          </div>
        </div>
        <div style="position: relative;">
          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 32px; aspect-ratio: 1; display: flex; align-items: center; justify-content: center;">
            <div style="text-align: center;">
              <div style="font-size: 6rem;">🚀</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: #92400e; margin-top: 16px;">March 15, 2025</div>
              <div style="color: #b45309;">San Francisco, CA</div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section style="padding: 80px 40px; background: #111;">
      <div style="max-width: 1000px; margin: 0 auto; text-align: center;">
        <h2 style="font-size: 2rem; font-weight: 700; color: #fff; margin-bottom: 48px;">Past Winners Have Raised</h2>
        <div style="display: flex; justify-content: center; gap: 64px; flex-wrap: wrap;">
          <div>
            <div style="font-size: 3rem; font-weight: 800; color: #fbbf24;">$50M</div>
            <div style="color: #666;">Series A Average</div>
          </div>
          <div>
            <div style="font-size: 3rem; font-weight: 800; color: #fbbf24;">12</div>
            <div style="color: #666;">Unicorns Created</div>
          </div>
          <div>
            <div style="font-size: 3rem; font-weight: 800; color: #fbbf24;">$1B+</div>
            <div style="color: #666;">Total Raised</div>
          </div>
        </div>
      </div>
    </section>
  `,
  css: '',
};
