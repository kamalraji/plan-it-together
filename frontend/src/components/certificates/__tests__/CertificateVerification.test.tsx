import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { CertificateVerification } from '../CertificateVerification';

import { vi } from 'vitest';

// Mock axios
vi.mock('axios', () => ({
  __esModule: true,
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
    })),
  },
}));

// Mock the API
vi.mock('../../../lib/api', () => ({
  __esModule: true,
  api: {
    defaults: {
      baseURL: 'http://localhost:3000/api',
    },
  },
}));

const renderWithProviders = (component: React.ReactElement, initialEntries?: string[]) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Router = initialEntries ? MemoryRouter : BrowserRouter;
  const routerProps = initialEntries ? { initialEntries } : {};

  return render(
    <QueryClientProvider client={queryClient}>
      <Router {...routerProps}>
        {component}
      </Router>
    </QueryClientProvider>
  );
};

describe('CertificateVerification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders certificate verification interface', () => {
    renderWithProviders(<CertificateVerification />);
    
    expect(screen.getByText('Certificate Verification')).toBeInTheDocument();
    expect(screen.getByText('Verify the authenticity of certificates issued through Thittam1Hub')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter certificate ID/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument();
  });

  it('shows verification form with input field and button', () => {
    renderWithProviders(<CertificateVerification />);
    
    const input = screen.getByPlaceholderText(/Enter certificate ID/);
    const button = screen.getByRole('button', { name: /verify/i });
    
    expect(input).toBeInTheDocument();
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled(); // Should be disabled when input is empty
  });

  it('enables verify button when certificate ID is entered', () => {
    renderWithProviders(<CertificateVerification />);
    
    const input = screen.getByPlaceholderText(/Enter certificate ID/);
    const button = screen.getByRole('button', { name: /verify/i });
    
    fireEvent.change(input, { target: { value: 'CERT-2024-ABC123' } });
    
    expect(button).not.toBeDisabled();
  });

  it('displays certificate ID from URL parameter', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/verify-certificate/CERT-2024-ABC123']}>
          <Routes>
            <Route path="/verify-certificate/:certificateId" element={<CertificateVerification />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
    
    const input = screen.getByPlaceholderText(/Enter certificate ID/) as HTMLInputElement;
    expect(input.value).toBe('CERT-2024-ABC123');
  });

  it('displays certificate ID from prop', () => {
    renderWithProviders(<CertificateVerification certificateId="CERT-PROP-123" />);
    
    const input = screen.getByPlaceholderText(/Enter certificate ID/) as HTMLInputElement;
    expect(input.value).toBe('CERT-PROP-123');
  });

  it('shows information section about certificate verification', () => {
    renderWithProviders(<CertificateVerification />);
    
    expect(screen.getByText('About Certificate Verification')).toBeInTheDocument();
    expect(screen.getByText(/This verification portal allows you to confirm/)).toBeInTheDocument();
    expect(screen.getByText('How to verify:')).toBeInTheDocument();
    expect(screen.getByText('Security:')).toBeInTheDocument();
  });

  it('displays valid certificate details when verification succeeds', async () => {
    const mockAxios = await import('axios');
    const mockGet = vi.fn().mockResolvedValue({
      data: {
        data: {
          valid: true,
          certificate: {
            id: 'cert-123',
            certificateId: 'CERT-2024-ABC123',
            recipientName: 'John Doe',
            eventName: 'Test Event',
            eventOrganization: 'Test Organization',
            type: 'COMPLETION',
            issuedAt: '2024-01-01T00:00:00Z',
            issuerName: 'Event Organizer',
          },
        },
      },
    });

    mockAxios.default.create.mockReturnValue({ get: mockGet });

    renderWithProviders(<CertificateVerification certificateId="CERT-2024-ABC123" />);

    await waitFor(() => {
      expect(screen.getByText('Certificate Verified')).toBeInTheDocument();
      expect(screen.getByText('This certificate is authentic and valid.')).toBeInTheDocument();
      expect(screen.getByText('CERT-2024-ABC123')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Test Event')).toBeInTheDocument();
      expect(screen.getByText('Test Organization')).toBeInTheDocument();
      expect(screen.getByText('Event Organizer')).toBeInTheDocument();
    });
  });

  it('displays error message when certificate is not found', async () => {
    const mockAxios = await import('axios');
    const mockGet = vi.fn().mockResolvedValue({
      data: {
        data: {
          valid: false,
          error: 'Certificate not found. Please check the certificate ID and try again.',
        },
      },
    });

    mockAxios.default.create.mockReturnValue({ get: mockGet });

    renderWithProviders(<CertificateVerification certificateId="INVALID-CERT" />);

    await waitFor(() => {
      expect(screen.getByText('Certificate Not Verified')).toBeInTheDocument();
      expect(screen.getByText('Certificate not found. Please check the certificate ID and try again.')).toBeInTheDocument();
      expect(screen.getByText('Troubleshooting')).toBeInTheDocument();
    });
  });

  it('handles network errors gracefully', async () => {
    const mockAxios = await import('axios');
    const mockGet = vi.fn().mockRejectedValue(new Error('Network error'));

    mockAxios.default.create.mockReturnValue({ get: mockGet });

    renderWithProviders(<CertificateVerification certificateId="CERT-2024-ABC123" />);

    await waitFor(() => {
      expect(screen.getByText('Verification Error')).toBeInTheDocument();
      expect(screen.getByText('An error occurred while verifying the certificate. Please try again.')).toBeInTheDocument();
    });
  });

  it('shows different certificate type badges correctly', async () => {
    const certificateTypes = [
      { type: 'MERIT', expectedClass: 'bg-yellow-100 text-yellow-800' },
      { type: 'COMPLETION', expectedClass: 'bg-green-100 text-green-800' },
      { type: 'APPRECIATION', expectedClass: 'bg-blue-100 text-blue-800' },
    ];

    for (const { type } of certificateTypes) {
      const mockAxios = await import('axios');
      const mockGet = vi.fn().mockResolvedValue({
        data: {
          data: {
            valid: true,
            certificate: {
              id: 'cert-123',
              certificateId: 'CERT-2024-ABC123',
              recipientName: 'John Doe',
              eventName: 'Test Event',
              type,
              issuedAt: '2024-01-01T00:00:00Z',
              issuerName: 'Event Organizer',
            },
          },
        },
      });

      mockAxios.default.create.mockReturnValue({ get: mockGet });

      const { unmount } = renderWithProviders(<CertificateVerification certificateId={`CERT-${type}`} />);

      await waitFor(() => {
        const badge = screen.getByText(type);
        expect(badge).toBeInTheDocument();
      });

      unmount();
      vi.clearAllMocks();
    }
  });

  it('allows user to verify another certificate after viewing results', async () => {
    const mockAxios = await import('axios');
    const mockGet = vi.fn().mockResolvedValue({
      data: {
        data: {
          valid: true,
          certificate: {
            id: 'cert-123',
            certificateId: 'CERT-2024-ABC123',
            recipientName: 'John Doe',
            eventName: 'Test Event',
            type: 'COMPLETION',
            issuedAt: '2024-01-01T00:00:00Z',
            issuerName: 'Event Organizer',
          },
        },
      },
    });

    mockAxios.default.create.mockReturnValue({ get: mockGet });

    renderWithProviders(<CertificateVerification certificateId="CERT-2024-ABC123" />);

    await waitFor(() => {
      expect(screen.getByText('Certificate Verified')).toBeInTheDocument();
    });

    const verifyAnotherButton = screen.getByRole('button', { name: /verify another certificate/i });
    fireEvent.click(verifyAnotherButton);

    // Should reset the form
    const input = screen.getByPlaceholderText(/Enter certificate ID/) as HTMLInputElement;
    expect(input.value).toBe('');
    expect(screen.queryByText('Certificate Verified')).not.toBeInTheDocument();
  });

  it('shows print verification button for valid certificates', async () => {
    const mockAxios = await import('axios');
    const mockGet = vi.fn().mockResolvedValue({
      data: {
        data: {
          valid: true,
          certificate: {
            id: 'cert-123',
            certificateId: 'CERT-2024-ABC123',
            recipientName: 'John Doe',
            eventName: 'Test Event',
            type: 'COMPLETION',
            issuedAt: '2024-01-01T00:00:00Z',
            issuerName: 'Event Organizer',
          },
        },
      },
    });

    mockAxios.default.create.mockReturnValue({ get: mockGet });

    // Mock window.print
    const mockPrint = vi.fn();
    Object.defineProperty(window, 'print', {
      value: mockPrint,
      writable: true,
    });

    renderWithProviders(<CertificateVerification certificateId="CERT-2024-ABC123" />);

    await waitFor(() => {
      expect(screen.getByText('Certificate Verified')).toBeInTheDocument();
    });

    const printButton = screen.getByRole('button', { name: /print verification/i });
    expect(printButton).toBeInTheDocument();

    fireEvent.click(printButton);
    expect(mockPrint).toHaveBeenCalled();
  });
});