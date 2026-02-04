import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PaperAirplaneIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WorkspaceAccessRequestProps {
  workspaceId: string;
  workspaceName: string;
  onRequestSent?: () => void;
}

export function WorkspaceAccessRequest({ 
  workspaceId, 
  workspaceName,
  onRequestSent 
}: WorkspaceAccessRequestProps) {
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const requestMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('request-workspace-access', {
        body: {
          workspace_id: workspaceId,
          message: message.trim() || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast.success('Access request submitted successfully');
      onRequestSent?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit access request');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    requestMutation.mutate();
  };

  if (isSubmitted) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Request Submitted</h3>
        <p className="text-sm text-muted-foreground">
          Your request to join "{workspaceName}" has been sent to the workspace owner. 
          You'll receive a notification when they respond.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-medium text-foreground mb-2">Request Access</h3>
      <p className="text-sm text-muted-foreground mb-4">
        You don't have access to "{workspaceName}". Submit a request to the workspace owner.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-muted-foreground mb-1">
            Message (Optional)
          </label>
          <textarea
            id="message"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full border border-border bg-background text-foreground rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
            placeholder="Tell the owner why you'd like to join this workspace..."
          />
        </div>

        <button
          type="submit"
          disabled={requestMutation.isPending}
          className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
        >
          {requestMutation.isPending ? (
            <>
              <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <PaperAirplaneIcon className="w-4 h-4 mr-2" />
              Request Access
            </>
          )}
        </button>
      </form>
    </div>
  );
}
