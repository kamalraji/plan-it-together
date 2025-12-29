import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { 
  BulkEmailDTO, 
  EmailTemplate, 
  SegmentCriteria, 
  RecipientPreview,
  BulkEmailResult
} from '../../types';
import { RecipientSegmentation } from './RecipientSegmentation';
import { EmailTemplates } from './EmailTemplates';

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

  // Fetch email templates (Requirements 8.1, 8.3)
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['email-templates', eventId],
    queryFn: async () => {
      const response = await api.get(`/communications/templates?eventId=${eventId}`);
      return response.data.data as EmailTemplate[];
    },
  });

  // Preview recipients mutation (Requirements 8.2, 8.5)
  const previewRecipientsMutation = useMutation({
    mutationFn: async (criteria: SegmentCriteria) => {
      const response = await api.post('/communications/segment-recipients', {
        eventId,
        segmentCriteria: criteria
      });
      return response.data.data as RecipientPreview;
    },
    onSuccess: (data) => {
      setRecipientPreview(data);
    },
  });

  // Send bulk email mutation (Requirements 8.1, 8.3)
  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: BulkEmailDTO) => {
      const response = await api.post('/communications/send-bulk-email', emailData);
      return response.data.data as BulkEmailResult;
    },
    onSuccess: (result) => {
      // Show success message
      alert(`Email sent successfully to ${result.successCount} recipients!`);
      // Reset form
      reset();
      setSelectedTemplate(null);
      setSegmentCriteria({});
      setRecipientPreview(null);
      setShowPreview(false);
      // Invalidate communication history to refresh
      queryClient.invalidateQueries({ queryKey: ['communication-logs', eventId] });
    },
    onError: (error: any) => {
      alert(`Failed to send email: ${error.response?.data?.error?.message || error.message}`);
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
      alert('Please select recipients before sending the email.');
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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Compose Email</h2>
        <p className="text-gray-600">
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
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Email Content</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                {...register('subject', { required: 'Subject is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter email subject"
              />
              {errors.subject && (
                <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Body *
              </label>
              <textarea
                {...register('body', { required: 'Message body is required' })}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Email Preview</h3>
              <button
                type="button"
                onClick={handlePreviewToggle}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
            </div>
            
            {showPreview && (
              <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-700">Subject: </span>
                  <span className="text-sm text-gray-900">{watchedSubject || '(No subject)'}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="text-sm text-gray-900 whitespace-pre-wrap">
                    {watchedBody || '(No message body)'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Send Actions */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
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
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
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