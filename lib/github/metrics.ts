import {
  GitHubInventorySummary,
  InstallationSigint,
  OrgSigint,
  RepoSigint,
} from "../../types/github-sigint";

const sortRecord = (input: Record<string, number>) =>
  Object.fromEntries(
    Object.entries(input).sort(([, left], [, right]) => right - left || 0)
  );

const increment = (input: Record<string, number>, key?: string, amount = 1) => {
  if (!key) {
    return;
  }

  input[key] = (input[key] || 0) + amount;
};

const latestDate = (current?: string, candidate?: string) => {
  if (!candidate) {
    return current;
  }

  if (!current) {
    return candidate;
  }

  return new Date(candidate).getTime() > new Date(current).getTime() ? candidate : current;
};

const dedupeRepos = (repositories: RepoSigint[]) =>
  Array.from(
    new Map(repositories.map((repository) => [repository.fullName, repository])).values()
  );

const buildOrgSigint = (owner: string, repositories: RepoSigint[]): OrgSigint => {
  const topLanguages: Record<string, number> = {};
  const topTopics: Record<string, number> = {};
  const defaultBranches: Record<string, number> = {};
  const recentRepos = [...repositories]
    .sort((left, right) => {
      const leftDate = left.pushedAt ? new Date(left.pushedAt).getTime() : 0;
      const rightDate = right.pushedAt ? new Date(right.pushedAt).getTime() : 0;
      return rightDate - leftDate;
    })
    .slice(0, 5)
    .map((repository) => repository.fullName);

  let privateRepos = 0;
  let publicRepos = 0;
  let internalRepos = 0;
  let archivedRepos = 0;
  let forkRepos = 0;
  let totalSize = 0;
  let lastPushedAt: string | undefined;
  const permissionCoverage = {
    admin: 0,
    push: 0,
    pull: 0,
  };

  for (const repository of repositories) {
    totalSize += repository.size;
    increment(defaultBranches, repository.defaultBranch);
    increment(topLanguages, repository.language, repository.size || 1);
    repository.topics?.forEach((topic) => increment(topTopics, topic));
    lastPushedAt = latestDate(lastPushedAt, repository.pushedAt);

    if (repository.visibility === "private") {
      privateRepos += 1;
    } else if (repository.visibility === "internal") {
      internalRepos += 1;
    } else {
      publicRepos += 1;
    }

    if (repository.archived) {
      archivedRepos += 1;
    }
    if (repository.fork) {
      forkRepos += 1;
    }
    if (repository.permissions?.admin) {
      permissionCoverage.admin += 1;
    }
    if (repository.permissions?.push) {
      permissionCoverage.push += 1;
    }
    if (repository.permissions?.pull) {
      permissionCoverage.pull += 1;
    }
  }

  return {
    owner,
    totalRepos: repositories.length,
    privateRepos,
    publicRepos,
    internalRepos,
    archivedRepos,
    forkRepos,
    totalSize,
    topLanguages: sortRecord(topLanguages),
    topTopics: sortRecord(topTopics),
    defaultBranches: sortRecord(defaultBranches),
    recentRepos,
    lastPushedAt,
    permissionCoverage,
  };
};

export function buildInventorySummary({
  authMode,
  repositories,
  installations,
  ownerFilter,
}: {
  authMode: "user-token" | "app-installation";
  repositories: RepoSigint[];
  installations: InstallationSigint[];
  ownerFilter?: string;
}): GitHubInventorySummary {
  const uniqueRepositories = dedupeRepos(repositories).sort((left, right) =>
    left.fullName.localeCompare(right.fullName)
  );
  const ownerMap = new Map<string, RepoSigint[]>();

  for (const repository of uniqueRepositories) {
    const repos = ownerMap.get(repository.owner) || [];
    repos.push(repository);
    ownerMap.set(repository.owner, repos);
  }

  const owners = Array.from(ownerMap.entries())
    .map(([owner, ownerRepositories]) => buildOrgSigint(owner, ownerRepositories))
    .sort((left, right) => right.totalRepos - left.totalRepos || left.owner.localeCompare(right.owner));

  const totals = owners.reduce(
    (accumulator, owner) => {
      accumulator.owners += 1;
      accumulator.totalRepos += owner.totalRepos;
      accumulator.privateRepos += owner.privateRepos;
      accumulator.publicRepos += owner.publicRepos;
      accumulator.internalRepos += owner.internalRepos;
      accumulator.archivedRepos += owner.archivedRepos;
      accumulator.forkRepos += owner.forkRepos;
      accumulator.totalSize += owner.totalSize;

      Object.entries(owner.topLanguages).forEach(([language, count]) =>
        increment(accumulator.topLanguages, language, count)
      );

      return accumulator;
    },
    {
      owners: 0,
      totalRepos: 0,
      privateRepos: 0,
      publicRepos: 0,
      internalRepos: 0,
      archivedRepos: 0,
      forkRepos: 0,
      totalSize: 0,
      topLanguages: {} as Record<string, number>,
    }
  );

  return {
    collectedAt: new Date().toISOString(),
    authMode,
    ownerFilter,
    installations,
    totals: {
      ...totals,
      topLanguages: sortRecord(totals.topLanguages),
    },
    owners,
    repositories: uniqueRepositories,
  };
}
