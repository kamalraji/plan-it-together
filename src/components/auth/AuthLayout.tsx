import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen relative flex items-center justify-center bg-background af-grid-bg py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Thittam1Hub-style soft card on top of gradient grid */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
      </div>

      <motion.div
        className="relative max-w-md w-full rounded-3xl border border-border/60 bg-card/90 shadow-xl shadow-[var(--shadow-md)] px-6 py-8 sm:px-8 sm:py-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </div>
  );
}
