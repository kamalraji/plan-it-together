import { useState, useEffect } from 'react';
import { WorkspaceDashboard } from './WorkspaceDashboard';
import { MobileWorkspaceDashboard } from './mobile/MobileWorkspaceDashboard';

interface ResponsiveWorkspaceDashboardProps {
  workspaceId?: string;
  orgSlug?: string;
}

export function ResponsiveWorkspaceDashboard({ workspaceId, orgSlug }: ResponsiveWorkspaceDashboardProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      // Use Tailwind's md breakpoint (768px) as the threshold
      setIsMobile(window.innerWidth < 768);
    };

    // Check initial screen size
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize);

    // Cleanup event listener on component unmount
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Force mobile view on touch devices
  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice && window.innerWidth < 1024) {
      setIsMobile(true);
    }
  }, []);

  return isMobile ? (
    <MobileWorkspaceDashboard workspaceId={workspaceId} orgSlug={orgSlug} />
  ) : (
    <WorkspaceDashboard workspaceId={workspaceId} orgSlug={orgSlug} />
  );
}
