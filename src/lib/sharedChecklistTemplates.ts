import type { Database } from '@/integrations/supabase/types';

type EventCategory = Database['public']['Enums']['event_category'];

export interface ChecklistTemplateItem {
  title: string;
  description?: string;
}

export interface ChecklistTemplate {
  title: string;
  description: string;
  phase: 'pre_event' | 'during_event' | 'post_event';
  items: ChecklistTemplateItem[];
}

export const EVENT_CATEGORY_TEMPLATES: Partial<Record<EventCategory, ChecklistTemplate[]>> = {
  OTHER: [
    {
      title: 'Event Planning Essentials',
      description: 'Core planning tasks for any event',
      phase: 'pre_event',
      items: [
        { title: 'Define event objectives and success metrics', description: 'Establish clear goals and KPIs' },
        { title: 'Create detailed timeline and milestones', description: 'Map out all key dates' },
        { title: 'Confirm venue and logistics', description: 'Finalize location, layout, and requirements' },
        { title: 'Finalize attendee registration', description: 'Close registration and confirm headcount' },
        { title: 'Brief all team members and volunteers', description: 'Conduct pre-event orientation' },
        { title: 'Test all equipment and technology', description: 'Verify AV, WiFi, and tools work' },
        { title: 'Prepare contingency plans', description: 'Document backup plans for key scenarios' },
      ]
    },
    {
      title: 'Communication & Marketing',
      description: 'Attendee communication and promotion',
      phase: 'pre_event',
      items: [
        { title: 'Send event reminders to attendees', description: 'Email/SMS with key details' },
        { title: 'Prepare event signage and materials', description: 'Banners, programs, name tags' },
        { title: 'Coordinate social media promotion', description: 'Schedule pre-event posts' },
        { title: 'Brief speakers and presenters', description: 'Share schedule and requirements' },
        { title: 'Prepare welcome packets', description: 'Assemble materials for attendees' },
      ]
    },
    {
      title: 'Day-of Operations',
      description: 'Tasks for smooth event execution',
      phase: 'during_event',
      items: [
        { title: 'Set up registration and check-in', description: 'Configure welcome desk' },
        { title: 'Conduct morning team briefing', description: 'Align on day\'s schedule and roles' },
        { title: 'Monitor event flow and timing', description: 'Keep activities on schedule' },
        { title: 'Manage attendee experience', description: 'Address questions and issues' },
        { title: 'Coordinate breaks and refreshments', description: 'Ensure catering runs smoothly' },
        { title: 'Capture photos and content', description: 'Document key moments' },
        { title: 'Monitor safety and security', description: 'Ensure attendee wellbeing' },
      ]
    },
    {
      title: 'Post-Event Wrap-up',
      description: 'Essential follow-up tasks',
      phase: 'post_event',
      items: [
        { title: 'Send thank-you messages', description: 'Appreciate attendees, speakers, sponsors' },
        { title: 'Collect feedback surveys', description: 'Gather attendee insights' },
        { title: 'Process outstanding payments', description: 'Handle invoices and reimbursements' },
        { title: 'Document lessons learned', description: 'Create retrospective notes' },
        { title: 'Share event photos and highlights', description: 'Distribute content to attendees' },
        { title: 'Analyze event metrics', description: 'Review attendance, engagement, ROI' },
        { title: 'Archive event materials', description: 'Store documents for future reference' },
      ]
    }
  ],
  HACKATHON: [
    {
      title: 'Hackathon Preparation',
      description: 'Essential pre-event setup for a successful hackathon',
      phase: 'pre_event',
      items: [
        { title: 'Set up coding environment and tools', description: 'Configure IDEs, APIs, and development resources' },
        { title: 'Prepare judging criteria and rubrics', description: 'Define scoring system and evaluation metrics' },
        { title: 'Configure submission platform', description: 'Set up DevPost or similar platform' },
        { title: 'Brief mentors and judges', description: 'Conduct orientation sessions' },
        { title: 'Test API access and resources', description: 'Verify all sponsor APIs work' },
      ]
    },
    {
      title: 'Hackathon Day-of Operations',
      description: 'Tasks to manage during the hackathon event',
      phase: 'during_event',
      items: [
        { title: 'Deliver kickoff presentation', description: 'Welcome participants and explain rules' },
        { title: 'Monitor team progress', description: 'Check in with teams regularly' },
        { title: 'Conduct mid-event check-ins', description: 'Ensure teams have what they need' },
        { title: 'Coordinate demo sessions', description: 'Organize presentation schedule' },
        { title: 'Facilitate judging rounds', description: 'Manage judges and scoring' },
      ]
    },
    {
      title: 'Hackathon Wrap-up',
      description: 'Post-event tasks and follow-up',
      phase: 'post_event',
      items: [
        { title: 'Announce and celebrate winners', description: 'Awards ceremony and recognition' },
        { title: 'Distribute prizes', description: 'Coordinate prize distribution' },
        { title: 'Collect participant feedback', description: 'Send survey to all participants' },
        { title: 'Archive project submissions', description: 'Document all submissions' },
      ]
    }
  ],
  CONFERENCE: [
    {
      title: 'Speaker Coordination',
      description: 'Manage speaker logistics and materials',
      phase: 'pre_event',
      items: [
        { title: 'Confirm speaker schedules', description: 'Verify all speaker availability' },
        { title: 'Collect presentation materials', description: 'Gather slides and demos' },
        { title: 'Brief AV team on requirements', description: 'Share technical needs' },
        { title: 'Prepare speaker gifts', description: 'Organize appreciation items' },
        { title: 'Create speaker briefing document', description: 'Compile venue and schedule info' },
      ]
    },
    {
      title: 'Conference Day Operations',
      description: 'On-site conference management tasks',
      phase: 'during_event',
      items: [
        { title: 'Manage session timekeeping', description: 'Keep sessions on schedule' },
        { title: 'Coordinate room transitions', description: 'Handle speaker changeovers' },
        { title: 'Monitor attendee flow', description: 'Manage crowd movement' },
        { title: 'Handle Q&A sessions', description: 'Facilitate audience interaction' },
        { title: 'Live-tweet key moments', description: 'Social media coverage' },
      ]
    },
    {
      title: 'Conference Follow-up',
      description: 'Post-conference tasks',
      phase: 'post_event',
      items: [
        { title: 'Share session recordings', description: 'Distribute video content' },
        { title: 'Send thank-you notes to speakers', description: 'Express appreciation' },
        { title: 'Publish conference highlights', description: 'Create recap content' },
        { title: 'Analyze attendance data', description: 'Review session popularity' },
      ]
    }
  ],
  WORKSHOP: [
    {
      title: 'Workshop Preparation',
      description: 'Setup for hands-on learning sessions',
      phase: 'pre_event',
      items: [
        { title: 'Prepare workshop materials', description: 'Create handouts and supplies' },
        { title: 'Set up workstations', description: 'Configure participant stations' },
        { title: 'Test all equipment', description: 'Verify tools and software work' },
        { title: 'Brief facilitators', description: 'Align on teaching approach' },
      ]
    },
    {
      title: 'Workshop Execution',
      description: 'During the workshop session',
      phase: 'during_event',
      items: [
        { title: 'Welcome and introductions', description: 'Set the stage for learning' },
        { title: 'Guide hands-on activities', description: 'Facilitate practical exercises' },
        { title: 'Provide individual support', description: 'Help struggling participants' },
        { title: 'Conduct wrap-up discussion', description: 'Summarize key learnings' },
      ]
    }
  ],
  SYMPOSIUM: [
    {
      title: 'Academic Coordination',
      description: 'Manage academic presentations and papers',
      phase: 'pre_event',
      items: [
        { title: 'Review submitted papers', description: 'Coordinate peer review process' },
        { title: 'Prepare session schedules', description: 'Organize presentation order' },
        { title: 'Coordinate with institutions', description: 'Align with academic partners' },
        { title: 'Prepare certificates', description: 'Create participation certificates' },
      ]
    },
    {
      title: 'Symposium Operations',
      description: 'During the symposium',
      phase: 'during_event',
      items: [
        { title: 'Manage presentation sessions', description: 'Facilitate academic talks' },
        { title: 'Coordinate panel discussions', description: 'Manage expert panels' },
        { title: 'Facilitate networking', description: 'Enable academic connections' },
        { title: 'Document proceedings', description: 'Record key discussions' },
      ]
    }
  ],
  CULTURAL_FEST: [
    {
      title: 'Cultural Event Setup',
      description: 'Prepare for cultural celebrations',
      phase: 'pre_event',
      items: [
        { title: 'Coordinate performance schedules', description: 'Align all acts and performances' },
        { title: 'Set up cultural displays', description: 'Prepare exhibition areas' },
        { title: 'Arrange traditional decorations', description: 'Cultural-themed decor' },
        { title: 'Coordinate food stalls', description: 'Organize cultural cuisine vendors' },
        { title: 'Brief performers', description: 'Technical and timing details' },
      ]
    },
    {
      title: 'Festival Day Operations',
      description: 'Managing the cultural festival',
      phase: 'during_event',
      items: [
        { title: 'Manage stage transitions', description: 'Coordinate performance changes' },
        { title: 'Monitor crowd engagement', description: 'Ensure audience participation' },
        { title: 'Coordinate competitions', description: 'Manage cultural contests' },
        { title: 'Capture event highlights', description: 'Photo and video documentation' },
      ]
    }
  ],
  ORIENTATION: [
    {
      title: 'Orientation Preparation',
      description: 'Welcome new members effectively',
      phase: 'pre_event',
      items: [
        { title: 'Prepare welcome kits', description: 'Assemble orientation materials' },
        { title: 'Set up registration desk', description: 'Configure check-in area' },
        { title: 'Brief orientation leaders', description: 'Train guides and mentors' },
        { title: 'Prepare venue signage', description: 'Create directional signs' },
      ]
    },
    {
      title: 'Orientation Day',
      description: 'Execute orientation program',
      phase: 'during_event',
      items: [
        { title: 'Conduct welcome session', description: 'Opening remarks and introduction' },
        { title: 'Lead campus/facility tours', description: 'Guide groups through spaces' },
        { title: 'Facilitate icebreakers', description: 'Team building activities' },
        { title: 'Host Q&A sessions', description: 'Answer newcomer questions' },
      ]
    }
  ],
  CAREER_FAIR: [
    {
      title: 'Career Fair Setup',
      description: 'Prepare employer and attendee experience',
      phase: 'pre_event',
      items: [
        { title: 'Confirm employer booths', description: 'Finalize booth assignments' },
        { title: 'Set up booth infrastructure', description: 'Tables, power, signage' },
        { title: 'Prepare attendee materials', description: 'Resume guides, maps' },
        { title: 'Brief employer representatives', description: 'Share event details' },
      ]
    },
    {
      title: 'Career Fair Operations',
      description: 'During the career fair',
      phase: 'during_event',
      items: [
        { title: 'Manage attendee flow', description: 'Guide job seekers through venue' },
        { title: 'Support employer needs', description: 'Address booth issues' },
        { title: 'Coordinate presentations', description: 'Manage employer info sessions' },
        { title: 'Facilitate networking', description: 'Enable connections' },
      ]
    }
  ],
  PRODUCT_LAUNCH: [
    {
      title: 'Launch Preparation',
      description: 'Prepare for product reveal',
      phase: 'pre_event',
      items: [
        { title: 'Prepare demo units', description: 'Set up product demonstrations' },
        { title: 'Coordinate media coverage', description: 'Brief press and influencers' },
        { title: 'Set up presentation area', description: 'Stage and AV setup' },
        { title: 'Brief spokesperson', description: 'Prepare key presenters' },
        { title: 'Test all demos', description: 'Verify product functionality' },
      ]
    },
    {
      title: 'Launch Day',
      description: 'Execute product launch',
      phase: 'during_event',
      items: [
        { title: 'Manage reveal moment', description: 'Coordinate product unveiling' },
        { title: 'Facilitate hands-on demos', description: 'Let attendees try product' },
        { title: 'Handle media interviews', description: 'Coordinate press access' },
        { title: 'Capture launch content', description: 'Photo and video documentation' },
      ]
    }
  ],
  TRADE_SHOW: [
    {
      title: 'Trade Show Setup',
      description: 'Prepare exhibition presence',
      phase: 'pre_event',
      items: [
        { title: 'Set up exhibition booth', description: 'Install displays and materials' },
        { title: 'Prepare product samples', description: 'Stock booth with demos' },
        { title: 'Brief booth staff', description: 'Train on talking points' },
        { title: 'Coordinate lead capture', description: 'Set up scanning/forms' },
      ]
    },
    {
      title: 'Trade Show Operations',
      description: 'During the trade show',
      phase: 'during_event',
      items: [
        { title: 'Engage booth visitors', description: 'Welcome and qualify leads' },
        { title: 'Conduct demonstrations', description: 'Show products in action' },
        { title: 'Schedule follow-up meetings', description: 'Book post-show calls' },
        { title: 'Network with other exhibitors', description: 'Build industry connections' },
      ]
    }
  ],
  FUNDRAISER: [
    {
      title: 'Fundraiser Preparation',
      description: 'Prepare for successful fundraising',
      phase: 'pre_event',
      items: [
        { title: 'Prepare donation materials', description: 'Set up payment systems' },
        { title: 'Brief volunteers', description: 'Train fundraising team' },
        { title: 'Set up auction items', description: 'Display and catalog items' },
        { title: 'Prepare thank-you materials', description: 'Recognition materials ready' },
      ]
    },
    {
      title: 'Fundraiser Event',
      description: 'During the fundraiser',
      phase: 'during_event',
      items: [
        { title: 'Conduct auction/bidding', description: 'Manage bidding process' },
        { title: 'Process donations', description: 'Handle payment transactions' },
        { title: 'Recognize donors', description: 'Thank contributors publicly' },
        { title: 'Track fundraising progress', description: 'Monitor toward goal' },
      ]
    }
  ],
  GALA: [
    {
      title: 'Gala Preparation',
      description: 'Prepare for formal evening event',
      phase: 'pre_event',
      items: [
        { title: 'Coordinate catering', description: 'Finalize menu and service' },
        { title: 'Set up table arrangements', description: 'Assign seating and decor' },
        { title: 'Coordinate entertainment', description: 'Confirm performers/band' },
        { title: 'Prepare awards/recognition', description: 'Ready for presentation' },
        { title: 'Brief service staff', description: 'Train on event flow' },
      ]
    },
    {
      title: 'Gala Evening',
      description: 'During the gala event',
      phase: 'during_event',
      items: [
        { title: 'Manage guest arrivals', description: 'Welcome and seat guests' },
        { title: 'Coordinate dinner service', description: 'Manage course timing' },
        { title: 'Conduct awards ceremony', description: 'Present recognition' },
        { title: 'Manage entertainment', description: 'Coordinate performances' },
      ]
    }
  ],
  EXPO: [
    {
      title: 'Expo Setup',
      description: 'Prepare exhibition space',
      phase: 'pre_event',
      items: [
        { title: 'Set up exhibitor booths', description: 'Configure all display areas' },
        { title: 'Test all equipment', description: 'Verify AV and power' },
        { title: 'Prepare signage and wayfinding', description: 'Install directional signs' },
        { title: 'Brief all exhibitors', description: 'Share venue and schedule info' },
      ]
    },
    {
      title: 'Expo Operations',
      description: 'During the expo',
      phase: 'during_event',
      items: [
        { title: 'Manage visitor flow', description: 'Guide attendees through expo' },
        { title: 'Support exhibitor needs', description: 'Address booth issues' },
        { title: 'Coordinate presentations', description: 'Manage stage schedule' },
        { title: 'Capture event content', description: 'Photo and video coverage' },
      ]
    }
  ],
  SUMMIT: [
    {
      title: 'Summit Preparation',
      description: 'Prepare high-level gathering',
      phase: 'pre_event',
      items: [
        { title: 'Confirm executive speakers', description: 'Finalize leadership lineup' },
        { title: 'Prepare strategic materials', description: 'Create briefing documents' },
        { title: 'Coordinate VIP logistics', description: 'Arrange executive travel' },
        { title: 'Set up secure meeting spaces', description: 'Configure private rooms' },
      ]
    },
    {
      title: 'Summit Operations',
      description: 'During the summit',
      phase: 'during_event',
      items: [
        { title: 'Manage keynote sessions', description: 'Coordinate main presentations' },
        { title: 'Facilitate roundtables', description: 'Guide discussion sessions' },
        { title: 'Enable executive networking', description: 'Create connection opportunities' },
        { title: 'Document key decisions', description: 'Record outcomes and actions' },
      ]
    }
  ],
  WEBINAR: [
    {
      title: 'Webinar Preparation',
      description: 'Set up online presentation',
      phase: 'pre_event',
      items: [
        { title: 'Test streaming platform', description: 'Verify all tech works' },
        { title: 'Prepare presentation materials', description: 'Finalize slides and demos' },
        { title: 'Set up registration', description: 'Configure sign-up process' },
        { title: 'Brief presenters', description: 'Tech check and run-through' },
        { title: 'Prepare Q&A moderation', description: 'Set up question management' },
      ]
    },
    {
      title: 'Webinar Execution',
      description: 'During the webinar',
      phase: 'during_event',
      items: [
        { title: 'Monitor stream quality', description: 'Watch for technical issues' },
        { title: 'Moderate Q&A', description: 'Filter and present questions' },
        { title: 'Manage time', description: 'Keep presentation on schedule' },
        { title: 'Record session', description: 'Capture for replay' },
      ]
    },
    {
      title: 'Webinar Follow-up',
      description: 'Post-webinar tasks',
      phase: 'post_event',
      items: [
        { title: 'Share recording', description: 'Distribute to registrants' },
        { title: 'Send follow-up materials', description: 'Share resources mentioned' },
        { title: 'Analyze attendance', description: 'Review engagement metrics' },
      ]
    }
  ],
  TRAINING: [
    {
      title: 'Training Preparation',
      description: 'Set up learning environment',
      phase: 'pre_event',
      items: [
        { title: 'Prepare training materials', description: 'Create workbooks and resources' },
        { title: 'Set up training room', description: 'Configure learning space' },
        { title: 'Test all equipment', description: 'Verify projectors, mics, etc.' },
        { title: 'Brief trainers', description: 'Align on curriculum' },
      ]
    },
    {
      title: 'Training Delivery',
      description: 'During training sessions',
      phase: 'during_event',
      items: [
        { title: 'Conduct training modules', description: 'Deliver curriculum content' },
        { title: 'Facilitate exercises', description: 'Guide hands-on activities' },
        { title: 'Assess understanding', description: 'Check learning progress' },
        { title: 'Provide feedback', description: 'Offer individual guidance' },
      ]
    }
  ],
  COMPETITION: [
    {
      title: 'Competition Setup',
      description: 'Prepare for competitive event',
      phase: 'pre_event',
      items: [
        { title: 'Define competition rules', description: 'Finalize and publish rules' },
        { title: 'Set up judging system', description: 'Configure scoring platform' },
        { title: 'Brief judges', description: 'Train on criteria and process' },
        { title: 'Prepare competition space', description: 'Set up competition area' },
        { title: 'Prepare awards', description: 'Ready trophies and prizes' },
      ]
    },
    {
      title: 'Competition Day',
      description: 'During the competition',
      phase: 'during_event',
      items: [
        { title: 'Manage competition rounds', description: 'Coordinate all heats/rounds' },
        { title: 'Facilitate judging', description: 'Support scoring process' },
        { title: 'Handle appeals', description: 'Address competitor concerns' },
        { title: 'Announce results', description: 'Declare winners' },
      ]
    }
  ],
};

export function getTemplatesForCategory(category: EventCategory | null): ChecklistTemplate[] {
  if (!category) return getDefaultTemplates();
  return EVENT_CATEGORY_TEMPLATES[category] || getDefaultTemplates();
}

export function getDefaultTemplates(): ChecklistTemplate[] {
  return [
    {
      title: 'General Event Preparation',
      description: 'Essential pre-event checklist',
      phase: 'pre_event',
      items: [
        { title: 'Confirm venue booking', description: 'Verify all venue details' },
        { title: 'Finalize attendee list', description: 'Confirm registrations' },
        { title: 'Brief all team members', description: 'Conduct team meeting' },
        { title: 'Test all equipment', description: 'Verify AV and tech' },
        { title: 'Prepare signage', description: 'Print and organize signs' },
      ]
    },
    {
      title: 'Event Day Operations',
      description: 'Day-of management tasks',
      phase: 'during_event',
      items: [
        { title: 'Set up registration desk', description: 'Configure check-in area' },
        { title: 'Conduct venue walkthrough', description: 'Final venue check' },
        { title: 'Brief on-site staff', description: 'Morning team huddle' },
        { title: 'Monitor event flow', description: 'Oversee all activities' },
      ]
    },
    {
      title: 'Post-Event Wrap-up',
      description: 'After event tasks',
      phase: 'post_event',
      items: [
        { title: 'Send thank-you communications', description: 'Thank attendees and partners' },
        { title: 'Collect feedback', description: 'Send surveys' },
        { title: 'Process payments', description: 'Handle outstanding invoices' },
        { title: 'Document lessons learned', description: 'Create retrospective report' },
      ]
    }
  ];
}
