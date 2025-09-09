import React, { useState, useEffect, useRef, useCallback } from 'react';
import EventCard from './EventCard';
import MediaViewer from './MediaViewer';
import { getEvents } from '../api';

const Timeline = ({ scope, token }) => {
    const [events, setEvents] = useState([]);
    const [nextToken, setNextToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedMedia, setSelectedMedia] = useState(null);

    const observer = useRef();

    // This function will be called when the last element in the list is visible
    const lastEventElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && nextToken) {
                loadEvents(true); // Load more events
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, nextToken]);

    const loadEvents = (loadMore = false) => {
        setLoading(true);
        setError(null);

        const options = loadMore && nextToken ? { older_than_ts: nextToken } : {};

        getEvents(token, scope, options)
            .then(data => {
                setNextToken(data.LastEvaluatedKey ? data.LastEvaluatedKey.event_ts.N : null);
                const newEvents = loadMore ? [...events, ...data.Items] : data.Items;
                setEvents(newEvents);
                if (!loadMore && newEvents.length > 0) {
                    setSelectedMedia(newEvents[0]);
                }
            })
            .catch(err => {
                console.error("Failed to fetch events:", err);
                setError("Failed to load events. Please try again.");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // Effect to load events when the scope (selected camera/filter) changes
    useEffect(() => {
        setSelectedMedia(null);
        setEvents([]);
        setNextToken(null);
        loadEvents();
    }, [scope, token]);

    const handleSelectMedia = (event) => {
        setSelectedMedia({ ...event, autoplay: true });
    };

    return (
        <div className="timeline-container">
            <div className="timeline">
                {events.map((event, index) => {
                    // Attach the ref to the last element
                    if (events.length === index + 1) {
                        return (
                            <div ref={lastEventElementRef} key={event.object_key}>
                                <EventCard event={event} onSelectMedia={handleSelectMedia} />
                            </div>
                        );
                    } else {
                        return <EventCard key={event.object_key} event={event} onSelectMedia={handleSelectMedia} />;
                    }
                })}
                 {loading && <div className="loading-indicator">Loading...</div>}
                 {error && <div className="error-indicator">{error}</div>}
                 {!loading && !nextToken && events.length > 0 && (
                     <div className="timeline-end">End of timeline.</div>
                 )}
            </div>

            {selectedMedia && (
                <MediaViewer event={selectedMedia} token={token} />
            )}
        </div>
    );
};

export default Timeline;