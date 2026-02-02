import { Sparkles } from 'lucide-react';
import { TemplateData } from './types';

export const saasProductLaunchTemplate: TemplateData = {
  id: 'saas-product-launch',
  name: 'SaaS Product Launch',
  category: 'Conference',
  description: 'Modern gradient design for product launches and demos',
  thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
  icon: Sparkles,
  html: `
    <section style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%); padding: 100px 40px; text-align: center; min-height: 90vh; display: flex; flex-direction: column; justify-content: center; position: relative; overflow: hidden;">
      <div style="position: absolute; top: 20%; left: 10%; width: 300px; height: 300px; background: radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%); filter: blur(60px);"></div>
      <div style="position: absolute; bottom: 20%; right: 10%; width: 400px; height: 400px; background: radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%); filter: blur(80px);"></div>
      <div style="position: relative; z-index: 1;">
        <span style="display: inline-block; background: linear-gradient(135deg, #6366f1, #ec4899); background-clip: text; -webkit-background-clip: text; color: transparent; font-size: 0.875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 24px;">LAUNCHING SOON</span>
        <h1 style="font-size: 4.5rem; font-weight: 800; color: #fff; margin-bottom: 24px; line-height: 1.1; letter-spacing: -0.03em;">The Future of<br/><span style="background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899); background-clip: text; -webkit-background-clip: text; color: transparent;">AI Productivity</span></h1>
        <p style="font-size: 1.25rem; color: rgba(255,255,255,0.7); margin-bottom: 48px; max-width: 600px; margin-left: auto; margin-right: auto;">Be the first to experience our revolutionary platform that transforms how teams work together.</p>
        <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
          <a href="#waitlist" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; padding: 18px 40px; border-radius: 12px; font-weight: 600; text-decoration: none; box-shadow: 0 10px 40px rgba(99,102,241,0.4);">Join the Waitlist</a>
          <a href="#demo" style="background: rgba(255,255,255,0.1); color: #fff; padding: 18px 40px; border-radius: 12px; font-weight: 600; text-decoration: none; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);">Watch Demo →</a>
        </div>
      </div>
    </section>
    <section style="padding: 100px 40px; background: #0f172a;">
      <div style="max-width: 1100px; margin: 0 auto;">
        <h2 style="font-size: 2.5rem; font-weight: 700; color: #fff; text-align: center; margin-bottom: 16px;">Why Choose Us</h2>
        <p style="color: rgba(255,255,255,0.5); text-align: center; margin-bottom: 64px;">Built for modern teams who demand excellence</p>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px;">
          <div style="background: linear-gradient(180deg, rgba(99,102,241,0.1) 0%, transparent 100%); border: 1px solid rgba(99,102,241,0.2); border-radius: 20px; padding: 40px 32px;">
            <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 16px; margin-bottom: 24px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">⚡</div>
            <h3 style="color: #fff; font-size: 1.25rem; font-weight: 600; margin-bottom: 12px;">Lightning Fast</h3>
            <p style="color: rgba(255,255,255,0.6); line-height: 1.6;">Experience blazing fast performance with our optimized infrastructure.</p>
          </div>
          <div style="background: linear-gradient(180deg, rgba(168,85,247,0.1) 0%, transparent 100%); border: 1px solid rgba(168,85,247,0.2); border-radius: 20px; padding: 40px 32px;">
            <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #a855f7, #ec4899); border-radius: 16px; margin-bottom: 24px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">🔒</div>
            <h3 style="color: #fff; font-size: 1.25rem; font-weight: 600; margin-bottom: 12px;">Enterprise Security</h3>
            <p style="color: rgba(255,255,255,0.6); line-height: 1.6;">Bank-grade encryption and compliance you can trust.</p>
          </div>
          <div style="background: linear-gradient(180deg, rgba(236,72,153,0.1) 0%, transparent 100%); border: 1px solid rgba(236,72,153,0.2); border-radius: 20px; padding: 40px 32px;">
            <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #ec4899, #f43f5e); border-radius: 16px; margin-bottom: 24px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">🚀</div>
            <h3 style="color: #fff; font-size: 1.25rem; font-weight: 600; margin-bottom: 12px;">Scale Infinitely</h3>
            <p style="color: rgba(255,255,255,0.6); line-height: 1.6;">From startup to enterprise, we grow with your needs.</p>
          </div>
        </div>
      </div>
    </section>
  `,
  css: '',
};
