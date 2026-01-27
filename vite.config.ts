import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(), // Using SWC for better performance
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/components/ui': path.resolve(__dirname, './src/components/ui'),
      '@/components/illustrations': path.resolve(__dirname, './src/components/illustrations'),
      '@/components/enhanced': path.resolve(__dirname, './src/components/enhanced'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/styles': path.resolve(__dirname, './src/styles'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/utils': path.resolve(__dirname, './src/utils'),
    },
    // Dedupe React to prevent multiple instances
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: '::',
    port: 8080,
    // Enhanced development server configuration
    hmr: {
      overlay: true,
    },
    // API proxy for backend integration
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    // Optimize for design system assets
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching (npm packages only)
          'ui-vendor': ['@radix-ui/react-slot', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
    // Increase chunk size warning limit for design system assets
    chunkSizeWarningLimit: 1000,
    // Optimize CSS for design system
    cssCodeSplit: true,
    // Enable source maps for development debugging
    sourcemap: mode === 'development',
    // Minification settings
    minify: mode === 'production' ? 'esbuild' : false,
    // Target modern browsers for better performance
    target: 'esnext',
  },
  optimizeDeps: {
    // Pre-bundle design system dependencies for faster dev startup
    include: [
      'react', 
      'react-dom', 
      'tailwind-merge', 
      'class-variance-authority',
      'clsx',
      'lucide-react',
      '@radix-ui/react-slot',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@zxing/library',
      '@zxing/browser',
    ],
    // Exclude large dependencies that should be loaded on demand
    exclude: ['@supabase/supabase-js'],
  },
  // CSS preprocessing
  css: {
    devSourcemap: mode === 'development',
  },
  // Enhanced error handling for design system development
  define: {
    __DEV__: mode === 'development',
    __DESIGN_SYSTEM_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
  },
}));
