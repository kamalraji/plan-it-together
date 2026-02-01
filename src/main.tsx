import { createRoot } from 'react-dom/client';
import App from './App';
import { logging } from '@/lib/logging';

// Initialize logging system
logging.init();

try {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  const root = createRoot(rootElement);
  root.render(<App />);
} catch (_error) {
  // Critical startup error - show fallback UI
  
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 50px; color: red; font-size: 24px; font-family: Arial;">
        <h1>❌ Startup Error</h1>
        <p>Failed to start the application. Please refresh the page or try again later.</p>
        <p>If the problem persists, contact support.</p>
      </div>
    `;
  }
}