import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Github, Link2, ExternalLink, CircleDot, CheckCircle } from 'lucide-react';

interface GitHubLink {
  id: string;
  repo: string;
  issueNumber: number;
  issueUrl: string;
  title: string;
  state: 'open' | 'closed';
}

interface GitHubIntegrationCardProps {
  links?: GitHubLink[];
  onLinkIssue?: (repo: string, issueNumber: number) => void;
}

export function GitHubIntegrationCard({
  links = [],
  onLinkIssue,
}: GitHubIntegrationCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [issueNumber, setIssueNumber] = useState('');

  const parseRepoFromUrl = (url: string): string | null => {
    const match = url.match(/github\.com\/([^\/]+\/[^\/]+)/);
    return match ? match[1] : null;
  };

  const handleLink = () => {
    const repo = parseRepoFromUrl(repoUrl) || repoUrl;
    const num = parseInt(issueNumber, 10);
    if (repo && !isNaN(num) && onLinkIssue) {
      onLinkIssue(repo, num);
      setDialogOpen(false);
      setRepoUrl('');
      setIssueNumber('');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-500/10">
              <Github className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">GitHub</CardTitle>
              <CardDescription className="text-xs">
                Link issues and pull requests
              </CardDescription>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Link2 className="h-3 w-3 mr-1" />
                Link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Link GitHub Issue</DialogTitle>
                <DialogDescription>
                  Connect a GitHub issue or pull request to this task
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Repository</Label>
                  <Input
                    placeholder="owner/repo or full URL"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Issue/PR Number</Label>
                  <Input
                    type="number"
                    placeholder="123"
                    value={issueNumber}
                    onChange={(e) => setIssueNumber(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleLink} disabled={!repoUrl || !issueNumber}>
                  Link Issue
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      {links.length > 0 && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.issueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors group"
              >
                {link.state === 'open' ? (
                  <CircleDot className="h-4 w-4 text-green-500" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-purple-500" />
                )}
                <span className="flex-1 text-sm truncate">{link.title}</span>
                <Badge variant="outline" className="text-xs">
                  #{link.issueNumber}
                </Badge>
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100" />
              </a>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

interface CalendarEventCardProps {
  workspaceId: string;
  taskId?: string;
  events?: Array<{
    id: string;
    title: string;
    start: string;
    end?: string;
    url?: string;
  }>;
}

export function CalendarEventCard({
  events = [],
}: CalendarEventCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <svg className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-base">Calendar Events</CardTitle>
            <CardDescription className="text-xs">
              Synced from Google Calendar
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      {events.length > 0 && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            {events.map((event) => (
              <a
                key={event.id}
                href={event.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2 rounded-md hover:bg-muted transition-colors"
              >
                <p className="text-sm font-medium truncate">{event.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(event.start).toLocaleDateString()}
                </p>
              </a>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
