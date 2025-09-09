const API_HOST = 'https://api.security-videos.brianandkelly.ws';

/**
 * A helper function to handle API requests.
 * @param {string} endpoint - The API endpoint to call.
 * @param {string} token - The user's JWT token for authorization.
 * @param {object} params - Query parameters for the request.
 * @returns {Promise<object>} - The JSON response from the API.
 */
const fetchFromApi = async (endpoint, token, params = {}) => {
    const url = new URL(`${API_HOST}${endpoint}`);
    if (params) {
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    }

    const response = await fetch(url, {
        method: 'GET',
        crossDomain: true,
        headers: {
            "Authorization": token,
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        // Create an error object that mimics the structure of failed jQuery AJAX calls
        const error = new Error(`API call failed with status: ${response.status}`);
        error.status = response.status;
        throw error;
    }

    return response.json();
};

/**
 * Fetches the list of cameras and groups (filters).
 * @param {string} token - The user's JWT token.
 * @returns {Promise<object>}
 */
export const getCameraList = (token) => {
    return fetchFromApi('/cameras', token);
};

/**
 * Fetches events based on the specified scope (latest, camera, or filter).
 * @param {string} token - The user's JWT token.
 * @param {string} scope - The scope of events to fetch ('latest', a camera name, or 'filter:filter_name').
 * @param {object} options - Additional options like 'older_than_ts' for pagination.
 * @returns {Promise<object>}
 */
export const getEvents = (token, scope, options = {}) => {
    let endpoint = '/lastfive';
    let params = { num_results: 50, ...options };

    if (scope && scope !== 'latest') {
        if (scope.startsWith('filter:')) {
            params.filter = scope.replace('filter:', '');
        } else {
            endpoint = `/lastfive/${scope}`;
        }
    }

    return fetchFromApi(endpoint, token, params);
};

/**
 * Fetches Rekognition labels for a given image.
 * @param {string} token - The user's JWT token.
 * @param {string} imageKey - The S3 object key for the image.
 * @returns {Promise<object>}
 */
export const getImageLabels = (token, imageKey) => {
    return fetchFromApi('/image/labels', token, { 'image-key': imageKey });
};