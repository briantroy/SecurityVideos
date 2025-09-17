import React, { useState, useEffect, useRef } from 'react';

const VOLUME_KEY = 'mediaViewerVolume';
const MUTE_KEY = 'mediaViewerMuted';

const MediaViewer = ({ event: eventGroup }) => {
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
    }, [eventGroup]);

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

    // Save volume/mute changes to localStorage
    const handleVolumeChange = (e) => {
        const video = e.target;
        setVolume(video.volume);
        setMuted(video.muted);
        localStorage.setItem(VOLUME_KEY, video.volume);
        localStorage.setItem(MUTE_KEY, video.muted);
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
                        src={currentEvent.uri}
                        controls
                        preload="auto"
                        autoPlay={eventGroup.autoplay}
                        className="video-embed"
                        playsInline
                        webkit-playsinline="true"
                        onVolumeChange={handleVolumeChange}
                    />
                ) : (
                    <img src={currentEvent.uri} alt={`Event from ${currentEvent.camera_name || 'camera'}`} className="image-embed" />
                )}
            </div>
        </div>
    );
};

export default MediaViewer;