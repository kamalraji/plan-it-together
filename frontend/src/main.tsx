// React import removed as it's not needed in React 18+
import { createRoot } from 'react-dom/client';
import App from './App';

console.log('🚀 Starting Thittam1Hub frontend...');

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
  
  // Fallback: inject error message directly into DOM
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 50px; color: red; font-size: 24px; font-family: Arial;">
        <h1>❌ Startup Error</h1>
        <p>Failed to start React application</p>
        <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
        <p>Check the browser console for more details</p>
      </div>
    `;
  }
}