/**
 * Black Duck API Type Definitions
 */

// Common metadata structure
export interface Meta {
  allow?: string[];
  href: string;
  links?: Link[];
}

interface Link {
  rel: string;
  href: string;
}

// Pagination response
export interface PaginatedResponse<T> {
  totalCount: number;
  items: T[];
  _meta?: Meta;
}

// Project types
export interface Project {
  name: string;
  description?: string;
  projectLevelAdjustments?: boolean;
  cloneCategories?: string[];
  customSignatureEnabled?: boolean;
  customSignatureDepth?: number;
  deepLicenseDataEnabled?: boolean;
  snippetAdjustmentApplied?: boolean;
  licenseConflictsEnabled?: boolean;
  projectGroup?: string;
  projectOwner?: string;
  projectTier?: number;
  source?: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  _meta: Meta;
}

export interface ProjectVersion {
  versionName: string;
  phase: string;
  distribution: string;
  nickname?: string;
  releaseComments?: string;
  releasedOn?: string;
  cloneFromReleaseId?: string;
  license?: {
    type: string;
    name?: string;
  };
  createdAt?: string;
  createdBy?: string;
  settingUpdatedAt?: string;
  settingUpdatedBy?: string;
  source?: string;
  _meta: Meta;
}

// Vulnerability types
export interface VulnerableComponent {
  componentName: string;
  componentVersionName: string;
  vulnerabilityWithRemediation: VulnerabilityWithRemediation;
  _meta: Meta;
}

export interface VulnerabilityWithRemediation {
  vulnerabilityName: string;
  description?: string;
  vulnerabilityPublishedDate?: string;
  vulnerabilityUpdatedDate?: string;
  baseScore?: number;
  impactSubscore?: number;
  exploitabilitySubscore?: number;
  source?: string;
  severity?: VulnerabilitySeverity;
  cvss2?: CvssScore;
  cvss3?: CvssScore;
  relatedVulnerability?: string;
  remediationStatus?: RemediationStatus;
  remediationComment?: string;
  remediationTargetAt?: string;
  remediationActualAt?: string;
  remediationCreatedAt?: string;
  remediationCreatedBy?: string;
  remediationUpdatedAt?: string;
  remediationUpdatedBy?: string;
  cweId?: string;
  bdsa?: BdsaVulnerability;
  _meta: Meta;
}

export type VulnerabilitySeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface CvssScore {
  baseScore?: number;
  impactSubscore?: number;
  exploitabilitySubscore?: number;
  attackVector?: string;
  attackComplexity?: string;
  authentication?: string;
  confidentialityImpact?: string;
  integrityImpact?: string;
  availabilityImpact?: string;
  privilegesRequired?: string;
  userInteraction?: string;
  scope?: string;
  source?: string;
  severity?: string;
  temporalMetrics?: TemporalMetrics;
  vector?: string;
}

interface TemporalMetrics {
  exploitCodeMaturity?: string;
  remediationLevel?: string;
  reportConfidence?: string;
  score?: number;
  severity?: string;
  vector?: string;
}

export interface BdsaVulnerability {
  bdsa?: string;
  affectedProduct?: string;
  description?: string;
  workaround?: string;
  solution?: string;
  _meta?: Meta;
}

// Remediation types
export type RemediationStatus =
  | "NEW"
  | "REMEDIATION_REQUIRED"
  | "IGNORED"
  | "DUPLICATE";

export interface RemediationUpdate {
  remediationStatus: RemediationStatus;
  comment?: string;
}

export interface VulnerabilityRemediation {
  vulnerabilityName: string;
  description?: string;
  remediationStatus?: RemediationStatus;
  remediationTargetAt?: string;
  remediationActualAt?: string;
  remediationCreatedAt?: string;
  remediationCreatedBy?: string;
  remediationUpdatedAt?: string;
  remediationUpdatedBy?: string;
  comment?: string;
  source?: string;
  severity?: VulnerabilitySeverity;
  baseScore?: number;
  overallScore?: number;
  exploitabilitySubscore?: number;
  impactSubscore?: number;
  cvss2?: CvssScore;
  cvss3?: CvssScore;
  relatedVulnerability?: string;
  cweId?: string;
  bdsa?: BdsaVulnerability;
  _meta: Meta;
}

// Dependency Paths types
export interface DependencyPathsResponse {
  totalCount: number;
  items: DependencyPathItem[];
  _meta: Meta;
}

export interface DependencyPathItem {
  count: number;
  type: "DIRECT" | "TRANSITIVE";
  path: DependencyPathNode[];
}

interface DependencyPathNode {
  name: string;
  version: string;
  originId: string;
  nameSpace: string;
  _meta: Meta;
}

// Upgrade Guidance types
export interface UpgradeGuidanceResponse {
  component: string;
  componentName: string;
  version: string;
  versionName: string;
  origin: string;
  originName: string;
  originExternalNamespace: string;
  originExternalId: string;
  shortTerm?: UpgradeRecommendation;
  longTerm?: UpgradeRecommendation;
  _meta: Meta;
}

export interface UpgradeRecommendation {
  version: string;
  versionName: string;
  vulnerabilityRisk: VulnerabilityRiskCounts;
  origin: string;
  originName: string;
  originExternalNamespace: string;
  originExternalId: string;
}

export interface VulnerabilityRiskCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

// Error response
export interface ErrorResponse {
  errorCode?: string;
  message: string;
  errorMessage?: string;
}
