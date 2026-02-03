import React from 'react';
import { AppRouter } from './components/routing';
import { ErrorBoundary } from './components/routing';
import './index.css';

function App() {
  return (
    <ErrorBoundary>
      <React.Fragment>
        <div className="App" data-app-root>
          <AppRouter />
        </div>
      </React.Fragment>
    </ErrorBoundary>
  );
}


export default App;