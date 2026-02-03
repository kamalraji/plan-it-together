import { VolunteerCheckInInterface } from '@/components/attendance/VolunteerCheckInInterface';
import { Workspace } from '@/types';

interface ScanCheckInTabProps {
  workspace: Workspace;
}

export function ScanCheckInTab({ workspace }: ScanCheckInTabProps) {
  // If no event is associated, show a message
  if (!workspace.eventId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">No Event Associated</h3>
        <p className="text-muted-foreground max-w-md">
          This workspace is not linked to an event. Check-in functionality requires an associated event with registrations.
        </p>
      </div>
    );
  }

  // Use the existing VolunteerCheckInInterface which has real QR scanning and Supabase integration
  return <VolunteerCheckInInterface eventId={workspace.eventId} />;
}
