
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DreamTeamCard } from '../dream-team-card';
import { useToast } from '@/hooks/use-toast';
import { generateDreamTeam } from '@/ai/flows/generate-dream-team-flow';
import type { DreamTeamOutput } from '@/ai/schemas';

// Mock the AI flow
jest.mock('@/ai/flows/generate-dream-team-flow', () => ({
  generateDreamTeam: jest.fn(),
}));

// Mock the useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

const mockedGenerateDreamTeam = generateDreamTeam as jest.Mock;

describe('DreamTeamCard', () => {
  beforeEach(() => {
    mockedGenerateDreamTeam.mockClear();
  });

  it('renders the initial state correctly', () => {
    render(<DreamTeamCard />);
    expect(screen.getByText('AI Dream Team Selector')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate Dream Team/i })).toBeInTheDocument();
    expect(screen.getByText('Your Dream Team awaits')).toBeInTheDocument();
  });

  it('shows loading state and generates a team successfully', async () => {
    const mockTeam: DreamTeamOutput = {
      team: [
        { name: 'Ben Stokes', justification: 'Great all-rounder.' },
        { name: 'Joe Root', justification: 'Consistent batsman.' },
        { name: 'Player 3', justification: '...' },
        { name: 'Player 4', justification: '...' },
        { name: 'Player 5', justification: '...' },
        { name: 'Player 6', justification: '...' },
        { name: 'Player 7', justification: '...' },
        { name: 'Player 8', justification: '...' },
        { name: 'Player 9', justification: '...' },
        { name: 'Player 10', justification: '...' },
        { name: 'Player 11', justification: '...' },
      ],
    };
    mockedGenerateDreamTeam.mockResolvedValue(mockTeam);

    render(<DreamTeamCard />);

    const generateButton = screen.getByRole('button', { name: /Generate Dream Team/i });
    fireEvent.click(generateButton);

    // Check for loading state
    expect(screen.getByText('Analyzing player stats...')).toBeInTheDocument();
    expect(generateButton).toHaveTextContent('Generating...');
    expect(generateButton).toBeDisabled();

    // Wait for the result
    await waitFor(() => {
      expect(screen.getByText('Ben Stokes')).toBeInTheDocument();
      expect(screen.getByText('Great all-rounder.')).toBeInTheDocument();
    });

    // Check that loading is gone
    expect(screen.queryByText('Analyzing player stats...')).not.toBeInTheDocument();
    expect(generateButton).not.toBeDisabled();
  });

  it('handles and displays an error from the AI flow', async () => {
    const errorMessage = 'Not enough players with match experience.';
    mockedGenerateDreamTeam.mockRejectedValue(new Error(errorMessage));
    const toastMock = require('@/hooks/use-toast').useToast().toast;

    render(<DreamTeamCard />);

    const generateButton = screen.getByRole('button', { name: /Generate Dream Team/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith({
        title: "Error Generating Team",
        description: errorMessage,
        variant: "destructive",
      });
    });

    // Ensure UI is back to initial state
    expect(screen.queryByText('Analyzing player stats...')).not.toBeInTheDocument();
    expect(screen.getByText('Your Dream Team awaits')).toBeInTheDocument();
  });
});
