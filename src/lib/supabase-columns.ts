/**
 * Column selection constants for Supabase queries
 * Use these instead of select('*') to fetch only needed columns
 * This improves performance by reducing network payload
 */

// Workspace table columns
export const WORKSPACE_COLUMNS = {
  list: 'id, name, slug, workspace_type, parent_workspace_id, event_id, status, created_at',
  detail: 'id, name, slug, workspace_type, parent_workspace_id, event_id, status, description, settings, created_at, updated_at',
  hierarchy: 'id, name, slug, workspace_type, parent_workspace_id, event_id',
  minimal: 'id, name, slug',
} as const;

// Workspace tasks columns
export const WORKSPACE_TASK_COLUMNS = {
  list: 'id, title, status, priority, due_date, assigned_to, workspace_id, created_at',
  detail: 'id, title, description, status, priority, due_date, assigned_to, workspace_id, source_workspace_id, start_date, end_date, estimated_hours, progress, category, role_scope, location, attachments, created_at, updated_at',
  minimal: 'id, title, status, priority',
  kanban: 'id, title, status, priority, due_date, assigned_to, category, estimated_hours',
} as const;

// Workspace team members columns
export const WORKSPACE_TEAM_MEMBER_COLUMNS = {
  list: 'id, user_id, workspace_id, role, status, joined_at',
  detail: 'id, user_id, workspace_id, role, status, permissions, joined_at, invited_by',
  minimal: 'id, user_id, role, status',
} as const;

// User profiles columns
export const USER_PROFILE_COLUMNS = {
  list: 'id, full_name, avatar_url, email',
  detail: 'id, full_name, avatar_url, email, bio, phone, organization, website, linkedin_url, twitter_url, github_url, username, username_changed_at, skills, social_links, qr_code, cover_image_url, cover_gradient_id, portfolio_accent_color, portfolio_layout, portfolio_sections, portfolio_is_public, created_at, updated_at',
  minimal: 'id, full_name, avatar_url',
  display: 'id, full_name, avatar_url, email',
} as const;

// Events columns
export const EVENT_COLUMNS = {
  list: 'id, name, slug, status, start_date, end_date, organization_id, mode, visibility, created_at',
  detail: 'id, name, slug, description, status, start_date, end_date, organization_id, mode, visibility, category, capacity, registration_type, registration_deadline, owner_user_id, branding, created_at, updated_at',
  minimal: 'id, name, slug, status',
  card: 'id, name, slug, status, start_date, end_date, mode, branding',
} as const;

// Organizations columns
export const ORGANIZATION_COLUMNS = {
  list: 'id, name, slug, logo_url, status, created_at',
  detail: 'id, name, slug, description, logo_url, website, status, settings, created_at, updated_at',
  minimal: 'id, name, slug, logo_url',
} as const;

// Registrations columns
export const REGISTRATION_COLUMNS = {
  list: 'id, event_id, user_id, status, ticket_tier_id, created_at',
  detail: 'id, event_id, user_id, status, ticket_tier_id, check_in_status, check_in_time, form_responses, created_at, updated_at',
  checkin: 'id, event_id, user_id, status, check_in_status, check_in_time, ticket_tier_id',
  minimal: 'id, status, created_at',
} as const;

// Ticket tiers columns
export const TICKET_TIER_COLUMNS = {
  list: 'id, name, event_id, price, currency, quantity, available_quantity, tier_type, status',
  detail: 'id, name, description, event_id, price, currency, quantity, available_quantity, tier_type, status, benefits, visibility, sales_start_date, sales_end_date, created_at',
  minimal: 'id, name, price, currency',
} as const;

// Workspace budget columns
export const WORKSPACE_BUDGET_COLUMNS = {
  detail: 'id, workspace_id, total_amount, allocated_amount, spent_amount, currency, fiscal_year, status, created_at, updated_at',
  summary: 'id, total_amount, allocated_amount, spent_amount, currency',
} as const;

// Workspace expenses columns  
export const WORKSPACE_EXPENSE_COLUMNS = {
  list: 'id, workspace_id, amount, currency, category, description, status, expense_date, created_at',
  detail: 'id, workspace_id, amount, currency, category, description, status, expense_date, receipt_url, approved_by, approved_at, created_by, created_at, updated_at',
  minimal: 'id, amount, category, status',
} as const;

// Workspace resources columns
export const WORKSPACE_RESOURCE_COLUMNS = {
  list: 'id, workspace_id, name, type, status, quantity, available_quantity',
  detail: 'id, workspace_id, name, description, type, status, quantity, available_quantity, unit, location, notes, created_at, updated_at',
  minimal: 'id, name, type, status',
} as const;

// Checklists columns
export const CHECKLIST_COLUMNS = {
  list: 'id, workspace_id, title, phase, due_date, committee_type, delegation_status, created_at',
  detail: 'id, workspace_id, title, phase, due_date, committee_type, items, is_template, delegated_from_workspace_id, delegated_by, delegated_at, delegation_status, is_shared, event_id, created_at, updated_at',
  minimal: 'id, title, phase',
} as const;

// Checklist items columns
export const CHECKLIST_ITEM_COLUMNS = {
  list: 'id, checklist_id, title, is_completed, position',
  detail: 'id, checklist_id, title, description, is_completed, position, completed_at, completed_by',
} as const;

// Task comments columns
export const TASK_COMMENT_COLUMNS = {
  list: 'id, task_id, user_id, content, parent_id, created_at',
  detail: 'id, task_id, user_id, content, parent_id, mentions, is_edited, created_at, updated_at, deleted_at',
} as const;

// Task activities columns
export const TASK_ACTIVITY_COLUMNS = {
  list: 'id, task_id, user_id, activity_type, description, created_at',
  detail: 'id, task_id, user_id, activity_type, description, metadata, created_at',
} as const;

// Volunteer shifts columns
export const VOLUNTEER_SHIFT_COLUMNS = {
  list: 'id, workspace_id, name, start_time, end_time, location, required_volunteers',
  detail: 'id, workspace_id, name, description, start_time, end_time, location, required_volunteers, notes, created_at, updated_at',
} as const;

// Social posts columns
export const SOCIAL_POST_COLUMNS = {
  list: 'id, workspace_id, content, platform, status, scheduled_for, created_at',
  detail: 'id, workspace_id, content, platform, status, scheduled_for, published_at, engagement_metrics, media_urls, created_at, updated_at',
  minimal: 'id, content, platform, status',
} as const;

// Budget requests columns
export const BUDGET_REQUEST_COLUMNS = {
  list: 'id, workspace_id, amount, status, requested_by, created_at',
  detail: 'id, workspace_id, parent_workspace_id, amount, reason, status, requested_by, reviewed_by, reviewed_at, review_notes, created_at, updated_at',
} as const;

// Resource requests columns
export const RESOURCE_REQUEST_COLUMNS = {
  list: 'id, workspace_id, resource_id, quantity, status, created_at',
  detail: 'id, workspace_id, parent_workspace_id, resource_id, quantity, start_date, end_date, purpose, status, requested_by, reviewed_by, reviewed_at, created_at, updated_at',
} as const;

// Milestones columns
export const MILESTONE_COLUMNS = {
  list: 'id, workspace_id, title, due_date, status, created_at',
  detail: 'id, workspace_id, title, description, due_date, status, completed_at, created_at, updated_at',
} as const;

// Goals columns
export const GOAL_COLUMNS = {
  list: 'id, workspace_id, title, target_value, current_value, due_date, status',
  detail: 'id, workspace_id, title, description, target_value, current_value, unit, due_date, status, created_at, updated_at',
} as const;

// Announcements columns
export const ANNOUNCEMENT_COLUMNS = {
  list: 'id, workspace_id, title, priority, status, publish_date, created_at',
  detail: 'id, workspace_id, title, content, priority, status, publish_date, expire_date, target_audience, created_by, created_at, updated_at',
} as const;

// Time entries columns
export const TIME_ENTRY_COLUMNS = {
  list: 'id, workspace_id, user_id, task_id, start_time, end_time, duration_minutes',
  detail: 'id, workspace_id, user_id, task_id, start_time, end_time, duration_minutes, description, billable, created_at, updated_at',
} as const;

// Email campaigns columns
export const EMAIL_CAMPAIGN_COLUMNS = {
  list: 'id, workspace_id, name, subject, status, recipients_count, sent_count, opened_count, scheduled_for, sent_at, created_at',
  detail: 'id, workspace_id, name, subject, content, template_id, status, recipients_count, sent_count, opened_count, clicked_count, target_audience, recipient_list, scheduled_for, sent_at, completed_at, created_by, created_at, updated_at',
} as const;

// Press releases columns
export const PRESS_RELEASE_COLUMNS = {
  list: 'id, workspace_id, title, type, status, author_name, embargo_date, distribution_date, created_at',
  detail: 'id, workspace_id, title, content, type, status, author_id, author_name, reviewer_id, reviewer_name, embargo_date, distribution_date, distribution_channels, media_contacts, attachments, notes, created_at, updated_at',
} as const;

// Stakeholders columns
export const STAKEHOLDER_COLUMNS = {
  list: 'id, workspace_id, name, role, organization, email, category, priority, last_contacted_at, created_at',
  detail: 'id, workspace_id, name, role, organization, email, phone, category, priority, notes, last_contacted_at, tags, metadata, created_by, created_at, updated_at',
} as const;

// Broadcast messages columns
export const BROADCAST_MESSAGE_COLUMNS = {
  list: 'id, workspace_id, title, message_type, channels, target_audience, status, scheduled_for, sent_at, created_at',
  detail: 'id, workspace_id, title, content, message_type, channels, target_audience, recipient_ids, status, scheduled_for, sent_at, sent_by, delivery_stats, created_at, updated_at',
} as const;

// Workspace announcements columns (communication)
export const WORKSPACE_ANNOUNCEMENT_COLUMNS = {
  list: 'id, workspace_id, title, announcement_type, status, scheduled_for, sent_at, created_at',
  detail: 'id, workspace_id, title, content, announcement_type, target_audience, channels, scheduled_for, sent_at, status, sent_by, recipients_count, created_at, updated_at',
} as const;

// Content items columns
export const CONTENT_ITEM_COLUMNS = {
  list: 'id, workspace_id, title, type, status, author_name, due_date, priority, created_at',
  detail: 'id, workspace_id, title, type, status, author_id, author_name, due_date, priority, description, content_url, created_at, updated_at',
} as const;

// Speakers columns
export const SPEAKER_COLUMNS = {
  list: 'id, workspace_id, name, role, session_title, session_time, status, created_at',
  detail: 'id, workspace_id, name, avatar_url, role, bio, email, phone, session_title, session_time, location, status, travel_arranged, accommodation_arranged, notes, created_at, updated_at',
} as const;

// Media assets columns
export const MEDIA_ASSET_COLUMNS = {
  list: 'id, workspace_id, name, type, thumbnail_url, status, created_at',
  detail: 'id, workspace_id, name, type, file_url, thumbnail_url, file_size, mime_type, uploaded_by, uploader_name, tags, description, status, created_at, updated_at',
} as const;

// Invoice columns
export const INVOICE_COLUMNS = {
  list: 'id, workspace_id, invoice_number, vendor_name, amount, paid_amount, due_date, status, created_at',
  detail: 'id, workspace_id, invoice_number, vendor_name, vendor_id, amount, paid_amount, due_date, issue_date, status, payment_terms, notes, attachment_url, created_by, sent_at, paid_at, created_at, updated_at',
} as const;

// Software licenses columns (actual schema)
export const SOFTWARE_LICENSE_COLUMNS = {
  list: 'id, workspace_id, name, vendor, license_type, assigned_seats, total_seats, expiry_date, status',
  detail: 'id, workspace_id, name, description, vendor, license_type, license_key, assigned_seats, total_seats, cost, expiry_date, renewal_date, status, notes, created_at, updated_at',
} as const;

// Network zones columns (actual schema)
export const NETWORK_ZONE_COLUMNS = {
  list: 'id, workspace_id, event_id, name, zone_type, vlan_id, status',
  detail: 'id, workspace_id, event_id, name, description, location, zone_type, max_devices, max_bandwidth_mbps, current_devices, current_bandwidth_percent, status, status_message, device_alert_threshold, bandwidth_alert_threshold, ssid, ip_range, vlan_id, last_checked_at, created_at, updated_at',
} as const;

// Event venue columns (actual schema)
export const EVENT_VENUE_COLUMNS = {
  list: 'id, event_id, name, address, city, country',
  detail: 'id, event_id, name, address, city, state, postal_code, country, latitude, longitude, capacity, accessibility_features, accessibility_notes, google_place_id, created_at, updated_at',
} as const;

// Event virtual links columns (actual schema)
export const EVENT_VIRTUAL_LINK_COLUMNS = {
  list: 'id, event_id, platform, meeting_url, is_primary',
  detail: 'id, event_id, platform, meeting_url, meeting_id, password, instructions, is_primary, created_at, updated_at',
} as const;

// Event images columns (actual schema)
export const EVENT_IMAGE_COLUMNS = {
  list: 'id, event_id, url, alt_text, sort_order, is_primary',
  detail: 'id, event_id, url, caption, alt_text, sort_order, is_primary, created_at, updated_at',
} as const;

// Event FAQs columns
export const EVENT_FAQ_COLUMNS = {
  list: 'id, event_id, question, answer, sort_order',
  detail: 'id, event_id, question, answer, sort_order, created_at, updated_at',
} as const;

// Workspace integrations columns (actual schema)
export const WORKSPACE_INTEGRATION_COLUMNS = {
  list: 'id, workspace_id, platform, name, is_active, created_at',
  detail: 'id, workspace_id, platform, name, webhook_url, is_active, notification_types, created_by, created_at, updated_at',
} as const;

// Sponsor columns (actual schema: workspace_sponsors)
export const SPONSOR_COLUMNS = {
  list: 'id, workspace_id, name, company_name, tier, contact_name, contact_email, contract_value, payment_status, status, created_at',
  detail: 'id, workspace_id, name, company_name, tier, contact_name, contact_email, contact_phone, contract_value, amount_paid, payment_status, deliverables, deliverables_status, proposal_sent_at, contract_signed_at, status, notes, created_at, updated_at',
  minimal: 'id, name, company_name, tier, status',
} as const;

// Sponsor proposal columns
export const SPONSOR_PROPOSAL_COLUMNS = {
  list: 'id, workspace_id, sponsor_id, company_name, contact_name, proposed_tier, proposed_value, stage, stage_entered_at, next_follow_up_date, created_at',
  detail: 'id, workspace_id, sponsor_id, company_name, contact_name, contact_email, contact_phone, proposed_tier, proposed_value, stage, stage_entered_at, proposal_document_url, notes, next_follow_up_date, assigned_to, created_by, created_at, updated_at',
} as const;

// Sponsor deliverable columns
export const SPONSOR_DELIVERABLE_COLUMNS = {
  list: 'id, workspace_id, sponsor_id, title, category, due_date, status, priority, created_at',
  detail: 'id, workspace_id, sponsor_id, title, description, category, due_date, completed_at, status, priority, proof_url, notes, assigned_to, created_by, created_at, updated_at',
} as const;

// Sponsor benefit columns
export const SPONSOR_BENEFIT_COLUMNS = {
  list: 'id, workspace_id, tier, name, category, value_estimate, quantity, is_active, display_order',
  detail: 'id, workspace_id, tier, name, description, category, value_estimate, quantity, is_active, display_order, created_at, updated_at',
} as const;

// Sponsor communication columns
export const SPONSOR_COMMUNICATION_COLUMNS = {
  list: 'id, workspace_id, sponsor_id, type, subject, direction, status, scheduled_for, sent_at, created_at',
  detail: 'id, workspace_id, sponsor_id, type, subject, content, direction, status, scheduled_for, sent_at, recipient_email, attachments, created_by, created_at, updated_at',
} as const;

// Time entry columns (extended)
export const TIME_TRACKING_COLUMNS = {
  list: 'id, workspace_id, user_id, task_id, date, hours, status, created_at',
  detail: 'id, workspace_id, user_id, task_id, date, hours, description, status, created_at, updated_at',
} as const;

// Support ticket columns
export const SUPPORT_TICKET_COLUMNS = {
  list: 'id, workspace_id, ticket_number, title, category, priority, status, reporter_id, reporter_name, assignee_id, is_escalated, created_at',
  detail: 'id, workspace_id, ticket_number, title, description, category, priority, status, location, affected_system, reporter_id, reporter_name, reporter_email, assignee_id, assigned_at, sla_response_deadline, sla_resolution_deadline, first_response_at, resolved_at, resolved_by, resolution_notes, is_escalated, escalated_at, escalation_reason, linked_incident_id, tags, internal_notes, created_at, updated_at',
} as const;

// Ticket activity columns
export const TICKET_ACTIVITY_COLUMNS = {
  list: 'id, ticket_id, activity_type, performed_by, performed_by_name, created_at',
  detail: 'id, ticket_id, activity_type, previous_value, new_value, comment, performed_by, performed_by_name, created_at',
} as const;

// Automation rules columns
export const AUTOMATION_RULE_COLUMNS = {
  list: 'id, workspace_id, name, trigger_type, action_type, is_active, created_at',
  detail: 'id, workspace_id, name, description, trigger_type, trigger_conditions, action_type, action_config, is_active, last_triggered_at, trigger_count, created_by, created_at, updated_at',
} as const;

// Issues columns
export const ISSUE_COLUMNS = {
  list: 'id, workspace_id, title, issue_type, severity, status, assigned_to, created_at',
  detail: 'id, workspace_id, title, description, issue_type, severity, status, assigned_to, reported_by, resolution, resolved_at, due_date, created_at, updated_at',
} as const;

// Social media platform columns
export const SOCIAL_PLATFORM_COLUMNS = {
  list: 'id, workspace_id, platform, followers_count, engagement_rate, is_connected, last_synced_at',
  detail: 'id, workspace_id, platform, handle, followers_count, following_count, posts_count, engagement_rate, is_connected, last_synced_at, created_at, updated_at',
} as const;

// Engagement report columns
export const ENGAGEMENT_REPORT_COLUMNS = {
  list: 'id, workspace_id, platform, report_date, total_followers, total_posts, engagement_rate, created_at',
  detail: 'id, workspace_id, platform, report_date, total_followers, follower_growth, total_posts, total_likes, total_comments, total_shares, total_saves, total_reach, total_impressions, engagement_rate, created_at',
} as const;

// Hashtag columns
export const HASHTAG_COLUMNS = {
  list: 'id, workspace_id, name, uses_count, created_at',
  detail: 'id, workspace_id, name, uses_count, is_branded, category, created_at, updated_at',
} as const;

// A/B Tests columns
export const AB_TEST_COLUMNS = {
  list: 'id, workspace_id, campaign_id, name, test_type, status, variant_a, variant_b, sample_size, current_sample, winner, start_date, end_date, created_at',
  detail: 'id, workspace_id, campaign_id, name, description, test_type, status, variant_a, variant_b, variant_a_metrics, variant_b_metrics, sample_size, current_sample, winner, confidence_level, start_date, end_date, created_by, created_at, updated_at',
} as const;

// Campaign columns
export const CAMPAIGN_COLUMNS = {
  list: 'id, workspace_id, name, type, channel, status, budget, spent, start_date, end_date, created_at',
  detail: 'id, workspace_id, name, description, type, channel, status, budget, spent, target_audience, metrics, impressions, clicks, conversions, start_date, end_date, created_by, created_at, updated_at',
  analytics: 'id, name, status, budget, spent, impressions, clicks, conversions',
} as const;

// Judge columns
export const JUDGE_COLUMNS = {
  list: 'id, workspace_id, user_id, expertise, status, assigned_submissions_count, completed_evaluations_count, created_at',
  detail: 'id, workspace_id, user_id, expertise, status, bio, profile_url, assigned_submissions_count, completed_evaluations_count, average_score_given, is_lead, panel_id, created_at, updated_at',
} as const;

// Rubric columns
export const RUBRIC_COLUMNS = {
  list: 'id, workspace_id, name, criteria_count, max_score, is_active, created_at',
  detail: 'id, workspace_id, name, description, criteria, criteria_count, max_score, is_active, created_by, created_at, updated_at',
} as const;

// Submission columns
export const SUBMISSION_COLUMNS = {
  list: 'id, workspace_id, team_name, project_title, category, status, submitted_at, created_at',
  detail: 'id, workspace_id, team_id, team_name, project_title, project_description, project_url, demo_url, repository_url, presentation_url, category, status, is_eligible, disqualification_reason, submitted_at, created_at, updated_at',
} as const;

// Content approval columns
export const CONTENT_APPROVAL_COLUMNS = {
  list: 'id, workspace_id, title, content_type, status, submitted_at, submitted_by, created_at',
  detail: 'id, workspace_id, title, content_type, content_url, status, current_stage, total_stages, submitted_at, submitted_by, submitter_name, approved_at, rejected_at, rejection_reason, created_at, updated_at',
} as const;

// Publish request columns
export const PUBLISH_REQUEST_COLUMNS = {
  list: 'id, event_id, status, requested_by, created_at',
  detail: 'id, event_id, status, requested_by, requester_name, reviewed_by, reviewer_name, reviewed_at, rejection_reason, notes, created_at, updated_at',
} as const;

/**
 * Helper to build relation selections
 * @example buildRelation('user_profiles', USER_PROFILE_COLUMNS.minimal) 
 * // Returns: 'user_profiles(id, full_name, avatar_url)'
 */
export function buildRelation(table: string, columns: string): string {
  return `${table}(${columns})`;
}

/**
 * Helper to combine multiple column selections
 * @example combineColumns(WORKSPACE_TASK_COLUMNS.list, 'workspace:workspaces(id, name)')
 */
export function combineColumns(...columns: string[]): string {
  return columns.join(', ');
}

// ============= Operations Department Columns =============

// Incident columns
export const INCIDENT_COLUMNS = {
  list: 'id, workspace_id, title, severity, status, location, reported_by_name, assigned_to_name, created_at',
  detail: 'id, workspace_id, title, description, severity, status, location, reported_by, reported_by_name, assigned_to, assigned_to_name, resolution_notes, resolved_at, created_at, updated_at',
} as const;

// Logistics columns
export const LOGISTICS_COLUMNS = {
  list: 'id, workspace_id, item_name, carrier, tracking_number, status, progress, eta, priority, created_at',
  detail: 'id, workspace_id, item_name, carrier, tracking_number, origin, destination, status, progress, eta, actual_arrival, notes, priority, created_by, created_at, updated_at',
} as const;

// Facility check columns
export const FACILITY_CHECK_COLUMNS = {
  list: 'id, workspace_id, area, item, status, checked_by_name, checked_at, follow_up_required',
  detail: 'id, workspace_id, area, item, status, checked_by, checked_by_name, checked_at, notes, follow_up_required, created_at, updated_at',
} as const;

// Event briefing columns
export const EVENT_BRIEFING_COLUMNS = {
  list: 'id, workspace_id, scheduled_time, activity, location, lead_name, status, event_date, sort_order',
  detail: 'id, workspace_id, scheduled_time, activity, location, lead_name, lead_id, status, notes, sort_order, event_date, created_at, updated_at',
} as const;

// Catering columns
export const CATERING_MEAL_SCHEDULE_COLUMNS = {
  list: 'id, workspace_id, name, meal_type, scheduled_time, expected_guests, location',
  detail: 'id, workspace_id, name, meal_type, scheduled_time, expected_guests, location, notes, sort_order, created_at, updated_at',
} as const;

export const CATERING_MENU_ITEM_COLUMNS = {
  list: 'id, workspace_id, name, meal_type, servings, status, is_vegetarian, is_vegan, is_gluten_free',
  detail: 'id, workspace_id, name, description, meal_type, servings, status, is_vegetarian, is_vegan, is_gluten_free, allergens, created_at, updated_at',
} as const;

export const CATERING_DIETARY_COLUMNS = {
  list: 'id, event_id, workspace_id, requirement_type, count',
  detail: 'id, event_id, workspace_id, requirement_type, count, special_requests, updated_at',
} as const;

// ============= Judge Committee Columns =============

export const WORKSPACE_JUDGE_COLUMNS = {
  list: 'id, workspace_id, user_id, judge_name, judge_email, expertise, category, status, assigned_count, completed_count, created_at',
  detail: 'id, workspace_id, user_id, judge_name, judge_email, expertise, category, status, availability, assigned_count, completed_count, notes, invited_at, confirmed_at, created_at, updated_at',
} as const;

export const WORKSPACE_RUBRIC_COLUMNS = {
  list: 'id, workspace_id, name, category, max_total_score, is_active, is_template, created_at',
  detail: 'id, workspace_id, name, description, category, criteria, max_total_score, is_active, is_template, created_by, created_at, updated_at',
} as const;

export const WORKSPACE_SUBMISSION_COLUMNS = {
  list: 'id, workspace_id, team_name, project_name, track, status, submitted_at, table_number',
  detail: 'id, workspace_id, event_id, team_name, project_name, description, demo_url, repo_url, presentation_url, table_number, track, submitted_by, submitted_at, status, metadata, created_at, updated_at',
  leaderboard: 'id, team_name, project_name, track, status',
} as const;

export const WORKSPACE_ASSIGNMENT_COLUMNS = {
  list: 'id, workspace_id, judge_id, submission_id, rubric_id, status, priority, assigned_at',
  detail: 'id, workspace_id, judge_id, submission_id, rubric_id, status, priority, assigned_at, started_at, completed_at, created_at',
} as const;

export const WORKSPACE_SCORE_COLUMNS = {
  list: 'id, workspace_id, assignment_id, judge_id, submission_id, total_score, scored_at',
  detail: 'id, workspace_id, assignment_id, judge_id, submission_id, rubric_id, scores, total_score, weighted_score, comments, private_notes, is_finalist_vote, scored_at, created_at, updated_at',
} as const;

// ============= Recurring Task Columns =============

export const RECURRING_TASK_COLUMNS = {
  list: 'id, workspace_id, title, priority, recurrence_type, next_occurrence, is_active, created_at',
  detail: 'id, workspace_id, title, description, priority, category, role_scope, assigned_to, recurrence_type, recurrence_config, template_data, next_occurrence, last_created_at, end_date, occurrence_count, max_occurrences, is_active, created_by, created_at, updated_at',
} as const;

// ============= Resource Columns =============

export const RESOURCE_COLUMNS = {
  list: 'id, workspace_id, name, type, quantity, available, status, assigned_to_name',
  detail: 'id, workspace_id, name, type, quantity, available, status, assigned_to_workspace_id, assigned_to_name, metadata, created_at, updated_at',
} as const;

// ============= Event Status History Columns =============

export const EVENT_STATUS_HISTORY_COLUMNS = {
  list: 'id, event_id, previous_status, new_status, changed_by, reason, created_at',
  detail: 'id, event_id, previous_status, new_status, changed_by, reason, created_at',
} as const;

// ============= Notification Preferences Columns =============

export const NOTIFICATION_PREFERENCES_COLUMNS = {
  list: 'id, user_id, workspace_enabled, event_enabled, marketplace_enabled, organization_enabled, system_enabled, sound_enabled, vibration_enabled',
  detail: 'id, user_id, workspace_enabled, event_enabled, marketplace_enabled, organization_enabled, system_enabled, sound_enabled, vibration_enabled, created_at, updated_at',
} as const;

// ============= Workspace Channel Columns =============

export const WORKSPACE_CHANNEL_COLUMNS = {
  list: 'id, workspace_id, name, type, is_private, created_at',
  detail: 'id, workspace_id, name, description, type, is_private, created_by, metadata, created_at, updated_at',
} as const;

// ============= Transport/Logistics Columns =============

export const TRANSPORT_SCHEDULE_COLUMNS = {
  list: 'id, workspace_id, name, transport_type, departure_time, pickup_location, dropoff_location, status, capacity, passengers_booked',
  detail: 'id, workspace_id, name, transport_type, departure_time, pickup_location, dropoff_location, capacity, passengers_booked, vehicle_info, driver_name, driver_contact, status, notes, created_by, created_at, updated_at',
} as const;

export const LOGISTICS_REPORT_COLUMNS = {
  list: 'id, workspace_id, report_type, title, generated_by_name, date_range_start, date_range_end, created_at',
  detail: 'id, workspace_id, report_type, title, content, generated_by, generated_by_name, date_range_start, date_range_end, created_at',
} as const;

// ============= Venue/Walkthrough Columns =============

export const VENUE_WALKTHROUGH_COLUMNS = {
  list: 'id, workspace_id, name, scheduled_date, scheduled_time, status, lead_name, created_at',
  detail: 'id, workspace_id, name, scheduled_date, scheduled_time, status, route_areas, lead_name, lead_id, attendees, notes, findings, completed_at, created_at, updated_at',
} as const;
