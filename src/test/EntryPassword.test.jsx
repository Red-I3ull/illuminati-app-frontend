
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import EntryPassword from '../pages/EntryPassword';
import api from '../axiosConfig.js';

const mockNavigate = vi.fn();

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../axiosConfig.js', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('EntryPassword Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <EntryPassword />
      </BrowserRouter>,
    );
  };

  it('renders the component with all elements', () => {
    renderComponent();

    expect(screen.getByLabelText(/enter password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    expect(screen.getByAltText(/abstract artwork/i)).toBeInTheDocument();
  });

  it('updates password input value on change', async () => {
    const user = userEvent.setup();
    renderComponent();

    const passwordInput = screen.getByLabelText(/enter password/i);
    await user.type(passwordInput, 'testpassword');

    expect(passwordInput).toHaveValue('testpassword');
  });

  it('shows error when password is empty', async () => {
    const user = userEvent.setup();
    renderComponent();

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password cannot be empty/i)).toBeInTheDocument();
    });
  });

  it('shows error when password is less than 8 characters', async () => {
    const user = userEvent.setup();
    renderComponent();

    const passwordInput = screen.getByLabelText(/enter password/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });

    await user.type(passwordInput, 'short');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Incorrect')).toBeInTheDocument();
    });
  });

  it('submits form successfully with valid password', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({
      status: 200,
      data: { success: true },
    });

    renderComponent();

    const passwordInput = screen.getByLabelText(/enter password/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });

    await user.type(passwordInput, 'validpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/verify-entry-password/', {
        password: 'validpassword',
      });
      expect(localStorage.getItem('entryPasswordVerified')).toBe('true');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('shows error message when API returns error', async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValueOnce({
      response: {
        status: 401,
        data: { error: 'Incorrect password' },
      },
    });

    renderComponent();

    const passwordInput = screen.getByLabelText(/enter password/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });

    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Incorrect password')).toBeInTheDocument();
    });
  });

  it('shows default error message when API returns no specific error', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({
      status: 200,
      data: { success: false },
    });

    renderComponent();

    const passwordInput = screen.getByLabelText(/enter password/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });

    await user.type(passwordInput, 'somepassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Incorrect password')).toBeInTheDocument();
    });
  });

  it('shows connection error when fetch fails', async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValueOnce(new Error('Network error'));

    renderComponent();

    const passwordInput = screen.getByLabelText(/enter password/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });

    await user.type(passwordInput, 'validpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/connection error. please try again/i),
      ).toBeInTheDocument();
    });
  });

  it('shows loading state during form submission', async () => {
    const user = userEvent.setup();
    api.post.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    renderComponent();

    const passwordInput = screen.getByLabelText(/enter password/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });

    await user.type(passwordInput, 'validpassword');
    await user.click(submitButton);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    expect(passwordInput).toBeDisabled();
  });

  it('clears previous error on successful validation', async () => {
    const user = userEvent.setup();
    renderComponent();

    const passwordInput = screen.getByLabelText(/enter password/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });

    // First submit with empty password
    await user.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/password cannot be empty/i)).toBeInTheDocument();
    });

    // Now submit with valid password
    api.post.mockResolvedValueOnce({
      status: 200,
      data: { success: true },
    });

    await user.clear(passwordInput);
    await user.type(passwordInput, 'validpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.queryByText(/password cannot be empty/i),
      ).not.toBeInTheDocument();
    });
  });

  it('applies error border class when there is an error', async () => {
    const user = userEvent.setup();
    renderComponent();

    const passwordInput = screen.getByLabelText(/enter password/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });

    await user.click(submitButton);

    await waitFor(() => {
      expect(passwordInput).toHaveClass('border-red-500');
    });
  });
});
