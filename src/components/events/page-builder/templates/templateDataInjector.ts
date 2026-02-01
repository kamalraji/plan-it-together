import { format } from 'date-fns';

export interface EventTemplateData {
  name: string;
  description?: string;
  organizationName?: string;
  startDate?: string;
  endDate?: string;
  mode?: string;
  category?: string;
  capacity?: number;
}

/**
 * Injects real event data into template HTML by replacing common placeholders
 */
export function injectEventDataIntoTemplate(html: string, eventData: EventTemplateData): string {
  let result = html;
  
  const formatEventDate = (dateStr?: string): string => {
    if (!dateStr) return 'TBD';
    try {
      return format(new Date(dateStr), 'MMMM d, yyyy');
    } catch {
      return 'TBD';
    }
  };

  const formatDateRange = (startDate?: string, endDate?: string): string => {
    if (!startDate) return 'TBD';
    try {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : null;
      
      if (end && start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
        return `${format(start, 'MMMM d')}-${format(end, 'd, yyyy')}`;
      } else if (end) {
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
      }
      return format(start, 'MMMM d, yyyy');
    } catch {
      return 'TBD';
    }
  };

  const getEventModeLabel = (mode?: string): string => {
    switch (mode) {
      case 'IN_PERSON': return 'In-Person Event';
      case 'VIRTUAL': return 'Virtual Event';
      case 'HYBRID': return 'Hybrid Event';
      default: return 'Event';
    }
  };

  const eventName = eventData.name || 'Your Event';
  const eventDescription = eventData.description || 'Join us for an amazing event experience';
  const formattedDate = formatEventDate(eventData.startDate);
  const dateRange = formatDateRange(eventData.startDate, eventData.endDate);
  const modeLabel = getEventModeLabel(eventData.mode);

  // ============================================
  // TEMPLATE: Tech Conference
  // ============================================
  result = result.replace(/TechConf 2025/g, eventName);
  result = result.replace(/The Future of Innovation Starts Here/g, eventDescription);
  result = result.replace(/March 15-17, 2025 • San Francisco, CA/g, `${dateRange} • ${modeLabel}`);

  // ============================================
  // TEMPLATE: Hackathon Night
  // ============================================
  result = result.replace(/HACK<span style="color: #22c55e;">NIGHT<\/span> 2025/g, `<span style="color: #22c55e;">${eventName}</span>`);
  result = result.replace(/Build something extraordinary\. Compete with the best\. Win big prizes\./g, eventDescription);

  // ============================================
  // TEMPLATE: Workshop Minimal
  // ============================================
  result = result.replace(/Online Workshop/g, modeLabel);
  result = result.replace(/Master Design Systems/g, eventName);
  result = result.replace(/Learn how to build scalable design systems from scratch in this hands-on 4-hour workshop\./g, eventDescription);
  result = result.replace(/Jan 20, 2025/g, formattedDate);

  // ============================================
  // TEMPLATE: Community Meetup (Vibrant)
  // ============================================
  result = result.replace(/MONTHLY MEETUP/g, eventData.category?.toUpperCase() || 'EVENT');
  result = result.replace(/Design & Coffee ☕/g, eventName);
  result = result.replace(/Design &amp; Coffee ☕/g, eventName);
  result = result.replace(/Every first Friday of the month/g, eventDescription);
  result = result.replace(/The Roastery, 123 Main St, Downtown/g, modeLabel);

  // ============================================
  // TEMPLATE: Gala Night (Celebration Elegant)
  // ============================================
  result = result.replace(/Annual Gala/g, eventName);
  result = result.replace(/An Evening of Elegance/g, eventDescription);
  result = result.replace(/December 31, 2025 • The Grand Ballroom/g, `${formattedDate} • ${modeLabel}`);

  // ============================================
  // TEMPLATE: Professional Webinar
  // ============================================
  result = result.replace(/FREE WEBINAR/g, modeLabel.toUpperCase());
  result = result.replace(/Building High-Performance Remote Teams/g, eventName);
  result = result.replace(/Join industry experts as they share proven strategies for managing distributed teams effectively\./g, eventDescription);
  result = result.replace(/Jan 25, 2025/g, formattedDate);

  // ============================================
  // TEMPLATE: SaaS Product Launch
  // ============================================
  result = result.replace(/LAUNCHING SOON/g, eventData.category?.toUpperCase() || 'EVENT');
  result = result.replace(/The Future of<br\/><span style="background: linear-gradient\(135deg, #6366f1, #a855f7, #ec4899\); background-clip: text; -webkit-background-clip: text; color: transparent;">AI Productivity<\/span>/g, 
    `<span style="background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899); background-clip: text; -webkit-background-clip: text; color: transparent;">${eventName}</span>`);
  result = result.replace(/Be the first to experience our revolutionary platform that transforms how teams work together\./g, eventDescription);

  // ============================================
  // TEMPLATE: Creative Summit
  // ============================================
  result = result.replace(/APRIL 20-22, 2025/g, dateRange.toUpperCase());
  result = result.replace(/Create\.<br\/>Inspire\.<br\/>Transform\./g, eventName);
  result = result.replace(/Three days of groundbreaking talks, hands-on workshops, and unforgettable networking with the world's most innovative creatives\./g, eventDescription);

  // ============================================
  // TEMPLATE: Startup Demo Day
  // ============================================
  result = result.replace(/Demo Day<br\/>Spring 2025/g, eventName);
  result = result.replace(/Watch the next generation of unicorns pitch to top VCs and angel investors\. Do not miss your chance to discover the future\./g, eventDescription);
  result = result.replace(/March 15, 2025/g, formattedDate);
  result = result.replace(/San Francisco, CA/g, modeLabel);

  // ============================================
  // TEMPLATE: Networking Mixer
  // ============================================
  result = result.replace(/Tech Leaders<br\/>Mixer/g, eventName);
  result = result.replace(/Thursday, February 20th • 6:00 PM/g, formattedDate);
  result = result.replace(/The Rooftop Lounge, Downtown/g, modeLabel);

  return result;
}
