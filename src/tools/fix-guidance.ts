/**
 * Vulnerability Fix Guidance MCP tool
 */

import { blackDuckClient } from "../client/blackduck-client.js";
import { formatErrorForMCP } from "../utils/errors.js";
import type { VulnerabilityRiskCounts } from "../client/types.js";

export interface GetVulnerabilityFixGuidanceParams {
  projectId: string;
  projectVersionId: string;
  componentId: string;
  componentVersionId: string;
  vulnerabilityId: string;
  originId: string;
}

/**
 * Get comprehensive fix guidance for a vulnerability
 * Includes short-term and long-term upgrade recommendations
 */
export async function getVulnerabilityFixGuidance(
  params: GetVulnerabilityFixGuidanceParams,
): Promise<string> {
  try {
    const {
      projectId,
      projectVersionId,
      componentId,
      componentVersionId,
      vulnerabilityId,
      originId,
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
    if (!originId || originId.trim().length === 0) {
      return "Error: originId is required";
    }

    // Step 1: Fetch current vulnerability details for context
    let vulnerabilityDetails;
    try {
      vulnerabilityDetails = await blackDuckClient.getVulnerabilityRemediation(
        projectId,
        projectVersionId,
        componentId,
        componentVersionId,
        vulnerabilityId,
      );
    } catch (error) {
      // Continue without vulnerability details if fetch fails
      console.error("Failed to fetch vulnerability details:", error);
    }

    // Step 2: Fetch dependency paths to determine if direct or transitive
    // and get the correct component IDs for upgrade guidance
    let dependencyType: "DIRECT" | "TRANSITIVE" = "DIRECT";
    let guidanceComponentId: string = componentId;
    let guidanceComponentVersionId: string = componentVersionId;
    let guidanceOriginId: string = originId;

    try {
      const dependencyPaths = await blackDuckClient.getDependencyPaths(
        projectId,
        projectVersionId,
        originId,
      );

      if (dependencyPaths.items && dependencyPaths.items.length > 0) {
        const firstItem = dependencyPaths.items[0];
        dependencyType = firstItem.type;

        // Extract component IDs from the dependency path links
        if (firstItem.path && firstItem.path.length > 1) {
          const pathNode = firstItem.path[firstItem.path.length - 2]; // Second to last node
          const links = pathNode._meta?.links || [];

          // Find the appropriate upgrade guidance link
          const guidanceLink = links.find((link) =>
            dependencyType === "DIRECT"
              ? link.rel === "upgrade-guidance"
              : link.rel === "transitive-upgrade-guidance",
          );

          if (guidanceLink?.href) {
            // Extract component and version IDs from the href
            // Format: /api/components/{componentId}/versions/{componentVersionId}/upgrade-guidance
            // or: /api/components/{componentId}/versions/{componentVersionId}/origins/{originId}/transitive-upgrade-guidance
            const hrefParts = guidanceLink.href.split("/");
            const componentsIndex = hrefParts.indexOf("components");
            const versionsIndex = hrefParts.indexOf("versions");
            const originsIndex = hrefParts.indexOf("origins");

            if (componentsIndex !== -1 && versionsIndex !== -1) {
              guidanceComponentId = hrefParts[componentsIndex + 1];
              guidanceComponentVersionId = hrefParts[versionsIndex + 1];

              if (originsIndex !== -1 && dependencyType === "TRANSITIVE") {
                guidanceOriginId = hrefParts[originsIndex + 1];
              }
            }
          }
        }
      }
    } catch (error) {
      // If dependency paths fail, use the provided IDs and assume DIRECT
      console.error(
        "Failed to fetch dependency paths, using provided IDs:",
        error,
      );
    }

    // Step 3: Fetch upgrade guidance based on dependency type
    let upgradeGuidance;
    try {
      if (dependencyType === "DIRECT") {
        upgradeGuidance = await blackDuckClient.getUpgradeGuidance(
          guidanceComponentId,
          guidanceComponentVersionId,
        );
      } else {
        upgradeGuidance = await blackDuckClient.getTransitiveUpgradeGuidance(
          guidanceComponentId,
          guidanceComponentVersionId,
          guidanceOriginId,
        );
      }
    } catch (error) {
      return formatErrorForMCP(error);
    }

    // Step 4: Build comprehensive response
    const result: any = {
      vulnerability: vulnerabilityDetails
        ? {
            name: vulnerabilityDetails.vulnerabilityName,
            severity: vulnerabilityDetails.severity || "UNSPECIFIED",
            baseScore: vulnerabilityDetails.baseScore,
            description:
              vulnerabilityDetails.description?.substring(0, 200) +
              (vulnerabilityDetails.description &&
              vulnerabilityDetails.description.length > 200
                ? "..."
                : ""),
            cvss3: vulnerabilityDetails.cvss3
              ? {
                  baseScore: vulnerabilityDetails.cvss3.baseScore,
                  severity: vulnerabilityDetails.cvss3.severity,
                  vector: vulnerabilityDetails.cvss3.vector,
                }
              : undefined,
            remediationStatus: vulnerabilityDetails.remediationStatus,
            cweId: vulnerabilityDetails.cweId,
          }
        : {
            name: vulnerabilityId,
            note: "Could not fetch vulnerability details",
          },

      component: {
        name: upgradeGuidance.componentName,
        currentVersion: upgradeGuidance.versionName,
        dependencyType: dependencyType,
        originId: upgradeGuidance.originExternalId,
      },

      fixGuidance: {},
    };

    // Add short-term guidance if available
    if (upgradeGuidance.shortTerm) {
      const shortTerm = upgradeGuidance.shortTerm;
      result.fixGuidance.shortTerm = {
        recommendedVersion: shortTerm.versionName,
        vulnerabilitiesRemaining: shortTerm.vulnerabilityRisk,
        riskReduction: calculateRiskReduction(shortTerm.vulnerabilityRisk),
        originId: shortTerm.originExternalId,
      };
    } else {
      result.fixGuidance.shortTerm = {
        available: false,
        message: "No short-term fix available",
      };
    }

    // Add long-term guidance if available
    if (upgradeGuidance.longTerm) {
      const longTerm = upgradeGuidance.longTerm;
      result.fixGuidance.longTerm = {
        recommendedVersion: longTerm.versionName,
        vulnerabilitiesRemaining: longTerm.vulnerabilityRisk,
        riskReduction: calculateRiskReduction(longTerm.vulnerabilityRisk),
        originId: longTerm.originExternalId,
      };
    } else {
      result.fixGuidance.longTerm = {
        available: false,
        message: "No long-term fix available",
      };
    }

    // Check if any fixes are available
    const hasShortTermFix = upgradeGuidance.shortTerm !== undefined;
    const hasLongTermFix = upgradeGuidance.longTerm !== undefined;
    const hasAnyFix = hasShortTermFix || hasLongTermFix;

    // Add actionable steps based on dependency type and fix availability
    if (!hasAnyFix) {
      result.actionSteps = [
        `This vulnerability is NOT FIXABLE by upgrading the component.`,
        `No short-term or long-term fix is available from the component maintainers.`,
        `Consider these alternative remediation strategies:`,
        `  - Apply security patches or workarounds if available`,
        `  - Implement additional security controls to mitigate the risk`,
        `  - Consider replacing the component with a secure alternative`,
        `  - Accept the risk if it's deemed acceptable for your use case`,
      ];
    } else if (dependencyType === "DIRECT") {
      result.actionSteps = [
        hasAnyFix
          ? `Update your dependency to one of the recommended versions:`
          : null,
        upgradeGuidance.shortTerm
          ? `  - Short-term: ${upgradeGuidance.shortTerm.versionName} (${getTotalVulnerabilities(upgradeGuidance.shortTerm.vulnerabilityRisk)} vulnerabilities remaining)`
          : hasShortTermFix === false
            ? `  - Short-term: No fix available`
            : null,
        upgradeGuidance.longTerm
          ? `  - Long-term: ${upgradeGuidance.longTerm.versionName} (${getTotalVulnerabilities(upgradeGuidance.longTerm.vulnerabilityRisk)} vulnerabilities remaining)`
          : hasLongTermFix === false
            ? `  - Long-term: No fix available`
            : null,
        `Update your package manager configuration (e.g., package.json, pom.xml, etc.)`,
        `Run your package manager's install/update command`,
        `Test your application to ensure compatibility`,
        `Scan again with Black Duck to verify the vulnerability is resolved`,
      ].filter(Boolean);
    } else {
      result.actionSteps = [
        `This is a TRANSITIVE dependency. To fix:`,
        `Update the parent/direct dependency that includes this component:`,
        upgradeGuidance.shortTerm
          ? `  - Short-term parent version: Check which direct dependency needs updating to get ${upgradeGuidance.shortTerm.versionName}`
          : hasShortTermFix === false
            ? `  - Short-term: No fix available`
            : null,
        upgradeGuidance.longTerm
          ? `  - Long-term parent version: Check which direct dependency needs updating to get ${upgradeGuidance.longTerm.versionName}`
          : hasLongTermFix === false
            ? `  - Long-term: No fix available`
            : null,
        `The transitive component will be automatically upgraded when you update the parent`,
        `Run your package manager's install/update command`,
        `Test your application to ensure compatibility`,
        `Scan again with Black Duck to verify the vulnerability is resolved`,
      ].filter(Boolean);
    }

    // Add recommendation note
    if (!hasAnyFix) {
      result.recommendation =
        "This vulnerability cannot be fixed by upgrading. Consider alternative remediation strategies such as applying security patches, implementing mitigating controls, or replacing the component.";
    } else if (upgradeGuidance.shortTerm && upgradeGuidance.longTerm) {
      const shortTermVulns = getTotalVulnerabilities(
        upgradeGuidance.shortTerm.vulnerabilityRisk,
      );
      const longTermVulns = getTotalVulnerabilities(
        upgradeGuidance.longTerm.vulnerabilityRisk,
      );

      result.recommendation =
        longTermVulns < shortTermVulns
          ? `Recommended: Use the long-term version (${upgradeGuidance.longTerm.versionName}) as it has fewer vulnerabilities.`
          : shortTermVulns === 0
            ? `Recommended: Use the short-term version (${upgradeGuidance.shortTerm.versionName}) as it has no known vulnerabilities.`
            : `Both versions have vulnerabilities. Consider the trade-offs between version compatibility and security.`;
    } else if (upgradeGuidance.shortTerm) {
      result.recommendation = `Only short-term fix available. Upgrade to ${upgradeGuidance.shortTerm.versionName}.`;
    } else if (upgradeGuidance.longTerm) {
      result.recommendation = `Only long-term fix available. Upgrade to ${upgradeGuidance.longTerm.versionName}.`;
    }

    return JSON.stringify(result, null, 2);
  } catch (error) {
    return formatErrorForMCP(error);
  }
}

/**
 * Calculate risk reduction message
 */
function calculateRiskReduction(
  remainingRisks: VulnerabilityRiskCounts,
): string {
  const total = getTotalVulnerabilities(remainingRisks);

  if (total === 0) {
    return "Eliminates all known vulnerabilities";
  }

  const criticalAndHigh = remainingRisks.critical + remainingRisks.high;
  if (criticalAndHigh === 0) {
    return `Eliminates all critical and high severity vulnerabilities (${total} low/medium remain)`;
  }

  const parts = [];
  if (remainingRisks.critical > 0)
    parts.push(`${remainingRisks.critical} critical`);
  if (remainingRisks.high > 0) parts.push(`${remainingRisks.high} high`);
  if (remainingRisks.medium > 0) parts.push(`${remainingRisks.medium} medium`);
  if (remainingRisks.low > 0) parts.push(`${remainingRisks.low} low`);

  return `${total} vulnerabilities remain: ${parts.join(", ")}`;
}

/**
 * Get total vulnerability count
 */
function getTotalVulnerabilities(risks: VulnerabilityRiskCounts): number {
  return risks.critical + risks.high + risks.medium + risks.low;
}
