import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen relative flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Shared gradient backdrop with blurred color glows */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background" />
        <div className="absolute -top-32 -right-20 h-72 w-72 rounded-full bg-gradient-to-br from-teal/40 via-sunny/40 to-coral/30 blur-3xl opacity-70" />
        <div className="absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-gradient-to-tr from-coral/40 via-sunny/35 to-teal/35 blur-3xl opacity-65" />
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/40 to-background/95" />
      </div>

      <motion.div
        className="relative max-w-md w-full"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </div>
  );
}
