/**
 * Black Duck API Client
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { config } from '../config.js';
import { authenticateAndGetBearerToken } from '../utils/auth.js';
import {
  createErrorFromStatus,
  NetworkError,
} from '../utils/errors.js';
import type {
  Project,
  ProjectVersion,
  VulnerableComponent,
  VulnerabilityRemediation,
  RemediationUpdate,
  PaginatedResponse,
  ErrorResponse,
  DependencyPathsResponse,
  UpgradeGuidanceResponse,
} from './types.js';

class BlackDuckClient {
  private client: AxiosInstance;
  private baseURL: string;
  private bearerToken: string | null = null;

  constructor() {
    this.baseURL = config.url;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
      // Important: Black Duck returns various content types
      validateStatus: (status) => status < 600, // Don't throw on any status < 600
    });

    // Request interceptor for authentication and logging
    this.client.interceptors.request.use(async (request) => {
      // Ensure we have a valid bearer token
      if (!this.bearerToken) {
        this.bearerToken = await authenticateAndGetBearerToken(
          this.baseURL,
          config.apiToken,
          config.timeout
        );
      }

      // Add bearer token to headers
      request.headers.Authorization = `Bearer ${this.bearerToken}`;

      if (config.debug) {
        console.error(`[BlackDuck] ${request.method?.toUpperCase()} ${request.url}`);
      }

      return request;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // Handle 401 by refreshing token and retrying
        if (error.response?.status === 401 && !error.config?.headers['X-Retry']) {
          try {
            // Clear and re-authenticate
            this.bearerToken = null;
            this.bearerToken = await authenticateAndGetBearerToken(
              this.baseURL,
              config.apiToken,
              config.timeout
            );

            // Retry the request once
            const retryConfig = {
              ...error.config,
              headers: {
                ...error.config?.headers,
                'Authorization': `Bearer ${this.bearerToken}`,
                'X-Retry': 'true',
              },
            };

            return this.client.request(retryConfig);
          } catch (authError) {
            // Authentication failed, throw original error
            throw error;
          }
        }

        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          throw new NetworkError(
            `Cannot connect to Black Duck server at ${this.baseURL}. Please check the URL and network connection.`
          );
        }

        if (error.code === 'ETIMEDOUT') {
          throw new NetworkError(
            `Request to Black Duck server timed out after ${config.timeout}ms`
          );
        }

        throw new NetworkError(`Network error: ${error.message}`);
      }
    );
  }

  /**
   * Generic GET request
   */
  private async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    acceptHeader?: string
  ): Promise<T> {
    const requestConfig: AxiosRequestConfig = {
      params,
      headers: acceptHeader ? { Accept: acceptHeader } : {},
    };

    const response = await this.client.get(endpoint, requestConfig);

    if (response.status >= 400) {
      this.handleErrorResponse(response.status, response.data);
    }

    return response.data;
  }

  /**
   * Generic PUT request
   */
  private async put<T>(
    endpoint: string,
    data: any,
    acceptHeader?: string
  ): Promise<T> {
    const requestConfig: AxiosRequestConfig = {
      headers: acceptHeader ? { Accept: acceptHeader } : {},
    };

    const response = await this.client.put(endpoint, data, requestConfig);

    if (response.status >= 400) {
      this.handleErrorResponse(response.status, response.data);
    }

    return response.data;
  }

  /**
   * Handle error responses from Black Duck API
   */
  private handleErrorResponse(status: number, data: any): never {
    const errorData = data as ErrorResponse;
    const message = errorData.errorMessage || errorData.message || 'Unknown error';
    const errorCode = errorData.errorCode;

    throw createErrorFromStatus(status, message, errorCode);
  }

  /**
   * List all projects
   */
  async listProjects(params?: {
    limit?: number;
    offset?: number;
    q?: string;
  }): Promise<PaginatedResponse<Project>> {
    const endpoint = '/api/projects';
    return this.get<PaginatedResponse<Project>>(
      endpoint,
      params,
      'application/vnd.blackducksoftware.project-detail-5+json'
    );
  }

  /**
   * Find project by name
   */
  async findProjectByName(projectName: string): Promise<Project[]> {
    const response = await this.listProjects({
      q: `name:${projectName}`,
      limit: 100,
    });
    return response.items;
  }

  /**
   * Get project details by ID
   */
  async getProject(projectId: string): Promise<Project> {
    const endpoint = `/api/projects/${projectId}`;
    return this.get<Project>(
      endpoint,
      undefined,
      'application/vnd.blackducksoftware.project-detail-5+json'
    );
  }

  /**
   * List project versions
   */
  async listProjectVersions(
    projectId: string,
    params?: { limit?: number; offset?: number }
  ): Promise<PaginatedResponse<ProjectVersion>> {
    const endpoint = `/api/projects/${projectId}/versions`;
    return this.get<PaginatedResponse<ProjectVersion>>(
      endpoint,
      params,
      'application/vnd.blackducksoftware.project-detail-5+json'
    );
  }

  /**
   * Get vulnerable components for a project version
   */
  async getVulnerableComponents(
    projectId: string,
    versionId: string,
    params?: {
      limit?: number;
      offset?: number;
      filter?: string;
    }
  ): Promise<PaginatedResponse<VulnerableComponent>> {
    const endpoint = `/api/projects/${projectId}/versions/${versionId}/vulnerable-bom-components`;
    return this.get<PaginatedResponse<VulnerableComponent>>(
      endpoint,
      params,
      'application/vnd.blackducksoftware.bill-of-materials-6+json'
    );
  }

  /**
   * Get vulnerability remediation details
   * Note: The actual endpoint structure may vary - this follows the pattern from the plan
   */
  async getVulnerabilityRemediation(
    projectId: string,
    versionId: string,
    componentId: string,
    componentVersionId: string,
    vulnerabilityId: string
  ): Promise<VulnerabilityRemediation> {
    const endpoint = `/api/projects/${projectId}/versions/${versionId}/components/${componentId}/versions/${componentVersionId}/vulnerabilities/${vulnerabilityId}/remediation`;
    return this.get<VulnerabilityRemediation>(
      endpoint,
      undefined,
      'application/vnd.blackducksoftware.vulnerability-4+json'
    );
  }

  /**
   * Update vulnerability remediation status
   */
  async updateVulnerabilityRemediation(
    projectId: string,
    versionId: string,
    componentId: string,
    componentVersionId: string,
    vulnerabilityId: string,
    update: RemediationUpdate
  ): Promise<VulnerabilityRemediation> {
    const endpoint = `/api/projects/${projectId}/versions/${versionId}/components/${componentId}/versions/${componentVersionId}/vulnerabilities/${vulnerabilityId}/remediation`;
    return this.put<VulnerabilityRemediation>(
      endpoint,
      update,
      'application/vnd.blackducksoftware.vulnerability-4+json'
    );
  }

  /**
   * Get dependency paths for a component origin
   */
  async getDependencyPaths(
    projectId: string,
    versionId: string,
    originId: string
  ): Promise<DependencyPathsResponse> {
    const endpoint = `/api/project/${projectId}/version/${versionId}/origin/${originId}/dependency-paths`;
    return this.get<DependencyPathsResponse>(
      endpoint,
      undefined,
      'application/vnd.blackducksoftware.bill-of-materials-7+json'
    );
  }

  /**
   * Get upgrade guidance for a direct dependency
   */
  async getUpgradeGuidance(
    componentId: string,
    componentVersionId: string
  ): Promise<UpgradeGuidanceResponse> {
    const endpoint = `/api/components/${componentId}/versions/${componentVersionId}/upgrade-guidance`;
    return this.get<UpgradeGuidanceResponse>(
      endpoint,
      undefined,
      'application/vnd.blackducksoftware.component-detail-5+json'
    );
  }

  /**
   * Get upgrade guidance for a transitive dependency
   */
  async getTransitiveUpgradeGuidance(
    componentId: string,
    componentVersionId: string,
    originId: string
  ): Promise<UpgradeGuidanceResponse> {
    const endpoint = `/api/components/${componentId}/versions/${componentVersionId}/origins/${originId}/transitive-upgrade-guidance`;
    return this.get<UpgradeGuidanceResponse>(
      endpoint,
      undefined,
      'application/vnd.blackducksoftware.component-detail-5+json'
    );
  }

  /**
   * Extract ID from Black Duck _meta.href URL
   */
  extractIdFromHref(href: string): string {
    const parts = href.split('/');
    return parts[parts.length - 1];
  }
}

// Export singleton instance
export const blackDuckClient = new BlackDuckClient();
