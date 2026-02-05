import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Thittam1HubLogo } from '@/components/brand/Thittam1HubLogo';

interface PublicHeaderProps {
  className?: string;
}

export function PublicHeader({ className }: PublicHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-sm ${className ?? ''}`}
    >
      <div className="container max-w-6xl">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <Thittam1HubLogo size="md" />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/events"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Events
            </Link>
            <Link
              to="/pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <Link
              to="/help"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Help
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild className="rounded-full">
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default PublicHeader;
