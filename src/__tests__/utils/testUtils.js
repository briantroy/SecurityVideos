import { render } from '@testing-library/react';

describe('Test Utils', () => {
  test('dummy test to satisfy Jest', () => {
    expect(true).toBe(true);
  });
});

// Helper to create mock event data
export const createMockEvent = (overrides = {}) => ({
  object_key: 'test-key-' + Math.random(),
  event_ts: Date.now(),
  camera_name: 'Test Camera',
  event_type: 'motion',
  thumbnail_uri: 'https://example.com/thumbnail.jpg',
  uri: 'https://example.com/video.mp4',
  video_name: 'test-video.mp4',
  ...overrides
});

// Helper to create mock event groups
export const createMockEventGroup = (count = 1, overrides = {}) => {
  return Array.from({ length: count }, (_, i) =>
    createMockEvent({
      object_key: `test-key-${i}`,
      event_ts: Date.now() + (i * 1000),
      ...overrides
    })
  );
};

// Helper to mock fetch responses
export const mockFetchResponse = (data, options = {}) => {
  const { ok = true, status = 200, headers = {} } = options;

  return Promise.resolve({
    ok,
    status,
    headers,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data))
  });
};

// Helper to mock fetch with multiple responses
export const mockFetchSequence = (...responses) => {
  responses.forEach((response, index) => {
    fetch.mockImplementationOnce(() => response);
  });
};

// Custom render function that can include providers if needed
export const renderWithProviders = (component, options = {}) => {
  return render(component, options);
};

// Helper to wait for async operations in tests
export const waitForAsync = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));