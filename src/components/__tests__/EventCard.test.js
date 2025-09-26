import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EventCard from '../EventCard';

const mockEventGroup = [
  {
    object_key: 'test-key-1',
    event_ts: Date.now(),
    camera_name: 'Front Door',
    event_type: 'motion',
    thumbnail_uri: 'https://example.com/thumbnail.jpg'
  }
];

const mockMultiEventGroup = [
  ...mockEventGroup,
  {
    object_key: 'test-key-2',
    event_ts: Date.now() + 1000,
    camera_name: 'Back Yard',
    event_type: 'motion',
    thumbnail_uri: 'https://example.com/thumbnail2.jpg'
  }
];

describe('EventCard', () => {
  const defaultProps = {
    event: mockEventGroup,
    onSelectMedia: jest.fn(),
    isSelected: false,
    isSeen: false,
    seenVideos: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders event card with basic information', () => {
    render(<EventCard {...defaultProps} />);

    expect(screen.getByText('Front Door')).toBeInTheDocument();
    expect(screen.getByText('motion')).toBeInTheDocument();
    expect(screen.getByAltText('Event thumbnail')).toBeInTheDocument();
  });

  test('displays timestamp in locale format', () => {
    render(<EventCard {...defaultProps} />);

    const timestamp = new Date(mockEventGroup[0].event_ts).toLocaleString();
    expect(screen.getByText(timestamp)).toBeInTheDocument();
  });

  test('calls onSelectMedia when clicked', () => {
    const onSelectMedia = jest.fn();
    render(<EventCard {...defaultProps} onSelectMedia={onSelectMedia} />);

    fireEvent.click(screen.getByText('Front Door').closest('.event-card'));
    expect(onSelectMedia).toHaveBeenCalledWith(mockEventGroup);
  });

  test('applies selected class when isSelected is true', () => {
    const { container } = render(<EventCard {...defaultProps} isSelected={true} />);

    expect(container.firstChild).toHaveClass('event-card selected');
  });

  test('applies seen class when isSeen is true and not selected', () => {
    const { container } = render(<EventCard {...defaultProps} isSeen={true} />);

    expect(container.firstChild).toHaveClass('event-card seen');
  });

  test('displays video count badge for multiple events', () => {
    render(<EventCard {...defaultProps} event={mockMultiEventGroup} />);

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('shows multiple camera names for multi-camera events', () => {
    render(<EventCard {...defaultProps} event={mockMultiEventGroup} />);

    expect(screen.getByText('Front Door')).toBeInTheDocument();
    expect(screen.getByText('Back Yard')).toBeInTheDocument();
  });

  test('displays no thumbnail message when thumbnail_uri is missing', () => {
    const eventWithoutThumbnail = [{
      ...mockEventGroup[0],
      thumbnail_uri: null
    }];

    render(<EventCard {...defaultProps} event={eventWithoutThumbnail} />);

    expect(screen.getByText('No Thumbnail')).toBeInTheDocument();
  });

  test('shows correct viewing status for cameras', () => {
    const { container } = render(
      <EventCard {...defaultProps} event={mockMultiEventGroup} seenVideos={['test-key-1']} />
    );

    const cameraChips = container.querySelectorAll('.camera-chip');
    expect(cameraChips[0]).toHaveClass('camera-chip--fully-viewed');
    expect(cameraChips[1]).toHaveClass('camera-chip--unviewed');
  });
});