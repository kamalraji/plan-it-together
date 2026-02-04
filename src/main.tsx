import { createRoot } from 'react-dom/client';
import App from './App';
import { logging } from '@/lib/logging';

console.log('🚀 Starting Thittam1Hub frontend...');
logging.init();

try {
  const rootElement = document.getElementById('root');
  console.log('Root element:', rootElement);
  
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  const root = createRoot(rootElement);
  console.log('React root created');

  root.render(<App />);
  console.log('✅ App rendered successfully');
} catch (error) {
  console.error('❌ Error starting app:', error);
  
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