/**
 * Vulnerability-related MCP tools
 */

import { blackDuckClient } from '../client/blackduck-client.js';
import { formatErrorForMCP } from '../utils/errors.js';
import type { VulnerableComponent, VulnerabilitySeverity } from '../client/types.js';

export interface GetProjectVulnerabilitiesParams {
  projectId: string;
  projectVersionId: string;
  limit?: number;
  offset?: number;
  severity?: VulnerabilitySeverity;
  searchTerm?: string;
}

export interface GetVulnerabilityDetailsParams {
  projectId: string;
  projectVersionId: string;
  componentId: string;
  componentVersionId: string;
  vulnerabilityId: string;
}

/**
 * Get vulnerable components in a project version
 */
export async function getProjectVulnerabilities(
  params: GetProjectVulnerabilitiesParams
): Promise<string> {
  try {
    const {
      projectId,
      projectVersionId,
      limit = 100,
      offset = 0,
      severity,
      searchTerm,
    } = params;

    // Validate required parameters
    if (!projectId || projectId.trim().length === 0) {
      return 'Error: projectId is required';
    }

    if (!projectVersionId || projectVersionId.trim().length === 0) {
      return 'Error: projectVersionId is required';
    }

    // Build filter parameter
    let filter = '';
    if (severity) {
      filter = `vulnerabilityWithRemediation.severity:${severity}`;
    }
    if (searchTerm) {
      filter += filter ? ` AND ` : '';
      filter += `componentOrVulnerabilityName:${searchTerm}`;
    }

    const queryParams: any = { limit, offset };
    if (filter) {
      queryParams.filter = filter;
    }

    const response = await blackDuckClient.getVulnerableComponents(
      projectId,
      projectVersionId,
      queryParams
    );

    if (!response.items || response.items.length === 0) {
      let message = `No vulnerabilities found for project version.`;
      if (severity) {
        message = `No ${severity} severity vulnerabilities found.`;
      }
      return message;
    }

    const vulnerabilityList = response.items.map((vc: VulnerableComponent) => {
      const vuln = vc.vulnerabilityWithRemediation;
      return {
        componentName: vc.componentName,
        componentVersionName: vc.componentVersionName,
        vulnerability: {
          name: vuln.vulnerabilityName,
          severity: vuln.severity,
          baseScore: vuln.baseScore,
          description: vuln.description?.substring(0, 200) + (vuln.description && vuln.description.length > 200 ? '...' : ''),
          publishedDate: vuln.vulnerabilityPublishedDate,
          remediationStatus: vuln.remediationStatus,
          source: vuln.source,
          cweId: vuln.cweId,
        },
        _meta: vc._meta,
      };
    });

    // Count by severity
    const severityCounts: Record<string, number> = {};
    response.items.forEach((vc: VulnerableComponent) => {
      const sev = vc.vulnerabilityWithRemediation.severity || 'UNSPECIFIED';
      severityCounts[sev] = (severityCounts[sev] || 0) + 1;
    });

    const result = {
      projectId,
      projectVersionId,
      totalCount: response.totalCount,
      returned: vulnerabilityList.length,
      severityCounts,
      vulnerabilities: vulnerabilityList,
    };

    return JSON.stringify(result, null, 2);
  } catch (error) {
    return formatErrorForMCP(error);
  }
}

/**
 * Get detailed information about a specific vulnerability
 */
export async function getVulnerabilityDetails(
  params: GetVulnerabilityDetailsParams
): Promise<string> {
  try {
    const {
      projectId,
      projectVersionId,
      componentId,
      componentVersionId,
      vulnerabilityId,
    } = params;

    // Validate required parameters
    if (!projectId || projectId.trim().length === 0) {
      return 'Error: projectId is required';
    }

    if (!projectVersionId || projectVersionId.trim().length === 0) {
      return 'Error: projectVersionId is required';
    }

    if (!componentId || componentId.trim().length === 0) {
      return 'Error: componentId is required';
    }

    if (!componentVersionId || componentVersionId.trim().length === 0) {
      return 'Error: componentVersionId is required';
    }

    if (!vulnerabilityId || vulnerabilityId.trim().length === 0) {
      return 'Error: vulnerabilityId is required';
    }

    const vulnerability = await blackDuckClient.getVulnerabilityRemediation(
      projectId,
      projectVersionId,
      componentId,
      componentVersionId,
      vulnerabilityId
    );

    const result = {
      vulnerabilityName: vulnerability.vulnerabilityName,
      description: vulnerability.description,
      severity: vulnerability.severity,
      baseScore: vulnerability.baseScore,
      overallScore: vulnerability.overallScore,
      source: vulnerability.source,
      cweId: vulnerability.cweId,
      cvss2: vulnerability.cvss2,
      cvss3: vulnerability.cvss3,
      relatedVulnerability: vulnerability.relatedVulnerability,
      remediation: {
        status: vulnerability.remediationStatus,
        targetAt: vulnerability.remediationTargetAt,
        actualAt: vulnerability.remediationActualAt,
        createdAt: vulnerability.remediationCreatedAt,
        createdBy: vulnerability.remediationCreatedBy,
        updatedAt: vulnerability.remediationUpdatedAt,
        updatedBy: vulnerability.remediationUpdatedBy,
        comment: vulnerability.comment,
      },
      bdsa: vulnerability.bdsa,
    };

    return JSON.stringify(result, null, 2);
  } catch (error) {
    return formatErrorForMCP(error);
  }
}
