import React from 'react';
import { AppRouter } from './components/routing';
import { ErrorBoundary } from './components/routing';
import './index.css';

function App() {
  return (
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  );
}

export default App;