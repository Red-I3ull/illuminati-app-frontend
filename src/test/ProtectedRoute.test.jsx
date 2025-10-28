import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

const TestChild = () => <div>Protected Content</div>;
const HomePage = () => <div>Home Page</div>;

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('redirects to home page when entryPasswordVerified is not set', () => {
    localStorage.removeItem('entryPasswordVerified');

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <TestChild />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to home page when entryPasswordVerified is false', () => {
    localStorage.setItem('entryPasswordVerified', 'false');

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <TestChild />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to home page when entryPasswordVerified is null', () => {
    localStorage.setItem('entryPasswordVerified', 'null');

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <TestChild />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to home page when entryPasswordVerified is empty string', () => {
    localStorage.setItem('entryPasswordVerified', '');

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <TestChild />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when entryPasswordVerified is true', () => {
    localStorage.setItem('entryPasswordVerified', 'true');

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <TestChild />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Home Page')).not.toBeInTheDocument();
  });

  it('checks localStorage value strictly equals to "true"', () => {
    localStorage.setItem('entryPasswordVerified', 'True');

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <TestChild />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders multiple children when verified', () => {
    localStorage.setItem('entryPasswordVerified', 'true');

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>First Child</div>
                <div>Second Child</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('First Child')).toBeInTheDocument();
    expect(screen.getByText('Second Child')).toBeInTheDocument();
  });

  it('renders complex child components when verified', () => {
    const ComplexChild = () => (
      <div>
        <h1>Title</h1>
        <p>Description</p>
        <button>Action</button>
      </div>
    );

    localStorage.setItem('entryPasswordVerified', 'true');

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <ComplexChild />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('correctly reads from localStorage on mount', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
    localStorage.setItem('entryPasswordVerified', 'true');

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <TestChild />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(getItemSpy).toHaveBeenCalledWith('entryPasswordVerified');
    expect(screen.getByText('Protected Content')).toBeInTheDocument();

    getItemSpy.mockRestore();
  });

  it('passes children prop correctly', () => {
    localStorage.setItem('entryPasswordVerified', 'true');

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <TestChild />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
