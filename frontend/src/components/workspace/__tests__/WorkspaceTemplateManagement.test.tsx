import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { WorkspaceTemplateManagement } from '../WorkspaceTemplateManagement';

// Mock the API
vi.mock('../../../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock the child components
vi.mock('../WorkspaceTemplateLibrary', () => ({
  WorkspaceTemplateLibrary: ({ onTemplateSelect, onTemplatePreview }: any) => (
    <div data-testid="template-library">
      <button onClick={() => onTemplateSelect?.({ id: '1', name: 'Test Template' })}>
        Select Template
      </button>
      <button onClick={() => onTemplatePreview?.({ id: '1', name: 'Test Template' })}>
        Preview Template
      </button>
    </div>
  ),
}));

vi.mock('../WorkspaceTemplateCreation', () => ({
  WorkspaceTemplateCreation: ({ onTemplateCreated, onCancel }: any) => (
    <div data-testid="template-creation">
      <button onClick={() => onTemplateCreated?.({ id: '2', name: 'New Template' })}>
        Create Template
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock('../WorkspaceTemplatePreview', () => ({
  WorkspaceTemplatePreview: ({ onClose, onUseTemplate }: any) => (
    <div data-testid="template-preview">
      <button onClick={onClose}>Close</button>
      <button onClick={() => onUseTemplate?.({ id: '1', name: 'Test Template' })}>
        Use Template
      </button>
    </div>
  ),
}));

vi.mock('../WorkspaceTemplateRating', () => ({
  WorkspaceTemplateRating: ({ onRatingSubmitted, onCancel }: any) => (
    <div data-testid="template-rating">
      <button onClick={onRatingSubmitted}>Submit Rating</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

describe('WorkspaceTemplateManagement', () => {
  it('renders template library by default', () => {
    render(
      <WorkspaceTemplateManagement
        workspaceId="workspace-1"
        mode="library"
      />
    );

    expect(screen.getByText('Template Library')).toBeInTheDocument();
    expect(screen.getByTestId('template-library')).toBeInTheDocument();
  });

  it('renders template creation when create mode is selected', () => {
    render(
      <WorkspaceTemplateManagement
        workspaceId="workspace-1"
        mode="create"
      />
    );

    expect(screen.getByText('Create Template')).toBeInTheDocument();
  });

  it('switches between library and create modes', () => {
    render(
      <WorkspaceTemplateManagement
        workspaceId="workspace-1"
        mode="library"
      />
    );

    // Should show library by default
    expect(screen.getByTestId('template-library')).toBeInTheDocument();

    // Click create template tab
    const createTab = screen.getByText('Create Template');
    createTab.click();

    // Should show creation form
    expect(screen.getByTestId('template-creation')).toBeInTheDocument();
  });

  it('handles template creation callback', () => {
    const onTemplateCreated = vi.fn();
    
    render(
      <WorkspaceTemplateManagement
        workspaceId="workspace-1"
        mode="create"
        onTemplateCreated={onTemplateCreated}
      />
    );

    // Click create template button
    const createButton = screen.getByText('Create Template');
    createButton.click();

    expect(onTemplateCreated).toHaveBeenCalledWith({ id: '2', name: 'New Template' });
  });
});