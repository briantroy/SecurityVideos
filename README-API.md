# Security Videos API Documentation

This directory contains comprehensive API documentation for the Security Videos application.

## Documentation Files

### 📋 [api-docs.yaml](./api-docs.yaml)
**OpenAPI 3.0 Specification**
- Complete Swagger/OpenAPI documentation
- All endpoints, request/response schemas, and authentication
- Can be imported into Swagger UI, Postman, or other API tools
- Includes detailed parameter descriptions and examples

### 🔧 [api-examples.md](./api-examples.md)
**Practical Usage Examples**
- cURL commands for all endpoints
- JavaScript/React integration examples
- Error handling patterns
- Authentication flow examples

## API Overview

**Base URL:** `https://api.security-videos.brianandkelly.ws/v4`

### Authentication
- Google OAuth 2.0 with JWT session cookies
- All endpoints require authentication except `/auth/*`
- Sessions managed via httpOnly cookies

### Core Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/google` | POST | Login with Google OAuth |
| `/auth/status` | GET | Check authentication status |
| `/auth/logout` | POST | Sign out user |
| `/cameras` | GET | Get camera list and filters |
| `/lastfive` | GET | Get latest events (all cameras) |
| `/lastfive/{camera}` | GET | Get events from specific camera |
| `/image/labels` | GET | Get AWS Rekognition labels |
| `/viewed-videos/{userId}` | POST | Save user viewing history |

## Quick Start

### 1. View API Documentation
```bash
# Install swagger-ui-serve (optional)
npm install -g swagger-ui-serve

# Serve the API docs locally
swagger-ui-serve api-docs.yaml
```

### 2. Test Authentication
```bash
# Check if you have a valid session
curl -X GET https://api.security-videos.brianandkelly.ws/v4/auth/status \
  --cookie-jar cookies.txt
```

### 3. Fetch Camera List
```bash
curl -X GET https://api.security-videos.brianandkelly.ws/v4/cameras \
  --cookie cookies.txt
```

### 4. Get Latest Events
```bash
curl -X GET "https://api.security-videos.brianandkelly.ws/v4/lastfive?num_results=5" \
  --cookie cookies.txt
```

## Integration

### React/JavaScript
The API is designed to work seamlessly with the React frontend:

```javascript
// Using fetch with credentials for session cookies
const apiCall = async (endpoint, options = {}) => {
  const response = await fetch(`${API_HOST}${endpoint}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status}`);
  }

  return response.json();
};
```

### Development Tools
- **Postman**: Import `api-docs.yaml` for interactive testing
- **Insomnia**: Supports OpenAPI 3.0 import
- **VS Code**: Use REST Client extension with examples
- **Swagger UI**: Self-host or use online editor

## Features

### Pagination
Events endpoints support cursor-based pagination:
```javascript
// Get next page using LastEvaluatedKey
const nextPage = await fetch('/lastfive', {
  body: JSON.stringify({
    older_than_ts: lastKey.event_ts,
    capture_date: lastKey.capture_date
  })
});
```

### Filtering
Multiple filtering options available:
- **Camera-specific**: `/lastfive/Front%20Door`
- **Group filters**: `?filter=outdoor`
- **Date filtering**: `?video_date=2023-12-31`
- **Real-time refresh**: `?newer_than_ts=1234567890`

### Error Handling
Consistent error response format:
```json
{
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE",
  "details": { "additional": "context" }
}
```

## Security

- **Authentication**: Google OAuth 2.0 with domain restrictions
- **Session Management**: Secure httpOnly JWT cookies
- **CORS**: Configured for specific origins
- **Rate Limiting**: Prevents abuse (see api-examples.md)

## Support

For API issues or questions:
1. Check the examples in `api-examples.md`
2. Validate requests against `api-docs.yaml`
3. Review error codes and responses
4. Test with cURL before integrating

## Development

When modifying the API:
1. Update `api-docs.yaml` with any changes
2. Add new examples to `api-examples.md`
3. Test all endpoints with updated documentation
4. Validate OpenAPI spec with swagger-validator