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
    const videoDateRef = useRef(videoDate);
    const [zeroEntryCount, setZeroEntryCount] = useState(0);
    // Prevent double API call for same scope/token
    const lastEffectKey = useRef(null);
    const [noEventsDate, setNoEventsDate] = useState(null);

    const observer = useRef();

    const lastEventElementRef = useCallback(node => {
        if (observer.current) observer.current.disconnect();
        if (loading) return;
        if (node && scrollableContainer.current) {
            observer.current = new IntersectionObserver(entries => {
                if (entries[0].isIntersecting && nextToken !== undefined) {
                    // For group (filter), always use the ref for the next date
                    if (scope.startsWith('filter:')) {
                        loadEvents(true, videoDateRef.current);
                    } else {
                        loadEvents(true);
                    }
                }
            }, { root: scrollableContainer.current });
            observer.current.observe(node);
        }
    }, [loading, nextToken, scrollableContainer, scope]);

    const loadEvents = (loadMore = false, date = videoDate, zeroTries = zeroEntryCount) => {
        // Always keep the ref in sync
        if (scope.startsWith('filter:')) {
            videoDateRef.current = date;
        }
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
                // Special case: group (filter) and 0 events returned, try up to 3 days
                if (scope.startsWith('filter:') && data.Items.length === 0 && zeroTries < 2) {
                    const newDate = new Date(date);
                    newDate.setDate(newDate.getDate() - 1);
                    setVideoDate(newDate);
                    setZeroEntryCount(zeroTries + 1);
                    loadEvents(false, newDate, zeroTries + 1);
                    return;
                }
                // If 3 tries and still 0 events, show message
                if (scope.startsWith('filter:') && data.Items.length === 0 && zeroTries >= 2) {
                    setNoEventsDate(date);
                    setEvents([]);
                    setGroupedEvents([]);
                    setLoading(false);
                    return;
                }

                if (data.Items.length > 0) {
                    setZeroEntryCount(0);
                    setNoEventsDate(null);
                }

                // For group (filter), always decrement date for next scroll, regardless of how many events were returned (except 0-events special case above)
                if (scope.startsWith('filter:')) {
                    // Immediately decrement date for next call
                    const newDate = new Date(date);
                    newDate.setDate(newDate.getDate() - 1);
                    setVideoDate(newDate);
                    videoDateRef.current = newDate;
                    setNextToken(null); // next scroll omits older_than_ts
                } else if (data.Items.length < 50 && loadMore) {
                    // For non-group, keep old logic
                    const newDate = new Date(date);
                    newDate.setDate(newDate.getDate() - 1);
                    setVideoDate(newDate);
                    setNextToken(null);
                } else {
                    setNextToken(data.LastEvaluatedKey ? data.LastEvaluatedKey.event_ts : null);
                }
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
        const effectKey = `${scope}:${token}`;
        if (lastEffectKey.current === effectKey) {
            // Already ran for this combination
            return;
        }
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

            {selectedMedia && (
                <MediaViewer event={selectedMedia} token={token} />
            )}
        </div>
    );
};

export default Timeline;
