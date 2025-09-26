import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MediaViewer from '../MediaViewer';

const mockEventGroup = [
  {
    object_key: 'video-1',
    event_ts: Date.now(),
    camera_name: 'Front Door',
    video_name: 'video1.mp4',
    uri: 'https://example.com/video1.mp4'
  },
  {
    object_key: 'video-2',
    event_ts: Date.now() + 1000,
    camera_name: 'Back Yard',
    video_name: 'video2.mp4',
    uri: 'https://example.com/video2.mp4'
  }
];

const mockImageEvent = [{
  object_key: 'image-1',
  event_ts: Date.now(),
  camera_name: 'Side Gate',
  uri: 'https://example.com/image1.jpg'
}];

describe('MediaViewer', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('renders nothing when no event group provided', () => {
    const { container } = render(<MediaViewer event={null} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders nothing when empty event group provided', () => {
    const { container } = render(<MediaViewer event={[]} />);
    expect(container.firstChild).toBeNull();
  });

  test('displays video player for video events', () => {
    const { container } = render(<MediaViewer event={mockEventGroup} />);

    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', 'https://example.com/video1.mp4');
    expect(video).toHaveAttribute('controls');
  });

  test('displays image for non-video events', () => {
    render(<MediaViewer event={mockImageEvent} />);

    const image = screen.getByAltText('Event from Side Gate');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image1.jpg');
  });

  test('shows camera name and timestamp', () => {
    render(<MediaViewer event={mockEventGroup} />);

    expect(screen.getByText('Front Door')).toBeInTheDocument();

    const expectedDate = new Date(mockEventGroup[0].event_ts).toLocaleString();
    expect(screen.getByText(expectedDate)).toBeInTheDocument();
  });

  test('shows navigation controls for multiple events', () => {
    render(<MediaViewer event={mockEventGroup} />);

    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('1 of 2')).toBeInTheDocument();
  });

  test('does not show navigation for single event', () => {
    render(<MediaViewer event={[mockEventGroup[0]]} />);

    expect(screen.queryByText('Previous')).not.toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });

  test('navigates to next event when Next button clicked', () => {
    render(<MediaViewer event={mockEventGroup} />);

    expect(screen.getByText('Front Door')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Next'));

    expect(screen.getByText('Back Yard')).toBeInTheDocument();
    expect(screen.getByText('2 of 2')).toBeInTheDocument();
  });

  test('navigates to previous event when Previous button clicked', () => {
    render(<MediaViewer event={mockEventGroup} />);

    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Back Yard')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Previous'));

    expect(screen.getByText('Front Door')).toBeInTheDocument();
    expect(screen.getByText('1 of 2')).toBeInTheDocument();
  });

  test('wraps around when navigating past boundaries', () => {
    render(<MediaViewer event={mockEventGroup} />);

    fireEvent.click(screen.getByText('Previous'));
    expect(screen.getByText('Back Yard')).toBeInTheDocument();
    expect(screen.getByText('2 of 2')).toBeInTheDocument();
  });

  test('calls markVideoAsViewed when provided', () => {
    const markVideoAsViewed = jest.fn();
    const eventGroupWithCallback = [...mockEventGroup];
    eventGroupWithCallback.markVideoAsViewed = markVideoAsViewed;

    render(<MediaViewer event={eventGroupWithCallback} />);

    expect(markVideoAsViewed).toHaveBeenCalledWith('video-1');
  });

  test('applies autoplay when specified', () => {
    const eventGroupWithAutoplay = [...mockEventGroup];
    eventGroupWithAutoplay.autoplay = true;

    const { container } = render(<MediaViewer event={eventGroupWithAutoplay} />);

    const video = container.querySelector('video');
    expect(video).toHaveAttribute('autoPlay');
  });

  test('renders video controls correctly', () => {
    const { container } = render(<MediaViewer event={mockEventGroup} />);

    const video = container.querySelector('video');
    expect(video).toHaveAttribute('controls');
    expect(video).toHaveAttribute('preload', 'auto');
    expect(video).toHaveAttribute('playsInline');
  });
});