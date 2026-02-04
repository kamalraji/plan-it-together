
import { AppRouter } from './components/routing';
import { ErrorBoundary } from './components/routing';
import { ThemeProvider } from './components/theme/ThemeProvider';
import './index.css';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        {/* Skip to main content link for keyboard/screen reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Skip to main content
        </a>
        <div className="App" data-app-root>
          <AppRouter />
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}


export default App;