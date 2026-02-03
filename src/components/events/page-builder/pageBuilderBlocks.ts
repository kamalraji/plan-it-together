/**
 * GrapesJS block definitions for the Event Page Builder
 */
import { format } from 'date-fns';

interface HeroBlockProps {
  name: string;
  description: string;
  logoUrl?: string;
  organizationName?: string;
}

export interface EventTemplateData {
  name: string;
  description: string;
  organizationName?: string;
  startDate?: string;
  endDate?: string;
  mode?: 'in_person' | 'virtual' | 'hybrid';
  capacity?: number | null;
  category?: string | null;
}

function formatEventDate(dateString?: string): string {
  if (!dateString) return 'Date TBD';
  try {
    return format(new Date(dateString), "EEEE, MMMM d, yyyy 'at' h:mm a");
  } catch {
    return 'Date TBD';
  }
}

function getModeLabel(mode?: string): string {
  switch (mode) {
    case 'virtual': return 'Virtual Event';
    case 'in_person': return 'In-Person Event';
    case 'hybrid': return 'Hybrid Event';
    default: return 'Event';
  }
}

function getModeIcon(mode?: string): string {
  switch (mode) {
    case 'virtual': return '🌐';
    case 'in_person': return '📍';
    case 'hybrid': return '🔄';
    default: return '📍';
  }
}

export function heroBlockHtml({ name, description, logoUrl }: HeroBlockProps): string {
  const safeName = name || 'Your event name';
  const safeDescription = description || 'Add a short description to explain why this event matters.';

  const logoImg = logoUrl
    ? `<div class="hero-logo" aria-hidden="true"><img src="${logoUrl}" alt="${safeName} logo" /></div>`
    : '';

  return `
  <header class="hero" data-type="hero">
    <div class="hero-inner">
      ${logoImg}
      <p class="eyebrow">Hosted on Thittam1Hub</p>
      <h1>${safeName}</h1>
      <p class="lead">${safeDescription}</p>
      <div class="hero-meta" aria-label="Event key info">
        <span class="pill">Date &amp; time</span>
        <span class="pill">Location or virtual link</span>
        <span class="pill">Limited seats • Reserve now</span>
      </div>
      <div class="cta-row" aria-label="Primary actions">
        <a href="#registration" class="btn-primary">Register now</a>
        <a href="#schedule" class="btn-secondary">View schedule</a>
      </div>
    </div>
  </header>
  `;
}

/**
 * Initial template that mirrors the PublicEventPage layout with real event data
 */
export function getInitialPublicEventTemplate(data: EventTemplateData): string {
  const safeName = data.name || 'Your Event Name';
  const safeDescription = data.description || 'Add a compelling description for your event.';
  const orgName = data.organizationName || 'Your Organization';
  
  const formattedDate = formatEventDate(data.startDate);
  const modeLabel = getModeLabel(data.mode);
  const modeIcon = getModeIcon(data.mode);
  const capacityText = data.capacity ? `${data.capacity} spots` : 'Limited spots';
  const locationLabel = data.mode === 'virtual' ? 'Online' : data.mode === 'hybrid' ? 'Hybrid' : 'In-Person';

  return `
  <!-- Hero Section - matches PublicEventPage with cyan-purple gradient -->
  <section id="hero" class="public-hero" data-type="hero">
    <div class="public-hero-overlay">
      <div class="public-hero-container">
        <h1 class="public-hero-title">${safeName}</h1>
        
        <p class="public-hero-description">${safeDescription}</p>

        <!-- Quick info badges with real data -->
        <div class="info-chips">
          <div class="info-chip">
            <span class="chip-icon">📅</span>
            <span>${formattedDate}</span>
          </div>
          <div class="info-chip">
            <span class="chip-icon">${modeIcon}</span>
            <span>${modeLabel}</span>
          </div>
          <div class="info-chip">
            <span class="chip-icon">👤</span>
            <span>${locationLabel}</span>
          </div>
        </div>

        <!-- CTA row with share icons -->
        <div class="hero-cta-row">
          <a href="#register" class="cta-primary">Register Now</a>
          <span class="cta-secondary">Share:</span>
          <div class="share-icons">
            <span class="share-icon">𝕏</span>
            <span class="share-icon">f</span>
            <span class="share-icon">in</span>
            <span class="share-icon">📋</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Tab Navigation -->
  <nav class="event-tabs">
    <span class="tab-item active">Overview</span>
    <span class="tab-item">Schedule</span>
    <span class="tab-item">Prizes</span>
    <span class="tab-item">Sponsors</span>
  </nav>

  <!-- Main Content Section -->
  <section id="details" class="public-details">
    <div class="details-container">
      <!-- Main content area -->
      <div class="details-main">
        <!-- About Card -->
        <div id="about" class="content-card">
          <h2 class="card-title">About This Event</h2>
          <p class="card-content">${safeDescription}</p>
          <p class="card-content">Join us for an incredible experience where you'll learn from industry experts, network with peers, and discover new opportunities.</p>
        </div>
      </div>

      <!-- Sidebar -->
      <aside class="details-sidebar">
        <!-- Registration Card -->
        <div id="register" class="sidebar-card">
          <h3 class="sidebar-title">Registration</h3>
          <div class="sidebar-content">
            <div class="detail-row">
              <span class="detail-icon">👥</span>
              <div class="detail-text">
                <p class="detail-label">Capacity</p>
                <p class="detail-value">${capacityText}</p>
              </div>
            </div>
          </div>
          <a href="#" class="sidebar-cta">Register Now</a>
        </div>

        <!-- Organizer Card -->
        <div id="organizer" class="sidebar-card">
          <h3 class="sidebar-title">Organized by</h3>
          <div class="organizer-info">
            <div class="organizer-avatar">${orgName.charAt(0).toUpperCase()}</div>
            <div class="organizer-details">
              <p class="organizer-name">${orgName}</p>
              <p class="organizer-link">View profile →</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </section>
  `;
}

export function scheduleBlockHtml(): string {
  return `
  <section id="schedule" class="schedule" aria-label="Event schedule">
    <h2>Schedule</h2>
    <p class="muted">Outline the key moments so attendees know what to expect.</p>
    <ul>
      <li>
        <strong>09:00 – Check-in &amp; networking</strong>
        <p>Welcome coffee and badge pickup.</p>
      </li>
      <li>
        <strong>10:00 – Opening keynote</strong>
        <p>Kick off the day with an inspiring keynote.</p>
      </li>
      <li>
        <strong>11:30 – Breakout sessions</strong>
        <p>Parallel tracks tailored to different audiences.</p>
      </li>
    </ul>
  </section>
  `;
}

export function registrationBlockHtml(): string {
  return `
  <section id="registration" class="registration" aria-label="Registration form">
    <h2>Reserve your seat</h2>
    <p class="muted">This is a visual-only form. Actual registration happens on the main Thittam1Hub flow.</p>
    <form>
      <label>
        Full name
        <input type="text" name="name" placeholder="Jane Doe" />
      </label>
      <label>
        Email address
        <input type="email" name="email" placeholder="you@example.com" />
      </label>
      <label>
        Ticket type
        <select name="ticket">
          <option>General admission</option>
          <option>Student</option>
          <option>VIP</option>
        </select>
      </label>
      <button type="button">Complete registration on Thittam1Hub</button>
    </form>
  </section>
  `;
}

export function speakersBlockHtml(): string {
  return `
  <section id="speakers" class="speakers" aria-label="Event speakers">
    <h2>Meet Our Speakers</h2>
    <p class="muted">Learn from industry experts and thought leaders.</p>
    <div class="speakers-grid">
      <div class="speaker-card">
        <div class="speaker-avatar">👤</div>
        <h3>Speaker Name</h3>
        <p class="speaker-role">CEO, Company</p>
        <p class="speaker-bio">Brief bio about the speaker and their expertise.</p>
      </div>
      <div class="speaker-card">
        <div class="speaker-avatar">👤</div>
        <h3>Speaker Name</h3>
        <p class="speaker-role">CTO, Company</p>
        <p class="speaker-bio">Brief bio about the speaker and their expertise.</p>
      </div>
      <div class="speaker-card">
        <div class="speaker-avatar">👤</div>
        <h3>Speaker Name</h3>
        <p class="speaker-role">Director, Company</p>
        <p class="speaker-bio">Brief bio about the speaker and their expertise.</p>
      </div>
    </div>
  </section>
  `;
}

export function sponsorsBlockHtml(): string {
  return `
  <section id="sponsors" class="sponsors" aria-label="Event sponsors">
    <h2>Our Sponsors</h2>
    <p class="muted">This event is made possible by our generous sponsors.</p>
    <div class="sponsors-tier">
      <h3 class="tier-label">Platinum</h3>
      <div class="sponsors-row">
        <div class="sponsor-logo">Logo</div>
        <div class="sponsor-logo">Logo</div>
      </div>
    </div>
    <div class="sponsors-tier">
      <h3 class="tier-label">Gold</h3>
      <div class="sponsors-row">
        <div class="sponsor-logo sponsor-gold">Logo</div>
        <div class="sponsor-logo sponsor-gold">Logo</div>
        <div class="sponsor-logo sponsor-gold">Logo</div>
      </div>
    </div>
    <div class="sponsors-tier">
      <h3 class="tier-label">Silver</h3>
      <div class="sponsors-row">
        <div class="sponsor-logo sponsor-silver">Logo</div>
        <div class="sponsor-logo sponsor-silver">Logo</div>
        <div class="sponsor-logo sponsor-silver">Logo</div>
        <div class="sponsor-logo sponsor-silver">Logo</div>
      </div>
    </div>
  </section>
  `;
}

export function faqBlockHtml(): string {
  return `
  <section id="faq" class="faq" aria-label="Frequently asked questions">
    <h2>Frequently Asked Questions</h2>
    <p class="muted">Find answers to common questions about the event.</p>
    <div class="faq-list">
      <details class="faq-item">
        <summary>What is the refund policy?</summary>
        <p>Full refunds are available up to 7 days before the event. After that, tickets are non-refundable but can be transferred.</p>
      </details>
      <details class="faq-item">
        <summary>Is there parking available?</summary>
        <p>Yes, free parking is available at the venue. VIP ticket holders get reserved spots near the entrance.</p>
      </details>
      <details class="faq-item">
        <summary>Can I get a certificate of attendance?</summary>
        <p>Yes! All registered attendees will receive a digital certificate after completing the event.</p>
      </details>
      <details class="faq-item">
        <summary>Will sessions be recorded?</summary>
        <p>Select keynote sessions will be recorded and shared with registered attendees after the event.</p>
      </details>
    </div>
  </section>
  `;
}

export function countdownBlockHtml(): string {
  return `
  <section id="countdown" class="countdown" aria-label="Event countdown">
    <h2>Event Starts In</h2>
    <div class="countdown-timer">
      <div class="countdown-unit">
        <span class="countdown-value">00</span>
        <span class="countdown-label">Days</span>
      </div>
      <div class="countdown-unit">
        <span class="countdown-value">00</span>
        <span class="countdown-label">Hours</span>
      </div>
      <div class="countdown-unit">
        <span class="countdown-value">00</span>
        <span class="countdown-label">Minutes</span>
      </div>
      <div class="countdown-unit">
        <span class="countdown-value">00</span>
        <span class="countdown-label">Seconds</span>
      </div>
    </div>
    <p class="muted">Don't miss out – register now to secure your spot!</p>
  </section>
  `;
}

export function videoBlockHtml(): string {
  return `
  <section id="video" class="video-section" aria-label="Event video">
    <h2>Watch the Highlights</h2>
    <p class="muted">Get a glimpse of what to expect at our event.</p>
    <div class="video-wrapper">
      <div class="video-placeholder">
        <div class="play-button">▶</div>
        <p>Click to add video URL</p>
      </div>
    </div>
  </section>
  `;
}

export function galleryBlockHtml(): string {
  return `
  <section id="gallery" class="gallery" aria-label="Event gallery">
    <h2>Event Gallery</h2>
    <p class="muted">Explore photos from our previous events and venue.</p>
    <div class="gallery-grid">
      <div class="gallery-item gallery-item-large">
        <div class="gallery-placeholder">📷 Main Photo</div>
      </div>
      <div class="gallery-item">
        <div class="gallery-placeholder">📷</div>
      </div>
      <div class="gallery-item">
        <div class="gallery-placeholder">📷</div>
      </div>
      <div class="gallery-item">
        <div class="gallery-placeholder">📷</div>
      </div>
      <div class="gallery-item">
        <div class="gallery-placeholder">📷</div>
      </div>
    </div>
  </section>
  `;
}

export function ctaBlockHtml(): string {
  return `
  <section id="cta" class="cta-section" aria-label="Call to action">
    <div class="cta-content">
      <h2>Ready to Join Us?</h2>
      <p>Don't miss this opportunity to connect, learn, and grow with industry leaders.</p>
      <div class="cta-buttons">
        <a href="#registration" class="btn-primary btn-large">Register Now</a>
        <a href="#contact" class="btn-secondary btn-large">Contact Us</a>
      </div>
    </div>
  </section>
  `;
}

export function venueBlockHtml(): string {
  return `
  <section id="venue" class="venue" aria-label="Event venue">
    <h2>Event Venue</h2>
    <p class="muted">Find us at the heart of the city.</p>
    <div class="venue-content">
      <div class="venue-map">
        <div class="map-placeholder">🗺️ Map</div>
      </div>
      <div class="venue-details">
        <h3>Conference Center</h3>
        <p class="venue-address">123 Event Street<br/>City, State 12345</p>
        <div class="venue-features">
          <span class="venue-feature">🅿️ Free Parking</span>
          <span class="venue-feature">♿ Accessible</span>
          <span class="venue-feature">🍽️ Catering</span>
          <span class="venue-feature">📶 Wi-Fi</span>
        </div>
        <a href="#" class="btn-secondary">Get Directions</a>
      </div>
    </div>
  </section>
  `;
}
