import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

// Mock the API module
jest.mock('../api', () => ({
  getCameraList: jest.fn(),
  API_HOST: 'https://api.security-videos.brianandkelly.ws/v4'
}));

// Mock child components to simplify testing
jest.mock('../components/Sidebar', () => ({ onSignOut, isOpen }) => (
  <div data-testid="sidebar">
    <button onClick={onSignOut}>Sign Out</button>
    <span>Sidebar {isOpen ? 'Open' : 'Closed'}</span>
  </div>
));

jest.mock('../components/Timeline', () => ({ scope }) => (
  <div data-testid="timeline">Timeline: {scope}</div>
));

jest.mock('../components/MediaViewer', () => ({ event }) => (
  <div data-testid="media-viewer">
    {event ? 'Media Selected' : 'No Media'}
  </div>
));

describe('App', () => {
  const { getCameraList } = require('../api');

  beforeEach(() => {
    localStorage.clear();
    fetch.mockClear();
    getCameraList.mockClear();
  });

  test('shows login screen when not authenticated', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Security Camera Viewer')).toBeInTheDocument();
      expect(screen.getByText('Please sign in to continue.')).toBeInTheDocument();
    });
  });

  test('shows main app when authenticated', async () => {
    const mockUserData = {
      name: 'Test User',
      email: 'test@brianandkelly.ws',
      picture: 'https://example.com/pic.jpg'
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserData
    });

    getCameraList.mockResolvedValueOnce({
      cameras: ['Front Door'],
      filters: {}
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('timeline')).toBeInTheDocument();
      expect(screen.getByTestId('media-viewer')).toBeInTheDocument();
    });
  });

  test('handles successful Google login', async () => {
    const mockUserData = {
      name: 'Test User',
      email: 'test@brianandkelly.ws',
      picture: 'https://example.com/pic.jpg'
    };

    fetch
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData
      });

    getCameraList.mockResolvedValueOnce({
      cameras: ['Front Door'],
      filters: {}
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('google-login')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('google-login'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'https://api.security-videos.brianandkelly.ws/v4/auth/google',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ id_token: 'mock-token' })
        })
      );
    });
  });

  test('handles sign out', async () => {
    const mockUserData = {
      name: 'Test User',
      email: 'test@brianandkelly.ws',
      picture: 'https://example.com/pic.jpg'
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserData
    });

    getCameraList.mockResolvedValueOnce({
      cameras: ['Front Door'],
      filters: {}
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    fetch.mockResolvedValueOnce({ ok: true });

    fireEvent.click(screen.getByText('Sign Out'));

    await waitFor(() => {
      expect(screen.getByText('Please sign in to continue.')).toBeInTheDocument();
    });
  });
});