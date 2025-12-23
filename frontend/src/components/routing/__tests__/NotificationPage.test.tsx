import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { NotificationPage } from '../NotificationPage';

// Mock the PageHeader component
vi.mock('../PageHeader', () => ({
  PageHeader: ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  ),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('NotificationPage', () => {
  it('renders notification page with title', () => {
    renderWithRouter(<NotificationPage />);
    
    expect(screen.getByTestId('page-header')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('displays search functionality', () => {
    renderWithRouter(<NotificationPage />);
    
    expect(screen.getByLabelText('Search Notifications')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search notifications...')).toBeInTheDocument();
  });

  it('shows category filters', () => {
    renderWithRouter(<NotificationPage />);
    
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('displays unread filter option', () => {
    renderWithRouter(<NotificationPage />);
    
    expect(screen.getByText('Show unread only')).toBeInTheDocument();
  });

  it('shows mock notifications by default', () => {
    renderWithRouter(<NotificationPage />);
    
    // Should show some mock notifications
    expect(screen.getByText('New Task Assignment')).toBeInTheDocument();
    expect(screen.getByText('Event Registration Milestone')).toBeInTheDocument();
  });
});