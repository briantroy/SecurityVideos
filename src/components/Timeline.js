import React, { useState, useEffect, useRef, useCallback } from 'react';
import EventCard from './EventCard';
import MediaViewer from './MediaViewer';
import { getEvents } from '../api';

const groupEvents = (events) => {
    if (events.length === 0) {
        return [];
    }

    // Assuming events are already sorted by timestamp from the API
    const groupedEvents = [];
    let currentGroup = [events[0]];

    for (let i = 1; i < events.length; i++) {
        const previousEvent = currentGroup[currentGroup.length - 1];
        const currentEvent = events[i];
        const timeDifference = Math.abs(currentEvent.event_ts - previousEvent.event_ts);

        if (timeDifference <= 60000) {
            currentGroup.push(currentEvent);
        } else {
            groupedEvents.push(currentGroup);
            currentGroup = [currentEvent];
        }
    }

    groupedEvents.push(currentGroup);
    return groupedEvents;
};


const Timeline = ({ scope, token }) => {
    const [events, setEvents] = useState([]);
    const [groupedEvents, setGroupedEvents] = useState([]);
    const [seenGroups, setSeenGroups] = useState([]); // new state
    const [nextToken, setNextToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedMedia, setSelectedMedia] = useState(null);

    const observer = useRef();

    const lastEventElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && nextToken) {
                loadEvents(true);
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

                let grouped;
                if (scope === 'latest') {
                    // In "latest" view, each event is its own group
                    grouped = newEvents.map(event => [event]);
                } else {
                    // For camera or group views, group events by time
                    grouped = groupEvents(newEvents);
                }
                setGroupedEvents(grouped);

                if (!loadMore && grouped.length > 0) {
                    setSelectedMedia(grouped[0]);
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

    useEffect(() => {
        setSelectedMedia(null);
        setEvents([]);
        setGroupedEvents([]);
        setNextToken(null);
        loadEvents();
    }, [scope, token]);

    const handleSelectMedia = (eventGroup) => {
        const key = eventGroup.map(e => e.object_key).join('-');
        if (!seenGroups.includes(key)) {
            setSeenGroups([...seenGroups, key]);
        }
        const newSelectedMedia = [...eventGroup];
        newSelectedMedia.autoplay = true;
        setSelectedMedia(newSelectedMedia);
    };

    return (
        <div className="timeline-container">
            <div className="timeline">
                {groupedEvents.map((group, index) => {
                    const key = group.map(e => e.object_key).join('-');
                    const isSelected = selectedMedia && key === selectedMedia.map(e => e.object_key).join('-');
                    const isSeen = seenGroups.includes(key);

                    if (groupedEvents.length === index + 1) {
                        return (
                            <div ref={lastEventElementRef} key={key}>
                                <EventCard event={group} onSelectMedia={handleSelectMedia} isSelected={isSelected} isSeen={isSeen} />
                            </div>
                        );
                    } else {
                        return <EventCard key={key} event={group} onSelectMedia={handleSelectMedia} isSelected={isSelected} isSeen={isSeen} />;
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
