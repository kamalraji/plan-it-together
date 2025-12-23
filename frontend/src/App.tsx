import React from 'react';
import { AppRouter } from './components/routing';
import { ErrorBoundary } from './components/routing';
import './index.css';

function App() {
  return (
    <ErrorBoundary>
      <div className="App">
        <AppRouter />
      </div>
    </ErrorBoundary>
  );
}

export default App;