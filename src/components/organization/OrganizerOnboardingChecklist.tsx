import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { useCurrentOrganization } from './OrganizationContext';
import { useOrganizationEvents } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/looseClient';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  action?: { label: string; path: string };
}

export const OrganizerOnboardingChecklist: React.FC = () => {
  const navigate = useNavigate();
  const organization = useCurrentOrganization();
  const { data: events } = useOrganizationEvents(organization?.id);
  const { user } = useAuth();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [completedFromDb, setCompletedFromDb] = useState<string[]>([]);

  // Load persisted completion state for this user + organization
  useEffect(() => {
    if (!user || !organization) return;

    const loadCompletion = async () => {
      const { data, error } = await supabase
        .from('onboarding_checklist')
        .select('item_id')
        .eq('user_id', user.id)
        .eq('organization_id', organization.id);

      if (!error && data) {
        setCompletedFromDb(data.map((row: { item_id: string }) => row.item_id));
      }
    };

    loadCompletion();
  }, [user?.id, organization?.id]);

  // Derive checklist items from current org state + persisted completion
  useEffect(() => {
    if (!organization) return;

    const items: ChecklistItem[] = [
      {
        id: 'profile',
        label: 'Complete organization profile',
        description: 'Add logo, description, and contact information',
        completed:
          !!(organization.description && organization.logo_url) ||
          completedFromDb.includes('profile'),
        action: { label: 'Edit profile', path: `/${organization.slug}/settings` },
      },
      {
        id: 'first-event',
        label: 'Create your first event',
        description: 'Set up an event to get started',
        completed:
          (events?.length || 0) > 0 || completedFromDb.includes('first-event'),
        action: { label: 'Create event', path: `/${organization.slug}/eventmanagement/create` },
      },
      {
        id: 'team',
        label: 'Invite team members',
        description: 'Add admins to help manage your organization',
        completed: completedFromDb.includes('team'), // can be marked complete once
        action: { label: 'Manage team', path: `/${organization.slug}/team` },
      },
      {
        id: 'analytics',
        label: 'Review analytics setup',
        description: 'Understand your event performance metrics',
        completed:
          (events?.length || 0) > 0 || completedFromDb.includes('analytics'),
        action: { label: 'View analytics', path: `/${organization.slug}/analytics` },
      },
    ];

    setChecklist(items);
  }, [organization, events, completedFromDb]);


  const completedCount = checklist.filter((item) => item.completed).length;
  const totalCount = checklist.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Persist completion state whenever checklist changes
  useEffect(() => {
    if (!user || !organization || checklist.length === 0) return;

    const completedIds = checklist.filter((item) => item.completed).map((item) => item.id);
    if (completedIds.length === 0) return;

    const rows = completedIds.map((id) => ({
      user_id: user.id,
      organization_id: organization.id,
      item_id: id,
    }));

    supabase
      .from('onboarding_checklist')
      .upsert(rows, { onConflict: 'user_id,organization_id,item_id' })
      .catch((error: unknown) => {
        console.error('Failed to persist onboarding checklist state', error);
      });
  }, [user?.id, organization?.id, checklist]);

  if (progress === 100) {
    return null; // Hide checklist when everything is done
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Getting Started</CardTitle>
        <div className="mt-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>
              {completedCount} of {totalCount} completed
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {checklist.map((item) => (
            <li key={item.id} className="flex items-start gap-3">
              <div className="mt-0.5">
                {item.completed ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    item.completed ? 'line-through text-muted-foreground' : ''
                  }`}
                >
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
                {!item.completed && item.action && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 mt-1"
                    onClick={() => navigate(item.action!.path)}
                  >
                    {item.action.label}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
