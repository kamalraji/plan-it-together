import { GraduationCap } from 'lucide-react';
import { TemplateData } from './types';

export const workshopMinimalTemplate: TemplateData = {
  id: 'workshop-minimal',
  name: 'Workshop Minimal',
  category: 'Workshop',
  description: 'Clean, focused design for educational workshops',
  thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=300&fit=crop',
  icon: GraduationCap,
  html: `
    <section style="background: #fafafa; padding: 100px 40px; min-height: 70vh; display: flex; align-items: center;">
      <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center;">
        <div>
          <span style="display: inline-block; background: #dbeafe; color: #1d4ed8; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px;">Online Workshop</span>
          <h1 style="font-size: 3.5rem; font-weight: 700; color: #111; margin-bottom: 24px; line-height: 1.1;">Master Design Systems</h1>
          <p style="font-size: 1.25rem; color: #666; margin-bottom: 32px; line-height: 1.6;">Learn how to build scalable design systems from scratch in this hands-on 4-hour workshop.</p>
          <div style="display: flex; gap: 16px; margin-bottom: 32px;">
            <div style="display: flex; align-items: center; gap: 8px; color: #666;">
              <span style="font-size: 1.5rem;">📅</span>
              <span>Jan 20, 2025</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; color: #666;">
              <span style="font-size: 1.5rem;">⏱️</span>
              <span>4 Hours</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; color: #666;">
              <span style="font-size: 1.5rem;">💻</span>
              <span>Zoom</span>
            </div>
          </div>
          <a href="#register" style="display: inline-block; background: #111; color: #fff; padding: 16px 32px; border-radius: 8px; font-weight: 600; text-decoration: none;">Enroll Now — $149</a>
        </div>
        <div style="background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); border-radius: 24px; aspect-ratio: 4/3;"></div>
      </div>
    </section>
    <section style="padding: 80px 40px; background: #fff;">
      <div style="max-width: 800px; margin: 0 auto;">
        <h2 style="font-size: 2rem; font-weight: 700; color: #111; margin-bottom: 40px; text-align: center;">What You Will Learn</h2>
        <div style="display: grid; gap: 24px;">
          <div style="display: flex; gap: 16px; align-items: start; padding: 24px; background: #f9fafb; border-radius: 12px;">
            <span style="font-size: 1.5rem;">✓</span>
            <div>
              <h3 style="font-weight: 600; color: #111; margin-bottom: 4px;">Token Architecture</h3>
              <p style="color: #666;">Build a robust foundation with design tokens for colors, typography, and spacing.</p>
            </div>
          </div>
          <div style="display: flex; gap: 16px; align-items: start; padding: 24px; background: #f9fafb; border-radius: 12px;">
            <span style="font-size: 1.5rem;">✓</span>
            <div>
              <h3 style="font-weight: 600; color: #111; margin-bottom: 4px;">Component Library</h3>
              <p style="color: #666;">Create reusable, accessible components that scale with your product.</p>
            </div>
          </div>
          <div style="display: flex; gap: 16px; align-items: start; padding: 24px; background: #f9fafb; border-radius: 12px;">
            <span style="font-size: 1.5rem;">✓</span>
            <div>
              <h3 style="font-weight: 600; color: #111; margin-bottom: 4px;">Documentation</h3>
              <p style="color: #666;">Document your system for seamless team adoption and maintenance.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  css: '',
};
