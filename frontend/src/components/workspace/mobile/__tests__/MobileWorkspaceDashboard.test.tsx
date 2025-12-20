import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { MobileWorkspaceDashboard } from '../MobileWorkspaceDashboard';

// Mock the API
jest.mock('../../../../lib/api', () => ({
  get: jest.fn(),
}));

const mockWorkspace = {
  id: 'workspace-1',
  name: 'Test Workspace',
  description: 'Test workspace description',
  status: 'ACTIVE',
  event: {
    id: 'event-1',
    name: 'Test Event'
  }
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('MobileWorkspaceDashboard', () => {
  beforeEach(() => {
    // Mock successful API responses
    const api = require('../../../../lib/api');
    api.get.mockResolvedValue({
      data: { workspace: mockWorkspace }
    });
  });

  it('renders loading state initially', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <MobileWorkspaceDashboard workspaceId="workspace-1" />
      </Wrapper>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders workspace dashboard after loading', async () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <MobileWorkspaceDashboard workspaceId="workspace-1" />
      </Wrapper>
    );

    // Wait for the workspace name to appear
    expect(await screen.findByText('Test Workspace')).toBeInTheDocument();
  });

  it('shows quick actions section', async () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <MobileWorkspaceDashboard workspaceId="workspace-1" />
      </Wrapper>
    );

    expect(await screen.findByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('New Task')).toBeInTheDocument();
    expect(screen.getByText('Invite')).toBeInTheDocument();
  });

  it('shows mobile features panel', async () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <MobileWorkspaceDashboard workspaceId="workspace-1" />
      </Wrapper>
    );

    expect(await screen.findByText('Mobile Features')).toBeInTheDocument();
    expect(screen.getByText('Location Services')).toBeInTheDocument();
    expect(screen.getByText('Photo Capture')).toBeInTheDocument();
    expect(screen.getByText('Voice Recording')).toBeInTheDocument();
  });

  it('shows bottom navigation', async () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <MobileWorkspaceDashboard workspaceId="workspace-1" />
      </Wrapper>
    );

    expect(await screen.findByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Stats')).toBeInTheDocument();
  });
});