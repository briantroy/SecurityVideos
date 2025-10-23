import React, { useState, useEffect, useRef } from 'react';

const VOLUME_KEY = 'mediaViewerVolume';
const MUTE_KEY = 'mediaViewerMuted';

const MediaViewer = ({ event: eventGroup, onOfflineVideoError }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const videoRef = useRef(null);
    // Local state for UI sync
    const [volume, setVolume] = useState(() => {
        const stored = localStorage.getItem(VOLUME_KEY);
        return stored !== null ? parseFloat(stored) : 1;
    });
    const [muted, setMuted] = useState(() => {
        const stored = localStorage.getItem(MUTE_KEY);
        return stored === 'true';
    });

    useEffect(() => {
        setCurrentIndex(0);
        // If autoplay is enabled, play the video
        if (eventGroup?.autoplay) {
            const timer = setTimeout(() => {
                videoRef.current?.play().catch(err => {
                    console.log('Autoplay prevented:', err);
                });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [eventGroup]);

    // Mark current video as viewed when it's displayed
    useEffect(() => {
        if (Array.isArray(eventGroup) && eventGroup.length > 0 && eventGroup.markVideoAsViewed) {
            const currentEvent = eventGroup[currentIndex] ?? eventGroup[0];
            if (currentEvent && currentEvent.object_key) {
                const timestamp = new Date(currentEvent.event_ts).toISOString();
                eventGroup.markVideoAsViewed(currentEvent.object_key, timestamp);
            }
        }
    }, [currentIndex, eventGroup]);

    // Ensure index stays within bounds if the group shrinks
    useEffect(() => {
        if (Array.isArray(eventGroup) && currentIndex >= eventGroup.length) {
            setCurrentIndex(0);
        }
    }, [currentIndex, eventGroup]);

    // Apply saved volume/mute to video when it loads
    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            video.volume = volume;
            video.muted = muted;
        }
    }, [currentIndex, eventGroup, volume, muted]);

    // Handler for when video ends
    const handleVideoEnded = () => {
        // Always advance to next video if there are more videos in the group
        if (eventGroup && currentIndex < eventGroup.length - 1) {
            setCurrentIndex(prevIndex => prevIndex + 1);
        }
    };

    // Handle time update to check if video is stuck near the end
    const handleTimeUpdate = (e) => {
        const video = e.target;
        if (video.duration > 0 && !isNaN(video.duration)) {
            const timeRemaining = video.duration - video.currentTime;
            // If we're within 1 second of the end, consider it done
            if (timeRemaining < 1 && timeRemaining > 0) {
                // Check if we're actually at the end or stuck
                if (video.paused || video.ended) {
                    handleVideoEnded();
                }
            }
        }
    };

    // Explicitly play video when index changes (for subsequent videos in a group)
    useEffect(() => {
        if (currentIndex === 0) return;

        // Wait for video element to be ready
        const attemptPlay = () => {
            const video = videoRef.current;
            if (video) {
                video.play().catch(err => {
                    console.log('Autoplay prevented:', err);
                });
            }
        };

        // Try immediately and with a delay as backup
        attemptPlay();
        const timer = setTimeout(attemptPlay, 100);

        return () => clearTimeout(timer);
    }, [currentIndex]);

    // Save volume/mute changes to localStorage
    const handleVolumeChange = (e) => {
        const video = e.target;
        setVolume(video.volume);
        setMuted(video.muted);
        localStorage.setItem(VOLUME_KEY, video.volume);
        localStorage.setItem(MUTE_KEY, video.muted);
    };

    // Handle video load errors (403 = offline storage)
    const handleVideoError = (e) => {
        const video = e.target;
        // Check if the error is likely a 403 (forbidden) - indicating offline storage
        if (video.error && (video.error.code === video.error.MEDIA_ERR_SRC_NOT_SUPPORTED || video.error.code === video.error.MEDIA_ERR_NETWORK)) {
            // Make a test request to check the actual HTTP status
            fetch(video.src, { method: 'HEAD' })
                .then(response => {
                    if (response.status === 403) {
                        if (onOfflineVideoError) {
                            onOfflineVideoError();
                        }
                    }
                })
                .catch(() => {
                    // If fetch fails, also assume it might be a 403 and show popup
                    if (onOfflineVideoError) {
                        onOfflineVideoError();
                    }
                });
        }
    };

    // Handle image load errors
    const handleImageError = (e) => {
        const img = e.target;
        // Make a test request to check the actual HTTP status
        fetch(img.src, { method: 'HEAD' })
            .then(response => {
                if (response.status === 403) {
                    if (onOfflineVideoError) {
                        onOfflineVideoError();
                    }
                }
            })
            .catch(() => {
                // If fetch fails, also assume it might be a 403 and show popup
                if (onOfflineVideoError) {
                    onOfflineVideoError();
                }
            });
    };

    if (!Array.isArray(eventGroup) || eventGroup.length === 0) {
        return null;
    }

    const currentEvent = eventGroup[currentIndex] ?? eventGroup[0];
    if (!currentEvent) return null;
    const eventDate = currentEvent.event_ts ? new Date(currentEvent.event_ts) : null;

    const handleNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % eventGroup.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + eventGroup.length) % eventGroup.length);
    };

    return (
        <div className="media-viewer">
            <div className="media-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1em' }}>
                    <span style={{ fontWeight: 'bold' }}>{currentEvent.camera_name || ''}</span>
                    <span>{eventDate ? eventDate.toLocaleString() : ''}</span>
                </div>
                {eventGroup.length > 1 && (
                    <div className="media-navigation">
                        <button onClick={handlePrev}>Previous</button>
                        <span>{currentIndex + 1} of {eventGroup.length}</span>
                        <button onClick={handleNext}>Next</button>
                    </div>
                )}
            </div>
            <div className="media-container">
                {currentEvent.video_name ? (
                    <video
                        ref={videoRef}
                        key={`${currentEvent.object_key}-${currentIndex}`}
                        src={currentEvent.uri}
                        controls
                        preload="metadata"
                        autoPlay={eventGroup?.autoplay || false}
                        className="video-embed"
                        playsInline
                        webkit-playsinline="true"
                        onVolumeChange={handleVolumeChange}
                        onError={handleVideoError}
                        onEnded={handleVideoEnded}
                        onTimeUpdate={handleTimeUpdate}
                    />
                ) : (
                    <img
                        src={currentEvent.uri}
                        alt={`Event from ${currentEvent.camera_name || 'camera'}`}
                        className="image-embed"
                        onError={handleImageError}
                    />
                )}
            </div>
        </div>
    );
};

export default MediaViewer;