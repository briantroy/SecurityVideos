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


const Timeline = ({ scope, token, scrollableContainer }) => {
    const [events, setEvents] = useState([]);
    const [groupedEvents, setGroupedEvents] = useState([]);
    const [seenGroups, setSeenGroups] = useState([]);
    const [nextToken, setNextToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [videoDate, setVideoDate] = useState(new Date());
    const [zeroEntryCount, setZeroEntryCount] = useState(0);

    const observer = useRef();

    const lastEventElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        if (scrollableContainer.current) {
            observer.current = new IntersectionObserver(entries => {
                if (entries[0].isIntersecting && nextToken) {
                    loadEvents(true);
                }
            }, { root: scrollableContainer.current });
            if (node) observer.current.observe(node);
        }
    }, [loading, nextToken, scrollableContainer]);

    const loadEvents = (loadMore = false, date = videoDate) => {
        setLoading(true);
        setError(null);

        const formattedDate = date.toISOString().split('T')[0];
        const options = {
            num_results: 50,
            ...(loadMore && nextToken && { older_than_ts: nextToken }),
        };

        if (scope === 'latest' || scope.startsWith('filter:')) {
            options.video_date = formattedDate;
        }

        getEvents(token, scope, options)
            .then(data => {
                if (data.Items.length === 0 && loadMore) {
                    if (zeroEntryCount < 2) {
                        setZeroEntryCount(zeroEntryCount + 1);
                        const newDate = new Date(date);
                        newDate.setDate(newDate.getDate() - 1);
                        setVideoDate(newDate);
                        loadEvents(true, newDate);
                    }
                    return;
                }

                if (data.Items.length > 0) {
                    setZeroEntryCount(0);
                }

                if (data.Items.length < 50 && loadMore) {
                    const newDate = new Date(date);
                    newDate.setDate(newDate.getDate() - 1);
                    setVideoDate(newDate);
                }

                setNextToken(data.LastEvaluatedKey ? data.LastEvaluatedKey.event_ts : null);
                const newEvents = loadMore ? [...events, ...data.Items] : data.Items;
                setEvents(newEvents);

                let grouped;
                if (scope === 'latest') {
                    grouped = newEvents.map(event => [event]);
                } else {
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
        setVideoDate(new Date());
        setZeroEntryCount(0);
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
