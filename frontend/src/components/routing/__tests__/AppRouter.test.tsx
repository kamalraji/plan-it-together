import { render, screen } from '@testing-library/react';
import { AppRouter } from '../AppRouter';

// Mock the API module to avoid network calls during tests
jest.mock('../../../lib/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe('AppRouter', () => {
  it('renders without crashing', () => {
    render(<AppRouter />);
    // The router should render something - either a loading state or redirect
    expect(document.body).toBeInTheDocument();
  });

  it('renders login page for /login route', () => {
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/login',
        search: '',
        hash: '',
      },
      writable: true,
    });

    render(<AppRouter />);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders register page for /register route', () => {
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/register',
        search: '',
        hash: '',
      },
      writable: true,
    });

    render(<AppRouter />);
    expect(screen.getByText('Register Page')).toBeInTheDocument();
  });
});