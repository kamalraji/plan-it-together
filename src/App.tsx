
import { AppRouter } from './components/routing';
import { ErrorBoundary } from './components/routing';
import { ThemeProvider } from './components/theme/ThemeProvider';
import './index.css';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <div className="App" data-app-root>
          <AppRouter />
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}


export default App;