import { blackDuckClient } from "../client/blackduck-client.js";

export async function getProjectId(name: string): Promise<string> {
  const projects = await blackDuckClient.findProjectByName(name);

  if (projects.length > 1) {
    throw new Error(
      `Multiple projects found with name "${name}". Please specify a unique project name.`,
    );
  }

  if (projects.length === 0) {
    throw new Error(`No project found with name "${name}".`);
  }

  const projectId = blackDuckClient.extractIdFromHref(projects[0]._meta.href);

  return projectId;
}

export async function getProjectVersionId(
  projectId: string,
  projectName: string,
): Promise<string> {
  const projectVersions = await blackDuckClient.listProjectVersions(projectId);

  if (projectVersions.totalCount === 0) {
    throw new Error(`No versions found for project "${projectName}".`);
  }

  if (projectVersions.totalCount > 1) {
    throw new Error(
      `Multiple versions found for project "${projectName}". Please specify a unique project version.`,
    );
  }

  const version = projectVersions.items[0];
  const versionId = blackDuckClient.extractIdFromHref(version._meta.href);

  return versionId;
}
