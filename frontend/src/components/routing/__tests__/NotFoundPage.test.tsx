import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { NotFoundPage } from '../NotFoundPage';
import { AuthProvider } from '../../../hooks/useAuth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the API module
vi.mock('../../../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('NotFoundPage', () => {
  it('renders 404 error message', () => {
    renderWithProviders(<NotFoundPage />);
    
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });

  it('renders navigation options', () => {
    renderWithProviders(<NotFoundPage />);
    
    expect(screen.getByText('Go Back')).toBeInTheDocument();
    expect(screen.getByText('Go to Login')).toBeInTheDocument();
  });

  it('renders help links', () => {
    renderWithProviders(<NotFoundPage />);
    
    expect(screen.getByText('Help Center')).toBeInTheDocument();
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
  });
});