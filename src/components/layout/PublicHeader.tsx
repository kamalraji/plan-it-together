import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

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
          <Link to="/" className="flex items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold shadow-md">
              TH
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight text-foreground">
                Thittam1Hub
              </span>
              <span className="text-[10px] text-muted-foreground hidden sm:block">
                Event marketing workspaces
              </span>
            </div>
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
