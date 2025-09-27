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



const Timeline = ({ scope, scrollableContainer, selectedMedia, setSelectedMedia, user }) => {
    const [events, setEvents] = useState([]);
    const [groupedEvents, setGroupedEvents] = useState([]);
    const [seenGroups, setSeenGroups] = useState(() => {
        const saved = localStorage.getItem('viewedEvents');
        return saved ? JSON.parse(saved) : [];
    });
    const [seenVideos, setSeenVideos] = useState(() => {
        const saved = localStorage.getItem('viewedVideos');
        return saved ? JSON.parse(saved) : [];
    });
    const [renderTrigger, setRenderTrigger] = useState(0); // Force re-render when viewed data changes
    const [nextToken, setNextToken] = useState(null); // legacy: event_ts only (kept for minimal changes)
    const [lastKey, setLastKey] = useState(null); // full LastEvaluatedKey from API { event_ts, video_date }
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
    const autoRefreshTimer = useRef(null);
    const pulldownButtonRef = useRef(null);
    const viewKeyRef = useRef('');
    const loadingRef = useRef(false); // <--- add loadingRef
    const groupKeySetRef = useRef(new Set()); // Track rendered group keys to prevent duplicates

    // Infinite scroll observer
    const lastEventElementRef = useCallback(node => {
        if (observer.current) observer.current.disconnect();
        if (loadingRef.current) return; // block if already loading
        if (node && scrollableContainer.current) {
            observer.current = new IntersectionObserver(entries => {
                if (
                    entries[0].isIntersecting &&
                    !loadingRef.current &&
                    (lastKey !== null) // only continue if API provided a next page key
                ) {
                    loadEvents(true, undefined, undefined, viewKeyRef.current);
                }
            }, { root: scrollableContainer.current });
            observer.current.observe(node);
        }
    }, [lastKey, scrollableContainer, scope]);

    // Initial load and scope change
    useEffect(() => {
        const viewKey = `${scope}`;
        viewKeyRef.current = viewKey;
        setSelectedMedia(null);
        setEvents([]);
        setGroupedEvents([]);
        setNextToken(null);
        setLastKey(null);
        setVideoDate(new Date());
        videoDateRef.current = new Date();
        setZeroEntryCount(0);
        setNoEventsDate(null);
        groupKeySetRef.current = new Set();
        loadEvents(false, new Date(), 0, viewKey);
    }, [scope]);

    // Main event loading logic
    const loadEvents = (loadMore = false, dateArg, zeroTriesArg, viewKeyArg) => {
        const viewKey = viewKeyArg || `${scope}`;
        if (loadingRef.current) return; // block re-entry
        loadingRef.current = true;
        setLoading(true);
        setError(null);

        let date = dateArg !== undefined ? dateArg : videoDate;
        let zeroTries = zeroTriesArg !== undefined ? zeroTriesArg : zeroEntryCount;
        if (scope.startsWith('filter:') || scope.startsWith('search:')) {
            videoDateRef.current = date;
        }

        // Handle search scope
        let actualScope = scope;
        let searchDateTime = null;
        if (scope.startsWith('search:')) {
            const timestamp = parseInt(scope.replace('search:', ''));
            searchDateTime = new Date(timestamp);
            // For search, determine the actual scope based on current scope or default to 'latest'
            const storedScope = localStorage.getItem('lastNonSearchScope');
            actualScope = storedScope || 'latest';
        } else {
            // Store non-search scope for later use
            localStorage.setItem('lastNonSearchScope', scope);
        }

        // Always use local date in YYYY-MM-DD
        const formattedDate = (searchDateTime || date).toLocaleDateString('en-CA');
        const options = {
            num_results: actualScope.startsWith('filter:') ? 50 : 50,
        };

        // After first request, ALWAYS use values from last response
        if (loadMore && lastKey) {
            if (lastKey.event_ts) options.older_than_ts = lastKey.event_ts;
            if (lastKey.capture_date) options.video_date = lastKey.capture_date;
        } else {
            // For search, use the search date and time
            if (searchDateTime) {
                // Only send video_date for latest/filter, NEVER for single cameras
                if (actualScope === 'latest' || actualScope.startsWith('filter:')) {
                    options.video_date = formattedDate;
                }
                options.older_than_ts = searchDateTime.getTime();
            } else {
                // Initial request can optionally provide today's date for latest/filter
                if (actualScope === 'latest' || actualScope.startsWith('filter:')) {
                    options.video_date = formattedDate;
                }
            }
        }

        // Prepare viewed data for auto-saving
        const viewedData = user ? {
            userId: user.email,
            viewedEvents: seenGroups,
            viewedVideos: seenVideos
        } : null;

        getEvents(actualScope, options, viewedData)
            .then(data => {
                if (viewKeyRef.current !== viewKey) {
                    loadingRef.current = false;
                    return;
                }
                
                // Handle merged viewed data from server
                if (data._mergedViewedData && data._mergedViewedData.wasMerged) {
                    const merged = data._mergedViewedData;
                    setSeenGroups(merged.viewedEvents || []);
                    setSeenVideos(merged.viewedVideos || []);
                    localStorage.setItem('viewedEvents', JSON.stringify(merged.viewedEvents || []));
                    localStorage.setItem('viewedVideos', JSON.stringify(merged.viewedVideos || []));
                    // Force re-render of existing event cards with updated viewed state
                    setRenderTrigger(prev => prev + 1);
                }
                
                const count = data.Items.length;
                // Update paging key from response in ALL cases
                const lek = data.LastEvaluatedKey || null;
                setLastKey(lek);
                setNextToken(lek && lek.event_ts ? lek.event_ts : null);

                // 1. Handle 0 results: just stop here; next scroll will use updated LEK
                if (count === 0) {
                    if (!lek) {
                        setNoEventsDate(date);
                    }
                    return;
                }

                // 2. Handle >0 results
                setZeroEntryCount(0);
                setNoEventsDate(null);


                // 3. LEK already handled; no manual date paging needed

                // 4. Always append new events
                if (viewKeyRef.current !== viewKey) return; // Only update if view matches
                setEvents(prevEvents => loadMore ? [...prevEvents, ...data.Items] : data.Items);
                const incomingGroupsRaw = (actualScope === 'latest')
                    ? data.Items.map(event => [event])
                    : groupEvents(data.Items);

                // Dedup within the same batch, then against already-rendered groups
                const batchSeen = new Set();
                const incomingGroups = [];
                for (const g of incomingGroupsRaw) {
                    const k = makeGroupKey(g);
                    if (batchSeen.has(k)) continue; // drop duplicates within this batch
                    batchSeen.add(k);
                    if (groupKeySetRef.current.has(k)) continue; // drop duplicates already rendered
                    incomingGroups.push(g);
                }

                if (loadMore) {
                    if (incomingGroups.length > 0) {
                        for (const g of incomingGroups) {
                            groupKeySetRef.current.add(makeGroupKey(g));
                        }
                        setGroupedEvents(prevGroups => [...prevGroups, ...incomingGroups]);
                    }
                } else {
                    groupKeySetRef.current = new Set(incomingGroups.map(g => makeGroupKey(g)));
                    setGroupedEvents(incomingGroups);
                }
                // On first load, save the event_ts of the first event for this scope
                if (!loadMore && data.Items.length > 0) {
                    setFirstEventTsByScope(prev => ({ ...prev, [scope]: data.Items[0].event_ts }));
                }
                if (!loadMore && data.Items.length > 0) {
                    setSelectedMedia(incomingGroups[0]);
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

    const makeGroupKey = useCallback((group) => group.map(e => e.object_key).sort().join('|'), []);

    const markVideoAsViewed = useCallback((objectKey) => {
        setSeenVideos(prevSeenVideos => {
            if (!prevSeenVideos.includes(objectKey)) {
                const newSeenVideos = [...prevSeenVideos, objectKey];
                localStorage.setItem('viewedVideos', JSON.stringify(newSeenVideos));
                return newSeenVideos;
            }
            return prevSeenVideos;
        });
    }, []); // Remove seenVideos dependency to avoid stale closure

    const handleSelectMedia = (eventGroup) => {
        const key = makeGroupKey(eventGroup);
        if (!seenGroups.includes(key)) {
            const newSeenGroups = [...seenGroups, key];
            setSeenGroups(newSeenGroups);
            localStorage.setItem('viewedEvents', JSON.stringify(newSeenGroups));
        }
        const newSelectedMedia = [...eventGroup];
        newSelectedMedia.autoplay = true;
        newSelectedMedia.markVideoAsViewed = markVideoAsViewed; // Pass the function
        setSelectedMedia(newSelectedMedia);
    };

    // Pull-to-refresh handler
    const handlePullDown = () => {
        const newerThanTs = firstEventTsByScope[scope];
        if (!newerThanTs) return; // nothing to fetch
        setRefreshing(true);

        // Handle search scope
        let actualScope = scope;
        let searchDate = null;
        if (scope.startsWith('search:')) {
            const timestamp = parseInt(scope.replace('search:', ''));
            searchDate = new Date(timestamp);
            const storedScope = localStorage.getItem('lastNonSearchScope');
            actualScope = storedScope || 'latest';
        }

        // Use search date if we're in search mode, otherwise use today
        const dateToUse = searchDate || new Date();
        const formattedDate = dateToUse.toLocaleDateString('en-CA');

        // Animate button as if clicked
        if (pulldownButtonRef.current) {
            pulldownButtonRef.current.classList.add('auto-refreshing');
            setTimeout(() => {
                if (pulldownButtonRef.current) {
                    pulldownButtonRef.current.classList.remove('auto-refreshing');
                }
            }, 1200);
        }
        const options = {
            num_results: actualScope.startsWith('filter:') ? 100 : 50,
            newer_than_ts: newerThanTs,
        };
        // Only send video_date for latest/filter, NEVER for single cameras
        if (actualScope === 'latest' || actualScope.startsWith('filter:')) {
            options.video_date = formattedDate;
        }
        // Prepare viewed data for auto-saving
        const viewedData = user ? {
            userId: user.email,
            viewedEvents: seenGroups,
            viewedVideos: seenVideos
        } : null;
        
        getEvents(actualScope, options, viewedData)
            .then(data => {
                // Handle merged viewed data from server
                if (data._mergedViewedData && data._mergedViewedData.wasMerged) {
                    const merged = data._mergedViewedData;
                    setSeenGroups(merged.viewedEvents || []);
                    setSeenVideos(merged.viewedVideos || []);
                    localStorage.setItem('viewedEvents', JSON.stringify(merged.viewedEvents || []));
                    localStorage.setItem('viewedVideos', JSON.stringify(merged.viewedVideos || []));
                    // Force re-render of existing event cards with updated viewed state
                    setRenderTrigger(prev => prev + 1);
                }
                
                if (data.Items && data.Items.length > 0) {
                    // Invert the items array so newest is last
                    const invertedItems = [...data.Items].reverse();
                    // Save event_ts of the first event in the inverted array
                    setFirstEventTsByScope(prev => ({ ...prev, [scope]: invertedItems[0].event_ts }));
                    // Prepend new events to the timeline in correct order
                    setEvents(prev => [...invertedItems, ...prev]);
                    const incomingGroupsRaw = (actualScope === 'latest')
                        ? invertedItems.map(event => [event])
                        : groupEvents(invertedItems);
                    const batchSeen = new Set();
                    const uniqueIncoming = [];
                    for (const g of incomingGroupsRaw) {
                        const k = makeGroupKey(g);
                        if (batchSeen.has(k)) continue; // drop duplicates within batch
                        batchSeen.add(k);
                        if (groupKeySetRef.current.has(k)) continue; // drop duplicates already rendered
                        groupKeySetRef.current.add(k);
                        uniqueIncoming.push(g);
                    }
                    if (uniqueIncoming.length > 0) {
                        setGroupedEvents(prev => [...uniqueIncoming, ...prev]);
                    }
                }
            })
            .catch(err => {
                console.error('Failed to fetch new events:', err);
            })
            .finally(() => setRefreshing(false));
    };

    // Auto-refresh every 5 minutes if not watching a video
    useEffect(() => {
        autoRefreshTimer.current = setInterval(() => {
            handlePullDown();
        }, 300000); // 5 minutes
        return () => {
            if (autoRefreshTimer.current) {
                clearInterval(autoRefreshTimer.current);
            }
        };
    }, [selectedMedia, scope]);

    // Ensure unique keys at render time as a final guard
    const renderList = (() => {
        const seen = new Set();
        const list = [];
        for (const g of groupedEvents) {
            const k = makeGroupKey(g);
            if (seen.has(k)) continue;
            seen.add(k);
            list.push({ key: k, group: g });
        }
        return list;
    })();

    return (
        <div className="timeline-container">
            <div className="timeline">
                {/* Pulldown button above the first event */}
                <button ref={pulldownButtonRef} className={`timeline-pulldown${refreshing ? ' refreshing' : ''}`} onClick={handlePullDown} disabled={refreshing}>
                    <span className={`refresh-icon${refreshing ? ' spinning' : ''}`} aria-label="refresh" role="img">
                        <img src="/images/refresh-icon.png" alt="refresh" width="20" height="20" style={{display:'block'}} />
                    </span>
                    {refreshing ? 'Refreshing...' : 'Get New Events'}
                </button>
                {/* Timeline events */}
                {renderList.map(({ key, group }, idx) => {
                    const isSelected = selectedMedia && key === makeGroupKey(selectedMedia);
                    
                    // For 'latest' scope (ungrouped), check individual video views
                    // For other scopes (grouped), check group views
                    // Handle search scope by using the actual scope for grouping logic
                    let actualScopeForGrouping = scope;
                    if (scope.startsWith('search:')) {
                        const storedScope = localStorage.getItem('lastNonSearchScope');
                        actualScopeForGrouping = storedScope || 'latest';
                    }
                    const isSeen = actualScopeForGrouping === 'latest'
                        ? group.every(event => seenVideos.includes(event.object_key))
                        : seenGroups.includes(key);
                    
                    const isLast = idx === renderList.length - 1;
                    return isLast ? (
                        <div ref={lastEventElementRef} key={key}>
                            <EventCard 
                                event={group} 
                                onSelectMedia={handleSelectMedia} 
                                isSelected={isSelected} 
                                isSeen={isSeen}
                                seenVideos={seenVideos}
                            />
                        </div>
                    ) : (
                        <EventCard 
                            key={key} 
                            event={group} 
                            onSelectMedia={handleSelectMedia} 
                            isSelected={isSelected} 
                            isSeen={isSeen}
                            seenVideos={seenVideos}
                        />
                    );
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
