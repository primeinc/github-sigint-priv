import { RepoSigint, RepoVisibility } from "../../types/github-sigint";

const normalizeVisibility = (repository: any): RepoVisibility => {
  if (repository.visibility === "internal") {
    return "internal";
  }

  if (repository.visibility === "private" || repository.private) {
    return "private";
  }

  return "public";
};

export const toRepoSigint = (repository: any): RepoSigint => ({
  fullName: repository.full_name,
  owner: repository.owner?.login || "unknown",
  visibility: normalizeVisibility(repository),
  archived: Boolean(repository.archived),
  fork: Boolean(repository.fork),
  defaultBranch: repository.default_branch || "main",
  size: Number(repository.size || 0),
  language: repository.language || undefined,
  topics: Array.isArray(repository.topics) && repository.topics.length ? repository.topics : undefined,
  pushedAt: repository.pushed_at || undefined,
  updatedAt: repository.updated_at || undefined,
  stars: typeof repository.stargazers_count === "number" ? repository.stargazers_count : undefined,
  forks: typeof repository.forks_count === "number" ? repository.forks_count : undefined,
  openIssues:
    typeof repository.open_issues_count === "number" ? repository.open_issues_count : undefined,
  permissions: repository.permissions
    ? {
        admin: Boolean(repository.permissions.admin),
        push: Boolean(repository.permissions.push),
        pull: Boolean(repository.permissions.pull),
      }
    : undefined,
});
