import { IndustryTaskTemplate, IndustryTaskItem, IndustryType, TaskPriority, TaskCategory } from './industryTemplateTypes';

// Helper to create task items
function createTask(
  id: string,
  title: string,
  description: string,
  category: TaskCategory,
  priority: TaskPriority,
  phase: 'PRE_EVENT' | 'DURING_EVENT' | 'POST_EVENT',
  daysFromEvent: number,
  estimatedHours: number,
  tags: string[] = [],
  subtasks: { title: string }[] = [],
  dependsOn?: string[]
): IndustryTaskItem {
  return { id, title, description, category, priority, phase, daysFromEvent, estimatedHours, tags, subtasks, dependsOn };
}

// ==================== CORPORATE EVENT TEMPLATES ====================

const conferenceTemplate: IndustryTaskTemplate = {
  id: 'corporate-conference',
  name: 'Corporate Conference',
  description: 'Complete task set for organizing professional conferences with speakers, sessions, and networking.',
  industry: 'corporate',
  eventType: 'Conference',
  icon: '🎤',
  color: '#4F46E5',
  estimatedTeamSize: { min: 5, max: 20 },
  eventSizeRange: { min: 100, max: 5000 },
  metadata: { author: 'Lovable', version: '1.0', lastUpdated: '2024-01-15', usageCount: 0, rating: 4.8 },
  tasks: [
    createTask('conf-1', 'Define conference theme and objectives', 'Establish the main theme, learning objectives, and target outcomes', TaskCategory.SETUP, TaskPriority.URGENT, 'PRE_EVENT', -90, 8, ['planning'], [{ title: 'Research industry trends' }, { title: 'Define target audience' }, { title: 'Set measurable goals' }]),
    createTask('conf-2', 'Create budget and financial plan', 'Develop comprehensive budget including venue, speakers, catering, marketing', TaskCategory.SETUP, TaskPriority.URGENT, 'PRE_EVENT', -85, 12, ['finance'], [{ title: 'Estimate all costs' }, { title: 'Identify revenue streams' }, { title: 'Create contingency fund' }]),
    createTask('conf-3', 'Select and book venue', 'Research, visit, and secure the conference venue', TaskCategory.LOGISTICS, TaskPriority.URGENT, 'PRE_EVENT', -80, 20, ['venue'], [{ title: 'Shortlist venues' }, { title: 'Schedule site visits' }, { title: 'Negotiate contract' }], ['conf-2']),
    createTask('conf-4', 'Identify and invite keynote speakers', 'Research and reach out to potential keynote speakers', TaskCategory.SETUP, TaskPriority.HIGH, 'PRE_EVENT', -75, 16, ['speakers'], [{ title: 'Create speaker wishlist' }, { title: 'Draft invitation letters' }, { title: 'Negotiate speaker fees' }]),
    createTask('conf-5', 'Design conference agenda and tracks', 'Create detailed schedule with sessions, breaks, and networking', TaskCategory.SETUP, TaskPriority.HIGH, 'PRE_EVENT', -60, 12, ['agenda'], [{ title: 'Define session types' }, { title: 'Allocate time slots' }, { title: 'Plan networking breaks' }], ['conf-4']),
    createTask('conf-6', 'Set up registration platform', 'Configure online registration with ticket types and pricing', TaskCategory.REGISTRATION, TaskPriority.HIGH, 'PRE_EVENT', -55, 8, ['registration'], [{ title: 'Choose platform' }, { title: 'Set up ticket tiers' }, { title: 'Configure payment processing' }]),
    createTask('conf-7', 'Launch marketing campaign', 'Execute multi-channel marketing strategy', TaskCategory.MARKETING, TaskPriority.HIGH, 'PRE_EVENT', -50, 24, ['marketing'], [{ title: 'Create marketing materials' }, { title: 'Launch email campaigns' }, { title: 'Social media promotion' }], ['conf-6']),
    createTask('conf-8', 'Arrange catering and refreshments', 'Plan meals, coffee breaks, and dietary accommodations', TaskCategory.LOGISTICS, TaskPriority.MEDIUM, 'PRE_EVENT', -40, 10, ['catering'], [{ title: 'Select caterer' }, { title: 'Plan menu' }, { title: 'Handle dietary requirements' }]),
    createTask('conf-9', 'Set up AV and technical equipment', 'Arrange projectors, microphones, screens, and WiFi', TaskCategory.TECHNICAL, TaskPriority.HIGH, 'PRE_EVENT', -30, 12, ['technical'], [{ title: 'List equipment needs' }, { title: 'Test all equipment' }, { title: 'Arrange backup equipment' }]),
    createTask('conf-10', 'Prepare speaker presentations', 'Collect, review, and format all speaker materials', TaskCategory.SETUP, TaskPriority.MEDIUM, 'PRE_EVENT', -20, 8, ['speakers'], [{ title: 'Collect presentations' }, { title: 'Review content' }, { title: 'Format for consistency' }], ['conf-5']),
    createTask('conf-11', 'Create name badges and materials', 'Design and print badges, programs, and handouts', TaskCategory.LOGISTICS, TaskPriority.MEDIUM, 'PRE_EVENT', -15, 6, ['materials'], [{ title: 'Design badges' }, { title: 'Print programs' }, { title: 'Prepare swag bags' }]),
    createTask('conf-12', 'Brief volunteers and staff', 'Train all team members on their roles and responsibilities', TaskCategory.SETUP, TaskPriority.HIGH, 'PRE_EVENT', -7, 8, ['team'], [{ title: 'Create role descriptions' }, { title: 'Conduct training session' }, { title: 'Distribute schedules' }]),
    createTask('conf-13', 'Final venue walkthrough', 'Complete final check of venue setup and logistics', TaskCategory.LOGISTICS, TaskPriority.URGENT, 'PRE_EVENT', -1, 4, ['venue'], [{ title: 'Check room layouts' }, { title: 'Verify signage' }, { title: 'Test all equipment' }]),
    createTask('conf-14', 'Manage registration desk', 'Handle attendee check-in and badge distribution', TaskCategory.REGISTRATION, TaskPriority.URGENT, 'DURING_EVENT', 0, 12, ['registration'], [{ title: 'Set up check-in stations' }, { title: 'Handle walk-ins' }, { title: 'Resolve issues' }]),
    createTask('conf-15', 'Coordinate session transitions', 'Ensure smooth flow between sessions and breaks', TaskCategory.LOGISTICS, TaskPriority.HIGH, 'DURING_EVENT', 0, 10, ['coordination'], [{ title: 'Manage time keeping' }, { title: 'Coordinate speakers' }, { title: 'Handle room changes' }]),
    createTask('conf-16', 'Capture event photos and videos', 'Document the conference for marketing and archives', TaskCategory.MARKETING, TaskPriority.MEDIUM, 'DURING_EVENT', 0, 8, ['media'], [{ title: 'Photograph key moments' }, { title: 'Record sessions' }, { title: 'Capture testimonials' }]),
    createTask('conf-17', 'Manage social media during event', 'Post live updates and engage with attendees online', TaskCategory.MARKETING, TaskPriority.MEDIUM, 'DURING_EVENT', 0, 6, ['social'], [{ title: 'Post live updates' }, { title: 'Monitor hashtag' }, { title: 'Respond to mentions' }]),
    createTask('conf-18', 'Send thank you emails', 'Thank attendees, speakers, and sponsors', TaskCategory.POST_EVENT, TaskPriority.HIGH, 'POST_EVENT', 1, 4, ['follow-up'], [{ title: 'Draft thank you messages' }, { title: 'Personalize for VIPs' }, { title: 'Schedule send' }]),
    createTask('conf-19', 'Collect attendee feedback', 'Send and analyze post-event surveys', TaskCategory.POST_EVENT, TaskPriority.HIGH, 'POST_EVENT', 2, 6, ['feedback'], [{ title: 'Create survey' }, { title: 'Send to attendees' }, { title: 'Analyze responses' }]),
    createTask('conf-20', 'Share event recordings', 'Process and distribute session recordings', TaskCategory.POST_EVENT, TaskPriority.MEDIUM, 'POST_EVENT', 7, 8, ['content'], [{ title: 'Edit recordings' }, { title: 'Upload to platform' }, { title: 'Send access links' }]),
    createTask('conf-21', 'Compile final event report', 'Create comprehensive post-event analysis', TaskCategory.POST_EVENT, TaskPriority.MEDIUM, 'POST_EVENT', 14, 10, ['reporting'], [{ title: 'Compile metrics' }, { title: 'Analyze ROI' }, { title: 'Document learnings' }], ['conf-19']),
  ],
};

const tradeShowTemplate: IndustryTaskTemplate = {
  id: 'corporate-tradeshow',
  name: 'Trade Show Exhibition',
  description: 'Comprehensive checklist for exhibiting at trade shows with booth setup and lead capture.',
  industry: 'corporate',
  eventType: 'Trade Show',
  icon: '🏢',
  color: '#059669',
  estimatedTeamSize: { min: 3, max: 15 },
  eventSizeRange: { min: 50, max: 1000 },
  metadata: { author: 'Lovable', version: '1.0', lastUpdated: '2024-01-15', usageCount: 0, rating: 4.6 },
  tasks: [
    createTask('trade-1', 'Select trade show and register', 'Research and register for target trade shows', TaskCategory.SETUP, TaskPriority.URGENT, 'PRE_EVENT', -120, 6, ['planning']),
    createTask('trade-2', 'Design booth concept', 'Create booth design including graphics and layout', TaskCategory.MARKETING, TaskPriority.HIGH, 'PRE_EVENT', -90, 16, ['design']),
    createTask('trade-3', 'Order booth materials', 'Purchase displays, banners, and promotional items', TaskCategory.LOGISTICS, TaskPriority.HIGH, 'PRE_EVENT', -60, 8, ['materials'], [], ['trade-2']),
    createTask('trade-4', 'Prepare marketing collateral', 'Create brochures, flyers, and business cards', TaskCategory.MARKETING, TaskPriority.MEDIUM, 'PRE_EVENT', -45, 12, ['marketing']),
    createTask('trade-5', 'Set up lead capture system', 'Configure badge scanners and CRM integration', TaskCategory.TECHNICAL, TaskPriority.HIGH, 'PRE_EVENT', -30, 6, ['leads']),
    createTask('trade-6', 'Train booth staff', 'Prepare team on product demos and pitch', TaskCategory.SETUP, TaskPriority.HIGH, 'PRE_EVENT', -14, 8, ['training']),
    createTask('trade-7', 'Arrange shipping and logistics', 'Coordinate booth and material shipping', TaskCategory.LOGISTICS, TaskPriority.HIGH, 'PRE_EVENT', -21, 6, ['shipping']),
    createTask('trade-8', 'Book travel and accommodation', 'Arrange team travel and hotel stays', TaskCategory.LOGISTICS, TaskPriority.MEDIUM, 'PRE_EVENT', -30, 4, ['travel']),
    createTask('trade-9', 'Set up booth', 'Install booth displays and test equipment', TaskCategory.LOGISTICS, TaskPriority.URGENT, 'PRE_EVENT', -1, 8, ['setup']),
    createTask('trade-10', 'Manage booth during show', 'Staff booth and engage with visitors', TaskCategory.SETUP, TaskPriority.URGENT, 'DURING_EVENT', 0, 24, ['operations']),
    createTask('trade-11', 'Capture leads and contacts', 'Collect visitor information and qualify leads', TaskCategory.REGISTRATION, TaskPriority.URGENT, 'DURING_EVENT', 0, 16, ['leads']),
    createTask('trade-12', 'Network with industry contacts', 'Attend networking events and meet partners', TaskCategory.SETUP, TaskPriority.MEDIUM, 'DURING_EVENT', 0, 8, ['networking']),
    createTask('trade-13', 'Dismantle booth', 'Pack up booth and arrange return shipping', TaskCategory.LOGISTICS, TaskPriority.HIGH, 'POST_EVENT', 1, 6, ['teardown']),
    createTask('trade-14', 'Follow up with leads', 'Send personalized follow-up emails', TaskCategory.POST_EVENT, TaskPriority.URGENT, 'POST_EVENT', 2, 8, ['follow-up']),
    createTask('trade-15', 'Analyze trade show ROI', 'Calculate cost per lead and evaluate success', TaskCategory.POST_EVENT, TaskPriority.MEDIUM, 'POST_EVENT', 14, 6, ['reporting']),
  ],
};

const corporateWorkshopTemplate: IndustryTaskTemplate = {
  id: 'corporate-workshop',
  name: 'Corporate Workshop',
  description: 'Task template for interactive training workshops and team development sessions.',
  industry: 'corporate',
  eventType: 'Workshop',
  icon: '📋',
  color: '#7C3AED',
  estimatedTeamSize: { min: 2, max: 8 },
  eventSizeRange: { min: 10, max: 100 },
  metadata: { author: 'Lovable', version: '1.0', lastUpdated: '2024-01-15', usageCount: 0, rating: 4.7 },
  tasks: [
    createTask('ws-1', 'Define workshop objectives', 'Establish learning goals and outcomes', TaskCategory.SETUP, TaskPriority.URGENT, 'PRE_EVENT', -45, 4, ['planning']),
    createTask('ws-2', 'Develop workshop content', 'Create presentation, exercises, and materials', TaskCategory.SETUP, TaskPriority.HIGH, 'PRE_EVENT', -30, 20, ['content'], [], ['ws-1']),
    createTask('ws-3', 'Book training room', 'Reserve appropriate space with equipment', TaskCategory.LOGISTICS, TaskPriority.HIGH, 'PRE_EVENT', -28, 2, ['venue']),
    createTask('ws-4', 'Prepare handouts and materials', 'Print workbooks and prepare supplies', TaskCategory.LOGISTICS, TaskPriority.MEDIUM, 'PRE_EVENT', -7, 4, ['materials'], [], ['ws-2']),
    createTask('ws-5', 'Set up room and equipment', 'Arrange seating and test AV equipment', TaskCategory.LOGISTICS, TaskPriority.HIGH, 'PRE_EVENT', -1, 2, ['setup']),
    createTask('ws-6', 'Facilitate workshop', 'Lead interactive sessions and exercises', TaskCategory.SETUP, TaskPriority.URGENT, 'DURING_EVENT', 0, 8, ['facilitation']),
    createTask('ws-7', 'Capture participant feedback', 'Collect evaluations during session', TaskCategory.REGISTRATION, TaskPriority.MEDIUM, 'DURING_EVENT', 0, 1, ['feedback']),
    createTask('ws-8', 'Send follow-up resources', 'Share additional materials and recordings', TaskCategory.POST_EVENT, TaskPriority.HIGH, 'POST_EVENT', 1, 2, ['follow-up']),
    createTask('ws-9', 'Analyze workshop effectiveness', 'Review feedback and measure learning outcomes', TaskCategory.POST_EVENT, TaskPriority.MEDIUM, 'POST_EVENT', 7, 4, ['evaluation']),
  ],
};

// ==================== SOCIAL EVENT TEMPLATES ====================

const weddingTemplate: IndustryTaskTemplate = {
  id: 'social-wedding',
  name: 'Wedding Celebration',
  description: 'Complete wedding planning checklist from engagement to honeymoon.',
  industry: 'social',
  eventType: 'Wedding',
  icon: '💒',
  color: '#EC4899',
  estimatedTeamSize: { min: 2, max: 10 },
  eventSizeRange: { min: 20, max: 500 },
  metadata: { author: 'Lovable', version: '1.0', lastUpdated: '2024-01-15', usageCount: 0, rating: 4.9 },
  tasks: [
    createTask('wed-1', 'Set wedding budget', 'Determine total budget and allocation', TaskCategory.SETUP, TaskPriority.URGENT, 'PRE_EVENT', -365, 8, ['budget']),
    createTask('wed-2', 'Create guest list', 'Compile and organize guest list with addresses', TaskCategory.SETUP, TaskPriority.URGENT, 'PRE_EVENT', -300, 10, ['guests']),
    createTask('wed-3', 'Select wedding venue', 'Visit and book ceremony and reception venues', TaskCategory.LOGISTICS, TaskPriority.URGENT, 'PRE_EVENT', -270, 20, ['venue'], [], ['wed-1']),
    createTask('wed-4', 'Hire photographer and videographer', 'Research, interview, and book vendors', TaskCategory.SETUP, TaskPriority.HIGH, 'PRE_EVENT', -240, 12, ['vendors']),
    createTask('wed-5', 'Book caterer', 'Select caterer and plan menu', TaskCategory.LOGISTICS, TaskPriority.HIGH, 'PRE_EVENT', -210, 10, ['catering']),
    createTask('wed-6', 'Choose wedding party', 'Select bridesmaids, groomsmen, and other roles', TaskCategory.SETUP, TaskPriority.MEDIUM, 'PRE_EVENT', -200, 2, ['party']),
    createTask('wed-7', 'Select and order wedding attire', 'Shop for wedding dress, suits, and accessories', TaskCategory.LOGISTICS, TaskPriority.HIGH, 'PRE_EVENT', -180, 16, ['attire']),
    createTask('wed-8', 'Book florist', 'Select florist and plan floral arrangements', TaskCategory.LOGISTICS, TaskPriority.MEDIUM, 'PRE_EVENT', -150, 6, ['flowers']),
    createTask('wed-9', 'Hire entertainment/DJ', 'Book band or DJ for reception', TaskCategory.SETUP, TaskPriority.MEDIUM, 'PRE_EVENT', -150, 6, ['entertainment']),
    createTask('wed-10', 'Send save-the-dates', 'Design and mail save-the-date cards', TaskCategory.MARKETING, TaskPriority.HIGH, 'PRE_EVENT', -180, 4, ['invitations']),
    createTask('wed-11', 'Plan honeymoon', 'Research and book honeymoon destination', TaskCategory.LOGISTICS, TaskPriority.MEDIUM, 'PRE_EVENT', -120, 8, ['honeymoon']),
    createTask('wed-12', 'Order wedding cake', 'Select bakery and design cake', TaskCategory.LOGISTICS, TaskPriority.MEDIUM, 'PRE_EVENT', -90, 4, ['cake']),
    createTask('wed-13', 'Send wedding invitations', 'Mail formal invitations with RSVP', TaskCategory.MARKETING, TaskPriority.HIGH, 'PRE_EVENT', -60, 6, ['invitations']),
    createTask('wed-14', 'Finalize ceremony details', 'Plan ceremony order and write vows', TaskCategory.SETUP, TaskPriority.HIGH, 'PRE_EVENT', -45, 8, ['ceremony']),
    createTask('wed-15', 'Create seating chart', 'Arrange seating based on RSVPs', TaskCategory.LOGISTICS, TaskPriority.MEDIUM, 'PRE_EVENT', -21, 6, ['seating'], [], ['wed-13']),
    createTask('wed-16', 'Confirm all vendors', 'Final confirmation with all service providers', TaskCategory.LOGISTICS, TaskPriority.URGENT, 'PRE_EVENT', -7, 4, ['vendors']),
    createTask('wed-17', 'Wedding rehearsal', 'Practice ceremony with wedding party', TaskCategory.SETUP, TaskPriority.URGENT, 'PRE_EVENT', -1, 4, ['rehearsal']),
    createTask('wed-18', 'Rehearsal dinner', 'Host dinner for wedding party and family', TaskCategory.LOGISTICS, TaskPriority.HIGH, 'PRE_EVENT', -1, 4, ['dinner']),
    createTask('wed-19', 'Wedding ceremony', 'Execute ceremony with all planned elements', TaskCategory.SETUP, TaskPriority.URGENT, 'DURING_EVENT', 0, 2, ['ceremony']),
    createTask('wed-20', 'Wedding reception', 'Coordinate reception activities and timeline', TaskCategory.LOGISTICS, TaskPriority.URGENT, 'DURING_EVENT', 0, 6, ['reception']),
    createTask('wed-21', 'Send thank you cards', 'Write and mail thank you notes for gifts', TaskCategory.POST_EVENT, TaskPriority.HIGH, 'POST_EVENT', 14, 8, ['follow-up']),
    createTask('wed-22', 'Return rentals', 'Return any rented items on time', TaskCategory.LOGISTICS, TaskPriority.MEDIUM, 'POST_EVENT', 3, 2, ['cleanup']),
    createTask('wed-23', 'Review and share photos', 'Collect and share wedding photos', TaskCategory.POST_EVENT, TaskPriority.LOW, 'POST_EVENT', 30, 4, ['photos']),
  ],
};

const birthdayPartyTemplate: IndustryTaskTemplate = {
  id: 'social-birthday',
  name: 'Birthday Party',
  description: 'Fun and organized birthday party planning for any age.',
  industry: 'social',
  eventType: 'Birthday',
  icon: '🎂',
  color: '#F59E0B',
  estimatedTeamSize: { min: 1, max: 5 },
  eventSizeRange: { min: 5, max: 100 },
  metadata: { author: 'Lovable', version: '1.0', lastUpdated: '2024-01-15', usageCount: 0, rating: 4.5 },
  tasks: [
    createTask('bday-1', 'Set party theme and budget', 'Choose theme and determine spending limit', TaskCategory.SETUP, TaskPriority.HIGH, 'PRE_EVENT', -30, 2, ['planning']),
    createTask('bday-2', 'Create guest list', 'List all invitees with contact info', TaskCategory.SETUP, TaskPriority.HIGH, 'PRE_EVENT', -28, 1, ['guests']),
    createTask('bday-3', 'Book venue or plan location', 'Reserve party venue or prepare home', TaskCategory.LOGISTICS, TaskPriority.HIGH, 'PRE_EVENT', -21, 3, ['venue']),
    createTask('bday-4', 'Send invitations', 'Design and send party invitations', TaskCategory.MARKETING, TaskPriority.HIGH, 'PRE_EVENT', -21, 2, ['invitations']),
    createTask('bday-5', 'Plan party activities', 'Organize games and entertainment', TaskCategory.SETUP, TaskPriority.MEDIUM, 'PRE_EVENT', -14, 3, ['activities']),
    createTask('bday-6', 'Order or make cake', 'Arrange birthday cake', TaskCategory.LOGISTICS, TaskPriority.MEDIUM, 'PRE_EVENT', -7, 2, ['cake']),
    createTask('bday-7', 'Buy decorations', 'Purchase balloons, banners, tableware', TaskCategory.LOGISTICS, TaskPriority.MEDIUM, 'PRE_EVENT', -5, 2, ['decorations']),
    createTask('bday-8', 'Plan party menu', 'Prepare or order food and drinks', TaskCategory.LOGISTICS, TaskPriority.MEDIUM, 'PRE_EVENT', -3, 3, ['food']),
    createTask('bday-9', 'Prepare party favors', 'Assemble gift bags for guests', TaskCategory.LOGISTICS, TaskPriority.LOW, 'PRE_EVENT', -2, 2, ['favors']),
    createTask('bday-10', 'Set up party space', 'Decorate and arrange seating', TaskCategory.LOGISTICS, TaskPriority.HIGH, 'PRE_EVENT', -1, 3, ['setup']),
    createTask('bday-11', 'Host the party', 'Greet guests and manage activities', TaskCategory.SETUP, TaskPriority.URGENT, 'DURING_EVENT', 0, 4, ['hosting']),
    createTask('bday-12', 'Clean up', 'Clear decorations and clean venue', TaskCategory.POST_EVENT, TaskPriority.HIGH, 'POST_EVENT', 0, 2, ['cleanup']),
    createTask('bday-13', 'Send thank you notes', 'Thank guests for attending and gifts', TaskCategory.POST_EVENT, TaskPriority.LOW, 'POST_EVENT', 3, 1, ['follow-up']),
  ],
};

// ==================== EDUCATIONAL EVENT TEMPLATES ====================

const hackathonTemplate: IndustryTaskTemplate = {
  id: 'educational-hackathon',
  name: 'Hackathon',
  description: 'Complete hackathon organization from registration to judging.',
  industry: 'educational',
  eventType: 'Hackathon',
  icon: '💻',
  color: '#10B981',
  estimatedTeamSize: { min: 5, max: 25 },
  eventSizeRange: { min: 50, max: 2000 },
  metadata: { author: 'Lovable', version: '1.0', lastUpdated: '2024-01-15', usageCount: 0, rating: 4.9 },
  tasks: [
    createTask('hack-1', 'Define hackathon theme and challenges', 'Choose problem statements and tracks', TaskCategory.SETUP, TaskPriority.URGENT, 'PRE_EVENT', -90, 8, ['planning']),
    createTask('hack-2', 'Secure sponsors', 'Reach out to companies for sponsorship', TaskCategory.SETUP, TaskPriority.URGENT, 'PRE_EVENT', -75, 20, ['sponsors']),
    createTask('hack-3', 'Book venue', 'Reserve space with 24/7 access capability', TaskCategory.LOGISTICS, TaskPriority.URGENT, 'PRE_EVENT', -60, 10, ['venue']),
    createTask('hack-4', 'Set up registration platform', 'Configure Devfolio or custom registration', TaskCategory.REGISTRATION, TaskPriority.HIGH, 'PRE_EVENT', -55, 6, ['registration']),
    createTask('hack-5', 'Recruit mentors and judges', 'Invite industry experts to participate', TaskCategory.SETUP, TaskPriority.HIGH, 'PRE_EVENT', -45, 12, ['mentors']),
    createTask('hack-6', 'Plan prizes and swag', 'Define prize structure and order merchandise', TaskCategory.LOGISTICS, TaskPriority.MEDIUM, 'PRE_EVENT', -40, 8, ['prizes']),
    createTask('hack-7', 'Launch marketing campaign', 'Promote across social media and campuses', TaskCategory.MARKETING, TaskPriority.HIGH, 'PRE_EVENT', -45, 16, ['marketing']),
    createTask('hack-8', 'Set up technical infrastructure', 'Prepare WiFi, power, and dev tools access', TaskCategory.TECHNICAL, TaskPriority.HIGH, 'PRE_EVENT', -21, 12, ['tech']),
    createTask('hack-9', 'Plan food and refreshments', 'Arrange meals and snacks for 24+ hours', TaskCategory.LOGISTICS, TaskPriority.HIGH, 'PRE_EVENT', -14, 8, ['catering']),
    createTask('hack-10', 'Create judging criteria', 'Define scoring rubrics and process', TaskCategory.SETUP, TaskPriority.MEDIUM, 'PRE_EVENT', -14, 4, ['judging']),
    createTask('hack-11', 'Prepare opening ceremony', 'Plan kickoff presentation and team formation', TaskCategory.SETUP, TaskPriority.HIGH, 'PRE_EVENT', -7, 6, ['ceremony']),
    createTask('hack-12', 'Brief volunteers', 'Train volunteer team on responsibilities', TaskCategory.SETUP, TaskPriority.HIGH, 'PRE_EVENT', -3, 4, ['volunteers']),
    createTask('hack-13', 'Set up venue', 'Arrange workstations, signage, and areas', TaskCategory.LOGISTICS, TaskPriority.URGENT, 'PRE_EVENT', -1, 8, ['setup']),
    createTask('hack-14', 'Run check-in process', 'Register participants and distribute materials', TaskCategory.REGISTRATION, TaskPriority.URGENT, 'DURING_EVENT', 0, 4, ['checkin']),
    createTask('hack-15', 'Conduct opening ceremony', 'Welcome participants and explain rules', TaskCategory.SETUP, TaskPriority.URGENT, 'DURING_EVENT', 0, 2, ['ceremony']),
    createTask('hack-16', 'Manage mentorship sessions', 'Coordinate mentor office hours', TaskCategory.SETUP, TaskPriority.HIGH, 'DURING_EVENT', 0, 8, ['mentorship']),
    createTask('hack-17', 'Organize mini-events', 'Run workshops and fun activities', TaskCategory.SETUP, TaskPriority.MEDIUM, 'DURING_EVENT', 0, 6, ['activities']),
    createTask('hack-18', 'Manage submission platform', 'Ensure all teams submit projects', TaskCategory.TECHNICAL, TaskPriority.URGENT, 'DURING_EVENT', 1, 4, ['submissions']),
    createTask('hack-19', 'Coordinate judging', 'Run demos and manage scoring', TaskCategory.SETUP, TaskPriority.URGENT, 'DURING_EVENT', 1, 6, ['judging']),
    createTask('hack-20', 'Closing ceremony and awards', 'Announce winners and distribute prizes', TaskCategory.SETUP, TaskPriority.URGENT, 'DURING_EVENT', 1, 2, ['awards']),
    createTask('hack-21', 'Venue cleanup', 'Return venue to original state', TaskCategory.LOGISTICS, TaskPriority.HIGH, 'POST_EVENT', 1, 4, ['cleanup']),
    createTask('hack-22', 'Send follow-up emails', 'Thank participants and share resources', TaskCategory.POST_EVENT, TaskPriority.HIGH, 'POST_EVENT', 2, 4, ['follow-up']),
    createTask('hack-23', 'Publish project gallery', 'Showcase winning projects publicly', TaskCategory.POST_EVENT, TaskPriority.MEDIUM, 'POST_EVENT', 7, 6, ['showcase']),
    createTask('hack-24', 'Create sponsor report', 'Compile metrics and ROI for sponsors', TaskCategory.POST_EVENT, TaskPriority.HIGH, 'POST_EVENT', 14, 8, ['reporting']),
  ],
};

const graduationTemplate: IndustryTaskTemplate = {
  id: 'educational-graduation',
  name: 'Graduation Ceremony',
  description: 'Plan and execute a memorable graduation ceremony.',
  industry: 'educational',
  eventType: 'Graduation',
  icon: '🎓',
  color: '#1D4ED8',
  estimatedTeamSize: { min: 10, max: 50 },
  eventSizeRange: { min: 100, max: 5000 },
  metadata: { author: 'Lovable', version: '1.0', lastUpdated: '2024-01-15', usageCount: 0, rating: 4.7 },
  tasks: [
    createTask('grad-1', 'Form graduation committee', 'Assemble planning team with clear roles', TaskCategory.SETUP, TaskPriority.URGENT, 'PRE_EVENT', -120, 4, ['planning']),
    createTask('grad-2', 'Book venue and date', 'Secure graduation venue and announce date', TaskCategory.LOGISTICS, TaskPriority.URGENT, 'PRE_EVENT', -100, 8, ['venue']),
    createTask('grad-3', 'Invite guest speaker', 'Identify and confirm commencement speaker', TaskCategory.SETUP, TaskPriority.HIGH, 'PRE_EVENT', -90, 10, ['speaker']),
    createTask('grad-4', 'Order caps and gowns', 'Coordinate regalia orders for graduates', TaskCategory.LOGISTICS, TaskPriority.HIGH, 'PRE_EVENT', -75, 8, ['regalia']),
    createTask('grad-5', 'Collect graduate information', 'Gather names, honors, and pronunciations', TaskCategory.REGISTRATION, TaskPriority.HIGH, 'PRE_EVENT', -60, 12, ['data']),
    createTask('grad-6', 'Design ceremony program', 'Create printed program with all details', TaskCategory.MARKETING, TaskPriority.MEDIUM, 'PRE_EVENT', -30, 8, ['program']),
    createTask('grad-7', 'Distribute tickets', 'Manage guest ticket allocation', TaskCategory.LOGISTICS, TaskPriority.HIGH, 'PRE_EVENT', -30, 6, ['tickets']),
    createTask('grad-8', 'Plan seating arrangement', 'Create seating chart for graduates and guests', TaskCategory.LOGISTICS, TaskPriority.MEDIUM, 'PRE_EVENT', -21, 6, ['seating']),
    createTask('grad-9', 'Arrange catering', 'Plan post-ceremony reception if applicable', TaskCategory.LOGISTICS, TaskPriority.MEDIUM, 'PRE_EVENT', -21, 6, ['catering']),
    createTask('grad-10', 'Set up AV and livestream', 'Prepare sound, video, and streaming equipment', TaskCategory.TECHNICAL, TaskPriority.HIGH, 'PRE_EVENT', -7, 10, ['technical']),
    createTask('grad-11', 'Conduct rehearsal', 'Practice ceremony flow with key participants', TaskCategory.SETUP, TaskPriority.HIGH, 'PRE_EVENT', -2, 4, ['rehearsal']),
    createTask('grad-12', 'Set up venue', 'Arrange chairs, stage, and decorations', TaskCategory.LOGISTICS, TaskPriority.URGENT, 'PRE_EVENT', -1, 8, ['setup']),
    createTask('grad-13', 'Execute ceremony', 'Manage ceremony flow and transitions', TaskCategory.SETUP, TaskPriority.URGENT, 'DURING_EVENT', 0, 4, ['ceremony']),
    createTask('grad-14', 'Manage photography', 'Coordinate official photos of graduates', TaskCategory.MARKETING, TaskPriority.HIGH, 'DURING_EVENT', 0, 4, ['photos']),
    createTask('grad-15', 'Host reception', 'Manage post-ceremony gathering', TaskCategory.LOGISTICS, TaskPriority.MEDIUM, 'DURING_EVENT', 0, 3, ['reception']),
    createTask('grad-16', 'Distribute diplomas', 'Ensure all graduates receive credentials', TaskCategory.POST_EVENT, TaskPriority.HIGH, 'POST_EVENT', 1, 4, ['diplomas']),
    createTask('grad-17', 'Share photos and recordings', 'Publish ceremony content for families', TaskCategory.POST_EVENT, TaskPriority.MEDIUM, 'POST_EVENT', 7, 6, ['media']),
  ],
};

// ==================== ENTERTAINMENT EVENT TEMPLATES ====================

const concertTemplate: IndustryTaskTemplate = {
  id: 'entertainment-concert',
  name: 'Music Concert',
  description: 'End-to-end concert production from booking to post-show.',
  industry: 'entertainment',
  eventType: 'Concert',
  icon: '🎵',
  color: '#DC2626',
  estimatedTeamSize: { min: 10, max: 100 },
  eventSizeRange: { min: 100, max: 50000 },
  metadata: { author: 'Lovable', version: '1.0', lastUpdated: '2024-01-15', usageCount: 0, rating: 4.8 },
  tasks: [
    createTask('concert-1', 'Book headliner and artists', 'Negotiate and sign artist contracts', TaskCategory.SETUP, TaskPriority.URGENT, 'PRE_EVENT', -180, 30, ['artists']),
    createTask('concert-2', 'Secure venue', 'Book venue with appropriate capacity', TaskCategory.LOGISTICS, TaskPriority.URGENT, 'PRE_EVENT', -150, 16, ['venue']),
    createTask('concert-3', 'Obtain permits and licenses', 'Secure all necessary legal permissions', TaskCategory.SETUP, TaskPriority.URGENT, 'PRE_EVENT', -120, 20, ['legal']),
    createTask('concert-4', 'Hire production company', 'Contract sound, lighting, and staging', TaskCategory.TECHNICAL, TaskPriority.HIGH, 'PRE_EVENT', -90, 16, ['production']),
    createTask('concert-5', 'Launch ticket sales', 'Set up ticketing platform and pricing tiers', TaskCategory.REGISTRATION, TaskPriority.HIGH, 'PRE_EVENT', -90, 12, ['tickets']),
    createTask('concert-6', 'Plan marketing campaign', 'Create promotional strategy and assets', TaskCategory.MARKETING, TaskPriority.HIGH, 'PRE_EVENT', -75, 24, ['marketing']),
    createTask('concert-7', 'Arrange artist hospitality', 'Plan green rooms, catering, accommodation', TaskCategory.LOGISTICS, TaskPriority.MEDIUM, 'PRE_EVENT', -45, 12, ['hospitality']),
    createTask('concert-8', 'Hire security team', 'Contract security for crowd management', TaskCategory.LOGISTICS, TaskPriority.HIGH, 'PRE_EVENT', -45, 8, ['security']),
    createTask('concert-9', 'Plan merchandise sales', 'Coordinate merch inventory and sales points', TaskCategory.LOGISTICS, TaskPriority.MEDIUM, 'PRE_EVENT', -30, 8, ['merch']),
    createTask('concert-10', 'Conduct sound check', 'Test all audio equipment with artists', TaskCategory.TECHNICAL, TaskPriority.URGENT, 'PRE_EVENT', -1, 6, ['soundcheck']),
    createTask('concert-11', 'Brief all staff', 'Final run-through with entire team', TaskCategory.SETUP, TaskPriority.URGENT, 'PRE_EVENT', -1, 4, ['briefing']),
    createTask('concert-12', 'Manage doors and entry', 'Coordinate ticket scanning and crowd flow', TaskCategory.REGISTRATION, TaskPriority.URGENT, 'DURING_EVENT', 0, 4, ['entry']),
    createTask('concert-13', 'Execute show production', 'Manage lighting, sound, and stage cues', TaskCategory.TECHNICAL, TaskPriority.URGENT, 'DURING_EVENT', 0, 6, ['production']),
    createTask('concert-14', 'Monitor crowd safety', 'Ensure audience safety throughout show', TaskCategory.LOGISTICS, TaskPriority.URGENT, 'DURING_EVENT', 0, 6, ['safety']),
    createTask('concert-15', 'Handle artist relations', 'Support artists during performance', TaskCategory.SETUP, TaskPriority.HIGH, 'DURING_EVENT', 0, 4, ['artists']),
    createTask('concert-16', 'Venue load-out', 'Remove equipment and clear venue', TaskCategory.LOGISTICS, TaskPriority.HIGH, 'POST_EVENT', 1, 8, ['loadout']),
    createTask('concert-17', 'Process artist payments', 'Complete all financial obligations', TaskCategory.POST_EVENT, TaskPriority.URGENT, 'POST_EVENT', 7, 6, ['payments']),
    createTask('concert-18', 'Compile show report', 'Document attendance, revenue, and issues', TaskCategory.POST_EVENT, TaskPriority.MEDIUM, 'POST_EVENT', 14, 6, ['reporting']),
  ],
};

const festivalTemplate: IndustryTaskTemplate = {
  id: 'entertainment-festival',
  name: 'Music Festival',
  description: 'Large-scale multi-day festival planning and execution.',
  industry: 'entertainment',
  eventType: 'Festival',
  icon: '🎪',
  color: '#9333EA',
  estimatedTeamSize: { min: 50, max: 500 },
  eventSizeRange: { min: 5000, max: 100000 },
  metadata: { author: 'Lovable', version: '1.0', lastUpdated: '2024-01-15', usageCount: 0, rating: 4.9 },
  tasks: [
    createTask('fest-1', 'Secure festival site', 'Book and contract multi-day venue', TaskCategory.LOGISTICS, TaskPriority.URGENT, 'PRE_EVENT', -365, 40, ['venue']),
    createTask('fest-2', 'Obtain all permits', 'Music, alcohol, food, and event permits', TaskCategory.SETUP, TaskPriority.URGENT, 'PRE_EVENT', -300, 60, ['permits']),
    createTask('fest-3', 'Book headliners', 'Sign contracts with main stage artists', TaskCategory.SETUP, TaskPriority.URGENT, 'PRE_EVENT', -270, 50, ['artists']),
    createTask('fest-4', 'Complete festival lineup', 'Book all supporting acts across stages', TaskCategory.SETUP, TaskPriority.HIGH, 'PRE_EVENT', -180, 80, ['lineup']),
    createTask('fest-5', 'Design site layout', 'Plan stages, vendors, camping, and flow', TaskCategory.SETUP, TaskPriority.HIGH, 'PRE_EVENT', -150, 40, ['design']),
    createTask('fest-6', 'Launch early bird tickets', 'Start ticket sales with tier pricing', TaskCategory.REGISTRATION, TaskPriority.HIGH, 'PRE_EVENT', -180, 16, ['tickets']),
    createTask('fest-7', 'Contract vendors', 'Sign food, beverage, and retail vendors', TaskCategory.LOGISTICS, TaskPriority.HIGH, 'PRE_EVENT', -120, 30, ['vendors']),
    createTask('fest-8', 'Hire production teams', 'Sound, lighting, staging for all areas', TaskCategory.TECHNICAL, TaskPriority.HIGH, 'PRE_EVENT', -90, 40, ['production']),
    createTask('fest-9', 'Plan emergency services', 'Medical, fire, and security arrangements', TaskCategory.LOGISTICS, TaskPriority.URGENT, 'PRE_EVENT', -60, 24, ['safety']),
    createTask('fest-10', 'Build festival infrastructure', 'Install stages, fencing, utilities', TaskCategory.LOGISTICS, TaskPriority.URGENT, 'PRE_EVENT', -14, 100, ['build']),
    createTask('fest-11', 'Staff training', 'Train all volunteers and staff', TaskCategory.SETUP, TaskPriority.HIGH, 'PRE_EVENT', -7, 20, ['training']),
    createTask('fest-12', 'Final safety inspection', 'Complete all safety certifications', TaskCategory.LOGISTICS, TaskPriority.URGENT, 'PRE_EVENT', -1, 8, ['safety']),
    createTask('fest-13', 'Manage daily operations', 'Coordinate all festival activities', TaskCategory.SETUP, TaskPriority.URGENT, 'DURING_EVENT', 0, 50, ['operations']),
    createTask('fest-14', 'Artist hospitality', 'Manage backstage and artist needs', TaskCategory.LOGISTICS, TaskPriority.HIGH, 'DURING_EVENT', 0, 30, ['hospitality']),
    createTask('fest-15', 'Festival teardown', 'Dismantle infrastructure and restore site', TaskCategory.LOGISTICS, TaskPriority.HIGH, 'POST_EVENT', 1, 80, ['teardown']),
    createTask('fest-16', 'Financial reconciliation', 'Complete all payments and accounting', TaskCategory.POST_EVENT, TaskPriority.URGENT, 'POST_EVENT', 30, 40, ['finance']),
  ],
};

// ==================== SPORTS EVENT TEMPLATES ====================

const tournamentTemplate: IndustryTaskTemplate = {
  id: 'sports-tournament',
  name: 'Sports Tournament',
  description: 'Multi-team competition organization from registration to awards.',
  industry: 'sports',
  eventType: 'Tournament',
  icon: '🏆',
  color: '#EA580C',
  estimatedTeamSize: { min: 5, max: 30 },
  eventSizeRange: { min: 50, max: 1000 },
  metadata: { author: 'Lovable', version: '1.0', lastUpdated: '2024-01-15', usageCount: 0, rating: 4.7 },
  tasks: [
    createTask('tourn-1', 'Define tournament format', 'Choose bracket style and rules', TaskCategory.SETUP, TaskPriority.URGENT, 'PRE_EVENT', -90, 6, ['format']),
    createTask('tourn-2', 'Secure venues/fields', 'Book all playing locations', TaskCategory.LOGISTICS, TaskPriority.URGENT, 'PRE_EVENT', -75, 12, ['venue']),
    createTask('tourn-3', 'Open team registration', 'Set up registration and payment', TaskCategory.REGISTRATION, TaskPriority.HIGH, 'PRE_EVENT', -60, 8, ['registration']),
    createTask('tourn-4', 'Recruit officials and referees', 'Hire qualified officiating staff', TaskCategory.SETUP, TaskPriority.HIGH, 'PRE_EVENT', -45, 10, ['officials']),
    createTask('tourn-5', 'Create tournament schedule', 'Build bracket and match schedule', TaskCategory.SETUP, TaskPriority.HIGH, 'PRE_EVENT', -30, 8, ['schedule'], [], ['tourn-3']),
    createTask('tourn-6', 'Arrange equipment', 'Secure balls, nets, scoreboards, etc.', TaskCategory.LOGISTICS, TaskPriority.MEDIUM, 'PRE_EVENT', -21, 6, ['equipment']),
    createTask('tourn-7', 'Order trophies and medals', 'Purchase awards for winners', TaskCategory.LOGISTICS, TaskPriority.MEDIUM, 'PRE_EVENT', -21, 4, ['awards']),
    createTask('tourn-8', 'Plan concessions', 'Arrange food and beverage sales', TaskCategory.LOGISTICS, TaskPriority.LOW, 'PRE_EVENT', -14, 6, ['food']),
    createTask('tourn-9', 'Brief volunteers', 'Train volunteers on roles', TaskCategory.SETUP, TaskPriority.HIGH, 'PRE_EVENT', -3, 4, ['volunteers']),
    createTask('tourn-10', 'Set up venues', 'Prepare fields, courts, and signage', TaskCategory.LOGISTICS, TaskPriority.URGENT, 'PRE_EVENT', -1, 6, ['setup']),
    createTask('tourn-11', 'Run check-in', 'Register teams and distribute materials', TaskCategory.REGISTRATION, TaskPriority.URGENT, 'DURING_EVENT', 0, 4, ['checkin']),
    createTask('tourn-12', 'Manage game operations', 'Coordinate matches and keep scores', TaskCategory.SETUP, TaskPriority.URGENT, 'DURING_EVENT', 0, 16, ['games']),
    createTask('tourn-13', 'Handle disputes', 'Resolve any rule conflicts or issues', TaskCategory.SETUP, TaskPriority.HIGH, 'DURING_EVENT', 0, 4, ['disputes']),
    createTask('tourn-14', 'Awards ceremony', 'Present trophies and recognition', TaskCategory.SETUP, TaskPriority.HIGH, 'DURING_EVENT', 1, 2, ['awards']),
    createTask('tourn-15', 'Venue cleanup', 'Return venues to original condition', TaskCategory.LOGISTICS, TaskPriority.HIGH, 'POST_EVENT', 1, 4, ['cleanup']),
    createTask('tourn-16', 'Send final results', 'Distribute standings and statistics', TaskCategory.POST_EVENT, TaskPriority.MEDIUM, 'POST_EVENT', 2, 3, ['results']),
  ],
};

const marathonTemplate: IndustryTaskTemplate = {
  id: 'sports-marathon',
  name: 'Marathon/Running Race',
  description: 'Complete race organization from course design to finish line.',
  industry: 'sports',
  eventType: 'Marathon',
  icon: '🏃',
  color: '#0891B2',
  estimatedTeamSize: { min: 20, max: 200 },
  eventSizeRange: { min: 100, max: 50000 },
  metadata: { author: 'Lovable', version: '1.0', lastUpdated: '2024-01-15', usageCount: 0, rating: 4.8 },
  tasks: [
    createTask('mara-1', 'Design race course', 'Map route with proper distance certification', TaskCategory.SETUP, TaskPriority.URGENT, 'PRE_EVENT', -180, 20, ['course']),
    createTask('mara-2', 'Obtain road permits', 'Secure permissions for road closures', TaskCategory.SETUP, TaskPriority.URGENT, 'PRE_EVENT', -150, 24, ['permits']),
    createTask('mara-3', 'Set up registration', 'Configure online registration system', TaskCategory.REGISTRATION, TaskPriority.HIGH, 'PRE_EVENT', -120, 10, ['registration']),
    createTask('mara-4', 'Recruit volunteers', 'Build volunteer team for all stations', TaskCategory.SETUP, TaskPriority.HIGH, 'PRE_EVENT', -90, 16, ['volunteers']),
    createTask('mara-5', 'Plan aid stations', 'Set up water, food, and medical points', TaskCategory.LOGISTICS, TaskPriority.HIGH, 'PRE_EVENT', -60, 12, ['aid']),
    createTask('mara-6', 'Arrange timing system', 'Contract chip timing and results service', TaskCategory.TECHNICAL, TaskPriority.HIGH, 'PRE_EVENT', -60, 8, ['timing']),
    createTask('mara-7', 'Order race bibs and shirts', 'Produce participant materials', TaskCategory.LOGISTICS, TaskPriority.MEDIUM, 'PRE_EVENT', -45, 8, ['materials']),
    createTask('mara-8', 'Coordinate with emergency services', 'Brief police, fire, and medical', TaskCategory.LOGISTICS, TaskPriority.URGENT, 'PRE_EVENT', -30, 10, ['safety']),
    createTask('mara-9', 'Set up expo/packet pickup', 'Organize pre-race material distribution', TaskCategory.LOGISTICS, TaskPriority.HIGH, 'PRE_EVENT', -2, 12, ['expo']),
    createTask('mara-10', 'Mark race course', 'Set up signage, mile markers, barriers', TaskCategory.LOGISTICS, TaskPriority.URGENT, 'PRE_EVENT', -1, 16, ['course']),
    createTask('mara-11', 'Brief all volunteers', 'Final instructions for race day', TaskCategory.SETUP, TaskPriority.URGENT, 'PRE_EVENT', -1, 4, ['briefing']),
    createTask('mara-12', 'Manage start area', 'Organize corrals and start proceedings', TaskCategory.SETUP, TaskPriority.URGENT, 'DURING_EVENT', 0, 4, ['start']),
    createTask('mara-13', 'Monitor course', 'Ensure safety along entire route', TaskCategory.LOGISTICS, TaskPriority.URGENT, 'DURING_EVENT', 0, 8, ['monitoring']),
    createTask('mara-14', 'Operate finish line', 'Manage finisher experience and timing', TaskCategory.SETUP, TaskPriority.URGENT, 'DURING_EVENT', 0, 6, ['finish']),
    createTask('mara-15', 'Distribute medals and refreshments', 'Award finisher medals and recovery food', TaskCategory.LOGISTICS, TaskPriority.HIGH, 'DURING_EVENT', 0, 4, ['awards']),
    createTask('mara-16', 'Course cleanup', 'Remove all course materials', TaskCategory.LOGISTICS, TaskPriority.HIGH, 'POST_EVENT', 0, 8, ['cleanup']),
    createTask('mara-17', 'Publish official results', 'Finalize and post race results', TaskCategory.POST_EVENT, TaskPriority.HIGH, 'POST_EVENT', 1, 4, ['results']),
    createTask('mara-18', 'Send participant certificates', 'Distribute finisher certificates', TaskCategory.POST_EVENT, TaskPriority.MEDIUM, 'POST_EVENT', 7, 4, ['certificates']),
  ],
};

// ==================== NON-PROFIT EVENT TEMPLATES ====================

const fundraisingGalaTemplate: IndustryTaskTemplate = {
  id: 'nonprofit-gala',
  name: 'Fundraising Gala',
  description: 'Elegant fundraising event with auction and entertainment.',
  industry: 'nonprofit',
  eventType: 'Gala',
  icon: '🎭',
  color: '#B45309',
  estimatedTeamSize: { min: 10, max: 50 },
  eventSizeRange: { min: 100, max: 1000 },
  metadata: { author: 'Lovable', version: '1.0', lastUpdated: '2024-01-15', usageCount: 0, rating: 4.8 },
  tasks: [
    createTask('gala-1', 'Set fundraising goal', 'Define target amount and purpose', TaskCategory.SETUP, TaskPriority.URGENT, 'PRE_EVENT', -120, 4, ['planning']),
    createTask('gala-2', 'Form event committee', 'Recruit volunteer planning committee', TaskCategory.SETUP, TaskPriority.HIGH, 'PRE_EVENT', -110, 6, ['committee']),
    createTask('gala-3', 'Book venue', 'Secure elegant event space', TaskCategory.LOGISTICS, TaskPriority.URGENT, 'PRE_EVENT', -90, 10, ['venue']),
    createTask('gala-4', 'Secure event sponsors', 'Approach corporate sponsors for support', TaskCategory.SETUP, TaskPriority.URGENT, 'PRE_EVENT', -90, 20, ['sponsors']),
    createTask('gala-5', 'Plan entertainment', 'Book speakers, performers, or band', TaskCategory.SETUP, TaskPriority.MEDIUM, 'PRE_EVENT', -60, 10, ['entertainment']),
    createTask('gala-6', 'Curate auction items', 'Solicit donations for silent/live auction', TaskCategory.SETUP, TaskPriority.HIGH, 'PRE_EVENT', -75, 24, ['auction']),
    createTask('gala-7', 'Design invitations', 'Create and send formal invitations', TaskCategory.MARKETING, TaskPriority.HIGH, 'PRE_EVENT', -60, 8, ['invitations']),
    createTask('gala-8', 'Plan menu with caterer', 'Select dinner menu and wine pairings', TaskCategory.LOGISTICS, TaskPriority.MEDIUM, 'PRE_EVENT', -45, 6, ['catering']),
    createTask('gala-9', 'Set up donation platform', 'Configure online giving and paddle raise', TaskCategory.TECHNICAL, TaskPriority.HIGH, 'PRE_EVENT', -30, 6, ['donations']),
    createTask('gala-10', 'Arrange décor and florals', 'Plan table settings and decorations', TaskCategory.LOGISTICS, TaskPriority.MEDIUM, 'PRE_EVENT', -21, 8, ['decor']),
    createTask('gala-11', 'Prepare program', 'Create run of show and printed program', TaskCategory.SETUP, TaskPriority.HIGH, 'PRE_EVENT', -14, 8, ['program']),
    createTask('gala-12', 'Brief volunteers', 'Train volunteers on roles and responsibilities', TaskCategory.SETUP, TaskPriority.HIGH, 'PRE_EVENT', -7, 4, ['volunteers']),
    createTask('gala-13', 'Set up venue', 'Arrange tables, stage, and auction displays', TaskCategory.LOGISTICS, TaskPriority.URGENT, 'PRE_EVENT', -1, 8, ['setup']),
    createTask('gala-14', 'Manage guest reception', 'Welcome guests and manage check-in', TaskCategory.REGISTRATION, TaskPriority.URGENT, 'DURING_EVENT', 0, 3, ['reception']),
    createTask('gala-15', 'Run program and auction', 'Execute event schedule and bidding', TaskCategory.SETUP, TaskPriority.URGENT, 'DURING_EVENT', 0, 5, ['program']),
    createTask('gala-16', 'Process donations', 'Collect payments and pledges', TaskCategory.REGISTRATION, TaskPriority.URGENT, 'DURING_EVENT', 0, 3, ['donations']),
    createTask('gala-17', 'Send thank you letters', 'Thank donors, sponsors, and attendees', TaskCategory.POST_EVENT, TaskPriority.URGENT, 'POST_EVENT', 3, 8, ['follow-up']),
    createTask('gala-18', 'Report final totals', 'Announce fundraising results', TaskCategory.POST_EVENT, TaskPriority.HIGH, 'POST_EVENT', 7, 4, ['reporting']),
    createTask('gala-19', 'Deliver auction items', 'Coordinate winner item pickups', TaskCategory.POST_EVENT, TaskPriority.MEDIUM, 'POST_EVENT', 7, 6, ['auction']),
  ],
};

const communityEventTemplate: IndustryTaskTemplate = {
  id: 'nonprofit-community',
  name: 'Community Event',
  description: 'Public community gathering for awareness and engagement.',
  industry: 'nonprofit',
  eventType: 'Community',
  icon: '🤝',
  color: '#16A34A',
  estimatedTeamSize: { min: 5, max: 30 },
  eventSizeRange: { min: 50, max: 5000 },
  metadata: { author: 'Lovable', version: '1.0', lastUpdated: '2024-01-15', usageCount: 0, rating: 4.5 },
  tasks: [
    createTask('comm-1', 'Define event purpose', 'Clarify goals and community impact', TaskCategory.SETUP, TaskPriority.URGENT, 'PRE_EVENT', -60, 4, ['planning']),
    createTask('comm-2', 'Secure public space permit', 'Obtain permission for venue use', TaskCategory.SETUP, TaskPriority.URGENT, 'PRE_EVENT', -45, 8, ['permits']),
    createTask('comm-3', 'Recruit community partners', 'Engage local organizations to participate', TaskCategory.SETUP, TaskPriority.HIGH, 'PRE_EVENT', -45, 10, ['partners']),
    createTask('comm-4', 'Plan activities and booths', 'Organize interactive elements', TaskCategory.SETUP, TaskPriority.MEDIUM, 'PRE_EVENT', -30, 8, ['activities']),
    createTask('comm-5', 'Arrange entertainment', 'Book local performers or speakers', TaskCategory.SETUP, TaskPriority.MEDIUM, 'PRE_EVENT', -30, 6, ['entertainment']),
    createTask('comm-6', 'Promote event locally', 'Distribute flyers and social media', TaskCategory.MARKETING, TaskPriority.HIGH, 'PRE_EVENT', -21, 10, ['promotion']),
    createTask('comm-7', 'Coordinate volunteers', 'Assign roles and create schedule', TaskCategory.SETUP, TaskPriority.HIGH, 'PRE_EVENT', -14, 6, ['volunteers']),
    createTask('comm-8', 'Arrange supplies and equipment', 'Secure tents, tables, sound system', TaskCategory.LOGISTICS, TaskPriority.MEDIUM, 'PRE_EVENT', -7, 6, ['equipment']),
    createTask('comm-9', 'Set up event space', 'Install booths, signage, and equipment', TaskCategory.LOGISTICS, TaskPriority.URGENT, 'PRE_EVENT', -1, 6, ['setup']),
    createTask('comm-10', 'Run event operations', 'Manage all activities and logistics', TaskCategory.SETUP, TaskPriority.URGENT, 'DURING_EVENT', 0, 8, ['operations']),
    createTask('comm-11', 'Engage attendees', 'Collect feedback and sign-ups', TaskCategory.REGISTRATION, TaskPriority.MEDIUM, 'DURING_EVENT', 0, 4, ['engagement']),
    createTask('comm-12', 'Event teardown', 'Pack up and clean venue', TaskCategory.LOGISTICS, TaskPriority.HIGH, 'POST_EVENT', 0, 4, ['cleanup']),
    createTask('comm-13', 'Thank partners and volunteers', 'Send appreciation messages', TaskCategory.POST_EVENT, TaskPriority.HIGH, 'POST_EVENT', 2, 3, ['follow-up']),
    createTask('comm-14', 'Share event impact', 'Report outcomes to community', TaskCategory.POST_EVENT, TaskPriority.MEDIUM, 'POST_EVENT', 7, 4, ['reporting']),
  ],
};

// ==================== EXPORT ALL TEMPLATES ====================

export const INDUSTRY_TASK_TEMPLATES: IndustryTaskTemplate[] = [
  // Corporate
  conferenceTemplate,
  tradeShowTemplate,
  corporateWorkshopTemplate,
  // Social
  weddingTemplate,
  birthdayPartyTemplate,
  // Educational
  hackathonTemplate,
  graduationTemplate,
  // Entertainment
  concertTemplate,
  festivalTemplate,
  // Sports
  tournamentTemplate,
  marathonTemplate,
  // Non-Profit
  fundraisingGalaTemplate,
  communityEventTemplate,
];

export function getTemplatesByIndustry(industry: IndustryType): IndustryTaskTemplate[] {
  return INDUSTRY_TASK_TEMPLATES.filter(t => t.industry === industry);
}

export function getTemplateById(id: string): IndustryTaskTemplate | undefined {
  return INDUSTRY_TASK_TEMPLATES.find(t => t.id === id);
}

export function searchTemplates(query: string): IndustryTaskTemplate[] {
  const lowerQuery = query.toLowerCase();
  return INDUSTRY_TASK_TEMPLATES.filter(
    t => t.name.toLowerCase().includes(lowerQuery) ||
         t.description.toLowerCase().includes(lowerQuery) ||
         t.eventType.toLowerCase().includes(lowerQuery)
  );
}
