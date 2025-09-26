# Testing Guide

This React application uses **Jest** and **React Testing Library** for comprehensive testing.

## Test Structure

```
src/
├── __tests__/
│   ├── App.test.js           # Main app integration tests
│   ├── api.test.js           # API function tests
│   └── utils/
│       └── testUtils.js      # Testing utilities and helpers
├── components/
│   └── __tests__/
│       ├── EventCard.test.js   # EventCard component tests
│       └── MediaViewer.test.js # MediaViewer component tests
└── setupTests.js             # Global test configuration
```

## Test Coverage

### Core Components
- **App.js**: Authentication flow, routing, state management
- **EventCard.js**: Event display, user interactions, viewing states
- **MediaViewer.js**: Video/image playback, navigation controls
- **api.js**: API calls, error handling, data fetching

### Test Types

1. **Unit Tests**: Individual component behavior
2. **Integration Tests**: Component interactions
3. **API Tests**: Network request mocking and validation

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test EventCard.test.js
```

## Key Testing Features

### Mocked Dependencies
- **localStorage**: Simulated for state persistence tests
- **IntersectionObserver**: Mocked for infinite scroll testing
- **fetch**: Global mock for API call testing
- **Google OAuth**: Simplified mock for authentication tests

### Test Utilities
- `createMockEvent()`: Generate realistic event data
- `createMockEventGroup()`: Create multi-event groups
- `mockFetchResponse()`: Easy API response mocking

### Component Testing Patterns

#### EventCard Tests
```javascript
// Basic rendering
expect(screen.getByText('Front Door')).toBeInTheDocument();

// User interactions
fireEvent.click(screen.getByText('Front Door').closest('.event-card'));

// State changes
expect(container.firstChild).toHaveClass('event-card selected');
```

#### MediaViewer Tests
```javascript
// Video element testing
const video = container.querySelector('video');
expect(video).toHaveAttribute('controls');

// Navigation testing
fireEvent.click(screen.getByText('Next'));
expect(screen.getByText('2 of 2')).toBeInTheDocument();
```

#### API Tests
```javascript
// Mock API response
fetch.mockResolvedValueOnce({
  ok: true,
  json: async () => mockResponse
});

// Verify API calls
expect(fetch).toHaveBeenCalledWith(
  expect.stringContaining('/v4/cameras'),
  expect.objectContaining({ method: 'GET' })
);
```

## Best Practices

### Test Organization
- Group related tests with `describe()` blocks
- Use descriptive test names that explain behavior
- Keep tests focused on single behaviors

### Mocking Strategy
- Mock external dependencies (APIs, localStorage, etc.)
- Use minimal mocks that preserve essential behavior
- Mock child components in integration tests

### Assertions
- Test user-visible behavior, not implementation details
- Use semantic queries (`getByRole`, `getByText`)
- Verify both positive and negative cases

### Async Testing
```javascript
// Wait for async operations
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// Handle promise-based APIs
await expect(apiFunction()).rejects.toThrow('Error message');
```

## Test Configuration

### setupTests.js
Global configuration including:
- Jest DOM matchers (`@testing-library/jest-dom`)
- localStorage mocking
- IntersectionObserver polyfill
- Global fetch mocking
- Google OAuth mocking

### Environment Variables
Tests run with `NODE_ENV=test` and include:
- JSDOM environment for DOM testing
- Automatic cleanup between tests
- Console warning suppression for expected errors

## Adding New Tests

1. **Component Tests**: Create `ComponentName.test.js` in `src/components/__tests__/`
2. **API Tests**: Add to `src/__tests__/api.test.js`
3. **Integration Tests**: Create in `src/__tests__/`
4. **Utilities**: Export helpers from `src/__tests__/utils/testUtils.js`

### Example Test Template
```javascript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ComponentName from '../ComponentName';

describe('ComponentName', () => {
  const defaultProps = {
    prop1: 'value1',
    onAction: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly', () => {
    render(<ComponentName {...defaultProps} />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  test('handles user interaction', () => {
    render(<ComponentName {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));
    expect(defaultProps.onAction).toHaveBeenCalled();
  });
});
```

## Continuous Integration

Tests are configured to run in CI environments with:
- `--watchAll=false` for single-run execution
- `--coverage` for coverage reporting
- `--silent` for clean output
- Exit code 0 on success for build pipelines

## Debugging Tests

```bash
# Run specific test with verbose output
npm test -- --verbose EventCard

# Debug failing tests
npm test -- --watch --verbose

# Check test coverage gaps
npm test -- --coverage --watchAll=false
```