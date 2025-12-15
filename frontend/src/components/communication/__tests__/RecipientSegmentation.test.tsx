import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { RecipientSegmentation } from '../RecipientSegmentation';
import { SegmentCriteria, UserRole, RegistrationStatus } from '../../../types';

describe('RecipientSegmentation', () => {
  const mockOnCriteriaChange = vi.fn();

  const defaultProps = {
    segmentCriteria: {},
    onCriteriaChange: mockOnCriteriaChange,
    recipientPreview: null,
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders recipient segmentation interface', () => {
    render(<RecipientSegmentation {...defaultProps} />);

    expect(screen.getByText('Recipient Segmentation')).toBeInTheDocument();
    expect(screen.getByText('Filter by Role')).toBeInTheDocument();
    expect(screen.getByText('Filter by Registration Status')).toBeInTheDocument();
    expect(screen.getByText('Filter by Attendance Status')).toBeInTheDocument();
  });

  it('handles role selection correctly', () => {
    render(<RecipientSegmentation {...defaultProps} />);

    const participantCheckbox = screen.getByRole('checkbox', { name: /Participants Event attendees/ });
    fireEvent.click(participantCheckbox);

    expect(mockOnCriteriaChange).toHaveBeenCalledWith({
      roles: [UserRole.PARTICIPANT],
    });
  });

  it('handles multiple role selections', () => {
    const propsWithRoles = {
      ...defaultProps,
      segmentCriteria: { roles: [UserRole.PARTICIPANT] },
    };

    render(<RecipientSegmentation {...propsWithRoles} />);

    const judgeCheckbox = screen.getByRole('checkbox', { name: /Judges Competition judges/ });
    fireEvent.click(judgeCheckbox);

    expect(mockOnCriteriaChange).toHaveBeenCalledWith({
      roles: [UserRole.PARTICIPANT, UserRole.JUDGE],
    });
  });

  it('handles role deselection', () => {
    const propsWithRoles = {
      ...defaultProps,
      segmentCriteria: { roles: [UserRole.PARTICIPANT, UserRole.JUDGE] },
    };

    render(<RecipientSegmentation {...propsWithRoles} />);

    const participantCheckbox = screen.getByRole('checkbox', { name: /Participants Event attendees/ });
    fireEvent.click(participantCheckbox);

    expect(mockOnCriteriaChange).toHaveBeenCalledWith({
      roles: [UserRole.JUDGE],
    });
  });

  it('handles registration status selection', () => {
    render(<RecipientSegmentation {...defaultProps} />);

    const confirmedCheckbox = screen.getByRole('checkbox', { name: /Confirmed Confirmed registrations/ });
    fireEvent.click(confirmedCheckbox);

    expect(mockOnCriteriaChange).toHaveBeenCalledWith({
      registrationStatus: [RegistrationStatus.CONFIRMED],
    });
  });

  it('handles attendance status selection', () => {
    render(<RecipientSegmentation {...defaultProps} />);

    const attendedRadio = screen.getByRole('radio', { name: /Attended Participants who checked in/ });
    fireEvent.click(attendedRadio);

    expect(mockOnCriteriaChange).toHaveBeenCalledWith({
      attendanceStatus: 'ATTENDED',
    });
  });

  it('clears all filters when clear button is clicked', () => {
    const propsWithCriteria = {
      ...defaultProps,
      segmentCriteria: {
        roles: [UserRole.PARTICIPANT],
        registrationStatus: [RegistrationStatus.CONFIRMED],
        attendanceStatus: 'ATTENDED' as const,
      },
    };

    render(<RecipientSegmentation {...propsWithCriteria} />);

    const clearButton = screen.getByText('Clear All Filters');
    fireEvent.click(clearButton);

    expect(mockOnCriteriaChange).toHaveBeenCalledWith({});
  });

  it('displays loading state', () => {
    const loadingProps = { ...defaultProps, isLoading: true };
    render(<RecipientSegmentation {...loadingProps} />);

    expect(screen.getByText('Loading recipients...')).toBeInTheDocument();
  });

  it('displays recipient preview', () => {
    const propsWithPreview = {
      ...defaultProps,
      recipientPreview: {
        count: 5,
        recipients: [
          { id: '1', name: 'John Doe', email: 'john@example.com' },
          { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
        ],
      },
    };

    render(<RecipientSegmentation {...propsWithPreview} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('recipients selected')).toBeInTheDocument();
  });

  it('shows recipient list when show list button is clicked', () => {
    const propsWithPreview = {
      ...defaultProps,
      recipientPreview: {
        count: 2,
        recipients: [
          { id: '1', name: 'John Doe', email: 'john@example.com' },
          { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
        ],
      },
    };

    render(<RecipientSegmentation {...propsWithPreview} />);

    const showListButton = screen.getByText('Show List');
    fireEvent.click(showListButton);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });
});