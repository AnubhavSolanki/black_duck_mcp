# Black Duck API Reference

This document describes how the Black Duck MCP Server interacts with the Black Duck REST API.

## API Version

This MCP server is designed to work with **Black Duck REST API v2024.x** and later versions.

## Base URL

All API requests are made to your Black Duck server's base URL:
```
https://your-blackduck-server.com/api
```

## Authentication

The MCP server uses **API Token Authentication** with the `Authorization` header:
```
Authorization: Bearer <your-api-token>
```

## API Endpoints Used

### Project Management

#### List Projects
```
GET /api/projects
```
**Query Parameters:**
- `limit` - Maximum results to return
- `offset` - Pagination offset
- `q` - Search query for project name

**Used by:** `list_projects`, `find_project_by_name`

---

#### Get Project Details
```
GET /api/projects/{projectId}
```
**Path Parameters:**
- `projectId` - UUID of the project

**Used by:** `get_project_details`

---

#### List Project Versions
```
GET /api/projects/{projectId}/versions
```
**Path Parameters:**
- `projectId` - UUID of the project

**Query Parameters:**
- `limit` - Maximum results to return
- `offset` - Pagination offset

**Used by:** `list_project_versions`

---

### Vulnerability Management

#### Get Vulnerable BOM Components
```
GET /api/projects/{projectId}/versions/{versionId}/vulnerable-bom-components
```
**Path Parameters:**
- `projectId` - UUID of the project
- `versionId` - UUID of the project version

**Query Parameters:**
- `limit` - Maximum results to return
- `offset` - Pagination offset
- `filter` - Filter by severity, component name, etc.

**Response:** List of vulnerable components with embedded vulnerability details

**Used by:** `get_project_vulnerabilities`

---

#### Get Vulnerability Remediation Details
```
GET /api/projects/{projectId}/versions/{versionId}/components/{componentId}/versions/{componentVersionId}/vulnerabilities/{vulnerabilityId}/remediation
```
**Path Parameters:**
- `projectId` - UUID of the project
- `versionId` - UUID of the project version
- `componentId` - UUID of the component
- `componentVersionId` - UUID of the component version
- `vulnerabilityId` - Vulnerability identifier (e.g., CVE-2023-1234)

**Response:** Detailed vulnerability information including:
- CVSS v2 and v3 scores
- Attack vector details
- Remediation status
- Comments
- Technical description
- Solution information

**Used by:** `get_vulnerability_details`, `get_vulnerability_fix_guidance`

---

#### Update Vulnerability Remediation Status
```
PUT /api/projects/{projectId}/versions/{versionId}/components/{componentId}/versions/{componentVersionId}/vulnerabilities/{vulnerabilityId}/remediation
```
**Path Parameters:**
- `projectId` - UUID of the project
- `versionId` - UUID of the project version
- `componentId` - UUID of the component
- `componentVersionId` - UUID of the component version
- `vulnerabilityId` - Vulnerability identifier

**Request Body:**
```json
{
  "remediationStatus": "NOT_VULNERABLE",
  "comment": "This code path is never executed in our application"
}
```

**Valid Remediation Statuses:**
- `NEW`
- `REMEDIATION_REQUIRED`
- `REMEDIATION_COMPLETE`
- `DUPLICATE`
- `IGNORED`
- `MITIGATED`
- `NEEDS_REVIEW`
- `NOT_VULNERABLE`
- `PATCHED`

**Used by:** `update_vulnerability_remediation`

---

### Dependency Analysis & Fix Guidance

#### Get Dependency Paths
```
GET /api/projects/{projectId}/versions/{versionId}/components/{componentId}/versions/{componentVersionId}/origins/{originId}/dependency-paths
```
**Path Parameters:**
- `projectId` - UUID of the project
- `versionId` - UUID of the project version
- `componentId` - UUID of the component
- `componentVersionId` - UUID of the component version
- `originId` - UUID of the origin

**Response:**
- Dependency path from direct dependency to vulnerable component
- Type: `DIRECT` or `TRANSITIVE`
- Path nodes with component information
- Links to upgrade guidance endpoints

**Used by:** `get_vulnerability_fix_guidance`

**Purpose:** Determines if a vulnerable component is a direct dependency or transitive (indirect) dependency. This is critical for providing accurate remediation guidance.

---

#### Get Upgrade Guidance (Direct Dependencies)
```
GET /api/components/{componentId}/versions/{componentVersionId}/upgrade-guidance
```
**Path Parameters:**
- `componentId` - UUID of the component
- `componentVersionId` - UUID of the component version

**Response:**
```json
{
  "componentName": "log4j-core",
  "versionName": "2.14.1",
  "shortTerm": {
    "versionName": "2.17.0",
    "vulnerabilityRisk": {
      "critical": 0,
      "high": 0,
      "medium": 2,
      "low": 1
    }
  },
  "longTerm": {
    "versionName": "2.20.0",
    "vulnerabilityRisk": {
      "critical": 0,
      "high": 0,
      "medium": 0,
      "low": 0
    }
  }
}
```

**Used by:** `get_vulnerability_fix_guidance`

**Purpose:** Provides short-term and long-term upgrade recommendations for direct dependencies with vulnerability counts for each option.

---

#### Get Transitive Upgrade Guidance
```
GET /api/components/{componentId}/versions/{componentVersionId}/origins/{originId}/transitive-upgrade-guidance
```
**Path Parameters:**
- `componentId` - UUID of the component
- `componentVersionId` - UUID of the component version
- `originId` - UUID of the origin

**Response:** Similar to direct upgrade guidance, but indicates which parent dependency needs to be updated.

**Used by:** `get_vulnerability_fix_guidance`

**Purpose:** Provides upgrade guidance for transitive (indirect) dependencies, indicating which direct dependency needs to be updated to resolve the transitive vulnerability.

---

## Response Format

All API responses follow the Black Duck standard format:

### Success Response
```json
{
  "totalCount": 100,
  "items": [
    {
      // Resource data
      "_meta": {
        "href": "resource-url",
        "links": [
          {
            "rel": "related-resource",
            "href": "related-url"
          }
        ]
      }
    }
  ]
}
```

### Error Response
```json
{
  "errorCode": "ERROR_CODE",
  "errorMessage": "Human readable error message"
}
```

## Rate Limiting

Black Duck API implements rate limiting to prevent abuse:
- Rate limits are per user/token
- Typical limit: 60 requests per minute
- HTTP 429 response when limit exceeded
- Retry-After header indicates wait time

## Pagination

Large result sets use pagination:
- `limit` parameter: Maximum results per page (default: 100, max: 1000)
- `offset` parameter: Starting position (default: 0)
- `totalCount` in response: Total number of items

**Example:**
```
# First page (items 0-99)
GET /api/projects?limit=100&offset=0

# Second page (items 100-199)
GET /api/projects?limit=100&offset=100
```

## Filtering

Many endpoints support filtering via query parameters:

**Examples:**
```
# Filter by name
GET /api/projects?q=name:MyProject

# Filter by severity
GET /api/.../vulnerable-bom-components?filter=vulnerability:severity:CRITICAL

# Multiple filters
GET /api/projects?q=name:Web*&limit=50
```

## HATEOAS Links

Black Duck API uses HATEOAS (Hypermedia as the Engine of Application State):
- Resources include `_meta` section with links
- Links define relationships and available actions
- MCP server follows these links for navigation

**Example:**
```json
{
  "_meta": {
    "href": "https://blackduck.com/api/projects/abc-123",
    "links": [
      {
        "rel": "versions",
        "href": "https://blackduck.com/api/projects/abc-123/versions"
      }
    ]
  }
}
```

## Best Practices

### 1. Use Pagination
Always use pagination for large datasets to avoid timeouts:
```javascript
// Good
const limit = 100;
const offset = 0;

// Bad
// Requesting all data without pagination
```

### 2. Filter When Possible
Use filters to reduce data transfer and improve performance:
```javascript
// Good - Filter by severity
GET /api/.../vulnerable-bom-components?filter=vulnerability:severity:CRITICAL

// Less efficient - Get all and filter client-side
GET /api/.../vulnerable-bom-components
```

### 3. Cache Aggressively
- Project and version information changes infrequently
- Cache project IDs and version IDs
- Refresh cache periodically or on-demand

### 4. Handle Rate Limits
```javascript
// Implement exponential backoff
if (response.status === 429) {
  const retryAfter = response.headers['retry-after'];
  await sleep(retryAfter * 1000);
  // Retry request
}
```

### 5. Use Specific Endpoints
- Use most specific endpoint available
- Avoid unnecessary nested requests
- Follow HATEOAS links when appropriate

## Additional Resources

For complete API documentation, refer to your Black Duck server's built-in API documentation:
```
https://your-blackduck-server.com/api/doc/public
```

This provides:
- Interactive API explorer
- Complete endpoint documentation
- Request/response schemas
- Authentication details
- Example requests

## API Version Compatibility

| Black Duck Version | API Version | MCP Server Support |
|-------------------|-------------|-------------------|
| 2024.x | v2024 | ✅ Fully Supported |
| 2023.x | v2023 | ⚠️ Mostly Compatible |
| 2022.x and older | v2022 | ❌ Not Guaranteed |

**Note:** Some features like transitive upgrade guidance may not be available in older Black Duck versions.
