import z from "zod";
import { VulnerabilitySeverity } from "../client/types.js";
import {
  getProjectId,
  getProjectVersionId,
} from "../services/project.service.js";
import {
  getVulnerabilities,
  Vulnerability,
} from "../services/vulnerability/service.js";

export const GetProjectVulnerabilitiesSchema = z.object({
  projectName: z
    .string()
    .describe("Name of the project to retrieve vulnerabilities for"),
  severity: z
    .enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"])
    .optional()
    .describe("Filter vulnerabilities by severity"),
});

export type Params = z.infer<typeof GetProjectVulnerabilitiesSchema>;

export async function getVulnerabilitiesForProject(
  params: Params,
): Promise<Vulnerability[]> {
  const projectName = params.projectName;
  const severity = params.severity as VulnerabilitySeverity;

  const projectId = await getProjectId(projectName);
  const projectVersionId = await getProjectVersionId(projectId, projectName);

  return await getVulnerabilities(projectId, projectVersionId, severity);
}
