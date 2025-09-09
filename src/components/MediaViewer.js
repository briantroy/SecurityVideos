
const MediaViewer = ({ event, token }) => {

    if (!event) return null;

    const eventDate = new Date(event.event_ts);

    return (
        <div className="media-viewer">
            <div className="media-container">
                {event.video_name ? (
                    <video src={event.uri} controls preload="auto" autoPlay={event.autoplay} className="video-embed" />
                ) : (
                    <img src={event.uri} alt={`Event from ${event.camera_name}`} className="image-embed" />
                )}
            </div>
            <div className="media-info">
                <h3>{event.camera_name}</h3>
                <p>{eventDate.toLocaleString()}</p>
            </div>
        </div>
    );
};

export default MediaViewer;