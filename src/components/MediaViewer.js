
import React, { useState, useEffect } from 'react';

const MediaViewer = ({ event: eventGroup, token }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        setCurrentIndex(0);
    }, [eventGroup]);

    if (!eventGroup || eventGroup.length === 0) {
        return null;
    }

    const currentEvent = eventGroup[currentIndex];
    const eventDate = new Date(currentEvent.event_ts);

    const handleNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % eventGroup.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + eventGroup.length) % eventGroup.length);
    };

    return (
        <div className="media-viewer">
            <div className="media-container">
                {currentEvent.video_name ? (
                    <video src={currentEvent.uri} controls preload="auto" autoPlay={eventGroup.autoplay} className="video-embed" />
                ) : (
                    <img src={currentEvent.uri} alt={`Event from ${currentEvent.camera_name}`} className="image-embed" />
                )}
            </div>
            <div className="media-info">
                <h3>{currentEvent.camera_name}</h3>
                <p>{eventDate.toLocaleString()}</p>
                {eventGroup.length > 1 && (
                    <div className="media-navigation">
                        <button onClick={handlePrev}>Previous</button>
                        <span>{currentIndex + 1} of {eventGroup.length}</span>
                        <button onClick={handleNext}>Next</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MediaViewer;