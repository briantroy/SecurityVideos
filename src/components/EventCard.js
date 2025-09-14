import React from 'react';

const EventCard = ({ event: eventGroup, onSelectMedia, isSelected, isSeen }) => {
    const firstEvent = eventGroup[0];
    const eventDate = new Date(firstEvent.event_ts);
    const cardClassName = `event-card ${isSelected ? 'selected' : ''} ${isSeen && !isSelected ? 'seen' : ''}`;
    // Get all unique camera names in the group
    const cameraNames = Array.from(new Set(eventGroup.map(e => e.camera_name))).filter(Boolean);

    return (
        <div className={cardClassName} onClick={() => onSelectMedia(eventGroup)}>
            <div className="event-card-thumbnail">
                {firstEvent.thumbnail_uri ? (
                    <img
                        src={firstEvent.thumbnail_uri}
                        alt="Event thumbnail"
                        className="thumbnail-image"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <span className="no-thumbnail">No Thumbnail</span>
                )}
                {eventGroup.length > 1 && (
                    <span className="video-count-badge">{eventGroup.length}</span>
                )}
            </div>
            <div className="event-card-body">
                <div className="event-card-header">
                    {cameraNames.length > 1 ? (
                        <span className="camera-names-group">{cameraNames.join(', ')}</span>
                    ) : (
                        <span className="camera-name">{firstEvent.camera_name}</span>
                    )}
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