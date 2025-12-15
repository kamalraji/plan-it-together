import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import RubricManagement from '../RubricManagement';
import JudgeScoring from '../JudgeScoring';
import Leaderboard from '../Leaderboard';

// Mock the API
vi.mock('../../../lib/api', () => ({
  default: {
    get: vi.fn().mockRejectedValue({ response: { status: 404 } }),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

describe('Judging Components Integration', () => {
  it('renders RubricManagement component', () => {
    render(<RubricManagement eventId="test-event" />);
    expect(screen.getByText('Create Judging Rubric')).toBeInTheDocument();
  });

  it('renders JudgeScoring component', () => {
    const { container } = render(<JudgeScoring eventId="test-event" judgeId="test-judge" />);
    // Component should render without errors
    expect(container).toBeInTheDocument();
  });

  it('renders Leaderboard component', () => {
    const { container } = render(<Leaderboard eventId="test-event" />);
    // Component should render without errors
    expect(container).toBeInTheDocument();
  });
});