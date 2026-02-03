/**
 * SkipLinks - Accessibility skip navigation links
 * Allows keyboard users to quickly navigate to main content areas
 */

interface SkipLink {
  id: string;
  label: string;
}

interface SkipLinksProps {
  links?: SkipLink[];
}

const DEFAULT_LINKS: SkipLink[] = [
  { id: 'main-content', label: 'Skip to main content' },
  { id: 'main-navigation', label: 'Skip to navigation' },
];

export function SkipLinks({ links = DEFAULT_LINKS }: SkipLinksProps) {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <nav aria-label="Skip links" className="fixed top-0 left-0 z-[100] p-2">
        <ul className="flex flex-col gap-1">
          {links.map((link) => (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
                className="inline-block px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-transform transform -translate-y-full focus:translate-y-0"
                onClick={(e) => {
                  const target = document.getElementById(link.id);
                  if (target) {
                    e.preventDefault();
                    target.focus();
                    target.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
