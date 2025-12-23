import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { HelpPage } from '../HelpPage';

// Mock the useAuth hook
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'ORGANIZER'
    }
  })
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('HelpPage', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('renders help page with main sections', () => {
    renderWithProviders(<HelpPage />);
    
    expect(screen.getByText('Help & Support')).toBeInTheDocument();
    expect(screen.getByText('Find answers, learn new features, and get support')).toBeInTheDocument();
    
    // Check navigation sections
    expect(screen.getByText('Knowledge Base')).toBeInTheDocument();
    expect(screen.getByText('Interactive Tutorials')).toBeInTheDocument();
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
    expect(screen.getByText('Feedback')).toBeInTheDocument();
  });

  it('has a search input', () => {
    renderWithProviders(<HelpPage />);
    
    const searchInput = screen.getByPlaceholderText('Search help articles...');
    expect(searchInput).toBeInTheDocument();
  });

  it('switches between sections when navigation is clicked', async () => {
    renderWithProviders(<HelpPage />);
    
    // Click on Interactive Tutorials
    fireEvent.click(screen.getByText('Interactive Tutorials'));
    
    await waitFor(() => {
      expect(screen.getByText('Featured Tutorials')).toBeInTheDocument();
    });
  });

  it('displays contextual help when context is provided', async () => {
    renderWithProviders(<HelpPage currentContext="events" />);
    
    await waitFor(() => {
      expect(screen.getByText('Help for Current Page')).toBeInTheDocument();
    });
  });

  it('has quick links section', () => {
    renderWithProviders(<HelpPage />);
    
    expect(screen.getByText('Quick Links')).toBeInTheDocument();
    expect(screen.getByText('Create New Event')).toBeInTheDocument();
    expect(screen.getByText('Manage Workspaces')).toBeInTheDocument();
    expect(screen.getByText('Browse Marketplace')).toBeInTheDocument();
  });

  it('handles search input changes', () => {
    renderWithProviders(<HelpPage />);
    
    const searchInput = screen.getByPlaceholderText('Search help articles...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    expect(searchInput).toHaveValue('test search');
  });
});