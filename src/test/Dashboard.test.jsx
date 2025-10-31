import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import api from '../axiosConfig.js';
import { toast } from 'react-toastify';

vi.mock('../axiosConfig.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    defaults: {
      headers: {
        common: {},
      },
    },
  },
}));

vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../components/Navigation', () => ({
  default: () => <div data-testid="navigation">Navigation</div>,
}));

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('authToken', 'test-token');
  });

  const renderComponent = (isInquisitor = false) => {
    const user = {
      is_inquisitor: isInquisitor,
      role: isInquisitor ? 'GOLDEN' : 'USER',
    };
    localStorage.setItem('user', JSON.stringify(user));

    return render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );
  };

  const mockUsers = [
    { id: 1, email: 'user1@test.com', username: 'user1', role: 'USER' },
    { id: 2, email: 'user2@test.com', username: 'user2', role: 'GOLDEN' },
  ];

  it('renders dashboard with navigation', () => {
    renderComponent();
    expect(screen.getByTestId('navigation')).toBeInTheDocument();
  });

  it('displays user dashboard for non-inquisitor', () => {
    renderComponent(false);
    expect(screen.getByText('User Dashboard')).toBeInTheDocument();
  });

  it('displays inquisitor dashboard for inquisitor', async () => {
    api.get.mockResolvedValueOnce({ data: mockUsers });
    renderComponent(true);

    await waitFor(() => {
      expect(screen.getByText('Inquisitor Dashboard')).toBeInTheDocument();
    });
  });

  it('fetches and displays users for inquisitor', async () => {
    api.get.mockResolvedValueOnce({ data: mockUsers });
    renderComponent(true);

    await waitFor(() => {
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
      expect(screen.getByText('user2@test.com')).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching users', async () => {
    api.get.mockImplementationOnce(() => new Promise(() => {}));
    renderComponent(true);

    await waitFor(() => {
      expect(screen.getByText('Loading users...')).toBeInTheDocument();
    });
  });

  it('handles user selection', async () => {
    api.get.mockResolvedValueOnce({ data: mockUsers });
    const user = userEvent.setup();
    renderComponent(true);

    await waitFor(() => {
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    });

    const radioButtons = screen.getAllByRole('radio');
    await user.click(radioButtons[0]);

    expect(radioButtons[0]).toBeChecked();
  });

  it('nominates user for ban', async () => {
    api.get.mockResolvedValueOnce({ data: mockUsers });
    api.post.mockResolvedValueOnce({
      data: { id: 1, target_username: 'user1' },
    });

    const user = userEvent.setup();
    renderComponent(true);

    await waitFor(() => {
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    });

    const radioButtons = screen.getAllByRole('radio');
    await user.click(radioButtons[0]);

    const nominateButton = screen.getByText('Start Ban Voting');
    await user.click(nominateButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/votes/nominate-ban/', {
        target_user_id: 1,
      });
      expect(toast.success).toHaveBeenCalledWith(
        'User user1 nominated. Voting started (ID: 1)',
      );
    });
  });

  it('handles nomination error', async () => {
    api.get.mockResolvedValueOnce({ data: mockUsers });
    api.post.mockRejectedValueOnce({
      response: { data: { detail: 'Already nominated' } },
    });

    const user = userEvent.setup();
    renderComponent(true);

    await waitFor(() => {
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    });

    const radioButtons = screen.getAllByRole('radio');
    await user.click(radioButtons[0]);

    const nominateButton = screen.getByText('Start Ban Voting');
    await user.click(nominateButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Already nominated');
    });
  });

  it('displays invite form', () => {
    renderComponent();
    expect(
      screen.getByPlaceholderText('Enter user email to invite'),
    ).toBeInTheDocument();
    expect(screen.getByText('Send Invite')).toBeInTheDocument();
  });

  it('handles invite form submission with valid email', async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    renderComponent();

    const emailInput = screen.getByPlaceholderText(
      'Enter user email to invite',
    );
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByText('Send Invite');
    await user.click(submitButton);

    expect(consoleSpy).toHaveBeenCalledWith('Invite sent to: test@example.com');
    expect(emailInput).toHaveValue('');

    consoleSpy.mockRestore();
  });

  it('shows architect actions for architect role', () => {
    const user = { is_inquisitor: false, role: 'ARCHITECT' };
    localStorage.setItem('user', JSON.stringify(user));

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    expect(screen.getByText('Architect Actions')).toBeInTheDocument();
    expect(screen.getByText('DB Backup (Not Implemented)')).toBeInTheDocument();
  });

  it('displays compromised button', async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    renderComponent();

    const compromisedButton = screen.getByText('WE ARE COMPROMISED');
    expect(compromisedButton).toBeInTheDocument();

    await user.click(compromisedButton);

    expect(consoleSpy).toHaveBeenCalledWith('compromised');
    expect(toast.warn).toHaveBeenCalledWith('Compromised button clicked!');

    consoleSpy.mockRestore();
  });

  it('shows placeholder image for non-inquisitor', () => {
    renderComponent(false);
    const image = screen.getByAltText('Masonic Scales');
    expect(image).toBeInTheDocument();
  });

  it('handles authentication error when fetching users', async () => {
    api.get.mockRejectedValueOnce({ response: { status: 401 } });
    renderComponent(true);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Authentication error. Please log in again.',
      );
    });
  });

  it('disables nominate button when no user is selected', async () => {
    api.get.mockResolvedValueOnce({ data: mockUsers });
    renderComponent(true);

    await waitFor(() => {
      const nominateButton = screen.getByText('Start Ban Voting');
      expect(nominateButton).toBeDisabled();
    });
  });
});
