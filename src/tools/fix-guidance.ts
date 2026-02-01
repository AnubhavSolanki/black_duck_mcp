/**
 * Vulnerability Fix Guidance MCP tool
 */

import { blackDuckClient } from "../client/blackduck-client.js";
import { formatErrorForMCP } from "../utils/errors.js";
import {
  calculateRiskReduction,
  getTotalVulnerabilities,
  getFixAvailability,
  extractComponentIdsFromPath,
  generateComparisonRecommendation,
  type FixAvailability,
} from "./fix-guidance.utils.js";

export interface GetVulnerabilityFixGuidanceParams {
  projectId: string;
  projectVersionId: string;
  componentId: string;
  componentVersionId: string;
  vulnerabilityId: string;
  originId: string;
}

interface DependencyAnalysis {
  dependencyType: "DIRECT" | "TRANSITIVE";
  guidanceComponentId: string;
  guidanceComponentVersionId: string;
  guidanceOriginId: string;
}

/**
 * Get comprehensive fix guidance for a vulnerability
 * Includes short-term and long-term upgrade recommendations
 */
export async function getVulnerabilityFixGuidance(
  params: GetVulnerabilityFixGuidanceParams,
): Promise<string> {
  try {
    // Step 1: Validate parameters
    validateParameters(params);

    // Step 2: Fetch vulnerability context (optional, used for additional info)
    const vulnerabilityDetails = await fetchVulnerabilityContext(params);

    // Step 3: Analyze dependency type (direct vs transitive)
    const dependencyAnalysis = await analyzeDependencyType(params);

    // Step 4: Fetch upgrade guidance based on dependency type
    const upgradeGuidance = await fetchUpgradeGuidance(
      dependencyAnalysis.dependencyType,
      dependencyAnalysis.guidanceComponentId,
      dependencyAnalysis.guidanceComponentVersionId,
      dependencyAnalysis.guidanceOriginId,
    );

    // Step 5: Build comprehensive response
    const result = buildResponse(
      params.vulnerabilityId,
      vulnerabilityDetails,
      dependencyAnalysis.dependencyType,
      upgradeGuidance,
    );

    return JSON.stringify(result, null, 2);
  } catch (error) {
    return formatErrorForMCP(error);
  }
}

/**
 * Validate required parameters
 */
function validateParameters(params: GetVulnerabilityFixGuidanceParams): void {
  const requiredFields: (keyof GetVulnerabilityFixGuidanceParams)[] = [
    "projectId",
    "projectVersionId",
    "componentId",
    "componentVersionId",
    "vulnerabilityId",
    "originId",
  ];

  for (const field of requiredFields) {
    if (!params[field] || params[field].trim().length === 0) {
      throw new Error(`${field} is required`);
    }
  }
}

/**
 * Fetch vulnerability details for context
 * Returns undefined if fetch fails (non-critical)
 */
async function fetchVulnerabilityContext(
  params: GetVulnerabilityFixGuidanceParams,
): Promise<any> {
  try {
    return await blackDuckClient.getVulnerabilityRemediation(
      params.projectId,
      params.projectVersionId,
      params.componentId,
      params.componentVersionId,
      params.vulnerabilityId,
    );
  } catch (error) {
    console.error("Failed to fetch vulnerability details:", error);
    return undefined;
  }
}

/**
 * Analyze dependency type and extract component IDs for upgrade guidance
 */
async function analyzeDependencyType(
  params: GetVulnerabilityFixGuidanceParams,
): Promise<DependencyAnalysis> {
  let dependencyType: "DIRECT" | "TRANSITIVE" = "DIRECT";
  let guidanceComponentId = params.componentId;
  let guidanceComponentVersionId = params.componentVersionId;
  let guidanceOriginId = params.originId;

  try {
    const dependencyPaths = await blackDuckClient.getDependencyPaths(
      params.projectId,
      params.projectVersionId,
      params.originId,
    );

    if (dependencyPaths.items && dependencyPaths.items.length > 0) {
      const firstItem = dependencyPaths.items[0];
      dependencyType = firstItem.type;

      // Extract component IDs from the dependency path links
      const extractedIds = extractComponentIdsFromPath(firstItem, dependencyType);
      if (extractedIds) {
        guidanceComponentId = extractedIds.componentId;
        guidanceComponentVersionId = extractedIds.componentVersionId;
        if (extractedIds.originId) {
          guidanceOriginId = extractedIds.originId;
        }
      }
    }
  } catch (error) {
    console.error("Failed to fetch dependency paths, using provided IDs:", error);
  }

  return {
    dependencyType,
    guidanceComponentId,
    guidanceComponentVersionId,
    guidanceOriginId,
  };
}


/**
 * Fetch upgrade guidance based on dependency type
 */
async function fetchUpgradeGuidance(
  dependencyType: "DIRECT" | "TRANSITIVE",
  componentId: string,
  componentVersionId: string,
  originId: string,
): Promise<any> {
  if (dependencyType === "DIRECT") {
    return await blackDuckClient.getUpgradeGuidance(componentId, componentVersionId);
  } else {
    return await blackDuckClient.getTransitiveUpgradeGuidance(
      componentId,
      componentVersionId,
      originId,
    );
  }
}

/**
 * Build comprehensive response object
 */
function buildResponse(
  vulnerabilityId: string,
  vulnerabilityDetails: any,
  dependencyType: "DIRECT" | "TRANSITIVE",
  upgradeGuidance: any,
): any {
  const fixAvailability = getFixAvailability(upgradeGuidance);

  return {
    vulnerability: buildVulnerabilityInfo(vulnerabilityId, vulnerabilityDetails),
    component: buildComponentInfo(upgradeGuidance, dependencyType),
    fixGuidance: buildFixGuidanceSection(upgradeGuidance),
    actionSteps: generateActionSteps(dependencyType, upgradeGuidance, fixAvailability),
    recommendation: generateRecommendation(upgradeGuidance, fixAvailability),
  };
}

/**
 * Build vulnerability information section
 */
function buildVulnerabilityInfo(vulnerabilityId: string, vulnerabilityDetails: any): any {
  if (!vulnerabilityDetails) {
    return {
      name: vulnerabilityId,
      note: "Could not fetch vulnerability details",
    };
  }

  return {
    name: vulnerabilityDetails.vulnerabilityName,
    severity: vulnerabilityDetails.severity || "UNSPECIFIED",
    baseScore: vulnerabilityDetails.baseScore,
    description:
      vulnerabilityDetails.description?.substring(0, 200) +
      (vulnerabilityDetails.description && vulnerabilityDetails.description.length > 200
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
  };
}

/**
 * Build component information section
 */
function buildComponentInfo(upgradeGuidance: any, dependencyType: "DIRECT" | "TRANSITIVE"): any {
  return {
    name: upgradeGuidance.componentName,
    currentVersion: upgradeGuidance.versionName,
    dependencyType: dependencyType,
    originId: upgradeGuidance.originExternalId,
  };
}

/**
 * Build fix guidance section with short-term and long-term recommendations
 */
function buildFixGuidanceSection(upgradeGuidance: any): any {
  const fixGuidance: any = {};

  // Add short-term guidance
  if (upgradeGuidance.shortTerm) {
    const shortTerm = upgradeGuidance.shortTerm;
    fixGuidance.shortTerm = {
      recommendedVersion: shortTerm.versionName,
      vulnerabilitiesRemaining: shortTerm.vulnerabilityRisk,
      riskReduction: calculateRiskReduction(shortTerm.vulnerabilityRisk),
      originId: shortTerm.originExternalId,
    };
  } else {
    fixGuidance.shortTerm = {
      available: false,
      message: "No short-term fix available",
    };
  }

  // Add long-term guidance
  if (upgradeGuidance.longTerm) {
    const longTerm = upgradeGuidance.longTerm;
    fixGuidance.longTerm = {
      recommendedVersion: longTerm.versionName,
      vulnerabilitiesRemaining: longTerm.vulnerabilityRisk,
      riskReduction: calculateRiskReduction(longTerm.vulnerabilityRisk),
      originId: longTerm.originExternalId,
    };
  } else {
    fixGuidance.longTerm = {
      available: false,
      message: "No long-term fix available",
    };
  }

  return fixGuidance;
}


/**
 * Generate actionable steps based on dependency type and fix availability
 */
function generateActionSteps(
  dependencyType: "DIRECT" | "TRANSITIVE",
  upgradeGuidance: any,
  fixAvailability: FixAvailability,
): string[] {
  const { hasAnyFix, hasShortTermFix, hasLongTermFix } = fixAvailability;

  // No fixes available
  if (!hasAnyFix) {
    return generateNoFixActionSteps();
  }

  // Direct dependency with fixes
  if (dependencyType === "DIRECT") {
    return generateDirectDependencyActionSteps(
      upgradeGuidance,
      hasShortTermFix,
      hasLongTermFix,
    );
  }

  // Transitive dependency with fixes
  return generateTransitiveDependencyActionSteps(
    upgradeGuidance,
    hasShortTermFix,
    hasLongTermFix,
  );
}

/**
 * Generate action steps when no fix is available
 */
function generateNoFixActionSteps(): string[] {
  return [
    `This vulnerability is NOT FIXABLE by upgrading the component.`,
    `No short-term or long-term fix is available from the component maintainers.`,
    `Consider these alternative remediation strategies:`,
    `  - Apply security patches or workarounds if available`,
    `  - Implement additional security controls to mitigate the risk`,
    `  - Consider replacing the component with a secure alternative`,
    `  - Accept the risk if it's deemed acceptable for your use case`,
  ];
}

/**
 * Generate action steps for direct dependencies
 */
function generateDirectDependencyActionSteps(
  upgradeGuidance: any,
  hasShortTermFix: boolean,
  hasLongTermFix: boolean,
): string[] {
  const steps = [
    `Update your dependency to one of the recommended versions:`,
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
  ];

  return steps.filter(Boolean) as string[];
}

/**
 * Generate action steps for transitive dependencies
 */
function generateTransitiveDependencyActionSteps(
  upgradeGuidance: any,
  hasShortTermFix: boolean,
  hasLongTermFix: boolean,
): string[] {
  const steps = [
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
  ];

  return steps.filter(Boolean) as string[];
}

/**
 * Generate recommendation based on available fixes
 */
function generateRecommendation(
  upgradeGuidance: any,
  fixAvailability: FixAvailability,
): string {
  const { hasAnyFix } = fixAvailability;

  // No fixes available
  if (!hasAnyFix) {
    return "This vulnerability cannot be fixed by upgrading. Consider alternative remediation strategies such as applying security patches, implementing mitigating controls, or replacing the component.";
  }

  // Both short-term and long-term available
  if (upgradeGuidance.shortTerm && upgradeGuidance.longTerm) {
    return generateComparisonRecommendation(
      upgradeGuidance.shortTerm,
      upgradeGuidance.longTerm,
    );
  }

  // Only short-term available
  if (upgradeGuidance.shortTerm) {
    return `Only short-term fix available. Upgrade to ${upgradeGuidance.shortTerm.versionName}.`;
  }

  // Only long-term available
  if (upgradeGuidance.longTerm) {
    return `Only long-term fix available. Upgrade to ${upgradeGuidance.longTerm.versionName}.`;
  }

  return "";
}

