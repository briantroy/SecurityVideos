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
 * Save the entire camera/filter configuration (overwrites existing).
 * @param {Array} cameras - Array of camera names
 * @param {object} filters - Complete filters object with operator-based structure
 * @returns {Promise<object>}
 */
export const saveCameraConfig = async (cameras, filters) => {
    const response = await fetch(`${API_HOST}/cameras`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cameras, filters })
    });

    if (!response.ok) {
        const error = new Error(`Save configuration failed: ${response.status}`);
        error.status = response.status;
        throw error;
    }

    return response.json();
};

/**
 * Fetches events based on the specified scope (latest, camera, or filter).
 * @param {string} scope - The scope of events to fetch ('latest', a camera name, or 'filter:filter_name').
 * @param {object} options - Additional options like 'older_than_ts' for pagination.
 * @param {string} userId - Optional user identifier to fetch viewed videos/events data from server.
 * @returns {Promise<object>}
 *
 *
 */
export const getEvents = async (scope, options = {}, userId = null) => {
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

    // Fetch viewed videos from server after fetching events
    if (userId) {
        try {
            // Retrieve the last stored timestamp for incremental updates
            let lastTimestamp = localStorage.getItem('viewedVideosTimestamp');

            // If timestamp is older than 24 hours, treat it as a first request
            if (lastTimestamp) {
                const timestampAge = Date.now() - new Date(lastTimestamp).getTime();
                const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
                if (timestampAge > twentyFourHours) {
                    lastTimestamp = null; // Discard stale timestamp
                }
            }

            const viewedData = await getViewedVideos(userId, lastTimestamp);

            // If server has viewed data, attach it to the result
            if (viewedData) {
                result._serverViewedData = {
                    viewedEvents: viewedData.viewedEvents || [],
                    viewedVideos: viewedData.viewedVideos || [],
                    timestamp: viewedData.timestamp,
                    isIncremental: lastTimestamp !== null // Track if this was an incremental update
                };

                // Store the new timestamp for future incremental updates
                if (viewedData.timestamp) {
                    localStorage.setItem('viewedVideosTimestamp', viewedData.timestamp);
                }
            }
        } catch (error) {
            console.warn('Failed to fetch viewed videos:', error);
            // Don't fail the main request if fetching viewed data fails
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
 * Gets viewed videos and events from the server.
 * @param {string} userId - The user identifier.
 * @param {string} since - Optional timestamp to fetch only changes since this time.
 * @returns {Promise<object>} - The server response with viewed data or null if user not found.
 *
 * Returns:
 * - 200: { userId, timestamp, viewedEvents, viewedVideos, viewedEventsCount, viewedVideosCount }
 * - 404: null (user not found, no viewed data yet)
 * - 400 or other errors: throws error
 */
export const getViewedVideos = async (userId, since = null) => {
    const url = new URL(`${API_HOST}/viewed-videos/${encodeURIComponent(userId)}`);

    // Add since parameter if provided
    if (since) {
        url.searchParams.append('since', since);
    }

    const response = await fetch(url, {
        method: 'GET',
        credentials: 'include', // Send cookies (JWT)
        headers: {
            'Content-Type': 'application/json'
        }
    });

    // Handle 404 as "no viewed data yet" - this is expected for new users
    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        const error = new Error(`Get viewed videos failed with status: ${response.status}`);
        error.status = response.status;
        try {
            const errorData = await response.json();
            error.details = errorData;
        } catch (e) {
            // Ignore JSON parse errors
        }
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

/**
 * Fetches the latest temperature readings for all cameras.
 * @returns {Promise<object>} - Returns { cameras: {CameraName: {temperature, timestamp, unit}}, count }
 */
export const getLatestTemperatures = () => {
    return fetchFromApi('/temperatures/latest');
};

/**
 * Fetches temperature history for a specific camera.
 * @param {string} cameraName - The name of the camera.
 * @param {number} hours - Number of hours of history to fetch (default: 24).
 * @returns {Promise<object>} - Returns { camera_name, hours, count, readings: [{timestamp, temperature, unit}] }
 */
export const getTemperatureHistory = (cameraName, hours = 24) => {
    return fetchFromApi('/temperatures/history', { camera: cameraName, hours });
};