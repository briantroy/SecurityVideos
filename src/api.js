export const API_HOST = 'https://api.security-videos.brianandkelly.ws/v4';

/**
 * A helper function to handle API requests using JWT from httpOnly cookie.
 * @param {string} endpoint - The API endpoint to call.
 * @param {object} params - Query parameters for the request.
 * @returns {Promise<object>} - The JSON response from the API.
 */
const fetchFromApi = async (endpoint, params = {}) => {
    const url = new URL(`${API_HOST}${endpoint}`);
    if (params) {
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    }

    const response = await fetch(url, {
        method: 'GET',
        credentials: 'include', // Send cookies (JWT)
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        const error = new Error(`API call failed with status: ${response.status}`);
        error.status = response.status;
        throw error;
    }

    return response.json();
};

/**
 * Fetches the list of cameras and groups (filters).
 * @returns {Promise<object>}
 */
export const getCameraList = () => {
    return fetchFromApi('/cameras');
};

/**
 * Fetches events based on the specified scope (latest, camera, or filter).
 * @param {string} scope - The scope of events to fetch ('latest', a camera name, or 'filter:filter_name').
 * @param {object} options - Additional options like 'older_than_ts' for pagination.
 * @param {object} viewedData - Optional object containing userId, viewedEvents, and viewedVideos for auto-saving.
 * @returns {Promise<object>}
 * 
 * 
 */
export const getEvents = async (scope, options = {}, viewedData = null) => {
    let endpoint = '/lastfive';
    let params = { num_results: 50, ...options };

    if (scope && scope !== 'latest') {
        if (scope.startsWith('filter:')) {
            params.filter = scope.replace('filter:', '');
        } else {
            endpoint = `/lastfive/${scope}`;
        }
    }

    const result = await fetchFromApi(endpoint, params);
    
    // Auto-save viewed videos after fetching events
    if (viewedData && viewedData.userId && (viewedData.viewedEvents || viewedData.viewedVideos)) {
        try {
            const saveResponse = await saveViewedVideos(
                viewedData.userId,
                viewedData.viewedEvents || [],
                viewedData.viewedVideos || []
            );
            
            // If server merged data, attach it to the result
            if (saveResponse.wasMerged) {
                result._mergedViewedData = saveResponse;
            }
        } catch (error) {
            console.warn('Failed to save viewed videos:', error);
            // Don't fail the main request if saving fails
        }
    }
    
    return result;
};

/**
 * Fetches Rekognition labels for a given image.
 * @param {string} imageKey - The S3 object key for the image.
 * @returns {Promise<object>}
 */
export const getImageLabels = (imageKey) => {
    return fetchFromApi('/image/labels', { 'image-key': imageKey });
};

/**
 * Saves viewed videos and events to the server.
 * @param {string} userId - The user identifier.
 * @param {Array<string>} viewedEvents - Array of viewed event group keys.
 * @param {Array<string>} viewedVideos - Array of viewed video object keys.
 * @returns {Promise<object>} - The server response with merged data.
 */
export const saveViewedVideos = async (userId, viewedEvents, viewedVideos) => {
    const url = `${API_HOST}/viewed-videos/${encodeURIComponent(userId)}`;

    const payload = {
        userId,
        timestamp: new Date().toISOString(),
        viewedEvents,
        viewedVideos
    };

    const response = await fetch(url, {
        method: 'POST',
        credentials: 'include', // Send cookies (JWT)
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const error = new Error(`Save viewed videos failed with status: ${response.status}`);
        error.status = response.status;
        throw error;
    }

    return response.json();
};

/**
 * Marks a video as viewed (async, fire-and-forget).
 * @param {string} userId - The user identifier.
 * @param {string} videoId - The video's object key.
 * @param {string} timestamp - The video's timestamp from the API.
 * @returns {Promise<void>} - Resolves when the request is sent (doesn't wait for response).
 */
export const markVideoAsViewed = async (userId, videoId, timestamp) => {
    const url = `${API_HOST}/viewed-videos/${encodeURIComponent(userId)}`;

    const payload = {
        videoId,
        timestamp,
        viewedTimestamp: new Date().toISOString()
    };

    // Fire and forget, but log detailed errors for debugging
    fetch(url, {
        method: 'PUT',
        credentials: 'include', // Send httpOnly JWT cookie
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(async response => {
        if (!response.ok) {
            const errorText = await response.text();
            console.warn(`Mark video as viewed failed: ${response.status} ${response.statusText}`);
            console.warn('Response body:', errorText);
            console.warn('Payload sent:', payload);
        }
    })
    .catch(err => {
        console.warn('Failed to mark video as viewed:', err);
    });
};

/**
 * Marks an event as viewed (async, fire-and-forget).
 * @param {string} userId - The user identifier.
 * @param {string} eventId - The event's group key.
 * @param {string} timestamp - The timestamp of the first event in the group.
 * @returns {Promise<void>} - Resolves when the request is sent (doesn't wait for response).
 */
export const markEventAsViewed = async (userId, eventId, timestamp) => {
    const url = `${API_HOST}/viewed-videos/${encodeURIComponent(userId)}`;

    const payload = {
        eventId,
        timestamp,
        viewedTimestamp: new Date().toISOString()
    };

    // Fire and forget, but log detailed errors for debugging
    fetch(url, {
        method: 'PUT',
        credentials: 'include', // Send httpOnly JWT cookie
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(async response => {
        if (!response.ok) {
            const errorText = await response.text();
            console.warn(`Mark event as viewed failed: ${response.status} ${response.statusText}`);
            console.warn('Response body:', errorText);
            console.warn('Payload sent:', payload);
        }
    })
    .catch(err => {
        console.warn('Failed to mark event as viewed:', err);
    });
};