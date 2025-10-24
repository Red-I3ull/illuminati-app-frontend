import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import userEvent from '@testing-library/user-event';
import Navigation from './Navigation';

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Navigation Component', () => {
  it('renders navigation with logo', () => {
    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>,
    );

    expect(screen.getByAltText('Logo')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>,
    );

    expect(screen.getByText('Map Page')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Log Out')).toBeInTheDocument();
  });

  it('clears storage and navigates on logout', async () => {
    const user = userEvent.setup();

    localStorage.setItem('test', 'data');
    sessionStorage.setItem('test', 'data');

    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>,
    );

    const logoutButton = screen.getByText('Log Out');
    await user.click(logoutButton);

    expect(localStorage.getItem('test')).toBeNull();
    expect(sessionStorage.getItem('test')).toBeNull();

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
