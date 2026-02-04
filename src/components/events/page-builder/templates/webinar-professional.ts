import { Sparkles } from 'lucide-react';
import { TemplateData } from './types';

export const webinarProfessionalTemplate: TemplateData = {
  id: 'webinar-professional',
  name: 'Professional Webinar',
  category: 'Webinar',
  description: 'Clean corporate webinar with host profiles',
  thumbnail: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=400&h=300&fit=crop',
  icon: Sparkles,
  html: `
    <section style="background: #fff; padding: 80px 40px; min-height: 80vh; display: flex; align-items: center;">
      <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center;">
        <div>
          <span style="display: inline-block; background: #ede9fe; color: #6366f1; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; margin-bottom: 16px;">FREE WEBINAR</span>
          <h1 style="font-size: 3rem; font-weight: 700; color: #111; margin-bottom: 24px; line-height: 1.15;">Building High-Performance Remote Teams</h1>
          <p style="font-size: 1.1rem; color: #666; margin-bottom: 32px; line-height: 1.7;">Join industry experts as they share proven strategies for managing distributed teams effectively.</p>
          <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; text-align: center;">
              <div>
                <div style="font-size: 0.75rem; color: #666; text-transform: uppercase; margin-bottom: 4px;">Date</div>
                <div style="font-weight: 600; color: #111;">Jan 25, 2025</div>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: #666; text-transform: uppercase; margin-bottom: 4px;">Time</div>
                <div style="font-weight: 600; color: #111;">2:00 PM EST</div>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: #666; text-transform: uppercase; margin-bottom: 4px;">Duration</div>
                <div style="font-weight: 600; color: #111;">60 Minutes</div>
              </div>
            </div>
          </div>
          <a href="#register" style="display: inline-block; background: #6366f1; color: #fff; padding: 16px 32px; border-radius: 8px; font-weight: 600; text-decoration: none;">Reserve Your Spot</a>
        </div>
        <div style="background: #6366f1; border-radius: 24px; aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center;">
          <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <div style="width: 0; height: 0; border-left: 24px solid #fff; border-top: 14px solid transparent; border-bottom: 14px solid transparent; margin-left: 6px;"></div>
          </div>
        </div>
      </div>
    </section>
    <section style="padding: 80px 40px; background: #f9fafb;">
      <div style="max-width: 800px; margin: 0 auto; text-align: center;">
        <h2 style="font-size: 2rem; font-weight: 700; color: #111; margin-bottom: 16px;">Your Hosts</h2>
        <p style="color: #666; margin-bottom: 48px;">Learn from experts with decades of combined experience</p>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px;">
          <div style="background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="width: 80px; height: 80px; background: #e5e7eb; border-radius: 50%; margin: 0 auto 16px;"></div>
            <h3 style="font-weight: 600; color: #111; margin-bottom: 4px;">Alex Rivera</h3>
            <p style="color: #6366f1; font-size: 0.875rem; margin-bottom: 8px;">VP of People Operations</p>
            <p style="color: #666; font-size: 0.875rem;">Former Head of HR at Fortune 500</p>
          </div>
          <div style="background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="width: 80px; height: 80px; background: #e5e7eb; border-radius: 50%; margin: 0 auto 16px;"></div>
            <h3 style="font-weight: 600; color: #111; margin-bottom: 4px;">Jordan Lee</h3>
            <p style="color: #6366f1; font-size: 0.875rem; margin-bottom: 8px;">Remote Work Consultant</p>
            <p style="color: #666; font-size: 0.875rem;">Author of "The Distributed Team"</p>
          </div>
        </div>
      </div>
    </section>
  `,
  css: '',
};
