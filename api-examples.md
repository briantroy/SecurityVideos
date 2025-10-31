# API Usage Examples

This document provides practical examples of how to interact with the Security Videos API.

## Authentication Flow

### 1. Google OAuth Login
```bash
curl -X POST https://api.security-videos.brianandkelly.ws/v4/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2NzAyN..."
  }' \
  --cookie-jar cookies.txt
```

**Response:**
```json
{
  "email": "john.doe@brianandkelly.ws",
  "name": "John Doe",
  "picture": "https://lh3.googleusercontent.com/a/default-user=s96-c"
}
```

### 2. Check Authentication Status
```bash
curl -X GET https://api.security-videos.brianandkelly.ws/v4/auth/status \
  --cookie cookies.txt
```

**Response:**
```json
{
  "email": "john.doe@brianandkelly.ws",
  "name": "John Doe",
  "picture": "https://lh3.googleusercontent.com/a/default-user=s96-c"
}
```

### 3. Logout
```bash
curl -X POST https://api.security-videos.brianandkelly.ws/v4/auth/logout \
  --cookie cookies.txt
```

## Camera Management

### Get Camera List
```bash
curl -X GET https://api.security-videos.brianandkelly.ws/v4/cameras \
  --cookie cookies.txt
```

**Response:**
```json
{
  "cameras": [
    "Front Door",
    "Back Yard",
    "Garage",
    "Living Room",
    "Kitchen"
  ],
  "filters": {
    "outdoor": ["Front Door", "Back Yard", "Garage"],
    "indoor": ["Living Room", "Kitchen"],
    "motion": ["Front Door", "Back Yard"],
    "entry_points": ["Front Door", "Garage"]
  }
}
```

## Event Retrieval

### Get Latest Events (All Cameras)
```bash
curl -X GET "https://api.security-videos.brianandkelly.ws/v4/lastfive?num_results=10" \
  --cookie cookies.txt
```

**Response:**
```json
{
  "Items": [
    {
      "object_key": "cameras/front-door/2023/12/31/video_20231231_235959.mp4",
      "event_ts": 1704067199000,
      "camera_name": "Front Door",
      "event_type": "motion",
      "uri": "https://videos.security-videos.brianandkelly.ws/cameras/front-door/2023/12/31/video_20231231_235959.mp4",
      "thumbnail_uri": "https://thumbnails.security-videos.brianandkelly.ws/cameras/front-door/2023/12/31/thumb_20231231_235959.jpg",
      "video_name": "video_20231231_235959.mp4",
      "capture_date": "2023-12-31",
      "duration": 30.5,
      "file_size": 2048000
    }
  ],
  "LastEvaluatedKey": {
    "event_ts": 1704067199000,
    "capture_date": "2023-12-31"
  }
}
```

### Get Events from Specific Camera
```bash
curl -X GET "https://api.security-videos.brianandkelly.ws/v4/lastfive/Front%20Door?num_results=5" \
  --cookie cookies.txt
```

### Get Events with Date Filter
```bash
curl -X GET "https://api.security-videos.brianandkelly.ws/v4/lastfive?video_date=2023-12-31&num_results=20" \
  --cookie cookies.txt
```

### Get Events with Group Filter
```bash
curl -X GET "https://api.security-videos.brianandkelly.ws/v4/lastfive?filter=outdoor&num_results=15" \
  --cookie cookies.txt
```

### Pagination - Get Older Events
```bash
curl -X GET "https://api.security-videos.brianandkelly.ws/v4/lastfive?older_than_ts=1704067199000&capture_date=2023-12-31" \
  --cookie cookies.txt
```

### Refresh - Get Newer Events
```bash
curl -X GET "https://api.security-videos.brianandkelly.ws/v4/lastfive?newer_than_ts=1704067199000&video_date=2023-12-31" \
  --cookie cookies.txt
```

## Image Analysis

### Get AWS Rekognition Labels
```bash
curl -X GET "https://api.security-videos.brianandkelly.ws/v4/image/labels?image-key=cameras/front-door/2023/12/31/image_20231231_235959.jpg" \
  --cookie cookies.txt
```

**Response:**
```json
{
  "labels": [
    {
      "Name": "Person",
      "Confidence": 98.5,
      "Instances": [
        {
          "BoundingBox": {
            "Width": 0.3,
            "Height": 0.7,
            "Left": 0.4,
            "Top": 0.1
          },
          "Confidence": 98.5
        }
      ],
      "Parents": [
        {
          "Name": "Human"
        }
      ]
    },
    {
      "Name": "Car",
      "Confidence": 85.2,
      "Instances": [
        {
          "BoundingBox": {
            "Width": 0.5,
            "Height": 0.3,
            "Left": 0.1,
            "Top": 0.6
          },
          "Confidence": 85.2
        }
      ],
      "Parents": [
        {
          "Name": "Vehicle"
        }
      ]
    }
  ],
  "image_key": "cameras/front-door/2023/12/31/image_20231231_235959.jpg"
}
```

## User Viewing History

### Get Viewing History (GET)

#### Full Sync (No `since` parameter)
Returns complete viewing history for initial sync or when cached data is stale.

```bash
curl -X GET "https://api.security-videos.brianandkelly.ws/v4/viewed-videos/john.doe%40brianandkelly.ws" \
  --cookie cookies.txt
```

**Response (200 OK):**
```json
{
  "userId": "john.doe@brianandkelly.ws",
  "timestamp": "2025-01-27T14:35:22.000Z",
  "viewedEvents": [
    "events/2025/01/27/front-door-motion-123.mp4",
    "events/2025/01/26/garage-door-456.mp4",
    "event-789"
  ],
  "viewedVideos": [
    "videos/2025/01/27/driveway-cam-001.mp4",
    "videos/2025/01/26/backyard-cam-002.mp4",
    "video-abc123"
  ],
  "viewedEventsCount": 3,
  "viewedVideosCount": 3
}
```

#### Incremental Sync (With `since` parameter)
Returns only items viewed after the specified timestamp for efficient updates.

```bash
curl -X GET "https://api.security-videos.brianandkelly.ws/v4/viewed-videos/john.doe%40brianandkelly.ws?since=2025-01-27T14%3A35%3A22.000Z" \
  --cookie cookies.txt
```

**Response (200 OK - New items since timestamp):**
```json
{
  "userId": "john.doe@brianandkelly.ws",
  "timestamp": "2025-01-27T15:42:10.000Z",
  "viewedEvents": [
    "events/2025/01/27/garage-cam-new-event.mp4"
  ],
  "viewedVideos": [
    "videos/2025/01/27/new-video-001.mp4"
  ],
  "viewedEventsCount": 1,
  "viewedVideosCount": 1
}
```

**Response (404 Not Found - User hasn't viewed anything yet):**
```json
{
  "error": "User not found",
  "userId": "john.doe@brianandkelly.ws"
}
```

### Mark Video as Viewed (PUT)

```bash
curl -X PUT "https://api.security-videos.brianandkelly.ws/v4/viewed-videos/john.doe%40brianandkelly.ws" \
  -H "Content-Type: application/json" \
  --cookie cookies.txt \
  -d '{
    "videoId": "cameras/front-door/2025/01/27/video_20250127_143522.mp4",
    "timestamp": "2025-01-27T14:35:22.000Z",
    "viewedTimestamp": "2025-01-27T14:36:00.000Z"
  }'
```

**Response:**
```json
{
  "success": true
}
```

### Mark Event as Viewed (PUT)

```bash
curl -X PUT "https://api.security-videos.brianandkelly.ws/v4/viewed-videos/john.doe%40brianandkelly.ws" \
  -H "Content-Type: application/json" \
  --cookie cookies.txt \
  -d '{
    "eventId": "events/2025/01/27/front-door-motion-123.mp4",
    "timestamp": "2025-01-27T14:35:22.000Z",
    "viewedTimestamp": "2025-01-27T14:36:00.000Z"
  }'
```

**Response:**
```json
{
  "success": true
}
```

## JavaScript Examples

### Authentication Check
```javascript
const checkAuth = async () => {
  try {
    const response = await fetch('https://api.security-videos.brianandkelly.ws/v4/auth/status', {
      credentials: 'include'
    });

    if (response.ok) {
      const userData = await response.json();
      console.log('User is authenticated:', userData);
    } else {
      console.log('User is not authenticated');
    }
  } catch (error) {
    console.error('Auth check failed:', error);
  }
};
```

### Fetch Events with Error Handling
```javascript
const fetchEvents = async (scope = 'latest', options = {}) => {
  const url = new URL('https://api.security-videos.brianandkelly.ws/v4/lastfive');

  // Add camera scope to URL path
  if (scope !== 'latest') {
    if (scope.startsWith('filter:')) {
      url.searchParams.append('filter', scope.replace('filter:', ''));
    } else {
      url.pathname += `/${encodeURIComponent(scope)}`;
    }
  }

  // Add query parameters
  Object.keys(options).forEach(key => {
    url.searchParams.append(key, options[key]);
  });

  try {
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = new Error(`API call failed with status: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch events:', error);
    throw error;
  }
};

// Usage examples
fetchEvents('latest', { num_results: 10 });
fetchEvents('Front Door', { num_results: 5 });
fetchEvents('filter:outdoor', { video_date: '2023-12-31' });
```

### Get Viewing History (JavaScript)

#### Full Sync

```javascript
const getViewingHistory = async (userId) => {
  const url = `https://api.security-videos.brianandkelly.ws/v4/viewed-videos/${encodeURIComponent(userId)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Handle 404 as "no viewed data yet" - this is expected for new users
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Get failed with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get viewing history:', error);
    throw error;
  }
};

// Usage
const viewedData = await getViewingHistory('john.doe@brianandkelly.ws');
if (viewedData) {
  console.log('Viewed events:', viewedData.viewedEvents);
  console.log('Viewed videos:', viewedData.viewedVideos);
  // Store timestamp for future incremental updates
  localStorage.setItem('viewedVideosTimestamp', viewedData.timestamp);
} else {
  console.log('User has not viewed any content yet');
}
```

#### Incremental Sync with Timestamp Management

```javascript
const getViewingHistoryIncremental = async (userId) => {
  // Retrieve the last stored timestamp
  let lastTimestamp = localStorage.getItem('viewedVideosTimestamp');

  // If timestamp is older than 24 hours, treat as first request
  if (lastTimestamp) {
    const timestampAge = Date.now() - new Date(lastTimestamp).getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (timestampAge > twentyFourHours) {
      lastTimestamp = null; // Discard stale timestamp
    }
  }

  // Build URL with optional since parameter
  const url = new URL(
    `https://api.security-videos.brianandkelly.ws/v4/viewed-videos/${encodeURIComponent(userId)}`
  );
  if (lastTimestamp) {
    url.searchParams.append('since', lastTimestamp);
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Get failed with status: ${response.status}`);
    }

    const viewedData = await response.json();

    // Store new timestamp for future incremental updates
    if (viewedData.timestamp) {
      localStorage.setItem('viewedVideosTimestamp', viewedData.timestamp);
    }

    // Determine if we need to merge or replace
    const isIncremental = lastTimestamp !== null;

    if (isIncremental) {
      // Merge with existing data
      const existingEvents = JSON.parse(localStorage.getItem('viewedEvents') || '[]');
      const existingVideos = JSON.parse(localStorage.getItem('viewedVideos') || '[]');

      const mergedEvents = [...new Set([...existingEvents, ...viewedData.viewedEvents])];
      const mergedVideos = [...new Set([...existingVideos, ...viewedData.viewedVideos])];

      localStorage.setItem('viewedEvents', JSON.stringify(mergedEvents));
      localStorage.setItem('viewedVideos', JSON.stringify(mergedVideos));

      return {
        ...viewedData,
        viewedEvents: mergedEvents,
        viewedVideos: mergedVideos
      };
    } else {
      // Full refresh - replace existing data
      localStorage.setItem('viewedEvents', JSON.stringify(viewedData.viewedEvents));
      localStorage.setItem('viewedVideos', JSON.stringify(viewedData.viewedVideos));

      return viewedData;
    }
  } catch (error) {
    console.error('Failed to get viewing history:', error);
    throw error;
  }
};

// Usage
const viewedData = await getViewingHistoryIncremental('john.doe@brianandkelly.ws');
if (viewedData) {
  console.log('Viewed events:', viewedData.viewedEvents);
  console.log('Viewed videos:', viewedData.viewedVideos);
}
```

### Mark Video as Viewed (JavaScript)

```javascript
const markVideoAsViewed = async (userId, videoId, timestamp) => {
  const url = `https://api.security-videos.brianandkelly.ws/v4/viewed-videos/${encodeURIComponent(userId)}`;

  const payload = {
    videoId,
    timestamp,
    viewedTimestamp: new Date().toISOString()
  };

  // Fire and forget - don't wait for response
  fetch(url, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  .then(async response => {
    if (!response.ok) {
      console.warn(`Mark video as viewed failed: ${response.status}`);
    }
  })
  .catch(err => {
    console.warn('Failed to mark video as viewed:', err);
  });
};

// Usage
markVideoAsViewed(
  'john.doe@brianandkelly.ws',
  'cameras/front-door/2025/01/27/video_20250127_143522.mp4',
  '2025-01-27T14:35:22.000Z'
);
```

### Mark Event as Viewed (JavaScript)

```javascript
const markEventAsViewed = async (userId, eventId, timestamp) => {
  const url = `https://api.security-videos.brianandkelly.ws/v4/viewed-videos/${encodeURIComponent(userId)}`;

  const payload = {
    eventId,
    timestamp,
    viewedTimestamp: new Date().toISOString()
  };

  // Fire and forget - don't wait for response
  fetch(url, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  .then(async response => {
    if (!response.ok) {
      console.warn(`Mark event as viewed failed: ${response.status}`);
    }
  })
  .catch(err => {
    console.warn('Failed to mark event as viewed:', err);
  });
};

// Usage
markEventAsViewed(
  'john.doe@brianandkelly.ws',
  'events/2025/01/27/front-door-motion-123.mp4',
  '2025-01-27T14:35:22.000Z'
);
```

## Error Handling

### Common Error Responses

**401 Unauthorized:**
```json
{
  "error": "Authentication required",
  "code": "AUTH_REQUIRED"
}
```

**403 Forbidden:**
```json
{
  "error": "User domain not allowed",
  "code": "DOMAIN_NOT_ALLOWED",
  "details": {
    "domain": "example.com",
    "allowed_domain": "brianandkelly.ws"
  }
}
```

**404 Not Found:**
```json
{
  "error": "Camera not found",
  "code": "CAMERA_NOT_FOUND",
  "details": {
    "camera_name": "Invalid Camera"
  }
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Authentication endpoints**: 10 requests per minute per IP
- **Data endpoints**: 100 requests per minute per user
- **Image analysis**: 20 requests per minute per user

When rate limited, you'll receive a `429 Too Many Requests` response:

```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMITED",
  "details": {
    "retry_after": 60
  }
}
```