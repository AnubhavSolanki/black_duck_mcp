# Black Duck MCP Server

A Model Context Protocol (MCP) server that integrates with Black Duck to provide vulnerability management capabilities through Claude and other MCP clients.

## Features

- **Project Management**: List, search, and retrieve details about Black Duck projects
- **Vulnerability Tracking**: Query vulnerabilities across project versions with filtering by severity
- **Fix Guidance & Upgrade Paths**: Determine if vulnerabilities are fixable and get specific upgrade recommendations for both direct and transitive dependencies
- **Remediation Management**: Update vulnerability remediation status and add justification comments
- **Dependency Analysis**: Identify whether vulnerable components are direct or transitive dependencies
- **Risk Assessment**: View vulnerability risk reduction metrics for different upgrade paths
- **API Token Authentication**: Secure authentication using Black Duck API tokens
- **Comprehensive Error Handling**: Clear error messages for troubleshooting

## Available Tools

### 1. `list_projects`
List all Black Duck projects with optional filtering and pagination.

**Parameters:**
- `limit` (optional): Maximum number of results (default: 100)
- `offset` (optional): Pagination offset (default: 0)
- `searchTerm` (optional): Filter by project name (partial match)

**Example:**
```
List all projects
Show projects with "webapp" in the name
```

### 2. `find_project_by_name`
Find projects by name with partial matching support.

**Parameters:**
- `projectName` (required): Name to search for

**Example:**
```
Find project named "MyApplication"
```

### 3. `get_project_details`
Get detailed information about a specific project including all versions.

**Parameters:**
- `projectId` (required): UUID of the project

**Example:**
```
Get details for project abc-123-def
```

### 4. `list_project_versions`
List all versions of a specific project.

**Parameters:**
- `projectId` (required): UUID of the project
- `limit` (optional): Maximum number of results (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Example:**
```
List versions for project abc-123-def
```

### 5. `get_project_vulnerabilities`
Get vulnerable components and their vulnerabilities for a project version.

**Parameters:**
- `projectId` (required): UUID of the project
- `projectVersionId` (required): UUID of the project version
- `limit` (optional): Maximum results (default: 100)
- `offset` (optional): Pagination offset (default: 0)
- `severity` (optional): Filter by severity (CRITICAL, HIGH, MEDIUM, LOW, INFO, UNSPECIFIED)
- `searchTerm` (optional): Search by component or vulnerability name

**Example:**
```
Show all CRITICAL vulnerabilities in project abc-123-def version xyz-789
```

### 6. `get_vulnerability_details`
Get detailed information about a specific vulnerability including CVSS scores and remediation info.

**Parameters:**
- `projectId` (required): UUID of the project
- `projectVersionId` (required): UUID of the project version
- `componentId` (required): UUID of the component
- `componentVersionId` (required): UUID of the component version
- `vulnerabilityId` (required): Vulnerability ID (e.g., CVE-2023-1234)

**Example:**
```
Get details for CVE-2023-1234 in the specified component
```

### 7. `update_vulnerability_remediation`
Update the remediation status and add comments for a vulnerability.

**Parameters:**
- `projectId` (required): UUID of the project
- `projectVersionId` (required): UUID of the project version
- `componentId` (required): UUID of the component
- `componentVersionId` (required): UUID of the component version
- `vulnerabilityId` (required): Vulnerability ID (e.g., CVE-2023-1234)
- `remediationStatus` (required): One of: NEW, REMEDIATION_REQUIRED, REMEDIATION_COMPLETE, DUPLICATE, IGNORED, MITIGATED, NEEDS_REVIEW, NOT_VULNERABLE, PATCHED
- `comment` (optional): Explanation for the remediation decision

**Example:**
```
Mark CVE-2023-1234 as NOT_VULNERABLE with comment "This code path is never executed"
```

### 8. `get_vulnerability_fix_guidance`
Determine if a vulnerability is fixable and get specific upgrade paths. This tool identifies whether a vulnerability can be fixed by upgrading the component and provides detailed recommendations.

**Parameters:**
- `projectId` (required): UUID of the project
- `projectVersionId` (required): UUID of the project version
- `componentId` (required): UUID of the component
- `componentVersionId` (required): UUID of the component version
- `vulnerabilityId` (required): Vulnerability ID (e.g., CVE-2023-1234)
- `originId` (required): UUID of the origin

**Returns:**
- Vulnerability details including severity and CVSS scores
- Component information and dependency type (DIRECT or TRANSITIVE)
- Short-term upgrade recommendations with risk analysis
- Long-term upgrade recommendations with risk analysis
- Step-by-step remediation guidance
- Risk reduction metrics for each upgrade path

**Example:**
```
Get fix guidance for CVE-2023-1234 in the specified component
Check if upgrading can fix the log4j vulnerability
```

## Installation

### Prerequisites
- Node.js 18.x or higher
- Black Duck server with API access
- Black Duck API token

### Setup

1. Clone or download this repository:
```bash
cd black_duck_mcp
```

2. Install dependencies:
```bash
npm install
```

3. Create configuration file:
```bash
cp .env.example .env
```

4. Edit `.env` with your Black Duck credentials:
```bash
BLACK_DUCK_URL=https://your-blackduck-server.com
BLACK_DUCK_API_TOKEN=your-api-token-here
```

**Getting a Black Duck API Token:**
1. Log into your Black Duck server
2. Navigate to your user profile (top right)
3. Go to "My Access Tokens"
4. Create a new token with appropriate permissions
5. Copy the token to your `.env` file

5. Build the TypeScript code:
```bash
npm run build
```

6. Test the server:
```bash
npm start
```

## Usage with Claude Desktop

### Configuration

Add this server to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "blackduck": {
      "command": "node",
      "args": [
        "/absolute/path/to/black_duck_mcp/dist/index.js"
      ],
      "env": {
        "BLACK_DUCK_URL": "https://your-blackduck-server.com",
        "BLACK_DUCK_API_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

**Note**: Replace `/absolute/path/to/black_duck_mcp` with the actual path to this project on your system.

### Restart Claude Desktop

After updating the configuration, restart Claude Desktop for the changes to take effect.

### Example Conversations

Once configured, you can interact with Black Duck through Claude:

```
You: List all Black Duck projects

You: Find the project named "WebApp Production"

You: Show me all CRITICAL vulnerabilities in that project

You: What are the details of CVE-2023-12345?

You: Can I fix CVE-2023-12345 by upgrading the component?

You: Mark CVE-2023-12345 as NOT_VULNERABLE because we don't use that code path
```

## Development

### Project Structure

```
black_duck_mcp/
├── src/
│   ├── index.ts                    # Main MCP server entry point
│   ├── config.ts                   # Configuration loader
│   ├── client/
│   │   ├── blackduck-client.ts    # Black Duck API client
│   │   └── types.ts               # TypeScript type definitions
│   ├── tools/
│   │   ├── projects.ts            # Project-related tools
│   │   ├── vulnerabilities.ts     # Vulnerability tools
│   │   ├── remediation.ts         # Remediation status tools
│   │   └── fix-guidance.ts        # Vulnerability fix guidance and upgrade paths
│   └── utils/
│       ├── auth.ts                # Authentication helpers
│       └── errors.ts              # Error handling utilities
├── dist/                           # Compiled JavaScript (generated)
├── .env                            # Local configuration (not in git)
├── .env.example                    # Configuration template
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
└── README.md                       # This file
```

### Available Scripts

```bash
# Build TypeScript to JavaScript
npm run build

# Watch mode for development
npm run dev

# Start the server
npm start

# Clean build artifacts
npm run clean
```

### Adding New Tools

1. Create tool functions in the appropriate file under `src/tools/`
2. Define parameter schemas using Zod in `src/index.ts`
3. Register the tool in the `ListToolsRequestSchema` handler
4. Add the tool case in the `CallToolRequestSchema` handler
5. Update this README with the new tool documentation

## Troubleshooting

### Authentication Errors

**Error**: `Authentication failed. Please check your API token.`

**Solution**:
- Verify your `BLACK_DUCK_API_TOKEN` in `.env` is correct
- Check that the token hasn't expired in Black Duck
- Ensure the token has appropriate permissions

### Connection Errors

**Error**: `Cannot connect to Black Duck server`

**Solution**:
- Verify `BLACK_DUCK_URL` is correct in `.env`
- Ensure the URL doesn't have a trailing slash
- Check network connectivity to Black Duck server
- Verify firewall rules allow connections

### Project Not Found

**Error**: `Project with ID 'xxx' not found`

**Solution**:
- Use `find_project_by_name` to locate the correct project ID
- Verify you have access to the project in Black Duck
- Check that the project hasn't been deleted

### Rate Limiting

**Error**: `Rate limit exceeded`

**Solution**:
- Wait before retrying
- Reduce pagination limits
- Contact Black Duck admin to adjust rate limits

### Timeout Errors

**Error**: `Request to Black Duck server timed out`

**Solution**:
- Increase `BLACK_DUCK_TIMEOUT` in `.env` (default: 30000ms)
- Check Black Duck server performance
- Reduce result limits for large queries

## API Reference

This MCP server integrates with Black Duck REST API v2024.x. Key endpoints used:

- `GET /api/projects` - List projects
- `GET /api/projects/{projectId}` - Get project details
- `GET /api/projects/{projectId}/versions` - List project versions
- `GET /api/projects/{projectId}/versions/{versionId}/vulnerable-bom-components` - Get vulnerabilities
- `GET /api/projects/{projectId}/versions/{versionId}/components/{componentId}/versions/{componentVersionId}/vulnerabilities/{vulnId}/remediation` - Get vulnerability details
- `PUT /api/projects/{projectId}/versions/{versionId}/components/{componentId}/versions/{componentVersionId}/vulnerabilities/{vulnId}/remediation` - Update remediation status
- `GET /api/projects/{projectId}/versions/{versionId}/components/{componentId}/versions/{componentVersionId}/origins/{originId}/dependency-paths` - Get dependency paths (direct vs transitive)
- `GET /api/components/{componentId}/versions/{componentVersionId}/upgrade-guidance` - Get upgrade guidance for direct dependencies
- `GET /api/components/{componentId}/versions/{componentVersionId}/origins/{originId}/transitive-upgrade-guidance` - Get upgrade guidance for transitive dependencies

For complete API documentation, refer to your Black Duck server's API documentation at `https://your-server.com/api/doc/public`.

## Security

- **Never commit** your `.env` file to version control
- Store API tokens securely
- Use environment-specific tokens (dev, staging, prod)
- Regularly rotate API tokens
- Follow your organization's security policies

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the troubleshooting section above
- Review Black Duck API documentation
- Open an issue on the project repository

## Acknowledgments

Built with:
- [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk) by Anthropic
- [Black Duck](https://www.blackduck.com/) by Synopsys
- TypeScript, Node.js, Axios, Zod