import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EntryPassword from '../pages/EntryPassword';

const mockNavigate = vi.fn();

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <EntryPassword />
    </BrowserRouter>
  );
};

describe('EntryPassword Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the component with all elements', () => {
    renderComponent();

    expect(screen.getByLabelText(/enter password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    expect(screen.getByAltText(/abstract artwork/i)).toBeInTheDocument();
  });

  it('updates password input value on change', () => {
    renderComponent();

    const passwordInput = screen.getByLabelText(/enter password/i);
    fireEvent.change(passwordInput, { target: { value: 'testpassword123' } });

    expect(passwordInput.value).toBe('testpassword123');
  });

  it('shows error when password is empty', async () => {
    renderComponent();

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password cannot be empty/i)).toBeInTheDocument();
    });
  });

  it('shows error when password is less than 8 characters', async () => {
    renderComponent();

    const passwordInput = screen.getByLabelText(/enter password/i);
    fireEvent.change(passwordInput, { target: { value: 'short' } });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/inccorect/i)).toBeInTheDocument();
    });
  });

  it('submits form successfully with valid password', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    );

    renderComponent();

    const passwordInput = screen.getByLabelText(/enter password/i);
    fireEvent.change(passwordInput, { target: { value: 'validpassword123' } });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/verify-entry-password/',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: 'validpassword123' }),
        })
      );
    });

    await waitFor(() => {
      expect(localStorage.getItem('entryPasswordVerified')).toBe('true');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('shows error message when API returns error', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ success: false, error: 'Incorrect password' }),
      })
    );

    renderComponent();

    const passwordInput = screen.getByLabelText(/enter password/i);
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/incorrect password/i)).toBeInTheDocument();
    });
  });

  it('shows default error message when API returns no specific error', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ success: false }),
      })
    );

    renderComponent();

    const passwordInput = screen.getByLabelText(/enter password/i);
    fireEvent.change(passwordInput, { target: { value: 'somepassword123' } });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/incorrect password/i)).toBeInTheDocument();
    });
  });

  it('shows connection error when fetch fails', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

    renderComponent();

    const passwordInput = screen.getByLabelText(/enter password/i);
    fireEvent.change(passwordInput, { target: { value: 'validpassword123' } });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/connection error/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during form submission', async () => {
    global.fetch = vi.fn(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve({ success: true }),
              }),
            100
          )
        )
    );

    renderComponent();

    const passwordInput = screen.getByLabelText(/enter password/i);
    fireEvent.change(passwordInput, { target: { value: 'validpassword123' } });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    expect(passwordInput).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText(/submit/i)).toBeInTheDocument();
    });
  });

  it('clears previous error on successful validation', async () => {
    renderComponent();

    const passwordInput = screen.getByLabelText(/enter password/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });

    // First submit with empty password
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/password cannot be empty/i)).toBeInTheDocument();
    });

    // Now submit with valid password
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    );

    fireEvent.change(passwordInput, { target: { value: 'validpassword123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText(/password cannot be empty/i)).not.toBeInTheDocument();
    });
  });

  it('applies error border class when there is an error', async () => {
    renderComponent();

    const passwordInput = screen.getByLabelText(/enter password/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(passwordInput).toHaveClass('border-red-500');
    });
  });
});
