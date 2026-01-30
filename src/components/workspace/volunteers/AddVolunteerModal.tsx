import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, UserPlus, Mail, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { WorkspaceRole, WorkspaceType } from '@/types';
import { WorkspaceRoleSelect, getDefaultRoleForWorkspace } from '@/components/workspace/WorkspaceRoleSelect';

const inviteSchema = z.object({
  email: z.string().email('Valid email is required'),
  role: z.nativeEnum(WorkspaceRole),
  message: z.string().optional(),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface AddVolunteerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  workspaceName?: string;
  workspaceType?: WorkspaceType;
  departmentId?: string;
  currentUserRole?: WorkspaceRole | null;
}

export function AddVolunteerModal({ 
  open, 
  onOpenChange, 
  workspaceId,
  workspaceName = 'Volunteers',
  workspaceType,
  departmentId,
  currentUserRole,
}: AddVolunteerModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Get the default role based on workspace context
  const defaultRole = useMemo(() => {
    return getDefaultRoleForWorkspace({
      workspaceType,
      workspaceName,
      departmentId,
    });
  }, [workspaceType, workspaceName, departmentId]);

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: defaultRole,
      message: '',
    },
  });

  const onSubmit = async (data: InviteFormData) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Call the invite-to-workspace edge function
      const { error } = await supabase.functions.invoke('invite-to-workspace', {
        body: {
          workspaceId,
          email: data.email,
          role: data.role,
          customMessage: data.message,
        },
      });

      if (error) throw error;

      toast.success(`Invitation sent to ${data.email}`);
      queryClient.invalidateQueries({ queryKey: ['volunteer-roster', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['full-volunteer-roster', workspaceId] });
      form.reset({ email: '', role: defaultRole, message: '' });
      onOpenChange(false);
    } catch {
      toast.error('Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-pink-500" />
            Add Team Member
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join this workspace.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="team-member@example.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Role
                  </FormLabel>
                  <FormControl>
                    <WorkspaceRoleSelect
                      workspace={{
                        id: workspaceId,
                        name: workspaceName,
                        workspaceType,
                        departmentId,
                      }}
                      value={field.value}
                      onChange={field.onChange}
                      currentUserRole={currentUserRole}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a personal note to the invitation..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Invitation
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
