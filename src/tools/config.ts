import {
  GetProjectVulnerabilitiesSchema,
  getVulnerabilitiesForProject,
} from "./get-detail.js";

export const TOOLS = [
  {
    name: "get-project-vulnerabilities",
    description: "Retrieve vulnerabilities for a specific project",
    inputSchema: GetProjectVulnerabilitiesSchema,
    handler: getVulnerabilitiesForProject,
  },
];
