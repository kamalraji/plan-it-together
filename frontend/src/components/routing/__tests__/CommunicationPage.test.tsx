import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { CommunicationPage } from '../CommunicationPage';

// Mock the PageHeader component
vi.mock('../PageHeader', () => ({
  PageHeader: ({ title, subtitle, tabs }: { title: string; subtitle?: string; tabs?: any[] }) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
      {tabs && (
        <div data-testid="tabs">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={tab.onClick}>
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </div>
  ),
}));

// Mock the communication components
vi.mock('../../communication/EmailComposer', () => ({
  EmailComposer: ({ eventId }: { eventId: string }) => (
    <div data-testid="email-composer">Email Composer for {eventId}</div>
  ),
}));

vi.mock('../../communication/CommunicationHistory', () => ({
  CommunicationHistory: ({ eventId }: { eventId: string }) => (
    <div data-testid="communication-history">Communication History for {eventId}</div>
  ),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('CommunicationPage', () => {
  it('renders communication page with title', () => {
    renderWithRouter(<CommunicationPage />);
    
    expect(screen.getByTestId('page-header')).toBeInTheDocument();
    expect(screen.getByText('Communications')).toBeInTheDocument();
  });

  it('displays inbox tab by default', () => {
    renderWithRouter(<CommunicationPage />);
    
    expect(screen.getByTestId('tabs')).toBeInTheDocument();
    expect(screen.getByText(/Inbox/)).toBeInTheDocument();
  });

  it('shows search functionality in inbox', () => {
    renderWithRouter(<CommunicationPage />);
    
    expect(screen.getByLabelText('Search Messages')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search messages...')).toBeInTheDocument();
  });

  it('displays category filters', () => {
    renderWithRouter(<CommunicationPage />);
    
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('switches to compose tab when clicked', () => {
    renderWithRouter(<CommunicationPage />);
    
    const composeButton = screen.getByText('Compose');
    fireEvent.click(composeButton);
    
    expect(screen.getByTestId('email-composer')).toBeInTheDocument();
    expect(screen.getByText('Compose Message')).toBeInTheDocument();
  });

  it('switches to history tab when clicked', () => {
    renderWithRouter(<CommunicationPage />);
    
    const historyButton = screen.getByText('History');
    fireEvent.click(historyButton);
    
    expect(screen.getByTestId('communication-history')).toBeInTheDocument();
    expect(screen.getByText('Communication History')).toBeInTheDocument();
  });

  it('switches to preferences tab when clicked', () => {
    renderWithRouter(<CommunicationPage />);
    
    const preferencesButton = screen.getByText('Preferences');
    fireEvent.click(preferencesButton);
    
    expect(screen.getByText('Communication Preferences')).toBeInTheDocument();
    expect(screen.getByText('Email Notifications')).toBeInTheDocument();
  });

  it('shows mock messages by default', () => {
    renderWithRouter(<CommunicationPage />);
    
    // Should show some mock messages
    expect(screen.getByText('Task Assignment: Design Event Brochure')).toBeInTheDocument();
    expect(screen.getByText('Event Update: Annual Conference 2024')).toBeInTheDocument();
  });
});