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
            // Sort the group by event_ts ascending before pushing
            groupedEvents.push([...currentGroup].sort((a, b) => a.event_ts - b.event_ts));
            currentGroup = [currentEvent];
        }
    }

    // Sort the last group as well
    groupedEvents.push([...currentGroup].sort((a, b) => a.event_ts - b.event_ts));
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
    // Store the first event_ts for each scope for later use
    const [firstEventTsByScope, setFirstEventTsByScope] = useState({});
    const [refreshing, setRefreshing] = useState(false);
    const viewKeyRef = useRef('');
    const loadingRef = useRef(false); // <--- add loadingRef

    // Infinite scroll observer
    const lastEventElementRef = useCallback(node => {
        if (observer.current) observer.current.disconnect();
        if (loadingRef.current) return; // block if already loading
        if (node && scrollableContainer.current) {
            observer.current = new IntersectionObserver(entries => {
                if (
                    entries[0].isIntersecting &&
                    !loadingRef.current &&
                    nextToken !== undefined && nextToken !== null
                ) {
                    loadEvents(true, undefined, undefined, viewKeyRef.current);
                }
            }, { root: scrollableContainer.current });
            observer.current.observe(node);
        }
    }, [nextToken, scrollableContainer, scope]);

    // Initial load and scope/token change
    useEffect(() => {
        const viewKey = `${scope}:${token}`;
        viewKeyRef.current = viewKey;
        setSelectedMedia(null);
        setEvents([]);
        setGroupedEvents([]);
        setNextToken(null);
        setVideoDate(new Date());
        videoDateRef.current = new Date();
        setZeroEntryCount(0);
        setNoEventsDate(null);
        loadEvents(false, new Date(), 0, viewKey);
    }, [scope, token]);

    // Main event loading logic
    const loadEvents = (loadMore = false, dateArg, zeroTriesArg, viewKeyArg) => {
        const viewKey = viewKeyArg || `${scope}:${token}`;
        if (loadingRef.current) return; // block re-entry
        loadingRef.current = true;
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
        if (scope === 'latest' || scope.startsWith('filter:')) {
            options.video_date = formattedDate;
        }

        getEvents(token, scope, options)
            .then(data => {
                if (viewKeyRef.current !== viewKey) {
                    loadingRef.current = false;
                    return;
                }
                const count = data.Items.length;
                // 1. Handle 0 results
                if (count === 0) {
                    // Only clear events on the very first call for a group (filter)
                    if (!loadMore && scope.startsWith('filter:')) {
                        setEvents([]);
                        setGroupedEvents([]);
                    }
                    if (scope.startsWith('filter:') && data.LastEvaluatedKey && data.LastEvaluatedKey.event_ts) {
                        // For groups, recursively fetch previous days and accumulate events
                        const newDate = new Date(date);
                        newDate.setDate(newDate.getDate() - 1);
                        setVideoDate(newDate);
                        setNextToken(null); // clear older_than_ts for next request
                        loadingRef.current = false;
                        // Always use loadMore=true for subsequent calls to accumulate
                        loadEvents(true, newDate, zeroTries, viewKey);
                        return;
                    }
                    setNextToken(null);
                    if (scope.startsWith('filter:')) {
                        if (zeroTries >= 2) {
                            setNoEventsDate(date);
                            setLoading(false);
                            return;
                        } else {
                            const newDate = new Date(date);
                            newDate.setDate(newDate.getDate() - 1);
                            setVideoDate(newDate);
                            setZeroEntryCount(zeroTries + 1);
                            loadEvents(true, newDate, zeroTries + 1, viewKey);
                            return;
                        }
                    } else {
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
                if (viewKeyRef.current !== viewKey) return; // Only update if view matches
                setEvents(prevEvents => loadMore ? [...prevEvents, ...data.Items] : data.Items);
                setGroupedEvents(prevGroups => {
                    if (scope === 'latest') {
                        return loadMore
                            ? [...prevGroups, ...data.Items.map(event => [event])]
                            : data.Items.map(event => [event]);
                    } else {
                        return loadMore
                            ? [...prevGroups, ...groupEvents(data.Items)]
                            : groupEvents(data.Items);
                    }
                });
                // On first load, save the event_ts of the first event for this scope
                if (!loadMore && data.Items.length > 0) {
                    setFirstEventTsByScope(prev => ({ ...prev, [scope]: data.Items[0].event_ts }));
                }
                if (!loadMore && data.Items.length > 0) {
                    setSelectedMedia(groupEvents(data.Items)[0]);
                }
            })
            .catch(err => {
                if (viewKeyRef.current !== viewKey) {
                    loadingRef.current = false;
                    return;
                }
                console.error("Failed to fetch events:", err);
                setError("Failed to load events. Please try again.");
            })
            .finally(() => {
                if (viewKeyRef.current === viewKey) {
                    setLoading(false);
                }
                loadingRef.current = false;
            });
    };

    const handleSelectMedia = (eventGroup) => {
        const key = eventGroup.map(e => e.object_key).join('-');
        if (!seenGroups.includes(key)) {
            setSeenGroups([...seenGroups, key]);
        }
        const newSelectedMedia = [...eventGroup];
        newSelectedMedia.autoplay = true;
        setSelectedMedia(newSelectedMedia);
    };

    // Pull-to-refresh handler
    const handlePullDown = () => {
        const today = new Date();
        const formattedDate = today.toLocaleDateString('en-CA');
        const newerThanTs = firstEventTsByScope[scope];
        if (!newerThanTs) return; // nothing to fetch
        setRefreshing(true);
        const options = {
            num_results: scope.startsWith('filter:') ? 100 : 50,
            newer_than_ts: newerThanTs,
        };
        if (scope === 'latest' || scope.startsWith('filter:')) {
            options.video_date = formattedDate;
        }
        getEvents(token, scope, options)
            .then(data => {
                if (data.Items && data.Items.length > 0) {
                    // Invert the items array so newest is last
                    const invertedItems = [...data.Items].reverse();
                    // Save event_ts of the first event in the inverted array
                    setFirstEventTsByScope(prev => ({ ...prev, [scope]: invertedItems[0].event_ts }));
                    // Prepend new events to the timeline in correct order
                    setEvents(prev => [...invertedItems, ...prev]);
                    let grouped;
                    if (scope === 'latest') {
                        grouped = [...invertedItems.map(event => [event]), ...groupedEvents];
                    } else {
                        grouped = [...groupEvents(invertedItems), ...groupedEvents];
                    }
                    setGroupedEvents(grouped);
                }
            })
            .catch(err => {
                console.error('Failed to fetch new events:', err);
            })
            .finally(() => setRefreshing(false));
    };

    return (
        <div className="timeline-container">
            <div className="timeline">
                {/* Pulldown button above the first event */}
                <button className="timeline-pulldown" onClick={handlePullDown} disabled={refreshing}>
                    <span className={`refresh-icon${refreshing ? ' spinning' : ''}`} aria-label="refresh" role="img">
                        <img src="/images/refresh-icon.png" alt="refresh" width="20" height="20" style={{display:'block'}} />
                    </span>
                    {refreshing ? 'Refreshing...' : 'Get New Events'}
                </button>
                {/* Timeline events */}
                {groupedEvents.map((group, index) => {
                    const key = group.map(e => e.object_key).join('-');
                    const isSelected = selectedMedia && key === selectedMedia.map(e => e.object_key).join('-');
                    const isSeen = seenGroups.includes(key);
                    // Always keep the infinite scroll trigger on the last card
                    if (index === groupedEvents.length - 1) {
                        return (
                            <div ref={lastEventElementRef} key={key}>
                                <EventCard event={group} onSelectMedia={handleSelectMedia} isSelected={isSelected} isSeen={isSeen} />
                            </div>
                        );
                    } else {
                        return <EventCard key={key} event={group} onSelectMedia={handleSelectMedia} isSelected={isSelected} isSeen={isSeen} />;
                    }
                })}
                {loading && (
                    <div className="loading-indicator" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
                        <span className="refresh-icon spinning">
                            <img
                                src="/images/refresh-icon.png"
                                alt="Loading..."
                                width={32}
                                height={32}
                                style={{ display: 'block' }}
                            />
                        </span>
                    </div>
                )}
                {error && <div className="error-indicator">{error}</div>}
                {!loading && noEventsDate && (
                    <div className="timeline-end">No events in the last 3 days (since {noEventsDate.toLocaleDateString()})</div>
                )}
                {/* Removed End of timeline text */}
            </div>

            {/* MediaViewer is now rendered in App.js */}
        </div>
    );
};

export default Timeline;
