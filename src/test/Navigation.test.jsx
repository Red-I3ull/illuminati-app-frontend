import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Navigation from '../Components/Navigation';
import { setAuthToken } from '../axiosConfig.js';
import { toast } from 'react-toastify';

vi.mock('../axiosConfig.js', () => ({
  setAuthToken: vi.fn(),
}));

vi.mock('react-toastify', () => ({
  toast: {
    info: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  const renderNavigation = (userRole = null) => {
    if (userRole) {
      localStorage.setItem('user', JSON.stringify({ role: userRole }));
    }
    return render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>,
    );
  };

  it('renders navigation with logo', () => {
    renderNavigation();
    const logo = screen.getByAltText('Logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src');
  });

  it('renders navigation links', () => {
    renderNavigation('GOLDEN');
    
    expect(screen.getByText('Map Page')).toBeInTheDocument();
    expect(screen.getByText('My Profile')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Log Out')).toBeInTheDocument();
  });

  it('clears storage and navigates on logout', async () => {
    const user = userEvent.setup();
    renderNavigation();

    const logoutButton = screen.getByText('Log Out');
    await user.click(logoutButton);

    expect(setAuthToken).toHaveBeenCalledWith(null);
    expect(localStorage.getItem('user')).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('/');
    expect(toast.info).toHaveBeenCalledWith('You have been logged out.');
  });

  it('shows Dashboard link for GOLDEN role', () => {
    renderNavigation('GOLDEN');
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('shows Dashboard link for ARCHITECT role', () => {
    renderNavigation('ARCHITECT');
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('does not show Dashboard link for other roles', () => {
    renderNavigation('USER');
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('handles invalid user data in localStorage gracefully', () => {
    localStorage.setItem('user', 'invalid-json');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderNavigation();
    
    expect(screen.getByText('Map Page')).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});
