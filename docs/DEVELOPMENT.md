# Development Guide

This guide is for developers who want to contribute to the Black Duck MCP Server or extend it with new features.

## Table of Contents
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Adding New Tools](#adding-new-tools)
- [Code Style](#code-style)
- [Testing](#testing)
- [Contributing](#contributing)

---

## Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm or yarn
- TypeScript knowledge
- Black Duck server access for testing
- Git

### Initial Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd black_duck_mcp
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Black Duck credentials
   ```

4. **Build the Project**
   ```bash
   npm run build
   ```

5. **Test the Server**
   ```bash
   npm start
   ```

---

## Project Structure

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
├── docs/                           # Documentation
│   ├── TOOLS.md                   # Tool documentation
│   ├── TROUBLESHOOTING.md         # Troubleshooting guide
│   ├── API_REFERENCE.md           # API documentation
│   └── DEVELOPMENT.md             # This file
├── .env                            # Local configuration (not in git)
├── .env.example                    # Configuration template
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
└── README.md                       # Main documentation
```

### Key Files Explained

#### `src/index.ts`
- Main entry point for the MCP server
- Registers all tools with the MCP SDK
- Handles tool requests and routing
- Defines parameter schemas using Zod

#### `src/config.ts`
- Loads configuration from environment variables
- Validates required configuration
- Provides defaults for optional settings

#### `src/client/blackduck-client.ts`
- HTTP client for Black Duck API
- Handles authentication
- Implements all API endpoint calls
- Error handling and retry logic

#### `src/client/types.ts`
- TypeScript type definitions
- Interfaces for API responses
- Type safety across the codebase

#### `src/tools/*.ts`
- Individual tool implementations
- Each file contains related tools
- Business logic for MCP tool handlers

#### `src/utils/*.ts`
- Shared utility functions
- Authentication helpers
- Error formatting

---

## Development Workflow

### Available Scripts

```bash
# Build TypeScript to JavaScript
npm run build

# Watch mode for development (auto-rebuild on changes)
npm run dev

# Start the server
npm start

# Clean build artifacts
npm run clean

# Full rebuild
npm run clean && npm run build
```

### Development Cycle

1. **Make Changes**
   - Edit TypeScript files in `src/`
   - Follow existing code patterns

2. **Build**
   ```bash
   npm run build
   ```

3. **Test Locally**
   ```bash
   npm start
   # In another terminal, test with MCP client
   ```

4. **Iterate**
   - Use `npm run dev` for auto-rebuild during development
   - Make incremental changes
   - Test frequently

---

## Adding New Tools

Follow these steps to add a new MCP tool:

### 1. Create Tool Implementation

Create or modify a file in `src/tools/` with your tool logic:

```typescript
// src/tools/my-new-tool.ts
import { blackDuckClient } from "../client/blackduck-client.js";
import { formatErrorForMCP } from "../utils/errors.js";

export interface MyToolParams {
  projectId: string;
  // ... other parameters
}

export async function myNewTool(params: MyToolParams): Promise<string> {
  try {
    // Validate parameters
    if (!params.projectId) {
      return "Error: projectId is required";
    }

    // Call Black Duck API
    const result = await blackDuckClient.someMethod(params.projectId);

    // Format and return result
    return JSON.stringify(result, null, 2);
  } catch (error) {
    return formatErrorForMCP(error);
  }
}
```

### 2. Add Type Definitions (if needed)

If you need new types, add them to `src/client/types.ts`:

```typescript
export interface MyNewDataType {
  id: string;
  name: string;
  // ... other fields
}
```

### 3. Add Client Method (if needed)

If you need a new API endpoint, add to `src/client/blackduck-client.ts`:

```typescript
async someMethod(projectId: string): Promise<MyNewDataType> {
  const response = await this.makeRequest(
    `/api/projects/${projectId}/new-endpoint`
  );
  return response.data;
}
```

### 4. Define Parameter Schema

In `src/index.ts`, add a Zod schema:

```typescript
const MyNewToolSchema = z.object({
  projectId: z.string().describe("UUID of the project"),
  // ... other parameters
});
```

### 5. Register Tool

In `src/index.ts`, add to the `ListToolsRequestSchema` handler:

```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // ... existing tools
      {
        name: "my_new_tool",
        description: "Clear description of what this tool does",
        inputSchema: {
          type: "object",
          properties: {
            projectId: {
              type: "string",
              description: "UUID of the project",
            },
            // ... other properties
          },
          required: ["projectId"],
        },
      },
    ],
  };
});
```

### 6. Add Tool Handler

In `src/index.ts`, add to the `CallToolRequestSchema` handler:

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    // ... existing cases

    case "my_new_tool": {
      const params = MyNewToolSchema.parse(args);
      const result = await myNewTool(params);
      return {
        content: [{ type: "text", text: result }],
      };
    }
  }
});
```

### 7. Import Tool Function

At the top of `src/index.ts`:

```typescript
import { myNewTool } from "./tools/my-new-tool.js";
```

### 8. Document the Tool

Add documentation to `docs/TOOLS.md` following the existing format.

### 9. Build and Test

```bash
npm run build
npm start
# Test your new tool
```

---

## Code Style

### TypeScript Guidelines

1. **Use Strong Typing**
   ```typescript
   // Good
   function procesData(data: ProjectData): Result {
     // ...
   }

   // Avoid
   function processData(data: any): any {
     // ...
   }
   ```

2. **Async/Await**
   ```typescript
   // Good
   async function getData(): Promise<Data> {
     const result = await client.fetch();
     return result;
   }

   // Avoid
   function getData(): Promise<Data> {
     return client.fetch().then(result => result);
   }
   ```

3. **Error Handling**
   ```typescript
   // Good
   try {
     const result = await riskyOperation();
     return formatSuccess(result);
   } catch (error) {
     return formatErrorForMCP(error);
   }

   // Avoid throwing errors from tool functions
   ```

4. **Use Descriptive Names**
   ```typescript
   // Good
   const vulnerabilitiesCount = items.length;

   // Avoid
   const cnt = items.length;
   ```

### Formatting

- Use 2 spaces for indentation
- Use semicolons
- Use double quotes for strings
- Keep lines under 100 characters when possible

### Comments

```typescript
/**
 * Get vulnerability details for a specific component
 *
 * @param projectId - UUID of the project
 * @param vulnerabilityId - CVE identifier
 * @returns Formatted vulnerability details
 */
async function getDetails(projectId: string, vulnerabilityId: string): Promise<string> {
  // Implementation
}
```

---

## Testing

### Manual Testing

1. **Configure Test Environment**
   - Use a test Black Duck instance
   - Don't test against production
   - Use test project with known data

2. **Test Each Tool**
   - Test happy path (valid inputs)
   - Test error cases (invalid inputs)
   - Test edge cases (empty results, large datasets)

3. **Integration Testing**
   - Test with Claude Desktop
   - Test complete workflows
   - Verify error messages are clear

### Test Checklist

For each new tool or change:
- [ ] Valid parameters work correctly
- [ ] Invalid parameters return clear errors
- [ ] Required parameters are validated
- [ ] Optional parameters have defaults
- [ ] Large result sets are handled (pagination)
- [ ] API errors are caught and formatted
- [ ] Authentication errors are handled
- [ ] Network errors are handled
- [ ] Documentation is updated

---

## Contributing

We welcome contributions! Here's how to contribute:

### 1. Fork and Clone

```bash
git clone <your-fork-url>
cd black_duck_mcp
```

### 2. Create Feature Branch

```bash
git checkout -b feature/my-new-feature
```

### 3. Make Changes

- Follow code style guidelines
- Add tests if applicable
- Update documentation

### 4. Commit Changes

```bash
git add .
git commit -m "Add new feature: description"
```

Use clear commit messages:
- `Add: new tool for X`
- `Fix: error handling in Y`
- `Update: documentation for Z`
- `Refactor: simplify X logic`

### 5. Push and Create PR

```bash
git push origin feature/my-new-feature
```

Create a pull request with:
- Clear description of changes
- Why the change is needed
- How to test the changes
- Screenshots (if UI-related)

### 6. Code Review

- Address review feedback
- Keep discussion professional
- Be open to suggestions

### What to Contribute

**Good First Issues:**
- Documentation improvements
- Error message clarity
- Additional examples
- Test coverage

**Feature Ideas:**
- New MCP tools for Black Duck features
- Performance optimizations
- Better error handling
- Caching strategies

**Bug Fixes:**
- Always welcome!
- Include reproduction steps
- Add tests if possible

---

## Architecture Decisions

### Why MCP?

Model Context Protocol (MCP) provides:
- Standardized interface for AI assistants
- Works with Claude and other MCP clients
- Extensible tool system
- Type-safe parameter validation

### Why TypeScript?

- Type safety prevents runtime errors
- Better IDE support and autocomplete
- Self-documenting code
- Easier refactoring

### Why Zod?

- Runtime type validation
- Automatic JSON schema generation
- TypeScript type inference
- Clear error messages

### Error Handling Strategy

- Never throw errors from tool functions
- Always return formatted error strings
- Include actionable error messages
- Log detailed errors server-side

---

## Getting Help

- Check existing issues on GitHub
- Review documentation in `docs/`
- Test with simple cases first
- Ask questions in discussions

## License

This project is licensed under the MIT License - see the LICENSE file for details.
