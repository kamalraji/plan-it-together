import { IndustryTaskTemplate, IndustryTaskItem, IndustryType, TaskPriority, TaskCategory, TaskPhase } from './industryTemplateTypes';

// Helper to create task items
function createTask(
  id: string,
  title: string,
  description: string,
  category: TaskCategory,
  priority: TaskPriority,
  phase: TaskPhase,
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
    createTask('conf-1', 'Define conference theme and objectives', 'Establish the main theme, learning objectives, and target outcomes', 'PLANNING', 'CRITICAL', 'PRE_EVENT', -90, 8, ['planning'], [{ title: 'Research industry trends' }, { title: 'Define target audience' }, { title: 'Set measurable goals' }]),
    createTask('conf-2', 'Create budget and financial plan', 'Develop comprehensive budget including venue, speakers, catering, marketing', 'FINANCE', 'CRITICAL', 'PRE_EVENT', -85, 12, ['finance'], [{ title: 'Estimate all costs' }, { title: 'Identify revenue streams' }, { title: 'Create contingency fund' }]),
    createTask('conf-3', 'Select and book venue', 'Research, visit, and secure the conference venue', 'VENUE', 'CRITICAL', 'PRE_EVENT', -80, 20, ['venue'], [{ title: 'Shortlist venues' }, { title: 'Schedule site visits' }, { title: 'Negotiate contract' }], ['conf-2']),
    createTask('conf-4', 'Identify and invite keynote speakers', 'Research and reach out to potential keynote speakers', 'CONTENT', 'HIGH', 'PRE_EVENT', -75, 16, ['speakers'], [{ title: 'Create speaker wishlist' }, { title: 'Draft invitation letters' }, { title: 'Negotiate speaker fees' }]),
    createTask('conf-5', 'Design conference agenda and tracks', 'Create detailed schedule with sessions, breaks, and networking', 'PLANNING', 'HIGH', 'PRE_EVENT', -60, 12, ['agenda'], [{ title: 'Define session types' }, { title: 'Allocate time slots' }, { title: 'Plan networking breaks' }], ['conf-4']),
    createTask('conf-6', 'Set up registration platform', 'Configure online registration with ticket types and pricing', 'REGISTRATION', 'HIGH', 'PRE_EVENT', -55, 8, ['registration'], [{ title: 'Choose platform' }, { title: 'Set up ticket tiers' }, { title: 'Configure payment processing' }]),
    createTask('conf-7', 'Launch marketing campaign', 'Execute multi-channel marketing strategy', 'MARKETING', 'HIGH', 'PRE_EVENT', -50, 24, ['marketing'], [{ title: 'Create marketing materials' }, { title: 'Launch email campaigns' }, { title: 'Social media promotion' }], ['conf-6']),
    createTask('conf-8', 'Arrange catering and refreshments', 'Plan meals, coffee breaks, and dietary accommodations', 'CATERING', 'MEDIUM', 'PRE_EVENT', -40, 10, ['catering'], [{ title: 'Select caterer' }, { title: 'Plan menu' }, { title: 'Handle dietary requirements' }]),
    createTask('conf-9', 'Set up AV and technical equipment', 'Arrange projectors, microphones, screens, and WiFi', 'TECHNOLOGY', 'HIGH', 'PRE_EVENT', -30, 12, ['technical'], [{ title: 'List equipment needs' }, { title: 'Test all equipment' }, { title: 'Arrange backup equipment' }]),
    createTask('conf-10', 'Prepare speaker presentations', 'Collect, review, and format all speaker materials', 'CONTENT', 'MEDIUM', 'PRE_EVENT', -20, 8, ['speakers'], [{ title: 'Collect presentations' }, { title: 'Review content' }, { title: 'Format for consistency' }], ['conf-5']),
    createTask('conf-11', 'Create name badges and materials', 'Design and print badges, programs, and handouts', 'LOGISTICS', 'MEDIUM', 'PRE_EVENT', -15, 6, ['materials'], [{ title: 'Design badges' }, { title: 'Print programs' }, { title: 'Prepare swag bags' }]),
    createTask('conf-12', 'Brief volunteers and staff', 'Train all team members on their roles and responsibilities', 'OPERATIONS', 'HIGH', 'PRE_EVENT', -7, 8, ['team'], [{ title: 'Create role descriptions' }, { title: 'Conduct training session' }, { title: 'Distribute schedules' }]),
    createTask('conf-13', 'Final venue walkthrough', 'Complete final check of venue setup and logistics', 'VENUE', 'CRITICAL', 'PRE_EVENT', -1, 4, ['venue'], [{ title: 'Check room layouts' }, { title: 'Verify signage' }, { title: 'Test all equipment' }]),
    createTask('conf-14', 'Manage registration desk', 'Handle attendee check-in and badge distribution', 'REGISTRATION', 'CRITICAL', 'DURING_EVENT', 0, 12, ['registration'], [{ title: 'Set up check-in stations' }, { title: 'Handle walk-ins' }, { title: 'Resolve issues' }]),
    createTask('conf-15', 'Coordinate session transitions', 'Ensure smooth flow between sessions and breaks', 'OPERATIONS', 'HIGH', 'DURING_EVENT', 0, 10, ['coordination'], [{ title: 'Manage time keeping' }, { title: 'Coordinate speakers' }, { title: 'Handle room changes' }]),
    createTask('conf-16', 'Capture event photos and videos', 'Document the conference for marketing and archives', 'MARKETING', 'MEDIUM', 'DURING_EVENT', 0, 8, ['media'], [{ title: 'Photograph key moments' }, { title: 'Record sessions' }, { title: 'Capture testimonials' }]),
    createTask('conf-17', 'Manage social media during event', 'Post live updates and engage with attendees online', 'MARKETING', 'MEDIUM', 'DURING_EVENT', 0, 6, ['social'], [{ title: 'Post live updates' }, { title: 'Monitor hashtag' }, { title: 'Respond to mentions' }]),
    createTask('conf-18', 'Send thank you emails', 'Thank attendees, speakers, and sponsors', 'COMMUNICATION', 'HIGH', 'POST_EVENT', 1, 4, ['follow-up'], [{ title: 'Draft thank you messages' }, { title: 'Personalize for VIPs' }, { title: 'Schedule send' }]),
    createTask('conf-19', 'Collect attendee feedback', 'Send and analyze post-event surveys', 'COMMUNICATION', 'HIGH', 'POST_EVENT', 2, 6, ['feedback'], [{ title: 'Create survey' }, { title: 'Send to attendees' }, { title: 'Analyze responses' }]),
    createTask('conf-20', 'Share event recordings', 'Process and distribute session recordings', 'CONTENT', 'MEDIUM', 'POST_EVENT', 7, 8, ['content'], [{ title: 'Edit recordings' }, { title: 'Upload to platform' }, { title: 'Send access links' }]),
    createTask('conf-21', 'Compile final event report', 'Create comprehensive post-event analysis', 'PLANNING', 'MEDIUM', 'POST_EVENT', 14, 10, ['reporting'], [{ title: 'Compile metrics' }, { title: 'Analyze ROI' }, { title: 'Document learnings' }], ['conf-19']),
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
    createTask('trade-1', 'Select trade show and register', 'Research and register for target trade shows', 'PLANNING', 'CRITICAL', 'PRE_EVENT', -120, 6, ['planning']),
    createTask('trade-2', 'Design booth concept', 'Create booth design including graphics and layout', 'MARKETING', 'HIGH', 'PRE_EVENT', -90, 16, ['design']),
    createTask('trade-3', 'Order booth materials', 'Purchase displays, banners, and promotional items', 'LOGISTICS', 'HIGH', 'PRE_EVENT', -60, 8, ['materials'], [], ['trade-2']),
    createTask('trade-4', 'Prepare marketing collateral', 'Create brochures, flyers, and business cards', 'MARKETING', 'MEDIUM', 'PRE_EVENT', -45, 12, ['marketing']),
    createTask('trade-5', 'Set up lead capture system', 'Configure badge scanners and CRM integration', 'TECHNOLOGY', 'HIGH', 'PRE_EVENT', -30, 6, ['leads']),
    createTask('trade-6', 'Train booth staff', 'Prepare team on product demos and pitch', 'OPERATIONS', 'HIGH', 'PRE_EVENT', -14, 8, ['training']),
    createTask('trade-7', 'Arrange shipping and logistics', 'Coordinate booth and material shipping', 'LOGISTICS', 'HIGH', 'PRE_EVENT', -21, 6, ['shipping']),
    createTask('trade-8', 'Book travel and accommodation', 'Arrange team travel and hotel stays', 'LOGISTICS', 'MEDIUM', 'PRE_EVENT', -30, 4, ['travel']),
    createTask('trade-9', 'Set up booth', 'Install booth displays and test equipment', 'LOGISTICS', 'CRITICAL', 'PRE_EVENT', -1, 8, ['setup']),
    createTask('trade-10', 'Manage booth during show', 'Staff booth and engage with visitors', 'OPERATIONS', 'CRITICAL', 'DURING_EVENT', 0, 24, ['operations']),
    createTask('trade-11', 'Capture leads and contacts', 'Collect visitor information and qualify leads', 'REGISTRATION', 'CRITICAL', 'DURING_EVENT', 0, 16, ['leads']),
    createTask('trade-12', 'Network with industry contacts', 'Attend networking events and meet partners', 'COMMUNICATION', 'MEDIUM', 'DURING_EVENT', 0, 8, ['networking']),
    createTask('trade-13', 'Dismantle booth', 'Pack up booth and arrange return shipping', 'LOGISTICS', 'HIGH', 'POST_EVENT', 1, 6, ['teardown']),
    createTask('trade-14', 'Follow up with leads', 'Send personalized follow-up emails', 'COMMUNICATION', 'CRITICAL', 'POST_EVENT', 2, 8, ['follow-up']),
    createTask('trade-15', 'Analyze trade show ROI', 'Calculate cost per lead and evaluate success', 'FINANCE', 'MEDIUM', 'POST_EVENT', 14, 6, ['reporting']),
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
    createTask('ws-1', 'Define workshop objectives', 'Establish learning goals and outcomes', 'PLANNING', 'CRITICAL', 'PRE_EVENT', -45, 4, ['planning']),
    createTask('ws-2', 'Develop workshop content', 'Create presentation, exercises, and materials', 'CONTENT', 'HIGH', 'PRE_EVENT', -30, 20, ['content'], [], ['ws-1']),
    createTask('ws-3', 'Book training room', 'Reserve appropriate space with equipment', 'VENUE', 'HIGH', 'PRE_EVENT', -28, 2, ['venue']),
    createTask('ws-4', 'Prepare handouts and materials', 'Print workbooks and prepare supplies', 'LOGISTICS', 'MEDIUM', 'PRE_EVENT', -7, 4, ['materials'], [], ['ws-2']),
    createTask('ws-5', 'Set up room and equipment', 'Arrange seating and test AV equipment', 'LOGISTICS', 'HIGH', 'PRE_EVENT', -1, 2, ['setup']),
    createTask('ws-6', 'Facilitate workshop', 'Lead interactive sessions and exercises', 'OPERATIONS', 'CRITICAL', 'DURING_EVENT', 0, 8, ['facilitation']),
    createTask('ws-7', 'Capture participant feedback', 'Collect evaluations during session', 'COMMUNICATION', 'MEDIUM', 'DURING_EVENT', 0, 1, ['feedback']),
    createTask('ws-8', 'Send follow-up resources', 'Share additional materials and recordings', 'COMMUNICATION', 'HIGH', 'POST_EVENT', 1, 2, ['follow-up']),
    createTask('ws-9', 'Analyze workshop effectiveness', 'Review feedback and measure learning outcomes', 'PLANNING', 'MEDIUM', 'POST_EVENT', 7, 4, ['evaluation']),
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
    createTask('wed-1', 'Set wedding budget', 'Determine total budget and allocation', 'FINANCE', 'CRITICAL', 'PRE_EVENT', -365, 8, ['budget']),
    createTask('wed-2', 'Create guest list', 'Compile and organize guest list with addresses', 'PLANNING', 'CRITICAL', 'PRE_EVENT', -300, 10, ['guests']),
    createTask('wed-3', 'Select wedding venue', 'Visit and book ceremony and reception venues', 'VENUE', 'CRITICAL', 'PRE_EVENT', -270, 20, ['venue'], [], ['wed-1']),
    createTask('wed-4', 'Hire photographer and videographer', 'Research, interview, and book vendors', 'LOGISTICS', 'HIGH', 'PRE_EVENT', -240, 12, ['vendors']),
    createTask('wed-5', 'Book caterer', 'Select caterer and plan menu', 'CATERING', 'HIGH', 'PRE_EVENT', -210, 10, ['catering']),
    createTask('wed-6', 'Choose wedding party', 'Select bridesmaids, groomsmen, and other roles', 'PLANNING', 'MEDIUM', 'PRE_EVENT', -200, 2, ['party']),
    createTask('wed-7', 'Select and order wedding attire', 'Shop for wedding dress, suits, and accessories', 'LOGISTICS', 'HIGH', 'PRE_EVENT', -180, 16, ['attire']),
    createTask('wed-8', 'Book florist', 'Select florist and plan floral arrangements', 'LOGISTICS', 'MEDIUM', 'PRE_EVENT', -150, 6, ['flowers']),
    createTask('wed-9', 'Hire entertainment/DJ', 'Book band or DJ for reception', 'LOGISTICS', 'MEDIUM', 'PRE_EVENT', -150, 6, ['entertainment']),
    createTask('wed-10', 'Send save-the-dates', 'Design and mail save-the-date cards', 'COMMUNICATION', 'HIGH', 'PRE_EVENT', -180, 4, ['invitations']),
    createTask('wed-11', 'Plan honeymoon', 'Research and book honeymoon destination', 'LOGISTICS', 'MEDIUM', 'PRE_EVENT', -120, 8, ['honeymoon']),
    createTask('wed-12', 'Order wedding cake', 'Select bakery and design cake', 'CATERING', 'MEDIUM', 'PRE_EVENT', -90, 4, ['cake']),
    createTask('wed-13', 'Send wedding invitations', 'Mail formal invitations with RSVP', 'COMMUNICATION', 'HIGH', 'PRE_EVENT', -60, 6, ['invitations']),
    createTask('wed-14', 'Finalize ceremony details', 'Plan ceremony order and write vows', 'PLANNING', 'HIGH', 'PRE_EVENT', -45, 8, ['ceremony']),
    createTask('wed-15', 'Create seating chart', 'Arrange seating based on RSVPs', 'PLANNING', 'MEDIUM', 'PRE_EVENT', -21, 6, ['seating'], [], ['wed-13']),
    createTask('wed-16', 'Confirm all vendors', 'Final confirmation with all service providers', 'LOGISTICS', 'CRITICAL', 'PRE_EVENT', -7, 4, ['vendors']),
    createTask('wed-17', 'Wedding rehearsal', 'Practice ceremony with wedding party', 'OPERATIONS', 'CRITICAL', 'PRE_EVENT', -1, 4, ['rehearsal']),
    createTask('wed-18', 'Rehearsal dinner', 'Host dinner for wedding party and family', 'CATERING', 'HIGH', 'PRE_EVENT', -1, 4, ['dinner']),
    createTask('wed-19', 'Wedding ceremony', 'Execute ceremony with all planned elements', 'OPERATIONS', 'CRITICAL', 'DURING_EVENT', 0, 2, ['ceremony']),
    createTask('wed-20', 'Wedding reception', 'Coordinate reception activities and timeline', 'OPERATIONS', 'CRITICAL', 'DURING_EVENT', 0, 6, ['reception']),
    createTask('wed-21', 'Send thank you cards', 'Write and mail thank you notes for gifts', 'COMMUNICATION', 'HIGH', 'POST_EVENT', 14, 8, ['follow-up']),
    createTask('wed-22', 'Return rentals', 'Return any rented items on time', 'LOGISTICS', 'MEDIUM', 'POST_EVENT', 3, 2, ['cleanup']),
    createTask('wed-23', 'Review and share photos', 'Collect and share wedding photos', 'CONTENT', 'LOW', 'POST_EVENT', 30, 4, ['photos']),
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
    createTask('bday-1', 'Set party theme and budget', 'Choose theme and determine spending limit', 'PLANNING', 'HIGH', 'PRE_EVENT', -30, 2, ['planning']),
    createTask('bday-2', 'Create guest list', 'List all invitees with contact info', 'PLANNING', 'HIGH', 'PRE_EVENT', -28, 1, ['guests']),
    createTask('bday-3', 'Book venue or plan location', 'Reserve party venue or prepare home', 'VENUE', 'HIGH', 'PRE_EVENT', -21, 3, ['venue']),
    createTask('bday-4', 'Send invitations', 'Design and send party invitations', 'COMMUNICATION', 'HIGH', 'PRE_EVENT', -21, 2, ['invitations']),
    createTask('bday-5', 'Plan party activities', 'Organize games and entertainment', 'PLANNING', 'MEDIUM', 'PRE_EVENT', -14, 3, ['activities']),
    createTask('bday-6', 'Order or make cake', 'Arrange birthday cake', 'CATERING', 'MEDIUM', 'PRE_EVENT', -7, 2, ['cake']),
    createTask('bday-7', 'Buy decorations', 'Purchase balloons, banners, tableware', 'LOGISTICS', 'MEDIUM', 'PRE_EVENT', -5, 2, ['decorations']),
    createTask('bday-8', 'Plan party menu', 'Prepare or order food and drinks', 'CATERING', 'MEDIUM', 'PRE_EVENT', -3, 3, ['food']),
    createTask('bday-9', 'Set up party space', 'Decorate venue and arrange furniture', 'LOGISTICS', 'HIGH', 'PRE_EVENT', -1, 3, ['setup']),
    createTask('bday-10', 'Host party activities', 'Lead games and entertainment', 'OPERATIONS', 'CRITICAL', 'DURING_EVENT', 0, 4, ['activities']),
    createTask('bday-11', 'Serve food and cake', 'Coordinate meal service and cake cutting', 'CATERING', 'HIGH', 'DURING_EVENT', 0, 2, ['catering']),
    createTask('bday-12', 'Capture memories', 'Take photos and videos', 'CONTENT', 'MEDIUM', 'DURING_EVENT', 0, 2, ['photos']),
    createTask('bday-13', 'Clean up venue', 'Pack decorations and clean space', 'LOGISTICS', 'HIGH', 'POST_EVENT', 1, 2, ['cleanup']),
    createTask('bday-14', 'Send thank you notes', 'Thank guests for attending and gifts', 'COMMUNICATION', 'MEDIUM', 'POST_EVENT', 3, 1, ['follow-up']),
  ],
};

// ==================== EDUCATIONAL EVENT TEMPLATES ====================

const hackathonTemplate: IndustryTaskTemplate = {
  id: 'educational-hackathon',
  name: 'Hackathon',
  description: 'Comprehensive hackathon organization with team formation, judging, and prizes.',
  industry: 'educational',
  eventType: 'Hackathon',
  icon: '💻',
  color: '#10B981',
  estimatedTeamSize: { min: 5, max: 25 },
  eventSizeRange: { min: 50, max: 2000 },
  metadata: { author: 'Lovable', version: '1.0', lastUpdated: '2024-01-15', usageCount: 0, rating: 4.9 },
  tasks: [
    createTask('hack-1', 'Define hackathon theme and challenges', 'Establish themes, problem statements, and tracks', 'PLANNING', 'CRITICAL', 'PRE_EVENT', -60, 8, ['planning'], [{ title: 'Research trending topics' }, { title: 'Define challenge tracks' }, { title: 'Set judging criteria' }]),
    createTask('hack-2', 'Secure venue and infrastructure', 'Book venue with power, WiFi, and workspace for teams', 'VENUE', 'CRITICAL', 'PRE_EVENT', -45, 12, ['venue'], [{ title: 'Check power capacity' }, { title: 'Test WiFi bandwidth' }, { title: 'Plan workspace layout' }]),
    createTask('hack-3', 'Recruit sponsors and partners', 'Reach out to companies for sponsorship and prizes', 'FINANCE', 'HIGH', 'PRE_EVENT', -50, 20, ['sponsors'], [{ title: 'Create sponsorship packages' }, { title: 'Pitch to companies' }, { title: 'Finalize agreements' }]),
    createTask('hack-4', 'Set up registration platform', 'Configure participant registration and team formation', 'REGISTRATION', 'HIGH', 'PRE_EVENT', -40, 6, ['registration'], [{ title: 'Set up registration form' }, { title: 'Enable team creation' }, { title: 'Configure waitlist' }]),
    createTask('hack-5', 'Recruit judges and mentors', 'Invite industry experts to judge and mentor', 'PLANNING', 'HIGH', 'PRE_EVENT', -35, 10, ['judges'], [{ title: 'Create mentor requirements' }, { title: 'Reach out to experts' }, { title: 'Confirm availability' }]),
    createTask('hack-6', 'Plan workshops and sessions', 'Schedule technical workshops and sponsor presentations', 'CONTENT', 'MEDIUM', 'PRE_EVENT', -30, 8, ['workshops'], [{ title: 'Define workshop topics' }, { title: 'Recruit speakers' }, { title: 'Create schedule' }]),
    createTask('hack-7', 'Arrange food and refreshments', 'Plan meals and snacks for duration of event', 'CATERING', 'HIGH', 'PRE_EVENT', -21, 8, ['catering'], [{ title: 'Order meals' }, { title: 'Plan snack stations' }, { title: 'Handle dietary restrictions' }]),
    createTask('hack-8', 'Prepare technical infrastructure', 'Set up development tools, APIs, and resources', 'TECHNOLOGY', 'HIGH', 'PRE_EVENT', -14, 10, ['technical'], [{ title: 'Set up GitHub org' }, { title: 'Prepare API access' }, { title: 'Configure dev tools' }]),
    createTask('hack-9', 'Create judging rubric', 'Define scoring criteria and process', 'PLANNING', 'HIGH', 'PRE_EVENT', -14, 4, ['judging'], [{ title: 'Define categories' }, { title: 'Create scoring sheets' }, { title: 'Brief judges' }]),
    createTask('hack-10', 'Brief volunteers', 'Train volunteers on their roles', 'OPERATIONS', 'HIGH', 'PRE_EVENT', -7, 4, ['volunteers'], [{ title: 'Create role assignments' }, { title: 'Conduct training' }, { title: 'Share schedules' }]),
    createTask('hack-11', 'Set up venue', 'Arrange workspaces, signage, and equipment', 'LOGISTICS', 'CRITICAL', 'PRE_EVENT', -1, 8, ['setup'], [{ title: 'Arrange tables' }, { title: 'Set up power strips' }, { title: 'Install signage' }]),
    createTask('hack-12', 'Run opening ceremony', 'Welcome participants and explain rules', 'OPERATIONS', 'CRITICAL', 'DURING_EVENT', 0, 2, ['ceremony'], [{ title: 'Welcome speech' }, { title: 'Explain challenges' }, { title: 'Start hacking' }]),
    createTask('hack-13', 'Manage hacking sessions', 'Support teams and run workshops', 'OPERATIONS', 'HIGH', 'DURING_EVENT', 0, 24, ['hacking'], [{ title: 'Run workshops' }, { title: 'Provide support' }, { title: 'Keep energy high' }]),
    createTask('hack-14', 'Coordinate judging', 'Manage demos and scoring process', 'OPERATIONS', 'CRITICAL', 'DURING_EVENT', 0, 6, ['judging'], [{ title: 'Schedule demos' }, { title: 'Collect scores' }, { title: 'Tabulate results' }]),
    createTask('hack-15', 'Run closing ceremony', 'Announce winners and distribute prizes', 'OPERATIONS', 'CRITICAL', 'DURING_EVENT', 0, 2, ['ceremony'], [{ title: 'Announce winners' }, { title: 'Award prizes' }, { title: 'Thank sponsors' }]),
    createTask('hack-16', 'Collect project submissions', 'Gather all project links and documentation', 'CONTENT', 'HIGH', 'POST_EVENT', 1, 4, ['submissions'], [{ title: 'Verify submissions' }, { title: 'Create gallery' }, { title: 'Archive projects' }]),
    createTask('hack-17', 'Send participant surveys', 'Gather feedback on the hackathon experience', 'COMMUNICATION', 'HIGH', 'POST_EVENT', 2, 4, ['feedback'], [{ title: 'Create survey' }, { title: 'Send to participants' }, { title: 'Analyze results' }]),
    createTask('hack-18', 'Share recap and photos', 'Publish blog post and share photos', 'MARKETING', 'MEDIUM', 'POST_EVENT', 7, 6, ['media'], [{ title: 'Write blog post' }, { title: 'Share photos' }, { title: 'Update website' }]),
    createTask('hack-19', 'Compile sponsor report', 'Create ROI report for sponsors', 'FINANCE', 'HIGH', 'POST_EVENT', 14, 8, ['reporting'], [{ title: 'Compile metrics' }, { title: 'Create report' }, { title: 'Send to sponsors' }]),
  ],
};

const graduationTemplate: IndustryTaskTemplate = {
  id: 'educational-graduation',
  name: 'Graduation Ceremony',
  description: 'Complete graduation planning including ceremony, photos, and celebrations.',
  industry: 'educational',
  eventType: 'Graduation',
  icon: '🎓',
  color: '#6366F1',
  estimatedTeamSize: { min: 10, max: 50 },
  eventSizeRange: { min: 100, max: 10000 },
  metadata: { author: 'Lovable', version: '1.0', lastUpdated: '2024-01-15', usageCount: 0, rating: 4.7 },
  tasks: [
    createTask('grad-1', 'Establish ceremony date and venue', 'Confirm date and secure graduation venue', 'VENUE', 'CRITICAL', 'PRE_EVENT', -180, 8, ['venue']),
    createTask('grad-2', 'Create graduate list', 'Compile and verify list of graduating students', 'REGISTRATION', 'CRITICAL', 'PRE_EVENT', -120, 12, ['graduates']),
    createTask('grad-3', 'Order regalia and supplies', 'Order caps, gowns, diplomas, and certificates', 'LOGISTICS', 'HIGH', 'PRE_EVENT', -90, 8, ['supplies']),
    createTask('grad-4', 'Plan ceremony program', 'Design ceremony order and select speakers', 'PLANNING', 'HIGH', 'PRE_EVENT', -60, 10, ['program']),
    createTask('grad-5', 'Coordinate with vendors', 'Book photographer, caterer, and decorators', 'LOGISTICS', 'HIGH', 'PRE_EVENT', -45, 8, ['vendors']),
    createTask('grad-6', 'Send invitations to families', 'Distribute invitations with seating info', 'COMMUNICATION', 'HIGH', 'PRE_EVENT', -30, 6, ['invitations']),
    createTask('grad-7', 'Rehearse ceremony', 'Run through ceremony with graduates', 'OPERATIONS', 'HIGH', 'PRE_EVENT', -7, 4, ['rehearsal']),
    createTask('grad-8', 'Set up venue', 'Arrange seating, stage, and decorations', 'LOGISTICS', 'CRITICAL', 'PRE_EVENT', -1, 8, ['setup']),
    createTask('grad-9', 'Manage ceremony', 'Coordinate all ceremony elements', 'OPERATIONS', 'CRITICAL', 'DURING_EVENT', 0, 6, ['ceremony']),
    createTask('grad-10', 'Distribute diplomas', 'Hand out diplomas and certificates', 'REGISTRATION', 'CRITICAL', 'DURING_EVENT', 0, 4, ['diplomas']),
    createTask('grad-11', 'Coordinate photography', 'Manage professional photo sessions', 'CONTENT', 'HIGH', 'DURING_EVENT', 0, 4, ['photos']),
    createTask('grad-12', 'Host reception', 'Manage post-ceremony celebration', 'CATERING', 'MEDIUM', 'DURING_EVENT', 0, 3, ['reception']),
    createTask('grad-13', 'Share photos and videos', 'Distribute ceremony photos and recordings', 'CONTENT', 'MEDIUM', 'POST_EVENT', 7, 6, ['media']),
    createTask('grad-14', 'Send certificates by mail', 'Mail certificates to absent graduates', 'LOGISTICS', 'MEDIUM', 'POST_EVENT', 14, 4, ['certificates']),
  ],
};

// ==================== ENTERTAINMENT EVENT TEMPLATES ====================

const concertTemplate: IndustryTaskTemplate = {
  id: 'entertainment-concert',
  name: 'Music Concert',
  description: 'Live music event planning with artist management, stage setup, and crowd control.',
  industry: 'entertainment',
  eventType: 'Concert',
  icon: '🎵',
  color: '#8B5CF6',
  estimatedTeamSize: { min: 10, max: 100 },
  eventSizeRange: { min: 100, max: 50000 },
  metadata: { author: 'Lovable', version: '1.0', lastUpdated: '2024-01-15', usageCount: 0, rating: 4.8 },
  tasks: [
    createTask('concert-1', 'Book headliner and supporting acts', 'Negotiate contracts with artists and agents', 'PLANNING', 'CRITICAL', 'PRE_EVENT', -180, 30, ['artists']),
    createTask('concert-2', 'Secure venue', 'Book venue with adequate capacity', 'VENUE', 'CRITICAL', 'PRE_EVENT', -150, 15, ['venue']),
    createTask('concert-3', 'Obtain permits and licenses', 'Get all necessary permits and insurance', 'SAFETY', 'CRITICAL', 'PRE_EVENT', -120, 20, ['permits']),
    createTask('concert-4', 'Coordinate sound and lighting', 'Book sound engineer and lighting designer', 'TECHNOLOGY', 'HIGH', 'PRE_EVENT', -90, 16, ['production']),
    createTask('concert-5', 'Launch ticket sales', 'Set up ticketing platform and pricing', 'REGISTRATION', 'HIGH', 'PRE_EVENT', -90, 10, ['tickets']),
    createTask('concert-6', 'Execute marketing campaign', 'Promote concert through all channels', 'MARKETING', 'HIGH', 'PRE_EVENT', -75, 30, ['marketing']),
    createTask('concert-7', 'Coordinate artist hospitality', 'Arrange travel, accommodation, and riders', 'LOGISTICS', 'HIGH', 'PRE_EVENT', -30, 12, ['hospitality']),
    createTask('concert-8', 'Hire security team', 'Contract professional security services', 'SAFETY', 'CRITICAL', 'PRE_EVENT', -45, 8, ['security']),
    createTask('concert-9', 'Arrange merchandise', 'Coordinate artist merchandise sales', 'LOGISTICS', 'MEDIUM', 'PRE_EVENT', -21, 6, ['merch']),
    createTask('concert-10', 'Sound check', 'Complete technical rehearsal', 'TECHNOLOGY', 'CRITICAL', 'PRE_EVENT', -1, 8, ['soundcheck']),
    createTask('concert-11', 'Manage doors and entry', 'Coordinate ticket scanning and crowd entry', 'OPERATIONS', 'CRITICAL', 'DURING_EVENT', 0, 4, ['entry']),
    createTask('concert-12', 'Run show production', 'Manage sound, lighting, and stage', 'OPERATIONS', 'CRITICAL', 'DURING_EVENT', 0, 6, ['production']),
    createTask('concert-13', 'Coordinate crowd safety', 'Monitor crowd and manage emergencies', 'SAFETY', 'CRITICAL', 'DURING_EVENT', 0, 6, ['safety']),
    createTask('concert-14', 'Manage artist departure', 'Coordinate artist send-off', 'LOGISTICS', 'MEDIUM', 'POST_EVENT', 1, 2, ['artists']),
    createTask('concert-15', 'Settle finances', 'Process payments to all vendors and artists', 'FINANCE', 'HIGH', 'POST_EVENT', 7, 10, ['finances']),
    createTask('concert-16', 'Analyze event performance', 'Review attendance, revenue, and feedback', 'PLANNING', 'MEDIUM', 'POST_EVENT', 14, 6, ['analytics']),
  ],
};

const festivalTemplate: IndustryTaskTemplate = {
  id: 'entertainment-festival',
  name: 'Music Festival',
  description: 'Multi-day festival organization with multiple stages, camping, and vendors.',
  industry: 'entertainment',
  eventType: 'Festival',
  icon: '🎪',
  color: '#F97316',
  estimatedTeamSize: { min: 50, max: 500 },
  eventSizeRange: { min: 1000, max: 100000 },
  metadata: { author: 'Lovable', version: '1.0', lastUpdated: '2024-01-15', usageCount: 0, rating: 4.9 },
  tasks: [
    createTask('fest-1', 'Develop festival concept and theme', 'Create festival identity and experience design', 'PLANNING', 'CRITICAL', 'PRE_EVENT', -365, 20, ['concept']),
    createTask('fest-2', 'Secure festival grounds', 'Lease land and obtain all permits', 'VENUE', 'CRITICAL', 'PRE_EVENT', -300, 40, ['venue']),
    createTask('fest-3', 'Book headliners and lineup', 'Contract artists across multiple stages', 'PLANNING', 'CRITICAL', 'PRE_EVENT', -270, 60, ['artists']),
    createTask('fest-4', 'Design site layout', 'Plan stages, camping, vendors, and facilities', 'PLANNING', 'HIGH', 'PRE_EVENT', -240, 30, ['site']),
    createTask('fest-5', 'Build sponsorship program', 'Create and sell sponsorship packages', 'FINANCE', 'HIGH', 'PRE_EVENT', -210, 40, ['sponsors']),
    createTask('fest-6', 'Set up infrastructure', 'Coordinate power, water, and sanitation', 'LOGISTICS', 'CRITICAL', 'PRE_EVENT', -60, 50, ['infrastructure']),
    createTask('fest-7', 'Recruit vendor village', 'Select and manage food and retail vendors', 'LOGISTICS', 'HIGH', 'PRE_EVENT', -90, 20, ['vendors']),
    createTask('fest-8', 'Launch ticket sales', 'Execute tiered ticket release strategy', 'REGISTRATION', 'HIGH', 'PRE_EVENT', -180, 15, ['tickets']),
    createTask('fest-9', 'Hire and train staff', 'Recruit hundreds of staff and volunteers', 'OPERATIONS', 'HIGH', 'PRE_EVENT', -60, 40, ['staffing']),
    createTask('fest-10', 'Coordinate medical and safety', 'Set up medical tents and safety protocols', 'SAFETY', 'CRITICAL', 'PRE_EVENT', -30, 20, ['safety']),
    createTask('fest-11', 'Build stages and structures', 'Construct all festival infrastructure', 'LOGISTICS', 'CRITICAL', 'PRE_EVENT', -7, 100, ['build']),
    createTask('fest-12', 'Manage daily operations', 'Run all festival operations', 'OPERATIONS', 'CRITICAL', 'DURING_EVENT', 0, 72, ['operations']),
    createTask('fest-13', 'Coordinate artist performances', 'Manage stage schedules and changes', 'OPERATIONS', 'HIGH', 'DURING_EVENT', 0, 48, ['artists']),
    createTask('fest-14', 'Handle crowd management', 'Monitor and manage festival crowds', 'SAFETY', 'CRITICAL', 'DURING_EVENT', 0, 48, ['crowds']),
    createTask('fest-15', 'Breakdown and cleanup', 'Dismantle structures and restore site', 'LOGISTICS', 'HIGH', 'POST_EVENT', 1, 100, ['teardown']),
    createTask('fest-16', 'Compile festival report', 'Analyze attendance, revenue, and feedback', 'FINANCE', 'HIGH', 'POST_EVENT', 30, 20, ['reporting']),
  ],
};

// ==================== SPORTS EVENT TEMPLATES ====================

const tournamentTemplate: IndustryTaskTemplate = {
  id: 'sports-tournament',
  name: 'Sports Tournament',
  description: 'Multi-team tournament organization with brackets, venues, and officiating.',
  industry: 'sports',
  eventType: 'Tournament',
  icon: '🏆',
  color: '#EF4444',
  estimatedTeamSize: { min: 5, max: 30 },
  eventSizeRange: { min: 50, max: 5000 },
  metadata: { author: 'Lovable', version: '1.0', lastUpdated: '2024-01-15', usageCount: 0, rating: 4.7 },
  tasks: [
    createTask('tourn-1', 'Define tournament format', 'Choose bracket type and rules', 'PLANNING', 'CRITICAL', 'PRE_EVENT', -60, 6, ['format']),
    createTask('tourn-2', 'Secure venues and fields', 'Book all required playing venues', 'VENUE', 'CRITICAL', 'PRE_EVENT', -45, 10, ['venue']),
    createTask('tourn-3', 'Open team registration', 'Set up registration for participating teams', 'REGISTRATION', 'HIGH', 'PRE_EVENT', -40, 6, ['registration']),
    createTask('tourn-4', 'Recruit referees and officials', 'Hire and schedule officiating crew', 'OPERATIONS', 'HIGH', 'PRE_EVENT', -30, 8, ['officials']),
    createTask('tourn-5', 'Create match schedule', 'Generate bracket and match times', 'PLANNING', 'HIGH', 'PRE_EVENT', -21, 6, ['schedule']),
    createTask('tourn-6', 'Arrange equipment', 'Ensure all sports equipment is ready', 'LOGISTICS', 'MEDIUM', 'PRE_EVENT', -14, 4, ['equipment']),
    createTask('tourn-7', 'Set up scoring system', 'Configure live scoring and standings', 'TECHNOLOGY', 'MEDIUM', 'PRE_EVENT', -7, 4, ['scoring']),
    createTask('tourn-8', 'Brief volunteers', 'Train event staff and volunteers', 'OPERATIONS', 'HIGH', 'PRE_EVENT', -3, 4, ['volunteers']),
    createTask('tourn-9', 'Run tournament matches', 'Manage all games and transitions', 'OPERATIONS', 'CRITICAL', 'DURING_EVENT', 0, 20, ['matches']),
    createTask('tourn-10', 'Update live standings', 'Keep brackets and scores updated', 'TECHNOLOGY', 'HIGH', 'DURING_EVENT', 0, 10, ['standings']),
    createTask('tourn-11', 'Handle disputes', 'Manage protests and rule clarifications', 'OPERATIONS', 'MEDIUM', 'DURING_EVENT', 0, 4, ['disputes']),
    createTask('tourn-12', 'Award ceremony', 'Present trophies and medals', 'OPERATIONS', 'HIGH', 'DURING_EVENT', 0, 2, ['awards']),
    createTask('tourn-13', 'Share final results', 'Publish results and standings', 'COMMUNICATION', 'HIGH', 'POST_EVENT', 1, 2, ['results']),
    createTask('tourn-14', 'Collect participant feedback', 'Send surveys to teams and players', 'COMMUNICATION', 'MEDIUM', 'POST_EVENT', 3, 3, ['feedback']),
  ],
};

const marathonTemplate: IndustryTaskTemplate = {
  id: 'sports-marathon',
  name: 'Marathon / Running Event',
  description: 'Road race organization with route planning, timing, and safety.',
  industry: 'sports',
  eventType: 'Marathon',
  icon: '🏃',
  color: '#22C55E',
  estimatedTeamSize: { min: 20, max: 200 },
  eventSizeRange: { min: 100, max: 50000 },
  metadata: { author: 'Lovable', version: '1.0', lastUpdated: '2024-01-15', usageCount: 0, rating: 4.8 },
  tasks: [
    createTask('mara-1', 'Design race course', 'Create route and get certifications', 'PLANNING', 'CRITICAL', 'PRE_EVENT', -180, 20, ['course']),
    createTask('mara-2', 'Obtain permits and road closures', 'Secure all government approvals', 'SAFETY', 'CRITICAL', 'PRE_EVENT', -120, 15, ['permits']),
    createTask('mara-3', 'Set up registration', 'Launch runner registration platform', 'REGISTRATION', 'HIGH', 'PRE_EVENT', -150, 8, ['registration']),
    createTask('mara-4', 'Contract timing company', 'Arrange chip timing and results', 'TECHNOLOGY', 'HIGH', 'PRE_EVENT', -90, 6, ['timing']),
    createTask('mara-5', 'Plan aid stations', 'Design water and nutrition stations', 'LOGISTICS', 'HIGH', 'PRE_EVENT', -60, 10, ['aid']),
    createTask('mara-6', 'Recruit medical support', 'Arrange EMTs and medical stations', 'SAFETY', 'CRITICAL', 'PRE_EVENT', -45, 8, ['medical']),
    createTask('mara-7', 'Coordinate volunteers', 'Recruit and train course volunteers', 'OPERATIONS', 'HIGH', 'PRE_EVENT', -30, 12, ['volunteers']),
    createTask('mara-8', 'Organize race expo', 'Plan pre-race expo and packet pickup', 'LOGISTICS', 'MEDIUM', 'PRE_EVENT', -14, 10, ['expo']),
    createTask('mara-9', 'Set up course', 'Install signage, barriers, and mile markers', 'LOGISTICS', 'CRITICAL', 'PRE_EVENT', -1, 12, ['setup']),
    createTask('mara-10', 'Manage race start', 'Coordinate corrals and start sequence', 'OPERATIONS', 'CRITICAL', 'DURING_EVENT', 0, 2, ['start']),
    createTask('mara-11', 'Monitor course operations', 'Manage aid stations and safety', 'OPERATIONS', 'CRITICAL', 'DURING_EVENT', 0, 6, ['course']),
    createTask('mara-12', 'Operate finish line', 'Manage finish area and results', 'OPERATIONS', 'CRITICAL', 'DURING_EVENT', 0, 6, ['finish']),
    createTask('mara-13', 'Post results online', 'Publish official race results', 'TECHNOLOGY', 'HIGH', 'POST_EVENT', 1, 4, ['results']),
    createTask('mara-14', 'Send finisher certificates', 'Distribute certificates and photos', 'COMMUNICATION', 'MEDIUM', 'POST_EVENT', 7, 6, ['certificates']),
    createTask('mara-15', 'Compile race report', 'Analyze participation and performance', 'PLANNING', 'MEDIUM', 'POST_EVENT', 14, 8, ['reporting']),
  ],
};

// ==================== NON-PROFIT EVENT TEMPLATES ====================

const fundraiserGalaTemplate: IndustryTaskTemplate = {
  id: 'nonprofit-gala',
  name: 'Fundraising Gala',
  description: 'Elegant fundraising event with dinner, auction, and donor recognition.',
  industry: 'nonprofit',
  eventType: 'Gala',
  icon: '✨',
  color: '#A855F7',
  estimatedTeamSize: { min: 10, max: 40 },
  eventSizeRange: { min: 50, max: 500 },
  metadata: { author: 'Lovable', version: '1.0', lastUpdated: '2024-01-15', usageCount: 0, rating: 4.9 },
  tasks: [
    createTask('gala-1', 'Set fundraising goal', 'Establish financial targets and tiers', 'FINANCE', 'CRITICAL', 'PRE_EVENT', -120, 6, ['goals']),
    createTask('gala-2', 'Select and book venue', 'Choose elegant venue for gala', 'VENUE', 'CRITICAL', 'PRE_EVENT', -90, 10, ['venue']),
    createTask('gala-3', 'Create honoree and speaker list', 'Select individuals to honor and speak', 'PLANNING', 'HIGH', 'PRE_EVENT', -75, 8, ['honorees']),
    createTask('gala-4', 'Develop sponsorship packages', 'Create tiered sponsorship opportunities', 'FINANCE', 'HIGH', 'PRE_EVENT', -75, 8, ['sponsors']),
    createTask('gala-5', 'Design invitations', 'Create elegant event invitations', 'MARKETING', 'MEDIUM', 'PRE_EVENT', -60, 6, ['invitations']),
    createTask('gala-6', 'Solicit auction items', 'Collect donations for silent/live auction', 'LOGISTICS', 'HIGH', 'PRE_EVENT', -45, 20, ['auction']),
    createTask('gala-7', 'Plan entertainment program', 'Book band, DJ, or performers', 'PLANNING', 'MEDIUM', 'PRE_EVENT', -45, 8, ['entertainment']),
    createTask('gala-8', 'Coordinate catering', 'Plan dinner menu and service', 'CATERING', 'HIGH', 'PRE_EVENT', -30, 10, ['catering']),
    createTask('gala-9', 'Prepare auction catalog', 'Create catalog of all auction items', 'CONTENT', 'MEDIUM', 'PRE_EVENT', -21, 8, ['auction']),
    createTask('gala-10', 'Set up donation stations', 'Configure mobile and physical giving', 'TECHNOLOGY', 'HIGH', 'PRE_EVENT', -14, 6, ['donations']),
    createTask('gala-11', 'Rehearse program', 'Run through event program', 'OPERATIONS', 'HIGH', 'PRE_EVENT', -3, 4, ['rehearsal']),
    createTask('gala-12', 'Decorate venue', 'Set up decor and table settings', 'LOGISTICS', 'HIGH', 'PRE_EVENT', -1, 8, ['setup']),
    createTask('gala-13', 'Manage check-in', 'Welcome guests and manage seating', 'REGISTRATION', 'CRITICAL', 'DURING_EVENT', 0, 3, ['check-in']),
    createTask('gala-14', 'Run auction', 'Manage silent and live auction', 'OPERATIONS', 'CRITICAL', 'DURING_EVENT', 0, 4, ['auction']),
    createTask('gala-15', 'Coordinate donation appeal', 'Execute fundraising ask', 'OPERATIONS', 'CRITICAL', 'DURING_EVENT', 0, 1, ['fundraising']),
    createTask('gala-16', 'Process donations', 'Record and process all donations', 'FINANCE', 'CRITICAL', 'POST_EVENT', 1, 10, ['donations']),
    createTask('gala-17', 'Send thank you letters', 'Personal thank you to all donors', 'COMMUNICATION', 'HIGH', 'POST_EVENT', 7, 12, ['thanks']),
    createTask('gala-18', 'Report on impact', 'Share fundraising results with stakeholders', 'COMMUNICATION', 'HIGH', 'POST_EVENT', 21, 8, ['reporting']),
  ],
};

const charityAuctionTemplate: IndustryTaskTemplate = {
  id: 'nonprofit-auction',
  name: 'Charity Auction',
  description: 'Silent and live auction event to raise funds for causes.',
  industry: 'nonprofit',
  eventType: 'Auction',
  icon: '🔨',
  color: '#0EA5E9',
  estimatedTeamSize: { min: 5, max: 20 },
  eventSizeRange: { min: 30, max: 300 },
  metadata: { author: 'Lovable', version: '1.0', lastUpdated: '2024-01-15', usageCount: 0, rating: 4.6 },
  tasks: [
    createTask('auction-1', 'Set auction goals', 'Establish fundraising targets', 'FINANCE', 'CRITICAL', 'PRE_EVENT', -60, 4, ['goals']),
    createTask('auction-2', 'Book venue', 'Reserve appropriate space for auction', 'VENUE', 'HIGH', 'PRE_EVENT', -45, 6, ['venue']),
    createTask('auction-3', 'Solicit item donations', 'Reach out for auction item donations', 'LOGISTICS', 'CRITICAL', 'PRE_EVENT', -45, 25, ['items']),
    createTask('auction-4', 'Create item catalog', 'Photograph and describe all items', 'CONTENT', 'HIGH', 'PRE_EVENT', -21, 12, ['catalog']),
    createTask('auction-5', 'Set up bidding platform', 'Configure online or mobile bidding', 'TECHNOLOGY', 'HIGH', 'PRE_EVENT', -14, 8, ['bidding']),
    createTask('auction-6', 'Promote auction event', 'Market event and preview items', 'MARKETING', 'HIGH', 'PRE_EVENT', -30, 10, ['marketing']),
    createTask('auction-7', 'Arrange auctioneer', 'Hire professional or volunteer auctioneer', 'PLANNING', 'MEDIUM', 'PRE_EVENT', -21, 4, ['auctioneer']),
    createTask('auction-8', 'Set up venue', 'Display items and arrange seating', 'LOGISTICS', 'HIGH', 'PRE_EVENT', -1, 6, ['setup']),
    createTask('auction-9', 'Run silent auction', 'Manage bidding period', 'OPERATIONS', 'CRITICAL', 'DURING_EVENT', 0, 3, ['silent']),
    createTask('auction-10', 'Conduct live auction', 'Execute live auction with auctioneer', 'OPERATIONS', 'CRITICAL', 'DURING_EVENT', 0, 2, ['live']),
    createTask('auction-11', 'Process payments', 'Collect payments from winners', 'FINANCE', 'CRITICAL', 'DURING_EVENT', 0, 2, ['payments']),
    createTask('auction-12', 'Distribute items', 'Ensure winners receive items', 'LOGISTICS', 'HIGH', 'POST_EVENT', 1, 4, ['distribution']),
    createTask('auction-13', 'Thank donors', 'Send appreciation to item donors', 'COMMUNICATION', 'HIGH', 'POST_EVENT', 7, 6, ['thanks']),
    createTask('auction-14', 'Report results', 'Compile and share auction results', 'FINANCE', 'MEDIUM', 'POST_EVENT', 14, 4, ['reporting']),
  ],
};

// ==================== EXPORT ALL TEMPLATES ====================

export const INDUSTRY_TEMPLATES: IndustryTaskTemplate[] = [
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
  fundraiserGalaTemplate,
  charityAuctionTemplate,
];

// Helper functions
export function getTemplatesByIndustry(industry: IndustryType): IndustryTaskTemplate[] {
  return INDUSTRY_TEMPLATES.filter((t) => t.industry === industry);
}

export function getTemplateById(id: string): IndustryTaskTemplate | undefined {
  return INDUSTRY_TEMPLATES.find((t) => t.id === id);
}

export function searchTemplates(query: string): IndustryTaskTemplate[] {
  const lowercaseQuery = query.toLowerCase();
  return INDUSTRY_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(lowercaseQuery) ||
      t.description.toLowerCase().includes(lowercaseQuery) ||
      t.eventType.toLowerCase().includes(lowercaseQuery)
  );
}

export function getTemplateStats(): {
  totalTemplates: number;
  totalTasks: number;
  totalHours: number;
  byIndustry: Record<IndustryType, number>;
} {
  const byIndustry = INDUSTRY_TEMPLATES.reduce(
    (acc, t) => {
      acc[t.industry] = (acc[t.industry] || 0) + 1;
      return acc;
    },
    {} as Record<IndustryType, number>
  );

  const totalTasks = INDUSTRY_TEMPLATES.reduce((sum, t) => sum + t.tasks.length, 0);
  const totalHours = INDUSTRY_TEMPLATES.reduce(
    (sum, t) => sum + t.tasks.reduce((taskSum, task) => taskSum + task.estimatedHours, 0),
    0
  );

  return {
    totalTemplates: INDUSTRY_TEMPLATES.length,
    totalTasks,
    totalHours,
    byIndustry,
  };
}
