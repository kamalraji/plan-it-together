import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Check, Sparkles, Calendar, Mic2, Trophy, GraduationCap, PartyPopper } from 'lucide-react';

export interface TemplateData {
  id: string;
  name: string;
  category: 'Conference' | 'Hackathon' | 'Workshop' | 'Meetup' | 'Celebration' | 'Webinar';
  description: string;
  thumbnail: string;
  icon: React.ElementType;
  html: string;
  css: string;
}

interface TemplatesGalleryProps {
  onSelectTemplate: (template: TemplateData) => void;
  selectedTemplateId?: string;
}

export const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'All Templates' },
  { id: 'Conference', label: 'Conference' },
  { id: 'Hackathon', label: 'Hackathon' },
  { id: 'Workshop', label: 'Workshop' },
  { id: 'Meetup', label: 'Meetup' },
  { id: 'Celebration', label: 'Celebration' },
  { id: 'Webinar', label: 'Webinar' },
];

// Pre-built landing page templates
export const PAGE_TEMPLATES: TemplateData[] = [
  {
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
  },
  {
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
  },
  {
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
          <h2 style="font-size: 2rem; font-weight: 700; color: #111; margin-bottom: 40px; text-align: center;">What You'll Learn</h2>
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
  },
  {
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
  },
  {
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
          <div style="font-size: 0.75rem; color: #d4af37; text-transform: uppercase; letter-spacing: 0.3em; margin-bottom: 24px;">You're Invited To</div>
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
              <div style="color: #d4af37; font-size: 2rem; margin-bottom: 16px; font-family: serif;">6:00 PM</div>
              <div style="color: rgba(255,255,255,0.8); font-size: 0.9rem;">Cocktail Reception</div>
            </div>
            <div>
              <div style="color: #d4af37; font-size: 2rem; margin-bottom: 16px; font-family: serif;">7:30 PM</div>
              <div style="color: rgba(255,255,255,0.8); font-size: 0.9rem;">Gala Dinner</div>
            </div>
            <div>
              <div style="color: #d4af37; font-size: 2rem; margin-bottom: 16px; font-family: serif;">10:00 PM</div>
              <div style="color: rgba(255,255,255,0.8); font-size: 0.9rem;">Dancing & Celebration</div>
            </div>
          </div>
        </div>
      </section>
    `,
    css: '',
  },
  {
    id: 'webinar-professional',
    name: 'Professional Webinar',
    category: 'Webinar',
    description: 'Clean professional design for online webinars',
    thumbnail: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=400&h=300&fit=crop',
    icon: Sparkles,
    html: `
      <section style="background: #fff; padding: 80px 40px; min-height: 70vh; display: flex; align-items: center;">
        <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center;">
          <div>
            <span style="display: inline-block; color: #6366f1; font-size: 0.875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px;">FREE WEBINAR</span>
            <h1 style="font-size: 3rem; font-weight: 700; color: #111; margin-bottom: 24px; line-height: 1.2;">The Future of Remote Work in 2025</h1>
            <p style="font-size: 1.1rem; color: #666; margin-bottom: 32px; line-height: 1.7;">Join industry leaders as they share insights on building successful remote-first organizations.</p>
            <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
              <div style="display: flex; gap: 32px;">
                <div>
                  <div style="font-size: 0.75rem; color: #666; text-transform: uppercase; margin-bottom: 4px;">Date</div>
                  <div style="font-weight: 600; color: #111;">Feb 15, 2025</div>
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
  },
];

export const TemplatesGallery: React.FC<TemplatesGalleryProps> = ({
  onSelectTemplate,
  selectedTemplateId,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const filteredTemplates = activeCategory === 'all'
    ? PAGE_TEMPLATES
    : PAGE_TEMPLATES.filter(t => t.category === activeCategory);

  return (
    <div className="space-y-4">
      {/* Category filters */}
      <div className="flex flex-wrap gap-1.5 pb-2">
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              'px-2.5 py-1 text-xs rounded-md transition-colors',
              activeCategory === cat.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-[hsl(220,13%,15%)] text-muted-foreground hover:text-foreground'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Templates grid */}
      <div className="grid grid-cols-1 gap-3">
        {filteredTemplates.map((template) => {
          const Icon = template.icon;
          const isSelected = selectedTemplateId === template.id;
          const isHovered = hoveredTemplate === template.id;

          return (
            <motion.button
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
              className={cn(
                'relative rounded-lg overflow-hidden text-left transition-all border',
                isSelected
                  ? 'border-primary ring-1 ring-primary'
                  : 'border-[hsl(220,13%,20%)] hover:border-[hsl(220,13%,30%)]'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Thumbnail */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
                <div className={cn(
                  'absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity',
                  isHovered ? 'opacity-100' : 'opacity-70'
                )} />
                
                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}

                {/* Category badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm">
                  <Icon className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-medium text-white">{template.category}</span>
                </div>

                {/* Info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h4 className="font-medium text-white text-sm mb-0.5">{template.name}</h4>
                  <p className="text-[11px] text-white/70 line-clamp-1">{template.description}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default TemplatesGallery;
