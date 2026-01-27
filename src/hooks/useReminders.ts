import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EmailTemplate {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  category: 'reminder' | 'confirmation' | 'update' | 'custom';
  subject: string;
  body: string;
  variables: string[];
  include_qr_code: boolean;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailCampaign {
  id: string;
  workspace_id: string;
  name: string;
  subject: string;
  content: string | null;
  status: string;
  target_audience: string | null;
  scheduled_for: string | null;
  sent_at: string | null;
  sent_count: number | null;
  opened_count: number | null;
  clicked_count: number | null;
  created_at: string | null;
}

export interface AudienceCounts {
  all: number;
  confirmed: number;
  pending: number;
  notCheckedIn: number;
  vip: number;
}

interface Recipient {
  email: string;
  name: string;
  registration_id: string;
  ticket_type?: string;
}

interface SendReminderData {
  subject: string;
  body: string;
  audience: string;
  includeQR: boolean;
  scheduledFor?: string;
}

// Default templates for new workspaces
const DEFAULT_TEMPLATES = [
  {
    id: 'event-reminder',
    name: 'Event Reminder',
    description: 'General reminder about the upcoming event',
    category: 'reminder' as const,
    subject: "Don't forget: {{event_name}} is coming up!",
    body: `Hi {{name}},

This is a friendly reminder that {{event_name}} is happening soon. We're excited to see you there!

📅 Date: {{event_date}}
📍 Location: {{event_location}}

Don't forget to bring your ticket QR code for quick check-in.

See you soon!`,
    variables: ['name', 'event_name', 'event_date', 'event_location'],
    include_qr_code: true,
  },
  {
    id: 'checkin-reminder',
    name: 'Check-in Info',
    description: 'Details about check-in process and QR codes',
    category: 'reminder' as const,
    subject: 'Your check-in details for {{event_name}}',
    body: `Hi {{name}},

Here's everything you need for a smooth check-in:

✅ Show your QR code (attached below)
✅ Bring a valid ID
✅ Arrive 15 minutes early

Check-in opens at the {{event_location}}.

See you there!`,
    variables: ['name', 'event_name', 'event_location'],
    include_qr_code: true,
  },
  {
    id: 'schedule-update',
    name: 'Schedule Update',
    description: 'Notify about schedule changes',
    category: 'update' as const,
    subject: 'Important: Schedule update for {{event_name}}',
    body: `Hi {{name}},

We have an important update to share about the event schedule.

[Describe changes here]

Please check the updated schedule on our event page.

Thank you for your understanding!`,
    variables: ['name', 'event_name'],
    include_qr_code: false,
  },
  {
    id: 'last-minute',
    name: 'Last Minute Info',
    description: 'Day-of information and reminders',
    category: 'reminder' as const,
    subject: '{{event_name}} starts today!',
    body: `Hi {{name}},

🎉 It's finally here! {{event_name}} starts today.

Quick reminders:
• Doors open soon
• Don't forget your QR code
• Check the event page for last-minute updates

We can't wait to see you!`,
    variables: ['name', 'event_name'],
    include_qr_code: true,
  },
  {
    id: 'custom',
    name: 'Custom Message',
    description: 'Write your own message',
    category: 'custom' as const,
    subject: '',
    body: '',
    variables: ['name', 'email', 'ticket_type', 'event_name', 'event_date', 'event_location'],
    include_qr_code: false,
  },
];

export function useReminders(workspaceId: string | undefined, eventId: string | undefined) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [audienceCounts, setAudienceCounts] = useState<AudienceCounts>({
    all: 0,
    confirmed: 0,
    pending: 0,
    notCheckedIn: 0,
    vip: 0,
  });
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [isLoadingAudience, setIsLoadingAudience] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Fetch templates from database
  const fetchTemplates = useCallback(async () => {
    if (!workspaceId) return;
    
    setIsLoadingTemplates(true);
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Combine database templates with defaults (for display)
      const dbTemplates = (data || []) as EmailTemplate[];
      
      // If no templates exist, use defaults
      if (dbTemplates.length === 0) {
        setTemplates(DEFAULT_TEMPLATES.map(t => ({
          ...t,
          workspace_id: workspaceId,
          is_default: true,
          created_by: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })) as EmailTemplate[]);
      } else {
        setTemplates(dbTemplates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      // Fall back to defaults on error
      setTemplates(DEFAULT_TEMPLATES.map(t => ({
        ...t,
        workspace_id: workspaceId || '',
        is_default: true,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })) as EmailTemplate[]);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [workspaceId]);

  // Fetch campaign history
  const fetchCampaigns = useCallback(async () => {
    if (!workspaceId) return;
    
    setIsLoadingCampaigns(true);
    try {
      const { data, error } = await supabase
        .from('workspace_email_campaigns')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setCampaigns((data || []) as EmailCampaign[]);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setIsLoadingCampaigns(false);
    }
  }, [workspaceId]);

  // Fetch audience counts
  const fetchAudienceCounts = useCallback(async () => {
    if (!eventId) return;
    
    setIsLoadingAudience(true);
    try {
      // Get all registered (confirmed + pending)
      const { count: allCount } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .in('status', ['CONFIRMED', 'PENDING']);

      // Get confirmed only
      const { count: confirmedCount } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'CONFIRMED');

      // Get pending
      const { count: pendingCount } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'PENDING');

      // Get not checked in using RPC function
      const { data: notCheckedInData } = await supabase
        .rpc('count_not_checked_in', { p_event_id: eventId });

      // Get VIP (registrations with VIP-tier tickets)
      const { count: vipCount } = await supabase
        .from('registrations')
        .select('*, ticket_tiers!inner(*)', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .ilike('ticket_tiers.name', '%VIP%');

      setAudienceCounts({
        all: allCount || 0,
        confirmed: confirmedCount || 0,
        pending: pendingCount || 0,
        notCheckedIn: notCheckedInData || 0,
        vip: vipCount || 0,
      });
    } catch (error) {
      console.error('Error fetching audience counts:', error);
    } finally {
      setIsLoadingAudience(false);
    }
  }, [eventId]);

  // Fetch recipients based on audience filter
  const fetchRecipients = async (audience: string): Promise<Recipient[]> => {
    if (!eventId) return [];

    try {
      let query = supabase
        .from('registration_attendees')
        .select(`
          id,
          full_name,
          email,
          registration:registrations!inner(
            id,
            status,
            event_id,
            ticket_tier:ticket_tiers(name)
          )
        `)
        .eq('registration.event_id', eventId)
        .not('email', 'is', null);

      switch (audience) {
        case 'confirmed':
          query = query.eq('registration.status', 'CONFIRMED');
          break;
        case 'pending':
          query = query.eq('registration.status', 'PENDING');
          break;
        case 'vip':
          query = query
            .eq('registration.status', 'CONFIRMED')
            .ilike('registration.ticket_tier.name', '%VIP%');
          break;
        case 'not-checked-in':
          // For not-checked-in, we need a different approach
          // First get all confirmed registrations
          query = query.eq('registration.status', 'CONFIRMED');
          break;
        case 'all':
        default:
          query = query.in('registration.status', ['CONFIRMED', 'PENDING']);
      }

      const { data, error } = await query;
      if (error) throw error;

      // If audience is 'not-checked-in', filter out those who have checked in
      let recipients = (data || []).map((attendee: any) => ({
        email: attendee.email,
        name: attendee.full_name || 'Attendee',
        registration_id: attendee.registration?.id || '',
        ticket_type: attendee.registration?.ticket_tier?.name || 'General',
      }));

      if (audience === 'not-checked-in') {
        const registrationIds = recipients.map(r => r.registration_id);
        const { data: attendanceData } = await supabase
          .from('attendance_records')
          .select('registration_id')
          .in('registration_id', registrationIds);

        const checkedInIds = new Set((attendanceData || []).map(a => a.registration_id));
        recipients = recipients.filter(r => !checkedInIds.has(r.registration_id));
      }

      return recipients;
    } catch (error) {
      console.error('Error fetching recipients:', error);
      return [];
    }
  };

  // Get event details for personalization
  const getEventDetails = async (): Promise<{ name: string; date: string; location: string }> => {
    if (!eventId) return { name: '', date: '', location: '' };

    try {
      const { data } = await supabase
        .from('events')
        .select('name, start_date, branding')
        .eq('id', eventId)
        .single();

      if (data) {
        const branding = data.branding as { venue?: string } | null;
        return {
          name: data.name,
          date: data.start_date ? new Date(data.start_date).toLocaleDateString() : '',
          location: branding?.venue || '',
        };
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
    }
    return { name: '', date: '', location: '' };
  };

  // Send reminder
  const sendReminder = async (data: SendReminderData) => {
    if (!workspaceId || !eventId) {
      toast.error('Missing workspace or event context');
      return;
    }

    setIsSending(true);
    try {
      // Fetch recipients
      const recipients = await fetchRecipients(data.audience);
      
      if (recipients.length === 0) {
        toast.error('No recipients found for the selected audience');
        setIsSending(false);
        return;
      }

      // Get event details for personalization
      const eventDetails = await getEventDetails();

      // Create campaign record
      const { data: campaign, error: campaignError } = await supabase
        .from('workspace_email_campaigns')
        .insert([{
          workspace_id: workspaceId,
          name: data.subject.substring(0, 100),
          subject: data.subject,
          content: data.body,
          status: data.scheduledFor ? 'scheduled' : 'sending',
          target_audience: data.audience,
          scheduled_for: data.scheduledFor || null,
          recipient_list: JSON.parse(JSON.stringify(recipients)),
          recipients_count: recipients.length,
        }])
        .select()
        .single();

      if (campaignError) throw campaignError;

      // If scheduled, just save and return
      if (data.scheduledFor) {
        toast.success('Reminder scheduled!', {
          description: `Will be sent to ${recipients.length} recipients on ${new Date(data.scheduledFor).toLocaleString()}`,
        });
        await fetchCampaigns();
        setIsSending(false);
        return;
      }

      // Call edge function to send emails
      const response = await supabase.functions.invoke('send-reminder-emails', {
        body: {
          campaign_id: campaign.id,
          workspace_id: workspaceId,
          event_id: eventId,
          subject: data.subject,
          body: data.body,
          include_qr: data.includeQR,
          recipients,
          event_name: eventDetails.name,
          event_date: eventDetails.date,
          event_location: eventDetails.location,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send emails');
      }

      const result = response.data;
      
      if (result.sent_count > 0) {
        toast.success('Reminders sent!', {
          description: `Successfully sent to ${result.sent_count} recipients${result.failed_count > 0 ? `, ${result.failed_count} failed` : ''}`,
        });
      } else {
        toast.error('Failed to send reminders', {
          description: 'No emails were sent. Please check your Resend configuration.',
        });
      }

      // Refresh campaigns list
      await fetchCampaigns();
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      toast.error('Failed to send reminders', {
        description: error.message || 'An unexpected error occurred',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Save template
  const saveTemplate = async (template: Partial<EmailTemplate>) => {
    if (!workspaceId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (template.id && !template.id.includes('-')) {
        // Update existing template (UUID format, not default template id)
        const { error } = await supabase
          .from('email_templates')
          .update({
            name: template.name,
            description: template.description,
            subject: template.subject,
            body: template.body,
            variables: template.variables,
            include_qr_code: template.include_qr_code,
            updated_at: new Date().toISOString(),
          })
          .eq('id', template.id);

        if (error) throw error;
        toast.success('Template updated');
      } else {
        // Create new template
        const { error } = await supabase
          .from('email_templates')
          .insert({
            workspace_id: workspaceId,
            name: template.name || 'Custom Template',
            description: template.description || null,
            category: template.category || 'custom',
            subject: template.subject || '',
            body: template.body || '',
            variables: template.variables || ['name', 'email', 'event_name'],
            include_qr_code: template.include_qr_code || false,
            created_by: user?.id || null,
          });

        if (error) throw error;
        toast.success('Template saved');
      }

      await fetchTemplates();
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  // Delete template
  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      toast.success('Template deleted');
      await fetchTemplates();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (workspaceId) {
      fetchTemplates();
      fetchCampaigns();
    }
  }, [workspaceId, fetchTemplates, fetchCampaigns]);

  useEffect(() => {
    if (eventId) {
      fetchAudienceCounts();
    }
  }, [eventId, fetchAudienceCounts]);

  return {
    // Data
    templates,
    campaigns,
    audienceCounts,
    
    // Loading states
    isLoadingTemplates,
    isLoadingCampaigns,
    isLoadingAudience,
    isSending,
    
    // Actions
    sendReminder,
    saveTemplate,
    deleteTemplate,
    refetchAudience: fetchAudienceCounts,
    refetchCampaigns: fetchCampaigns,
  };
}