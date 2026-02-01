/**
 * Utility functions for vulnerability fix guidance
 */

import type { VulnerabilityRiskCounts } from "../client/types.js";

export interface FixAvailability {
  hasShortTermFix: boolean;
  hasLongTermFix: boolean;
  hasAnyFix: boolean;
}

/**
 * Calculate risk reduction message based on remaining vulnerabilities
 */
export function calculateRiskReduction(remainingRisks: VulnerabilityRiskCounts): string {
  const total = getTotalVulnerabilities(remainingRisks);

  if (total === 0) {
    return "Eliminates all known vulnerabilities";
  }

  const criticalAndHigh = remainingRisks.critical + remainingRisks.high;
  if (criticalAndHigh === 0) {
    return `Eliminates all critical and high severity vulnerabilities (${total} low/medium remain)`;
  }

  const parts = [];
  if (remainingRisks.critical > 0) parts.push(`${remainingRisks.critical} critical`);
  if (remainingRisks.high > 0) parts.push(`${remainingRisks.high} high`);
  if (remainingRisks.medium > 0) parts.push(`${remainingRisks.medium} medium`);
  if (remainingRisks.low > 0) parts.push(`${remainingRisks.low} low`);

  return `${total} vulnerabilities remain: ${parts.join(", ")}`;
}

/**
 * Get total vulnerability count across all severity levels
 */
export function getTotalVulnerabilities(risks: VulnerabilityRiskCounts): number {
  return risks.critical + risks.high + risks.medium + risks.low;
}

/**
 * Determine what fixes are available from upgrade guidance
 */
export function getFixAvailability(upgradeGuidance: any): FixAvailability {
  const hasShortTermFix = upgradeGuidance.shortTerm !== undefined;
  const hasLongTermFix = upgradeGuidance.longTerm !== undefined;
  const hasAnyFix = hasShortTermFix || hasLongTermFix;

  return { hasShortTermFix, hasLongTermFix, hasAnyFix };
}

/**
 * Extract component IDs from dependency path node
 */
export function extractComponentIdsFromPath(
  pathItem: any,
  dependencyType: "DIRECT" | "TRANSITIVE",
): { componentId: string; componentVersionId: string; originId?: string } | null {
  if (!pathItem.path || pathItem.path.length <= 1) {
    return null;
  }

  const pathNode = pathItem.path[pathItem.path.length - 2]; // Second to last node
  const links = pathNode._meta?.links || [];

  // Find the appropriate upgrade guidance link
  const guidanceLink = links.find((link: any) =>
    dependencyType === "DIRECT"
      ? link.rel === "upgrade-guidance"
      : link.rel === "transitive-upgrade-guidance",
  );

  if (!guidanceLink?.href) {
    return null;
  }

  return parseComponentIdsFromHref(guidanceLink.href, dependencyType);
}

/**
 * Parse component IDs from upgrade guidance href
 * Format: /api/components/{componentId}/versions/{componentVersionId}/upgrade-guidance
 * or: /api/components/{componentId}/versions/{componentVersionId}/origins/{originId}/transitive-upgrade-guidance
 */
function parseComponentIdsFromHref(
  href: string,
  dependencyType: "DIRECT" | "TRANSITIVE",
): { componentId: string; componentVersionId: string; originId?: string } | null {
  const hrefParts = href.split("/");
  const componentsIndex = hrefParts.indexOf("components");
  const versionsIndex = hrefParts.indexOf("versions");
  const originsIndex = hrefParts.indexOf("origins");

  if (componentsIndex === -1 || versionsIndex === -1) {
    return null;
  }

  const result = {
    componentId: hrefParts[componentsIndex + 1],
    componentVersionId: hrefParts[versionsIndex + 1],
    originId: undefined as string | undefined,
  };

  if (originsIndex !== -1 && dependencyType === "TRANSITIVE") {
    result.originId = hrefParts[originsIndex + 1];
  }

  return result;
}

/**
 * Generate recommendation comparing short-term and long-term upgrade options
 */
export function generateComparisonRecommendation(shortTerm: any, longTerm: any): string {
  const shortTermVulns = getTotalVulnerabilities(shortTerm.vulnerabilityRisk);
  const longTermVulns = getTotalVulnerabilities(longTerm.vulnerabilityRisk);

  if (longTermVulns < shortTermVulns) {
    return `Recommended: Use the long-term version (${longTerm.versionName}) as it has fewer vulnerabilities.`;
  }

  if (shortTermVulns === 0) {
    return `Recommended: Use the short-term version (${shortTerm.versionName}) as it has no known vulnerabilities.`;
  }

  return `Both versions have vulnerabilities. Consider the trade-offs between version compatibility and security.`;
}
