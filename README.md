# Black Duck MCP Server

A Model Context Protocol (MCP) server that integrates with Black Duck to provide vulnerability management capabilities through Claude and other MCP clients.

## Features

- **Project Management** - List, search, and retrieve details about Black Duck projects
- **Vulnerability Tracking** - Query vulnerabilities across project versions with filtering by severity
- **Fix Guidance & Upgrade Paths** - Determine if vulnerabilities are fixable and get specific upgrade recommendations for both direct and transitive dependencies
- **Remediation Management** - Update vulnerability remediation status and add justification comments
- **Dependency Analysis** - Identify whether vulnerable components are direct or transitive dependencies
- **Risk Assessment** - View vulnerability risk reduction metrics for different upgrade paths

## Quick Start

### Prerequisites
- Node.js 18.x or higher
- Black Duck server with API access
- Black Duck API token ([How to get one](#getting-an-api-token))

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Black Duck URL and API token
   ```

3. **Build the server**
   ```bash
   npm run build
   ```

### Getting an API Token

1. Log into your Black Duck server
2. Navigate to your user profile (top right)
3. Go to "My Access Tokens"
4. Create a new token with appropriate permissions
5. Copy the token to your `.env` file

## Usage with Claude Desktop

Add this configuration to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "blackduck": {
      "command": "node",
      "args": ["/absolute/path/to/black_duck_mcp/dist/index.js"],
      "env": {
        "BLACK_DUCK_URL": "https://your-blackduck-server.com",
        "BLACK_DUCK_API_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

**Note**: Replace `/absolute/path/to/black_duck_mcp` with the actual path to this project.

Restart Claude Desktop after updating the configuration.

## Example Conversations

Once configured, you can interact with Black Duck through Claude:

```
You: List all Black Duck projects

You: Find the project named "WebApp Production"

You: Show me all CRITICAL vulnerabilities in that project

You: What are the details of CVE-2023-12345?

You: Can I fix CVE-2023-12345 by upgrading the component?

You: Mark CVE-2023-12345 as NOT_VULNERABLE because we don't use that code path
```

## Documentation

- **[Available Tools](docs/TOOLS.md)** - Detailed documentation for all 8 MCP tools
- **[Troubleshooting Guide](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[API Reference](docs/API_REFERENCE.md)** - Black Duck API endpoints and usage
- **[Development Guide](docs/DEVELOPMENT.md)** - Contributing and extending the server

## Available Tools Summary

| Tool | Description |
|------|-------------|
| `list_projects` | List all Black Duck projects with filtering and pagination |
| `find_project_by_name` | Search for projects by name (partial matching) |
| `get_project_details` | Get detailed project information including versions |
| `list_project_versions` | List all versions of a specific project |
| `get_project_vulnerabilities` | Get vulnerabilities with severity filtering |
| `get_vulnerability_details` | Get detailed vulnerability information and CVSS scores |
| `update_vulnerability_remediation` | Update remediation status and add comments |
| `get_vulnerability_fix_guidance` | Determine if vulnerabilities are fixable and get upgrade paths |

See [full tool documentation](docs/TOOLS.md) for parameters, examples, and response formats.

## Development

```bash
# Build the project
npm run build

# Watch mode for development
npm run dev

# Start the server
npm start

# Clean build artifacts
npm run clean
```

See the [Development Guide](docs/DEVELOPMENT.md) for detailed information about contributing.

## Security

- **Never commit** your `.env` file to version control
- Store API tokens securely
- Use environment-specific tokens (dev, staging, prod)
- Regularly rotate API tokens
- Follow your organization's security policies

## Support

- **Issues**: Check the [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- **API Questions**: See the [API Reference](docs/API_REFERENCE.md)
- **Contributing**: Read the [Development Guide](docs/DEVELOPMENT.md)
- **Bugs**: Open an issue on the project repository

## License

MIT License - see LICENSE file for details

## Acknowledgments

Built with:
- [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk) by Anthropic
- [Black Duck](https://www.blackduck.com/) by Synopsys
- TypeScript, Node.js, Axios, Zod
