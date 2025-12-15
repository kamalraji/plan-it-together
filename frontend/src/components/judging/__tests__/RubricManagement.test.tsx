import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import RubricManagement from '../RubricManagement';

// Mock the API
vi.mock('../../../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

import api from '../../../lib/api';
const mockedApi = vi.mocked(api);

describe('RubricManagement', () => {
  const mockEventId = 'event-123';
  const mockOnRubricCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders rubric creation form', () => {
    render(<RubricManagement eventId={mockEventId} onRubricCreated={mockOnRubricCreated} />);
    
    expect(screen.getByText('Create Judging Rubric')).toBeInTheDocument();
    expect(screen.getByText('Define the criteria and weights for judging submissions. Total weight must equal 100%.')).toBeInTheDocument();
    expect(screen.getByText('Criterion 1')).toBeInTheDocument();
  });

  it('allows adding and removing criteria', () => {
    render(<RubricManagement eventId={mockEventId} onRubricCreated={mockOnRubricCreated} />);
    
    // Initially has one criterion
    expect(screen.getByText('Criterion 1')).toBeInTheDocument();
    expect(screen.queryByText('Criterion 2')).not.toBeInTheDocument();
    
    // Add criterion
    fireEvent.click(screen.getByText('Add Criterion'));
    expect(screen.getByText('Criterion 2')).toBeInTheDocument();
    
    // Remove criterion
    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]);
    expect(screen.queryByText('Criterion 2')).not.toBeInTheDocument();
  });

  it('validates weight totals', async () => {
    render(<RubricManagement eventId={mockEventId} onRubricCreated={mockOnRubricCreated} />);
    
    // Fill in criterion details
    const nameInput = screen.getByPlaceholderText('e.g., Innovation');
    const weightInputs = screen.getAllByRole('spinbutton');
    const weightInput = weightInputs[0]; // First number input should be weight
    const descriptionInput = screen.getByPlaceholderText('Describe what judges should evaluate for this criterion...');
    
    fireEvent.change(nameInput, { target: { value: 'Innovation' } });
    fireEvent.change(weightInput, { target: { value: '50' } });
    fireEvent.change(descriptionInput, { target: { value: 'Evaluate innovation level' } });
    
    // Try to submit with weight not equal to 100
    fireEvent.click(screen.getByText('Create Rubric'));
    
    await waitFor(() => {
      expect(screen.getByText('Total weight must equal 100%. Current total: 50%')).toBeInTheDocument();
    });
  });

  it('submits valid rubric', async () => {
    const mockRubric = {
      id: 'rubric-123',
      eventId: mockEventId,
      criteria: [
        { id: 'criterion-1', name: 'Innovation', description: 'Evaluate innovation', weight: 100, maxScore: 100 }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockedApi.get.mockRejectedValue({ response: { status: 404 } });
    mockedApi.post.mockResolvedValue({ data: mockRubric });

    render(<RubricManagement eventId={mockEventId} onRubricCreated={mockOnRubricCreated} />);
    
    // Fill in criterion details
    const nameInput = screen.getByPlaceholderText('e.g., Innovation');
    const weightInput = screen.getByLabelText('Weight (%) *');
    const descriptionInput = screen.getByPlaceholderText('Describe what judges should evaluate for this criterion...');
    
    fireEvent.change(nameInput, { target: { value: 'Innovation' } });
    fireEvent.change(weightInput, { target: { value: '100' } });
    fireEvent.change(descriptionInput, { target: { value: 'Evaluate innovation level' } });
    
    // Submit form
    fireEvent.click(screen.getByText('Create Rubric'));
    
    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith('/rubrics', {
        eventId: mockEventId,
        criteria: [
          {
            name: 'Innovation',
            description: 'Evaluate innovation level',
            weight: 100,
            maxScore: 100
          }
        ]
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Rubric created successfully!')).toBeInTheDocument();
    });

    expect(mockOnRubricCreated).toHaveBeenCalledWith(mockRubric);
  });

  it('loads existing rubric for editing', async () => {
    const mockRubric = {
      id: 'rubric-123',
      eventId: mockEventId,
      criteria: [
        { id: 'criterion-1', name: 'Innovation', description: 'Evaluate innovation', weight: 60, maxScore: 100 },
        { id: 'criterion-2', name: 'Implementation', description: 'Evaluate implementation', weight: 40, maxScore: 100 }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockedApi.get.mockResolvedValue({ data: mockRubric });

    render(<RubricManagement eventId={mockEventId} onRubricCreated={mockOnRubricCreated} />);
    
    await waitFor(() => {
      expect(screen.getByText('Edit Judging Rubric')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Innovation')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Implementation')).toBeInTheDocument();
      expect(screen.getByText('Total Weight: 100% ✓')).toBeInTheDocument();
    });
  });
});