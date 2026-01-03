import { Editor } from 'grapesjs';

export interface TemplateData {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnail: string;
  html: string;
  css: string;
}

// Pre-built landing page templates
export const PAGE_TEMPLATES: TemplateData[] = [
  {
    id: 'tech-conference',
    name: 'Tech Conference',
    category: 'Conference',
    description: 'Modern tech conference with speaker lineup',
    thumbnail: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop',
    html: `
      <section style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); padding: 80px 40px; text-align: center; min-height: 80vh; display: flex; flex-direction: column; justify-content: center;">
        <h1 style="font-size: 4rem; font-weight: 800; color: #fff; margin-bottom: 16px; letter-spacing: -0.02em;">TechConf 2025</h1>
        <p style="font-size: 1.5rem; color: rgba(255,255,255,0.8); margin-bottom: 32px;">The Future of Innovation Starts Here</p>
        <p style="font-size: 1.1rem; color: rgba(255,255,255,0.6); margin-bottom: 40px;">March 15-17, 2025 • San Francisco, CA</p>
        <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
          <a href="#register" style="background: #fff; color: #1e1b4b; padding: 16px 32px; border-radius: 8px; font-weight: 600; text-decoration: none;">Register Now</a>
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
    `,
    css: '',
  },
  {
    id: 'hackathon-dark',
    name: 'Hackathon Night',
    category: 'Hackathon',
    description: 'High-energy hackathon with countdown',
    thumbnail: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=300&fit=crop',
    html: `
      <section style="background: linear-gradient(180deg, #000 0%, #0a0a0a 100%); padding: 80px 40px; text-align: center; min-height: 80vh; display: flex; flex-direction: column; justify-content: center; position: relative; overflow: hidden;">
        <div style="position: absolute; inset: 0; background: radial-gradient(circle at 50% 50%, rgba(34,197,94,0.15) 0%, transparent 50%);"></div>
        <div style="position: relative; z-index: 1;">
          <span style="display: inline-block; background: rgba(34,197,94,0.2); color: #22c55e; padding: 8px 16px; border-radius: 100px; font-size: 0.875rem; font-weight: 600; margin-bottom: 24px; border: 1px solid rgba(34,197,94,0.3);">48 HOURS • $50K IN PRIZES</span>
          <h1 style="font-size: 4.5rem; font-weight: 900; color: #fff; margin-bottom: 16px; letter-spacing: -0.03em;">HACK<span style="color: #22c55e;">NIGHT</span> 2025</h1>
          <p style="font-size: 1.25rem; color: rgba(255,255,255,0.6); margin-bottom: 48px; max-width: 600px; margin-left: auto; margin-right: auto;">Build something extraordinary. Compete with the best. Win big prizes.</p>
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
    description: 'Clean design for educational workshops',
    thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=300&fit=crop',
    html: `
      <section style="background: #fafafa; padding: 100px 40px; min-height: 70vh; display: flex; align-items: center;">
        <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center;">
          <div>
            <span style="display: inline-block; background: #dbeafe; color: #1d4ed8; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px;">Online Workshop</span>
            <h1 style="font-size: 3.5rem; font-weight: 700; color: #111; margin-bottom: 24px; line-height: 1.1;">Master Design Systems</h1>
            <p style="font-size: 1.25rem; color: #666; margin-bottom: 32px; line-height: 1.6;">Learn how to build scalable design systems from scratch in this hands-on 4-hour workshop.</p>
            <a href="#register" style="display: inline-block; background: #111; color: #fff; padding: 16px 32px; border-radius: 8px; font-weight: 600; text-decoration: none;">Enroll Now — $149</a>
          </div>
          <div style="background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); border-radius: 24px; aspect-ratio: 4/3;"></div>
        </div>
      </section>
    `,
    css: '',
  },
  {
    id: 'meetup-vibrant',
    name: 'Community Meetup',
    category: 'Meetup',
    description: 'Vibrant design for local meetups',
    thumbnail: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop',
    html: `
      <section style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fbbf24 100%); padding: 80px 40px; text-align: center; min-height: 70vh; display: flex; flex-direction: column; justify-content: center;">
        <span style="display: inline-block; background: rgba(0,0,0,0.1); color: #92400e; padding: 8px 16px; border-radius: 100px; font-size: 0.875rem; font-weight: 600; margin-bottom: 24px;">MONTHLY MEETUP</span>
        <h1 style="font-size: 3.5rem; font-weight: 800; color: #78350f; margin-bottom: 16px;">Design & Coffee ☕</h1>
        <p style="font-size: 1.25rem; color: #92400e; margin-bottom: 8px;">Every first Friday of the month</p>
        <p style="font-size: 1rem; color: rgba(120,53,15,0.7); margin-bottom: 40px;">The Roastery, 123 Main St, Downtown</p>
        <a href="#rsvp" style="display: inline-block; background: #78350f; color: #fff; padding: 16px 40px; border-radius: 100px; font-weight: 600; text-decoration: none;">RSVP for Next Meetup</a>
      </section>
    `,
    css: '',
  },
  {
    id: 'webinar-modern',
    name: 'Webinar Modern',
    category: 'Webinar',
    description: 'Modern webinar registration page',
    thumbnail: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=400&h=300&fit=crop',
    html: `
      <section style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 80px 40px; min-height: 80vh; display: flex; align-items: center;">
        <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center;">
          <div>
            <span style="display: inline-block; background: rgba(59,130,246,0.2); color: #3b82f6; padding: 6px 16px; border-radius: 100px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; margin-bottom: 20px;">Free Webinar</span>
            <h1 style="font-size: 3rem; font-weight: 700; color: #fff; margin-bottom: 20px; line-height: 1.2;">The Future of AI in Business</h1>
            <p style="font-size: 1.1rem; color: rgba(255,255,255,0.7); margin-bottom: 32px;">Join industry experts as they discuss how AI is transforming businesses in 2025.</p>
            <div style="display: flex; gap: 24px; margin-bottom: 32px;">
              <div style="color: rgba(255,255,255,0.6);">
                <div style="font-size: 0.75rem; text-transform: uppercase; margin-bottom: 4px;">Date</div>
                <div style="color: #fff; font-weight: 500;">Jan 25, 2025</div>
              </div>
              <div style="color: rgba(255,255,255,0.6);">
                <div style="font-size: 0.75rem; text-transform: uppercase; margin-bottom: 4px;">Time</div>
                <div style="color: #fff; font-weight: 500;">2:00 PM EST</div>
              </div>
              <div style="color: rgba(255,255,255,0.6);">
                <div style="font-size: 0.75rem; text-transform: uppercase; margin-bottom: 4px;">Duration</div>
                <div style="color: #fff; font-weight: 500;">60 minutes</div>
              </div>
            </div>
            <a href="#register" style="display: inline-block; background: #3b82f6; color: #fff; padding: 16px 40px; border-radius: 8px; font-weight: 600; text-decoration: none;">Register for Free</a>
          </div>
          <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px;">
            <h3 style="color: #fff; font-size: 1.25rem; font-weight: 600; margin-bottom: 24px;">What You'll Learn</h3>
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="color: rgba(255,255,255,0.8); padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; gap: 12px;"><span style="color: #22c55e;">✓</span> AI implementation strategies</li>
              <li style="color: rgba(255,255,255,0.8); padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; gap: 12px;"><span style="color: #22c55e;">✓</span> Real-world case studies</li>
              <li style="color: rgba(255,255,255,0.8); padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; gap: 12px;"><span style="color: #22c55e;">✓</span> ROI measurement techniques</li>
              <li style="color: rgba(255,255,255,0.8); padding: 12px 0; display: flex; align-items: center; gap: 12px;"><span style="color: #22c55e;">✓</span> Q&A with experts</li>
            </ul>
          </div>
        </div>
      </section>
    `,
    css: '',
  },
  {
    id: 'gala-elegant',
    name: 'Gala Night',
    category: 'Celebration',
    description: 'Elegant design for formal galas',
    thumbnail: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400&h=300&fit=crop',
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
    `,
    css: '',
  },
];

/**
 * Templates Plugin for GrapesJS
 * Adds a templates panel with pre-built landing page designs
 */
export function templatesPlugin(editor: Editor) {
  const panelManager = editor.Panels;
  const modal = editor.Modal;

  // Add templates button to the panels
  panelManager.addButton('options', {
    id: 'open-templates',
    className: 'fa fa-th-large',
    command: 'open-templates',
    attributes: { title: 'Templates' },
  });

  // Create templates modal content
  function createTemplatesContent(): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      padding: 20px;
      max-height: 70vh;
      overflow-y: auto;
    `;

    // Category filter
    const categories = ['All', ...new Set(PAGE_TEMPLATES.map(t => t.category))];
    const filterContainer = document.createElement('div');
    filterContainer.style.cssText = `
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    `;

    let activeCategory = 'All';

    const renderTemplates = () => {
      const templatesGrid = container.querySelector('.templates-grid') as HTMLElement;
      if (!templatesGrid) return;

      templatesGrid.innerHTML = '';
      const filtered = activeCategory === 'All' 
        ? PAGE_TEMPLATES 
        : PAGE_TEMPLATES.filter(t => t.category === activeCategory);

      filtered.forEach(template => {
        const card = document.createElement('div');
        card.style.cssText = `
          background: hsl(220, 13%, 15%);
          border: 1px solid hsl(220, 13%, 22%);
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s ease;
        `;
        card.onmouseenter = () => {
          card.style.borderColor = 'hsl(221, 83%, 53%)';
          card.style.transform = 'translateY(-4px)';
        };
        card.onmouseleave = () => {
          card.style.borderColor = 'hsl(220, 13%, 22%)';
          card.style.transform = 'translateY(0)';
        };

        card.innerHTML = `
          <div style="width: 100%; height: 140px; background-image: url('${template.thumbnail}'); background-size: cover; background-position: center;"></div>
          <div style="padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <h4 style="color: #fff; font-size: 14px; font-weight: 600; margin: 0;">${template.name}</h4>
              <span style="background: hsl(220, 13%, 20%); color: hsl(215, 20%, 65%); padding: 4px 8px; border-radius: 4px; font-size: 10px;">${template.category}</span>
            </div>
            <p style="color: hsl(215, 20%, 60%); font-size: 12px; margin: 0;">${template.description}</p>
          </div>
        `;

        card.onclick = () => {
          if (confirm('Apply this template? This will replace your current content.')) {
            editor.DomComponents.clear();
            editor.CssComposer.clear();
            editor.setComponents(template.html);
            if (template.css) {
              editor.setStyle(template.css);
            }
            modal.close();
          }
        };

        templatesGrid.appendChild(card);
      });
    };

    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.textContent = cat;
      btn.style.cssText = `
        background: ${cat === activeCategory ? 'hsl(221, 83%, 53%)' : 'hsl(220, 13%, 15%)'};
        color: ${cat === activeCategory ? '#fff' : 'hsl(215, 20%, 65%)'};
        border: 1px solid ${cat === activeCategory ? 'hsl(221, 83%, 53%)' : 'hsl(220, 13%, 22%)'};
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.15s ease;
      `;
      btn.onmouseenter = () => {
        if (cat !== activeCategory) {
          btn.style.borderColor = 'hsl(221, 83%, 53%)';
        }
      };
      btn.onmouseleave = () => {
        if (cat !== activeCategory) {
          btn.style.borderColor = 'hsl(220, 13%, 22%)';
        }
      };
      btn.onclick = () => {
        activeCategory = cat;
        filterContainer.querySelectorAll('button').forEach(b => {
          const isActive = b.textContent === activeCategory;
          (b as HTMLElement).style.background = isActive ? 'hsl(221, 83%, 53%)' : 'hsl(220, 13%, 15%)';
          (b as HTMLElement).style.color = isActive ? '#fff' : 'hsl(215, 20%, 65%)';
          (b as HTMLElement).style.borderColor = isActive ? 'hsl(221, 83%, 53%)' : 'hsl(220, 13%, 22%)';
        });
        renderTemplates();
      };
      filterContainer.appendChild(btn);
    });

    container.appendChild(filterContainer);

    // Templates grid
    const templatesGrid = document.createElement('div');
    templatesGrid.className = 'templates-grid';
    templatesGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
    `;
    container.appendChild(templatesGrid);

    renderTemplates();

    return container;
  }

  // Add open templates command
  editor.Commands.add('open-templates', {
    run: () => {
      modal.setTitle('Page Templates');
      modal.setContent(createTemplatesContent());
      modal.open();
    },
  });
}
