/**
 * Vulnerability remediation tools
 */

import { blackDuckClient } from "../client/blackduck-client.js";
import { formatErrorForMCP, ValidationError } from "../utils/errors.js";
import type { RemediationStatus } from "../client/types.js";

export interface UpdateVulnerabilityRemediationParams {
  projectId: string;
  projectVersionId: string;
  componentId: string;
  componentVersionId: string;
  vulnerabilityId: string;
  remediationStatus: RemediationStatus;
  comment?: string;
}

// Valid remediation status values
const VALID_REMEDIATION_STATUSES: RemediationStatus[] = [
  "NEW",
  "REMEDIATION_REQUIRED",
  "DUPLICATE",
  "IGNORED",
];

/**
 * Validate remediation status
 */
function validateRemediationStatus(status: string): void {
  if (!VALID_REMEDIATION_STATUSES.includes(status as RemediationStatus)) {
    throw new ValidationError(
      `Invalid remediation status: ${status}. Valid values are: ${VALID_REMEDIATION_STATUSES.join(", ")}`,
    );
  }
}

/**
 * Update vulnerability remediation status and justification
 */
export async function updateVulnerabilityRemediation(
  params: UpdateVulnerabilityRemediationParams,
): Promise<string> {
  try {
    const {
      projectId,
      projectVersionId,
      componentId,
      componentVersionId,
      vulnerabilityId,
      remediationStatus,
      comment,
    } = params;

    // Validate required parameters
    if (!projectId || projectId.trim().length === 0) {
      return "Error: projectId is required";
    }

    if (!projectVersionId || projectVersionId.trim().length === 0) {
      return "Error: projectVersionId is required";
    }

    if (!componentId || componentId.trim().length === 0) {
      return "Error: componentId is required";
    }

    if (!componentVersionId || componentVersionId.trim().length === 0) {
      return "Error: componentVersionId is required";
    }

    if (!vulnerabilityId || vulnerabilityId.trim().length === 0) {
      return "Error: vulnerabilityId is required";
    }

    if (!remediationStatus || remediationStatus.trim().length === 0) {
      return "Error: remediationStatus is required";
    }

    // Validate remediation status
    validateRemediationStatus(remediationStatus);

    // Update remediation
    const updated = await blackDuckClient.updateVulnerabilityRemediation(
      projectId,
      projectVersionId,
      componentId,
      componentVersionId,
      vulnerabilityId,
      {
        remediationStatus,
        comment,
      },
    );

    const result = {
      success: true,
      vulnerabilityName: updated.vulnerabilityName,
      previousStatus: "Check getVulnerabilityDetails for previous status",
      newStatus: remediationStatus,
      comment: comment || "No comment provided",
      updatedAt: updated.remediationUpdatedAt,
      updatedBy: updated.remediationUpdatedBy,
      vulnerability: {
        severity: updated.severity,
        baseScore: updated.baseScore,
        description:
          updated.description?.substring(0, 200) +
          (updated.description && updated.description.length > 200
            ? "..."
            : ""),
      },
    };

    return JSON.stringify(result, null, 2);
  } catch (error) {
    return formatErrorForMCP(error);
  }
}
