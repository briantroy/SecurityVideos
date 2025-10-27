import { getCameraList, getEvents, getViewedVideos } from '../api';

// Mock fetch globally
global.fetch = jest.fn();

describe('API functions', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('getCameraList', () => {
    test('fetches camera list successfully', async () => {
      const mockResponse = {
        cameras: ['Front Door', 'Back Yard'],
        filters: { outdoor: ['Front Door'] }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await getCameraList();

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    test('throws error when API call fails', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(getCameraList()).rejects.toThrow('API call failed with status: 500');
    });
  });

  describe('getEvents', () => {
    test('fetches latest events with default parameters', async () => {
      const mockResponse = { Items: [], LastEvaluatedKey: null };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await getEvents('latest');

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    test('fetches events for specific camera', async () => {
      const mockResponse = { Items: [] };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await getEvents('Front Door');

      expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('fetches viewed videos when userId provided', async () => {
      const mockEventsResponse = { Items: [] };
      const mockViewedResponse = {
        userId: 'test@example.com',
        timestamp: '2025-01-27T14:35:22.000Z',
        viewedEvents: ['event1'],
        viewedVideos: ['video1'],
        viewedEventsCount: 1,
        viewedVideosCount: 1
      };

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockEventsResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockViewedResponse
        });

      const result = await getEvents('latest', {}, 'test@example.com');

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result._serverViewedData).toBeDefined();
      expect(result._serverViewedData.viewedEvents).toEqual(['event1']);
      expect(result._serverViewedData.viewedVideos).toEqual(['video1']);
    });

    test('handles 404 when user has no viewed videos yet', async () => {
      const mockEventsResponse = { Items: [] };

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockEventsResponse
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404
        });

      const result = await getEvents('latest', {}, 'test@example.com');

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result._serverViewedData).toBeUndefined();
    });
  });

  describe('getViewedVideos', () => {
    test('fetches viewed videos successfully', async () => {
      const mockResponse = {
        userId: 'test@example.com',
        timestamp: '2025-01-27T14:35:22.000Z',
        viewedEvents: ['event1'],
        viewedVideos: ['video1'],
        viewedEventsCount: 1,
        viewedVideosCount: 1
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const result = await getViewedVideos('test@example.com');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('viewed-videos'),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include'
        })
      );
      expect(result).toEqual(mockResponse);
    });

    test('returns null when user not found (404)', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const result = await getViewedVideos('test@example.com');

      expect(result).toBeNull();
    });

    test('throws error when request fails with non-404 status', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'userId is required' })
      });

      await expect(
        getViewedVideos('test@example.com')
      ).rejects.toThrow('Get viewed videos failed with status: 400');
    });
  });
});