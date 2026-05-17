import { Octokit } from "@octokit/rest";
import { getGitHubAuthContext } from "./auth";
import { buildInventorySummary } from "./metrics";
import { toRepoSigint } from "./normalize";

const paginateRepositories = async (octokit: Octokit, route: string, parameters: Record<string, any>) => {
  const repositories: any[] = [];

  for await (const response of octokit.paginate.iterator(route, {
    per_page: 100,
    ...parameters,
  })) {
    const data: any = response.data;

    if (Array.isArray(data)) {
      repositories.push(...data);
      continue;
    }

    if (Array.isArray(data?.repositories)) {
      repositories.push(...data.repositories);
    }
  }

  return repositories;
};

export async function collectGitHubInventory(ownerFilter?: string) {
  const authContext = await getGitHubAuthContext(ownerFilter);

  const repositories = await Promise.all(
    authContext.clients.map(async (client) => {
      if (authContext.mode === "user-token") {
        return paginateRepositories(client.octokit, "GET /user/repos", {
          affiliation: "owner,collaborator,organization_member",
          visibility: "all",
          sort: "updated",
        });
      }

      return paginateRepositories(client.octokit, "GET /installation/repositories", {});
    })
  );

  const flattenedRepositories = repositories
    .flat()
    .filter((repository) =>
      ownerFilter ? repository.owner?.login?.toLowerCase() === ownerFilter.toLowerCase() : true
    )
    .map(toRepoSigint);

  return buildInventorySummary({
    authMode: authContext.mode,
    repositories: flattenedRepositories,
    installations: authContext.installations,
    ownerFilter,
  });
}
