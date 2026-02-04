import { Link } from 'react-router-dom';
import { FollowedOrganizations } from '@/components/organization';

export function FollowedOrganizationsPage() {
  return (
    <div className="min-h-screen bg-muted/50">
      <header className="bg-card shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Followed Organizations</h1>
            <p className="text-muted-foreground">
              View all organizations you follow and jump into their event pages.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            Back to dashboard
          </Link>
        </div>
      </header>

      <main className="py-8">
        <FollowedOrganizations />
      </main>
    </div>
  );
}
