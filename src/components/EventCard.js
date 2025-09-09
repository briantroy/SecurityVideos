import React from 'react';

const EventCard = ({ event, onSelectMedia }) => {
    const eventDate = new Date(event.event_ts * 1000);

    return (
        <div className="event-card">
            <div className="event-card-body">
                <div className="event-card-header">
                    <span className="camera-name">{event.camera_name}</span>
                    <span className="timestamp">{eventDate.toLocaleString()}</span>
                </div>
                <div className="event-card-details">
                    <span className="event-type">{event.event_type}</span>
                </div>
                <button className="view-button" onClick={() => onSelectMedia(event)}>
                    Play
                </button>
            </div>
        </div>
    );
};

export default EventCard;