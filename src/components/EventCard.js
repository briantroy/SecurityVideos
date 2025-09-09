import React from 'react';

const EventCard = ({ event: eventGroup, onSelectMedia, isSelected }) => {
    const firstEvent = eventGroup[0];
    const eventDate = new Date(firstEvent.event_ts);
    const cardClassName = `event-card ${isSelected ? 'selected' : ''}`;

    return (
        <div className={cardClassName} onClick={() => onSelectMedia(eventGroup)}>
            <div className="event-card-thumbnail">
                {/* Placeholder for thumbnail */}
                {eventGroup.length > 1 && (
                    <span className="video-count-badge">{eventGroup.length} videos</span>
                )}
            </div>
            <div className="event-card-body">
                <div className="event-card-header">
                    <span className="camera-name">{firstEvent.camera_name}</span>
                    <span className="timestamp">{eventDate.toLocaleString()}</span>
                </div>
                <div className="event-card-details">
                    <span className="event-type">{firstEvent.event_type}</span>
                </div>
            </div>
            <div className="event-card-play-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="24px" height="24px"><path d="M8 5v14l11-7z"/><path d="M0 0h24v24H0z" fill="none"/></svg>
            </div>
        </div>
    );
};

export default EventCard;