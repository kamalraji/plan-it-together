import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { useCurrentOrganization } from './OrganizationContext';
import { useOrganizationEvents } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  action?: { label: string; path: string };
}

/**
 * OrganizerOnboardingChecklist
 *
 * Lightweight, front-end driven checklist that guides new organizers
 * through the first critical steps:
 * 1. Completing their organization profile
 * 2. Creating the first event
 * 3. Inviting team members
 * 4. Reviewing analytics
 *
 * Completion is derived from existing data (organization + events) and
 * does not depend on additional database tables, so it works immediately
 * with the current schema.
 */
export const OrganizerOnboardingChecklist: React.FC = () => {
  const navigate = useNavigate();
  const organization = useCurrentOrganization();
  const { data: events } = useOrganizationEvents(organization?.id);
  const { user } = useAuth();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  // Derive checklist items from current org + events state
  useEffect(() => {
    if (!organization || !user) {
      setChecklist([]);
      return;
    }

    const hasBasicProfile = Boolean(
      organization.description || organization.website || organization.email || organization.phone,
    );

    const hasAnyEvent = (events?.length || 0) > 0;

    const items: ChecklistItem[] = [
      {
        id: 'profile',
        label: 'Complete organization profile',
        description: 'Add description and contact details so participants can trust your brand.',
        completed: hasBasicProfile,
        action: { label: 'Edit profile', path: `/${organization.slug}/settings` },
      },
      {
        id: 'first-event',
        label: 'Create your first event',
        description: 'Set up your first hackathon or meetup to start inviting participants.',
        completed: hasAnyEvent,
        action: { label: 'Create event', path: `/${organization.slug}/eventmanagement/create` },
      },
      {
        id: 'team',
        label: 'Invite team members',
        description: 'Add co-organizers and volunteers so you are not running events alone.',
        completed: false,
        action: { label: 'Manage team', path: `/${organization.slug}/team` },
      },
      {
        id: 'analytics',
        label: 'Review analytics setup',
        description: 'Monitor registrations, check-ins, and tasks for your live events.',
        completed: hasAnyEvent,
        action: { label: 'View analytics', path: `/${organization.slug}/analytics` },
      },
    ];

    setChecklist(items);
  }, [organization, events, user]);

  const completedCount = checklist.filter((item) => item.completed).length;
  const totalCount = checklist.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (!organization || !user || progress === 100) {
    // Hide checklist when there is no context or everything is done
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Getting started as an organizer</CardTitle>
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
