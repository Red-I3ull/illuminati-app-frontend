import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, test, expect, beforeEach} from 'vitest';
import MapPage from '../pages/Main.jsx';
import api from '../axiosConfig.js';
import { toast } from 'react-toastify';

vi.mock('react-leaflet', () => ({
  // eslint-disable-next-line react/prop-types
  MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
  TileLayer: () => <div data-testid="tilelayer" />, // eslint-disable-next-line react/prop-types
  Marker: ({ children }) => <div data-testid="marker">{children}</div>, // eslint-disable-next-line react/prop-types
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  useMapEvents: (handlers) => {
    if (handlers.click) {
      handlers.click({ latlng: { lat: 11, lng: 22 } });
    }
  },
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../axiosConfig.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../components/Navigation', () => ({
  default: () => <nav data-testid="navigation" />,
}));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

//tests
test('renders map and navigation', async () => {
  api.get.mockResolvedValueOnce({ data: [] });

  render(<MapPage />);

  expect(screen.getByTestId('navigation')).toBeInTheDocument();
  expect(screen.getByTestId('map')).toBeInTheDocument();

  await waitFor(() => expect(api.get).toHaveBeenCalledWith('markers/'));
});

test('fetches and displays markers on mount', async () => {
  api.get.mockResolvedValueOnce({
    data: [{ id: 1, lat: 10, lng: 20, name: 'ghost', user: 1 }],
  });
  render(<MapPage />);
  await waitFor(() => expect(screen.getByTestId('marker')).toBeInTheDocument());
});

test('creates a marker when handleMapClick is called', async () => {
  api.get.mockResolvedValueOnce({ data: [] });
  api.post.mockResolvedValueOnce({
    data: { lat: 11, lng: 22, name: 'ufo', user: 1 },
  });

  render(<MapPage />);

  await waitFor(() => {
    expect(api.post).toHaveBeenCalledWith('markers/', {
      lat: 11,
      lng: 22,
      name: 'other',
    });
  });

  await waitFor(() => {
    expect(toast.success).toHaveBeenCalledWith('You added a new marker!');
  });
});

test('handles marker deletion', async () => {
  api.get.mockResolvedValueOnce({
    data: [{ id: 2, lat: 30, lng: 40, name: 'bigfoot', user: 1 }],
  });
  api.delete.mockResolvedValueOnce({});

  const user = { role: 'GOLDEN' };
  localStorage.setItem('user', JSON.stringify(user));

  render(<MapPage />);

  const deleteButton = await screen.findByRole('button', {
    name: /Delete Marker/i,
  });
  fireEvent.click(deleteButton);

  await waitFor(() => expect(api.delete).toHaveBeenCalledWith('markers/2/'));
});

test('does not show delete button for basic USER role', async () => {
  api.get.mockResolvedValueOnce({
    data: [{ id: 2, lat: 30, lng: 40, name: 'bigfoot', user: 1 }],
  });
  render(<MapPage />);

  expect(
    screen.queryByRole('button', { name: /Delete Marker/i }),
  ).not.toBeInTheDocument();
});

test('shows toast error when user has no permission to create marker', async () => {
  api.get.mockResolvedValueOnce({ data: [] });
  api.post.mockRejectedValueOnce({ response: { status: 403 } });

  render(<MapPage />);
  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith(
      "You don't have permission to create a marker.",
    );
  });
});

test('logs error for other marker creation issues', async () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  api.get.mockResolvedValueOnce({ data: [] });
  api.post.mockRejectedValueOnce({ response: { status: 500 } });

  render(<MapPage />);

  await waitFor(() => {
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error creating marker:'),
      expect.any(Object),
    );
  });

  expect(toast.error).not.toHaveBeenCalledWith(
    "You don't have permission to create a marker.",
  );

  consoleSpy.mockRestore();
});
