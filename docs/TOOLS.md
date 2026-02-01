# Available Tools

This document provides detailed information about all tools available in the Black Duck MCP Server.

## Table of Contents
- [list_projects](#1-list_projects)
- [find_project_by_name](#2-find_project_by_name)
- [get_project_details](#3-get_project_details)
- [list_project_versions](#4-list_project_versions)
- [get_project_vulnerabilities](#5-get_project_vulnerabilities)
- [get_vulnerability_details](#6-get_vulnerability_details)
- [update_vulnerability_remediation](#7-update_vulnerability_remediation)
- [get_vulnerability_fix_guidance](#8-get_vulnerability_fix_guidance)

---

## 1. `list_projects`

List all Black Duck projects with optional filtering and pagination.

### Parameters
- `limit` (optional): Maximum number of results (default: 100)
- `offset` (optional): Pagination offset (default: 0)
- `searchTerm` (optional): Filter by project name (partial match)

### Example Usage
```
List all projects
Show projects with "webapp" in the name
```

### Response Format
Returns a JSON array of projects with:
- Project ID (UUID)
- Project name
- Description
- Created date
- Metadata

---

## 2. `find_project_by_name`

Find projects by name with partial matching support.

### Parameters
- `projectName` (required): Name to search for

### Example Usage
```
Find project named "MyApplication"
```

### Response Format
Returns matching projects with their IDs and details. Useful when you know the project name but need the project ID.

---

## 3. `get_project_details`

Get detailed information about a specific project including all versions.

### Parameters
- `projectId` (required): UUID of the project

### Example Usage
```
Get details for project abc-123-def
```

### Response Format
Returns detailed project information including:
- Project metadata
- All project versions
- Version names and IDs
- Phase information

---

## 4. `list_project_versions`

List all versions of a specific project.

### Parameters
- `projectId` (required): UUID of the project
- `limit` (optional): Maximum number of results (default: 100)
- `offset` (optional): Pagination offset (default: 0)

### Example Usage
```
List versions for project abc-123-def
```

### Response Format
Returns version information including:
- Version ID (UUID)
- Version name
- Phase (e.g., DEVELOPMENT, RELEASED)
- Distribution type

---

## 5. `get_project_vulnerabilities`

Get vulnerable components and their vulnerabilities for a project version.

### Parameters
- `projectId` (required): UUID of the project
- `projectVersionId` (required): UUID of the project version
- `limit` (optional): Maximum results (default: 100)
- `offset` (optional): Pagination offset (default: 0)
- `severity` (optional): Filter by severity (CRITICAL, HIGH, MEDIUM, LOW, INFO, UNSPECIFIED)
- `searchTerm` (optional): Search by component or vulnerability name

### Example Usage
```
Show all CRITICAL vulnerabilities in project abc-123-def version xyz-789
List all vulnerabilities with "log4j" in the name
```

### Response Format
Returns vulnerable components with:
- Component name and version
- Vulnerability ID (CVE)
- Severity level
- CVSS scores
- Remediation status
- Description

---

## 6. `get_vulnerability_details`

Get detailed information about a specific vulnerability including CVSS scores and remediation info.

### Parameters
- `projectId` (required): UUID of the project
- `projectVersionId` (required): UUID of the project version
- `componentId` (required): UUID of the component
- `componentVersionId` (required): UUID of the component version
- `vulnerabilityId` (required): Vulnerability ID (e.g., CVE-2023-1234)

### Example Usage
```
Get details for CVE-2023-1234 in the specified component
```

### Response Format
Returns detailed vulnerability information:
- Full CVSS v2 and v3 scores
- Attack vector details
- Remediation status and comments
- Technical description
- Solution/workaround information
- Related security bulletins

---

## 7. `update_vulnerability_remediation`

Update the remediation status and add comments for a vulnerability.

### Parameters
- `projectId` (required): UUID of the project
- `projectVersionId` (required): UUID of the project version
- `componentId` (required): UUID of the component
- `componentVersionId` (required): UUID of the component version
- `vulnerabilityId` (required): Vulnerability ID (e.g., CVE-2023-1234)
- `remediationStatus` (required): One of:
  - `NEW` - Newly discovered vulnerability
  - `REMEDIATION_REQUIRED` - Requires action
  - `REMEDIATION_COMPLETE` - Has been fixed
  - `DUPLICATE` - Duplicate of another vulnerability
  - `IGNORED` - Intentionally ignored
  - `MITIGATED` - Risk has been mitigated
  - `NEEDS_REVIEW` - Requires further review
  - `NOT_VULNERABLE` - Not affected by this vulnerability
  - `PATCHED` - Patch has been applied
- `comment` (optional): Explanation for the remediation decision

### Example Usage
```
Mark CVE-2023-1234 as NOT_VULNERABLE with comment "This code path is never executed"
Set CVE-2024-5678 to REMEDIATION_REQUIRED with comment "Need to upgrade to v2.0.0"
```

### Response Format
Returns confirmation of the status update with the new remediation status.

---

## 8. `get_vulnerability_fix_guidance`

Determine if a vulnerability is fixable and get specific upgrade paths. This tool identifies whether a vulnerability can be fixed by upgrading the component and provides detailed recommendations.

### Parameters
- `projectId` (required): UUID of the project
- `projectVersionId` (required): UUID of the project version
- `componentId` (required): UUID of the component
- `componentVersionId` (required): UUID of the component version
- `vulnerabilityId` (required): Vulnerability ID (e.g., CVE-2023-1234)
- `originId` (required): UUID of the origin

### Example Usage
```
Get fix guidance for CVE-2023-1234 in the specified component
Check if upgrading can fix the log4j vulnerability
Is there a version upgrade that fixes this security issue?
```

### Response Format
Returns comprehensive fix guidance including:

#### Vulnerability Context
- Vulnerability name and severity
- CVSS scores (v2/v3)
- Brief description
- Current remediation status

#### Component Information
- Component name and current version
- Dependency type (DIRECT or TRANSITIVE)
- Origin identifier

#### Fix Guidance

**Short-term Upgrade Path:**
- Recommended version for quick fix
- Number of vulnerabilities remaining after upgrade
- Risk reduction assessment
- Origin ID for the upgrade

**Long-term Upgrade Path:**
- Recommended version for long-term stability
- Number of vulnerabilities remaining after upgrade
- Risk reduction assessment
- Origin ID for the upgrade

#### Action Steps
Provides specific, actionable steps based on:
- Whether the vulnerability is fixable
- Whether it's a direct or transitive dependency
- Available upgrade paths

For **direct dependencies**:
1. Update your dependency to recommended version
2. Modify package manager configuration
3. Run install/update command
4. Test application compatibility
5. Rescan with Black Duck

For **transitive dependencies**:
1. Identify parent dependency to update
2. Update parent to version that includes fixed transitive
3. Run install/update command
4. Test application compatibility
5. Rescan with Black Duck

For **non-fixable vulnerabilities**:
1. Apply security patches if available
2. Implement additional security controls
3. Consider component alternatives
4. Accept risk if appropriate

#### Recommendations
Provides specific recommendations such as:
- Which upgrade path to prefer (short-term vs long-term)
- Trade-offs between version compatibility and security
- Alternative remediation strategies for non-fixable vulnerabilities

### Important Notes
- This tool must be called for each vulnerability to determine if it's fixable
- Not all vulnerabilities can be fixed by upgrading
- Risk reduction metrics help prioritize remediation efforts
- Transitive dependencies require updating the parent dependency

---

## Common Workflows

### Finding and Analyzing Vulnerabilities
1. Use `list_projects` or `find_project_by_name` to locate your project
2. Use `list_project_versions` to find the version to analyze
3. Use `get_project_vulnerabilities` to list all vulnerabilities (optionally filter by severity)
4. Use `get_vulnerability_details` for detailed information about specific CVEs
5. Use `get_vulnerability_fix_guidance` to determine if upgrading can fix the issue
6. Use `update_vulnerability_remediation` to track remediation decisions

### Prioritizing Remediation
1. Start with CRITICAL and HIGH severity vulnerabilities
2. Use `get_vulnerability_fix_guidance` to identify which are fixable
3. Focus on fixable vulnerabilities with available upgrade paths
4. For non-fixable vulnerabilities, document mitigation strategies using `update_vulnerability_remediation`

### Managing Transitive Dependencies
1. Use `get_vulnerability_fix_guidance` to identify if a vulnerable component is transitive
2. The tool will indicate which parent dependency needs updating
3. Update the direct dependency to a version that includes the fixed transitive component
4. Rescan to verify the vulnerability is resolved
