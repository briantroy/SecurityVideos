import { getCameraList, getEvents, saveViewedVideos } from '../api';

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

    test('auto-saves viewed videos when viewedData provided', async () => {
      const mockResponse = { Items: [] };
      const mockSaveResponse = { success: true, wasMerged: false };

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSaveResponse
        });

      const viewedData = {
        userId: 'test@example.com',
        viewedEvents: ['event1'],
        viewedVideos: ['video1']
      };

      await getEvents('latest', {}, viewedData);

      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('saveViewedVideos', () => {
    test('saves viewed videos successfully', async () => {
      const mockResponse = { success: true, wasMerged: false };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await saveViewedVideos('test@example.com', ['event1'], ['video1']);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('viewed-videos'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include'
        })
      );
      expect(result).toEqual(mockResponse);
    });

    test('throws error when save fails', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      await expect(
        saveViewedVideos('test@example.com', [], [])
      ).rejects.toThrow('Save viewed videos failed with status: 400');
    });
  });
});