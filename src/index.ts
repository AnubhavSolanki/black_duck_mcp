#!/usr/bin/env node

/**
 * Black Duck MCP Server
 * Model Context Protocol server for Black Duck vulnerability management
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Import tool functions
import {
  listProjects,
  findProjectByName,
  getProjectDetails,
  listProjectVersions,
} from './tools/projects.js';
import {
  getProjectVulnerabilities,
  getVulnerabilityDetails,
} from './tools/vulnerabilities.js';
import {
  updateVulnerabilityRemediation,
} from './tools/remediation.js';

// Tool parameter schemas
const ListProjectsSchema = z.object({
  limit: z.number().optional().default(100).describe('Maximum number of results to return'),
  offset: z.number().optional().default(0).describe('Number of results to skip for pagination'),
  searchTerm: z.string().optional().describe('Filter projects by name (partial match)'),
});

const FindProjectByNameSchema = z.object({
  projectName: z.string().describe('Project name to search for (partial match supported)'),
});

const GetProjectDetailsSchema = z.object({
  projectId: z.string().describe('UUID of the project'),
});

const ListProjectVersionsSchema = z.object({
  projectId: z.string().describe('UUID of the project'),
  limit: z.number().optional().default(100).describe('Maximum number of results to return'),
  offset: z.number().optional().default(0).describe('Number of results to skip for pagination'),
});

const GetProjectVulnerabilitiesSchema = z.object({
  projectId: z.string().describe('UUID of the project'),
  projectVersionId: z.string().describe('UUID of the project version'),
  limit: z.number().optional().default(100).describe('Maximum number of results to return'),
  offset: z.number().optional().default(0).describe('Number of results to skip for pagination'),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO', 'UNSPECIFIED']).optional()
    .describe('Filter by vulnerability severity'),
  searchTerm: z.string().optional().describe('Search by component or vulnerability name'),
});

const GetVulnerabilityDetailsSchema = z.object({
  projectId: z.string().describe('UUID of the project'),
  projectVersionId: z.string().describe('UUID of the project version'),
  componentId: z.string().describe('UUID of the component'),
  componentVersionId: z.string().describe('UUID of the component version'),
  vulnerabilityId: z.string().describe('Vulnerability identifier (e.g., CVE-2023-1234)'),
});

const UpdateVulnerabilityRemediationSchema = z.object({
  projectId: z.string().describe('UUID of the project'),
  projectVersionId: z.string().describe('UUID of the project version'),
  componentId: z.string().describe('UUID of the component'),
  componentVersionId: z.string().describe('UUID of the component version'),
  vulnerabilityId: z.string().describe('Vulnerability identifier (e.g., CVE-2023-1234)'),
  remediationStatus: z.enum([
    'NEW',
    'REMEDIATION_REQUIRED',
    'REMEDIATION_COMPLETE',
    'DUPLICATE',
    'IGNORED',
    'MITIGATED',
    'NEEDS_REVIEW',
    'NOT_VULNERABLE',
    'PATCHED',
  ]).describe('New remediation status for the vulnerability'),
  comment: z.string().optional().describe('Optional comment explaining the remediation decision'),
});

/**
 * Create and configure the MCP server
 */
async function main() {
  const server = new Server(
    {
      name: 'blackduck-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  /**
   * Handler for listing available tools
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'list_projects',
          description:
            'List all Black Duck projects. Supports pagination and filtering by project name. Returns project IDs, names, descriptions, and metadata.',
          inputSchema: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Maximum number of results to return (default: 100)',
              },
              offset: {
                type: 'number',
                description: 'Number of results to skip for pagination (default: 0)',
              },
              searchTerm: {
                type: 'string',
                description: 'Filter projects by name (partial match)',
              },
            },
          },
        },
        {
          name: 'find_project_by_name',
          description:
            'Find Black Duck projects by name. Supports partial matching. Returns matching projects with their IDs and details. Useful when you know the project name but need the project ID.',
          inputSchema: {
            type: 'object',
            properties: {
              projectName: {
                type: 'string',
                description: 'Project name to search for (partial match supported)',
              },
            },
            required: ['projectName'],
          },
        },
        {
          name: 'get_project_details',
          description:
            'Get detailed information about a specific Black Duck project, including all its versions. Requires the project ID (use find_project_by_name first if you only know the name).',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: {
                type: 'string',
                description: 'UUID of the project',
              },
            },
            required: ['projectId'],
          },
        },
        {
          name: 'list_project_versions',
          description:
            'List all versions of a specific Black Duck project. Returns version IDs, names, phases, and distribution information.',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: {
                type: 'string',
                description: 'UUID of the project',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of results to return (default: 100)',
              },
              offset: {
                type: 'number',
                description: 'Number of results to skip for pagination (default: 0)',
              },
            },
            required: ['projectId'],
          },
        },
        {
          name: 'get_project_vulnerabilities',
          description:
            'Get all vulnerable components and their vulnerabilities for a specific project version. Returns vulnerability details including severity, CVSS scores, remediation status, and component information. Supports filtering by severity and searching by name.',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: {
                type: 'string',
                description: 'UUID of the project',
              },
              projectVersionId: {
                type: 'string',
                description: 'UUID of the project version',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of results to return (default: 100)',
              },
              offset: {
                type: 'number',
                description: 'Number of results to skip for pagination (default: 0)',
              },
              severity: {
                type: 'string',
                enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO', 'UNSPECIFIED'],
                description: 'Filter by vulnerability severity',
              },
              searchTerm: {
                type: 'string',
                description: 'Search by component or vulnerability name',
              },
            },
            required: ['projectId', 'projectVersionId'],
          },
        },
        {
          name: 'get_vulnerability_details',
          description:
            'Get detailed information about a specific vulnerability in a component. Returns full CVSS scores (v2/v3), remediation information, technical description, and solution details.',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: {
                type: 'string',
                description: 'UUID of the project',
              },
              projectVersionId: {
                type: 'string',
                description: 'UUID of the project version',
              },
              componentId: {
                type: 'string',
                description: 'UUID of the component',
              },
              componentVersionId: {
                type: 'string',
                description: 'UUID of the component version',
              },
              vulnerabilityId: {
                type: 'string',
                description: 'Vulnerability identifier (e.g., CVE-2023-1234)',
              },
            },
            required: [
              'projectId',
              'projectVersionId',
              'componentId',
              'componentVersionId',
              'vulnerabilityId',
            ],
          },
        },
        {
          name: 'update_vulnerability_remediation',
          description:
            'Update the remediation status and add comments for a specific vulnerability. Valid statuses: NEW, REMEDIATION_REQUIRED, REMEDIATION_COMPLETE, DUPLICATE, IGNORED, MITIGATED, NEEDS_REVIEW, NOT_VULNERABLE, PATCHED.',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: {
                type: 'string',
                description: 'UUID of the project',
              },
              projectVersionId: {
                type: 'string',
                description: 'UUID of the project version',
              },
              componentId: {
                type: 'string',
                description: 'UUID of the component',
              },
              componentVersionId: {
                type: 'string',
                description: 'UUID of the component version',
              },
              vulnerabilityId: {
                type: 'string',
                description: 'Vulnerability identifier (e.g., CVE-2023-1234)',
              },
              remediationStatus: {
                type: 'string',
                enum: [
                  'NEW',
                  'REMEDIATION_REQUIRED',
                  'REMEDIATION_COMPLETE',
                  'DUPLICATE',
                  'IGNORED',
                  'MITIGATED',
                  'NEEDS_REVIEW',
                  'NOT_VULNERABLE',
                  'PATCHED',
                ],
                description: 'New remediation status for the vulnerability',
              },
              comment: {
                type: 'string',
                description: 'Optional comment explaining the remediation decision',
              },
            },
            required: [
              'projectId',
              'projectVersionId',
              'componentId',
              'componentVersionId',
              'vulnerabilityId',
              'remediationStatus',
            ],
          },
        },
      ],
    };
  });

  /**
   * Handler for tool execution
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'list_projects': {
          const params = ListProjectsSchema.parse(args);
          const result = await listProjects(params);
          return {
            content: [{ type: 'text', text: result }],
          };
        }

        case 'find_project_by_name': {
          const params = FindProjectByNameSchema.parse(args);
          const result = await findProjectByName(params);
          return {
            content: [{ type: 'text', text: result }],
          };
        }

        case 'get_project_details': {
          const params = GetProjectDetailsSchema.parse(args);
          const result = await getProjectDetails(params);
          return {
            content: [{ type: 'text', text: result }],
          };
        }

        case 'list_project_versions': {
          const params = ListProjectVersionsSchema.parse(args);
          const result = await listProjectVersions(params);
          return {
            content: [{ type: 'text', text: result }],
          };
        }

        case 'get_project_vulnerabilities': {
          const params = GetProjectVulnerabilitiesSchema.parse(args);
          const result = await getProjectVulnerabilities(params);
          return {
            content: [{ type: 'text', text: result }],
          };
        }

        case 'get_vulnerability_details': {
          const params = GetVulnerabilityDetailsSchema.parse(args);
          const result = await getVulnerabilityDetails(params);
          return {
            content: [{ type: 'text', text: result }],
          };
        }

        case 'update_vulnerability_remediation': {
          const params = UpdateVulnerabilityRemediationSchema.parse(args);
          const result = await updateVulnerabilityRemediation(params);
          return {
            content: [{ type: 'text', text: result }],
          };
        }

        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid parameters: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
        );
      }
      throw error;
    }
  });

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Black Duck MCP Server running on stdio');
}

// Run the server
main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
