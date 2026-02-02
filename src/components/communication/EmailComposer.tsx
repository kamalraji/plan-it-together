import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  BulkEmailDTO, 
  EmailTemplate, 
  SegmentCriteria, 
  RecipientPreview,
  BulkEmailResult
} from '../../types';
import { RecipientSegmentation } from './RecipientSegmentation';
import { EmailTemplates } from './EmailTemplates';
import { toast } from 'sonner';

interface EmailComposerProps {
  eventId: string;
}

interface EmailFormData {
  subject: string;
  body: string;
  templateId?: string;
}

export function EmailComposer({ eventId }: EmailComposerProps) {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [segmentCriteria, setSegmentCriteria] = useState<SegmentCriteria>({});
  const [recipientPreview, setRecipientPreview] = useState<RecipientPreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<EmailFormData>({
    defaultValues: {
      subject: '',
      body: '',
      templateId: undefined
    }
  });

  const watchedSubject = watch('subject');
  const watchedBody = watch('body');

  // Fetch email templates from Supabase
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['email-templates', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .or(`event_id.eq.${eventId},event_id.is.null`)
        .order('name');

      if (error) throw error;

      return (data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        subject: t.subject,
        body: t.body,
        variables: t.variables || [],
        category: t.category,
        eventId: t.event_id,
      })) as EmailTemplate[];
    },
  });

  // Preview recipients mutation using Supabase
  const previewRecipientsMutation = useMutation({
    mutationFn: async (criteria: SegmentCriteria) => {
      // Build query based on segment criteria
      let query = supabase
        .from('registrations')
        .select('id, user_id, user:user_profiles(id, email, full_name)')
        .eq('event_id', eventId);

      if ((criteria as any).status) {
        query = query.eq('status', (criteria as any).status);
      }

      const { data, error } = await query;
      if (error) throw error;

      const recipients = (data || []).map((r: any) => ({
        id: r.user_id,
        email: r.user?.email || '',
        name: r.user?.full_name || '',
      }));

      return {
        count: recipients.length,
        recipients: recipients,
      } as RecipientPreview;
    },
    onSuccess: (data) => {
      setRecipientPreview(data);
    },
  });

  // Send bulk email mutation using edge function
  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: BulkEmailDTO) => {
      const { data, error } = await supabase.functions.invoke('send-bulk-email', {
        body: emailData,
      });

      if (error) throw error;
      return data as BulkEmailResult;
    },
    onSuccess: (result) => {
      toast.success(`Email sent successfully to ${result.successCount} recipients!`);
      reset();
      setSelectedTemplate(null);
      setSegmentCriteria({});
      setRecipientPreview(null);
      setShowPreview(false);
      queryClient.invalidateQueries({ queryKey: ['communication-logs', eventId] });
    },
    onError: (error: any) => {
      toast.error(`Failed to send email: ${error.message}`);
    },
  });

  // Apply template when selected
  const applyTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setValue('subject', template.subject);
    setValue('body', template.body);
    setValue('templateId', template.id);
  };

  // Preview recipients when criteria changes
  useEffect(() => {
    if (Object.keys(segmentCriteria).length > 0) {
      previewRecipientsMutation.mutate(segmentCriteria);
    } else {
      setRecipientPreview(null);
    }
  }, [segmentCriteria]);

  const onSubmit = (data: EmailFormData) => {
    if (!recipientPreview || recipientPreview.count === 0) {
      toast.error('Please select recipients before sending the email.');
      return;
    }

    const emailData: BulkEmailDTO = {
      eventId,
      subject: data.subject,
      body: data.body,
      templateId: data.templateId,
      segmentCriteria
    };

    sendEmailMutation.mutate(emailData);
  };

  const handlePreviewToggle = () => {
    setShowPreview(!showPreview);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Compose Email</h2>
        <p className="text-muted-foreground">
          Create and send targeted communications to event participants.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email Templates Section (Requirements 8.1, 8.3) */}
        <EmailTemplates
          templates={templates || []}
          isLoading={templatesLoading}
          selectedTemplate={selectedTemplate}
          onTemplateSelect={applyTemplate}
        />

        {/* Recipient Segmentation (Requirements 8.2, 8.5) */}
        <RecipientSegmentation
          segmentCriteria={segmentCriteria}
          onCriteriaChange={setSegmentCriteria}
          recipientPreview={recipientPreview}
          isLoading={previewRecipientsMutation.isPending}
        />

        {/* Email Composition */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">Email Content</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Subject *
              </label>
              <input
                type="text"
                {...register('subject', { required: 'Subject is required' })}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus-visible:ring-ring focus-visible:border-primary"
                placeholder="Enter email subject"
              />
              {errors.subject && (
                <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Message Body *
              </label>
              <textarea
                {...register('body', { required: 'Message body is required' })}
                rows={12}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus-visible:ring-ring focus-visible:border-primary"
                placeholder="Enter your message here..."
              />
              {errors.body && (
                <p className="mt-1 text-sm text-red-600">{errors.body.message}</p>
              )}
              
              {selectedTemplate && selectedTemplate.variables.length > 0 && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800 font-medium mb-1">Available Variables:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.variables.map((variable) => (
                      <span
                        key={variable}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Email Preview */}
        {(watchedSubject || watchedBody) && (
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-foreground">Email Preview</h3>
              <button
                type="button"
                onClick={handlePreviewToggle}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
            </div>
            
            {showPreview && (
              <div className="border border-border rounded-md p-4 bg-muted/50">
                <div className="mb-3">
                  <span className="text-sm font-medium text-foreground">Subject: </span>
                  <span className="text-sm text-foreground">{watchedSubject || '(No subject)'}</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="text-sm text-foreground whitespace-pre-wrap">
                    {watchedBody || '(No message body)'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Send Actions */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {recipientPreview && (
              <span>
                Ready to send to <strong>{recipientPreview.count}</strong> recipient{recipientPreview.count !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => {
                reset();
                setSelectedTemplate(null);
                setSegmentCriteria({});
                setRecipientPreview(null);
                setShowPreview(false);
              }}
              className="px-4 py-2 border border-input rounded-md text-foreground hover:bg-muted/50 transition-colors"
            >
              Clear
            </button>
            
            <button
              type="submit"
              disabled={sendEmailMutation.isPending || !recipientPreview || recipientPreview.count === 0}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendEmailMutation.isPending ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}