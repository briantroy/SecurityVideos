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

### Save Viewing History
```bash
curl -X POST "https://api.security-videos.brianandkelly.ws/v4/viewed-videos/john.doe%40brianandkelly.ws" \
  -H "Content-Type: application/json" \
  --cookie cookies.txt \
  -d '{
    "userId": "john.doe@brianandkelly.ws",
    "timestamp": "2023-12-31T23:59:59.999Z",
    "viewedEvents": [
      "cameras/front-door/video1.mp4|cameras/front-door/video2.mp4",
      "cameras/back-yard/video3.mp4"
    ],
    "viewedVideos": [
      "cameras/front-door/video1.mp4",
      "cameras/front-door/video2.mp4",
      "cameras/back-yard/video3.mp4",
      "cameras/garage/video4.mp4"
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "wasMerged": true,
  "viewedEvents": [
    "cameras/front-door/video1.mp4|cameras/front-door/video2.mp4",
    "cameras/back-yard/video3.mp4",
    "cameras/kitchen/video5.mp4"
  ],
  "viewedVideos": [
    "cameras/front-door/video1.mp4",
    "cameras/front-door/video2.mp4",
    "cameras/back-yard/video3.mp4",
    "cameras/garage/video4.mp4",
    "cameras/kitchen/video5.mp4"
  ],
  "timestamp": "2023-12-31T23:59:59.999Z"
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

### Save Viewing History
```javascript
const saveViewingHistory = async (userId, viewedEvents, viewedVideos) => {
  const url = `https://api.security-videos.brianandkelly.ws/v4/viewed-videos/${encodeURIComponent(userId)}`;

  const payload = {
    userId,
    timestamp: new Date().toISOString(),
    viewedEvents,
    viewedVideos
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Save failed with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to save viewing history:', error);
    throw error;
  }
};
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