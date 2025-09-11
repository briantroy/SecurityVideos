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



const Timeline = ({ scope, token, scrollableContainer, selectedMedia, setSelectedMedia }) => {
    const [events, setEvents] = useState([]);
    const [groupedEvents, setGroupedEvents] = useState([]);
    const [seenGroups, setSeenGroups] = useState([]);
    const [nextToken, setNextToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [videoDate, setVideoDate] = useState(new Date());
    const videoDateRef = useRef(videoDate);
    const [zeroEntryCount, setZeroEntryCount] = useState(0);
    const [noEventsDate, setNoEventsDate] = useState(null);
    const lastEffectKey = useRef(null);
    const observer = useRef();

    // Infinite scroll observer
    const lastEventElementRef = useCallback(node => {
        if (observer.current) observer.current.disconnect();
        if (loading) return;
        if (node && scrollableContainer.current) {
            observer.current = new IntersectionObserver(entries => {
                if (entries[0].isIntersecting && nextToken !== undefined) {
                    loadEvents(true);
                }
            }, { root: scrollableContainer.current });
            observer.current.observe(node);
        }
    }, [loading, nextToken, scrollableContainer, scope]);

    // Main event loading logic
    const loadEvents = (loadMore = false, dateArg, zeroTriesArg) => {
        setLoading(true);
        setError(null);

        let date = dateArg !== undefined ? dateArg : videoDate;
        let zeroTries = zeroTriesArg !== undefined ? zeroTriesArg : zeroEntryCount;
        if (scope.startsWith('filter:')) {
            videoDateRef.current = date;
        }

        // Always use local date in YYYY-MM-DD
        const formattedDate = date.toLocaleDateString('en-CA');
        const options = {
            num_results: scope.startsWith('filter:') ? 100 : 50,
        };
        if (nextToken && loadMore) {
            options.older_than_ts = nextToken;
        }
        // Only use video_date for non-camera
        if (scope === 'latest' || scope.startsWith('filter:')) {
            options.video_date = formattedDate;
        }

        getEvents(token, scope, options)
            .then(data => {
                const count = data.Items.length;
                // 1. Handle 0 results
                if (count === 0) {
                    setNextToken(null); // Unset older_than_ts on 0 entry response
                    if (scope.startsWith('filter:')) {
                        if (zeroTries >= 2) {
                            setNoEventsDate(date);
                            setLoading(false);
                            return;
                        } else {
                            // Try previous day, but do NOT clear events
                            const newDate = new Date(date);
                            newDate.setDate(newDate.getDate() - 1);
                            setVideoDate(newDate);
                            setZeroEntryCount(zeroTries + 1);
                            loadEvents(true, newDate, zeroTries + 1);
                            return;
                        }
                    } else {
                        // Not a group: show no events message
                        setNoEventsDate(date);
                        setLoading(false);
                        return;
                    }
                }

                // 2. Handle >0 results
                setZeroEntryCount(0);
                setNoEventsDate(null);


                // 3. Handle LastEvaluatedKey for infinite scroll
                if (data.LastEvaluatedKey && data.LastEvaluatedKey.event_ts) {
                    setNextToken(data.LastEvaluatedKey.event_ts);
                } else {
                    setNextToken(null);
                    // If >0 results and no LastEvaluatedKey, decrement videoDate for next scroll
                    if (count > 0 && (scope === 'latest' || scope.startsWith('filter:'))) {
                        const newDate = new Date(date);
                        newDate.setDate(newDate.getDate() - 1);
                        setVideoDate(newDate);
                        videoDateRef.current = newDate;
                    }
                }

                // 4. Always append new events
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

    // Initial load and scope/token change
    useEffect(() => {
        const effectKey = `${scope}:${token}`;
        if (lastEffectKey.current === effectKey) return;
        lastEffectKey.current = effectKey;
        const today = new Date();
        setSelectedMedia(null);
        setEvents([]);
        setGroupedEvents([]);
        setNextToken(null);
        setVideoDate(today);
        videoDateRef.current = today;
        setZeroEntryCount(0);
        setNoEventsDate(null);
        loadEvents(false, today, 0);
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
                {!loading && noEventsDate && (
                    <div className="timeline-end">No events in the last 3 days (since {noEventsDate.toLocaleDateString()})</div>
                )}
                {!loading && !noEventsDate && !nextToken && events.length > 0 && (
                    <div className="timeline-end">End of timeline.</div>
                )}
            </div>

            {/* MediaViewer is now rendered in App.js */}
        </div>
    );
};

export default Timeline;
