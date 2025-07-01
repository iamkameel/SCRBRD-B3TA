
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatsQueryCard } from '../stats-query-card';
import { useToast } from '@/hooks/use-toast';
import { queryStatsAction } from '@/lib/actions/analysis';

// Mock the server action
jest.mock('@/lib/actions/analysis', () => ({
  queryStatsAction: jest.fn(),
}));

// Mock the useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

const mockedQueryStatsAction = queryStatsAction as jest.Mock;

describe('StatsQueryCard', () => {
  beforeEach(() => {
    mockedQueryStatsAction.mockClear();
  });

  it('renders the form correctly', () => {
    render(<StatsQueryCard />);
    expect(screen.getByPlaceholderText('e.g., Who has the most wickets?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ask/i })).toBeInTheDocument();
  });

  it('submits the form, shows loading state, and displays the answer', async () => {
    const mockAnswer = 'Ben Stokes has the most wickets with 50.';
    mockedQueryStatsAction.mockResolvedValue(mockAnswer);

    render(<StatsQueryCard />);

    const input = screen.getByPlaceholderText('e.g., Who has the most wickets?');
    const button = screen.getByRole('button', { name: /Ask/i });

    // Simulate user input and submission
    fireEvent.change(input, { target: { value: 'Who has the most wickets?' } });
    fireEvent.click(button);

    // Check for loading state
    expect(screen.getByText('Finding an answer...')).toBeInTheDocument();
    expect(button).toBeDisabled();

    // Wait for the mock action to resolve and the UI to update
    await waitFor(() => {
      expect(screen.getByText(mockAnswer)).toBeInTheDocument();
    });
    
    // Loading state should be gone
    expect(screen.queryByText('Finding an answer...')).not.toBeInTheDocument();
    expect(button).not.toBeDisabled();
    
    // Ensure the action was called with the correct question
    expect(mockedQueryStatsAction).toHaveBeenCalledWith('Who has the most wickets?');
  });

  it('handles and displays an error from the server action', async () => {
    const errorMessage = 'The AI is currently offline.';
    mockedQueryStatsAction.mockRejectedValue(new Error(errorMessage));

    // We need to spy on the toast function to see if it's called
    const toastMock = require('@/hooks/use-toast').useToast().toast;

    render(<StatsQueryCard />);

    const input = screen.getByPlaceholderText('e.g., Who has the most wickets?');
    const button = screen.getByRole('button', { name: /Ask/i });

    fireEvent.change(input, { target: { value: 'Any question' } });
    fireEvent.click(button);

    // Wait for the error handling to complete
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    });

    // Ensure the UI is back to its initial state
    expect(screen.queryByText('Finding an answer...')).not.toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('shows a validation error for a short question', async () => {
    render(<StatsQueryCard />);
    
    const input = screen.getByPlaceholderText('e.g., Who has the most wickets?');
    const button = screen.getByRole('button', { name: /Ask/i });

    fireEvent.change(input, { target: { value: 'hi' } });
    fireEvent.click(button);

    // The component uses react-hook-form, so the message should appear
    await waitFor(() => {
        expect(screen.getByText('Please ask a longer question.')).toBeInTheDocument();
    });
    
    // Ensure the server action was NOT called
    expect(mockedQueryStatsAction).not.toHaveBeenCalled();
  });
});
