import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ProfilePage from '../pages/ProfilePage';
import api from '../axiosConfig.js';
import { toast } from 'react-toastify';

// mock modules
vi.mock('../axiosConfig.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('../components/Navigation', () => ({
  default: () => <div data-testid="navigation">Navigation</div>,
}));

// test suite
describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderComponent = async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <ProfilePage />
        </BrowserRouter>,
      );
    });
  };

  const mockVotesResponse = [
    {
      id: 1,
      vote_type: { name: 'BAN' },
      target_username: 'tester',
      time_remaining_seconds: 3600,
      vote_counts: { total_cast: 5, agree: 3, disagree: 2 },
      current_user_vote: null,
    },
    {
      id: 2,
      vote_type: { name: 'MUTE' },
      target_username: 'anotherUser',
      time_remaining_seconds: 7200,
      vote_counts: { total_cast: 3, agree: 1, disagree: 2 },
      current_user_vote: 'AGREE',
    },
  ];

  // Basic rendering
  it('renders the profile page with navigation', async () => {
    api.get.mockResolvedValueOnce({ data: [] });

    await renderComponent();

    expect(screen.getByTestId('navigation')).toBeInTheDocument();
    expect(screen.getByText('Your Profile & Votes')).toBeInTheDocument();
    expect(screen.getByText('Active Voting')).toBeInTheDocument();
    expect(screen.getByText('Rank Promotion')).toBeInTheDocument();
  });

  it('displays loading state while fetching votes', async () => {
    api.get.mockImplementationOnce(() => new Promise(() => {})); // never resolves
    await renderComponent();

    expect(screen.getByText('Loading active votes...')).toBeInTheDocument();
  });

  // Active votes display
  it('displays active votes when available', async () => {
    api.get.mockResolvedValueOnce({ data: [mockVotesResponse[0]] });
    await renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/BAN on: tester/i)).toBeInTheDocument();
    });
  });

  it('displays vote counts correctly', async () => {
    api.get.mockResolvedValueOnce({ data: [mockVotesResponse[0]] });
    await renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Votes Cast:/)).toBeInTheDocument();
      expect(screen.getByText(/Agree: 3 \/ Disagree: 2/)).toBeInTheDocument();
    });
  });

  it('shows message when no active votes are available', async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    await renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText('No active votes available for you at the moment.'),
      ).toBeInTheDocument();
    });
  });

  it('handles error when fetching votes fails', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    api.get.mockRejectedValueOnce(new Error('Network error'));

    await renderComponent();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load active votes.');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  // Voting actions
  it('allows user to cast an AGREE vote successfully', async () => {
    api.get.mockResolvedValueOnce({ data: [mockVotesResponse[0]] });
    api.post.mockResolvedValueOnce({
      data: { ...mockVotesResponse[0], current_user_vote: 'AGREE' },
    });

    const user = userEvent.setup();
    await renderComponent();

    const agreeButton = await screen.findByText('Agree');
    await user.click(agreeButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/votes/1/cast-vote/', {
        decision: 'AGREE',
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Vote 'AGREE' cast successfully!",
      );
    });
  });

  it('allows user to cast a DISAGREE vote successfully', async () => {
    api.get.mockResolvedValueOnce({ data: [mockVotesResponse[0]] });
    api.post.mockResolvedValueOnce({
      data: { ...mockVotesResponse[0], current_user_vote: 'DISAGREE' },
    });

    const user = userEvent.setup();
    await renderComponent();

    const disagreeButton = await screen.findByText('Disagree');
    await user.click(disagreeButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/votes/1/cast-vote/', {
        decision: 'DISAGREE',
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Vote 'DISAGREE' cast successfully!",
      );
    });
  });

  it('shows voted badge when user has already voted', async () => {
    api.get.mockResolvedValueOnce({ data: [mockVotesResponse[1]] });
    await renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Voted: AGREE')).toBeInTheDocument();
      expect(screen.queryByText('Agree')).not.toBeInTheDocument();
      expect(screen.queryByText('Disagree')).not.toBeInTheDocument();
    });
  });

  // Error handling on vote cast
  it('handles vote casting error with detail message', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    api.get.mockResolvedValueOnce({ data: [mockVotesResponse[0]] });
    api.post.mockRejectedValueOnce({
      response: { data: { detail: 'You have already voted' } },
    });

    const user = userEvent.setup();
    await renderComponent();

    const agreeButton = await screen.findByText('Agree');
    await user.click(agreeButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('You have already voted');
    });

    consoleErrorSpy.mockRestore();
  });

  it('handles vote casting error without detail message', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    api.get.mockResolvedValueOnce({ data: [mockVotesResponse[0]] });
    api.post.mockRejectedValueOnce(new Error('Network error'));

    const user = userEvent.setup();
    await renderComponent();

    const agreeButton = await screen.findByText('Agree');
    await user.click(agreeButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to cast vote. You might have already voted or the vote ended.',
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('updates vote state after successful vote cast', async () => {
    api.get.mockResolvedValueOnce({ data: [mockVotesResponse[0]] });
    api.post.mockResolvedValueOnce({
      data: {
        ...mockVotesResponse[0],
        current_user_vote: 'AGREE',
        vote_counts: { total_cast: 6, agree: 4, disagree: 2 },
      },
    });

    const user = userEvent.setup();
    await renderComponent();

    const agreeButton = await screen.findByText('Agree');
    await user.click(agreeButton);

    await waitFor(() => {
      expect(screen.getByText('Voted: AGREE')).toBeInTheDocument();
      expect(screen.getByText(/Agree: 4 \/ Disagree: 2/)).toBeInTheDocument();
    });
  });

  it('displays closed badge when time expires', async () => {
    const expiredVote = {
      ...mockVotesResponse[0],
      time_remaining_seconds: 0,
    };
    api.get.mockResolvedValueOnce({ data: [expiredVote] });

    await renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Closed')).toBeInTheDocument();
    });
  });

  // Promotion eligibility
  it('shows eligible message for MASON role', async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    const masonUser = { role: 'MASON', last_promotion_attempt: null };
    localStorage.setItem('user', JSON.stringify(masonUser));

    await renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText('You are eligible to request promotion.'),
      ).toBeInTheDocument();
      expect(screen.getByText('Promote to Silver')).toBeInTheDocument();
    });
  });

  it('shows eligible message for SILVER role', async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    const silverUser = { role: 'SILVER', last_promotion_attempt: null };
    localStorage.setItem('user', JSON.stringify(silverUser));

    await renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText('You are eligible to request promotion.'),
      ).toBeInTheDocument();
      expect(screen.getByText('Promote to Golden')).toBeInTheDocument();
    });
  });

  it('shows cooldown message when promotion attempted recently', async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 10);
    const userWithCooldown = {
      role: 'MASON',
      last_promotion_attempt: recentDate.toISOString(),
    };
    localStorage.setItem('user', JSON.stringify(userWithCooldown));

    await renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText(/You can attempt promotion again after/),
      ).toBeInTheDocument();
    });
  });

  it('shows eligible for GOLDEN after 42 days', async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 50);
    const goldenUser = {
      role: 'GOLDEN',
      role_assigned_at: oldDate.toISOString(),
      last_promotion_attempt: null,
    };
    localStorage.setItem('user', JSON.stringify(goldenUser));

    await renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText('You are eligible to request promotion to Architect.'),
      ).toBeInTheDocument();
      expect(screen.getByText('Promote to Architect')).toBeInTheDocument();
    });
  });

  it('shows waiting message for GOLDEN under 42 days', async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 10);
    const goldenUser = {
      role: 'GOLDEN',
      role_assigned_at: recentDate.toISOString(),
      last_promotion_attempt: null,
    };
    localStorage.setItem('user', JSON.stringify(goldenUser));

    await renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText(/You must be Golden for 42 days/),
      ).toBeInTheDocument();
    });
  });

  it('shows cannot promote message for ARCHITECT role', async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    const architectUser = { role: 'ARCHITECT', last_promotion_attempt: null };
    localStorage.setItem('user', JSON.stringify(architectUser));

    await renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText('Your role cannot be promoted.'),
      ).toBeInTheDocument();
    });
  });

  // Promotion action
  it('successfully initiates promotion vote', async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    const promotionResponse = {
      id: 3,
      vote_type: { name: 'PROMOTE_SILVER' },
      target_username: null,
      time_remaining_seconds: 7200,
      vote_counts: { total_cast: 0, agree: 0, disagree: 0 },
      current_user_vote: null,
    };
    api.post.mockResolvedValueOnce({ data: promotionResponse });

    const masonUser = { role: 'MASON', last_promotion_attempt: null };
    localStorage.setItem('user', JSON.stringify(masonUser));

    const user = userEvent.setup();
    await renderComponent();

    const promoteButton = await screen.findByText('Promote to Silver');
    await user.click(promoteButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/votes/promote/');
      expect(toast.success).toHaveBeenCalledWith(
        'Promotion vote to SILVER started!',
      );
    });
  });

  it('handles promotion vote error', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    api.get.mockResolvedValueOnce({ data: [] });
    api.post.mockRejectedValueOnce({
      response: { data: { detail: 'Not eligible for promotion' } },
    });

    const masonUser = { role: 'MASON', last_promotion_attempt: null };
    localStorage.setItem('user', JSON.stringify(masonUser));

    const user = userEvent.setup();
    await renderComponent();

    const promoteButton = await screen.findByText('Promote to Silver');
    await user.click(promoteButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Not eligible for promotion');
    });

    consoleErrorSpy.mockRestore();
  });

  it('disables promotion button during submission', async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    api.post.mockImplementationOnce(() => new Promise(() => {}));

    const masonUser = { role: 'MASON', last_promotion_attempt: null };
    localStorage.setItem('user', JSON.stringify(masonUser));

    const user = userEvent.setup();
    await renderComponent();

    const promoteButton = await screen.findByText('Promote to Silver');
    await user.click(promoteButton);

    await waitFor(() => {
      expect(screen.getByText('Starting Vote...')).toBeInTheDocument();
    });
  });

  it('updates localStorage after successful promotion attempt', async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    const promotionResponse = {
      id: 3,
      vote_type: { name: 'PROMOTE_SILVER' },
      target_username: null,
      time_remaining_seconds: 7200,
      vote_counts: { total_cast: 0, agree: 0, disagree: 0 },
      current_user_vote: null,
    };
    api.post.mockResolvedValueOnce({ data: promotionResponse });

    const masonUser = { role: 'MASON', last_promotion_attempt: null };
    localStorage.setItem('user', JSON.stringify(masonUser));

    const user = userEvent.setup();
    await renderComponent();

    const promoteButton = await screen.findByText('Promote to Silver');
    await user.click(promoteButton);

    await waitFor(() => {
      const updatedUser = JSON.parse(localStorage.getItem('user'));
      expect(updatedUser.last_promotion_attempt).toBeTruthy();
    });
  });

  // User data handling
  it('handles missing user data in localStorage', async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    localStorage.removeItem('user');

    await renderComponent();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'User data not found. Please log in.',
      );
    });
  });

  it('handles invalid JSON in localStorage', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    api.get.mockResolvedValueOnce({ data: [] });
    localStorage.setItem('user', 'invalid json');

    await renderComponent();

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error parsing user data',
        expect.any(Error),
      );
    });

    consoleErrorSpy.mockRestore();
  });
});
