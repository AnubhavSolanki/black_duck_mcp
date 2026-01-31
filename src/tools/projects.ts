/**
 * Project-related MCP tools
 */

import { blackDuckClient } from '../client/blackduck-client.js';
import { formatErrorForMCP } from '../utils/errors.js';
import type { Project, ProjectVersion } from '../client/types.js';

export interface ListProjectsParams {
  limit?: number;
  offset?: number;
  searchTerm?: string;
}

export interface FindProjectByNameParams {
  projectName: string;
}

export interface GetProjectDetailsParams {
  projectId: string;
}

export interface ListProjectVersionsParams {
  projectId: string;
  limit?: number;
  offset?: number;
}

/**
 * List all Black Duck projects
 */
export async function listProjects(params: ListProjectsParams): Promise<string> {
  try {
    const { limit = 100, offset = 0, searchTerm } = params;

    const queryParams: any = { limit, offset };
    if (searchTerm) {
      queryParams.q = `name:${searchTerm}`;
    }

    const response = await blackDuckClient.listProjects(queryParams);

    if (!response.items || response.items.length === 0) {
      return searchTerm
        ? `No projects found matching "${searchTerm}".`
        : 'No projects found in Black Duck.';
    }

    const projectList = response.items.map((project: Project) => {
      const projectId = blackDuckClient.extractIdFromHref(project._meta.href);
      return {
        id: projectId,
        name: project.name,
        description: project.description || 'No description',
        createdAt: project.createdAt,
        projectTier: project.projectTier,
      };
    });

    const result = {
      totalCount: response.totalCount,
      returned: projectList.length,
      projects: projectList,
    };

    return JSON.stringify(result, null, 2);
  } catch (error) {
    return formatErrorForMCP(error);
  }
}

/**
 * Find project by name (exact or partial match)
 */
export async function findProjectByName(params: FindProjectByNameParams): Promise<string> {
  try {
    const { projectName } = params;

    if (!projectName || projectName.trim().length === 0) {
      return 'Error: projectName is required';
    }

    const projects = await blackDuckClient.findProjectByName(projectName);

    if (projects.length === 0) {
      return `No projects found matching name "${projectName}".`;
    }

    const projectList = projects.map((project: Project) => {
      const projectId = blackDuckClient.extractIdFromHref(project._meta.href);
      return {
        id: projectId,
        name: project.name,
        description: project.description || 'No description',
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    });

    const result = {
      searchTerm: projectName,
      matchCount: projectList.length,
      projects: projectList,
    };

    return JSON.stringify(result, null, 2);
  } catch (error) {
    return formatErrorForMCP(error);
  }
}

/**
 * Get detailed information about a specific project
 */
export async function getProjectDetails(params: GetProjectDetailsParams): Promise<string> {
  try {
    const { projectId } = params;

    if (!projectId || projectId.trim().length === 0) {
      return 'Error: projectId is required';
    }

    const project = await blackDuckClient.getProject(projectId);
    const versions = await blackDuckClient.listProjectVersions(projectId, { limit: 100 });

    const versionList = versions.items.map((version: ProjectVersion) => {
      const versionId = blackDuckClient.extractIdFromHref(version._meta.href);
      return {
        id: versionId,
        versionName: version.versionName,
        phase: version.phase,
        distribution: version.distribution,
        createdAt: version.createdAt,
      };
    });

    const result = {
      id: projectId,
      name: project.name,
      description: project.description || 'No description',
      projectTier: project.projectTier,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      versions: {
        totalCount: versions.totalCount,
        items: versionList,
      },
    };

    return JSON.stringify(result, null, 2);
  } catch (error) {
    return formatErrorForMCP(error);
  }
}

/**
 * List all versions of a project
 */
export async function listProjectVersions(params: ListProjectVersionsParams): Promise<string> {
  try {
    const { projectId, limit = 100, offset = 0 } = params;

    if (!projectId || projectId.trim().length === 0) {
      return 'Error: projectId is required';
    }

    const response = await blackDuckClient.listProjectVersions(projectId, { limit, offset });

    if (!response.items || response.items.length === 0) {
      return `No versions found for project ${projectId}.`;
    }

    const versionList = response.items.map((version: ProjectVersion) => {
      const versionId = blackDuckClient.extractIdFromHref(version._meta.href);
      return {
        id: versionId,
        versionName: version.versionName,
        phase: version.phase,
        distribution: version.distribution,
        nickname: version.nickname,
        createdAt: version.createdAt,
        settingUpdatedAt: version.settingUpdatedAt,
      };
    });

    const result = {
      projectId,
      totalCount: response.totalCount,
      returned: versionList.length,
      versions: versionList,
    };

    return JSON.stringify(result, null, 2);
  } catch (error) {
    return formatErrorForMCP(error);
  }
}
