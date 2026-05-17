import { toRepoSigint } from "../lib/github/normalize";
import { buildInventorySummary } from "../lib/github/metrics";

describe("GitHub inventory metrics", () => {
  it("normalizes repository API responses into RepoSigint", () => {
    const repository = toRepoSigint({
      full_name: "acme/private-api",
      owner: { login: "acme" },
      private: true,
      archived: false,
      fork: false,
      default_branch: "main",
      size: 120,
      language: "TypeScript",
      topics: ["internal", "api"],
      pushed_at: "2026-05-01T00:00:00Z",
      updated_at: "2026-05-02T00:00:00Z",
      stargazers_count: 4,
      forks_count: 1,
      open_issues_count: 2,
      permissions: { admin: true, push: true, pull: true },
    });

    expect(repository).toEqual({
      fullName: "acme/private-api",
      owner: "acme",
      visibility: "private",
      archived: false,
      fork: false,
      defaultBranch: "main",
      size: 120,
      language: "TypeScript",
      topics: ["internal", "api"],
      pushedAt: "2026-05-01T00:00:00Z",
      updatedAt: "2026-05-02T00:00:00Z",
      stars: 4,
      forks: 1,
      openIssues: 2,
      permissions: { admin: true, push: true, pull: true },
    });
  });

  it("aggregates per-owner and overall totals from unique repositories", () => {
    const repositories = [
      {
        fullName: "acme/private-api",
        owner: "acme",
        visibility: "private" as const,
        archived: false,
        fork: false,
        defaultBranch: "main",
        size: 120,
        language: "TypeScript",
        topics: ["internal", "api"],
        pushedAt: "2026-05-03T00:00:00Z",
        permissions: { admin: true, push: true, pull: true },
      },
      {
        fullName: "acme/public-web",
        owner: "acme",
        visibility: "public" as const,
        archived: false,
        fork: false,
        defaultBranch: "main",
        size: 80,
        language: "TypeScript",
        topics: ["frontend"],
        pushedAt: "2026-05-04T00:00:00Z",
        permissions: { admin: true, push: true, pull: true },
      },
      {
        fullName: "beta/internal-fork",
        owner: "beta",
        visibility: "internal" as const,
        archived: true,
        fork: true,
        defaultBranch: "develop",
        size: 40,
        language: "Go",
        topics: ["platform"],
        pushedAt: "2026-04-01T00:00:00Z",
        permissions: { admin: false, push: false, pull: true },
      },
      {
        fullName: "acme/public-web",
        owner: "acme",
        visibility: "public" as const,
        archived: false,
        fork: false,
        defaultBranch: "main",
        size: 80,
        language: "TypeScript",
        topics: ["frontend"],
        pushedAt: "2026-05-04T00:00:00Z",
        permissions: { admin: true, push: true, pull: true },
      },
    ];

    const summary = buildInventorySummary({
      authMode: "app-installation",
      repositories,
      installations: [
        {
          installationId: 101,
          accountLogin: "acme",
          accountType: "Organization",
          repositorySelection: "all",
        },
      ],
    });

    expect(summary.totals).toMatchObject({
      owners: 2,
      totalRepos: 3,
      privateRepos: 1,
      publicRepos: 1,
      internalRepos: 1,
      archivedRepos: 1,
      forkRepos: 1,
      totalSize: 240,
      topLanguages: {
        TypeScript: 200,
        Go: 40,
      },
    });

    expect(summary.owners[0]).toMatchObject({
      owner: "acme",
      totalRepos: 2,
      privateRepos: 1,
      publicRepos: 1,
      internalRepos: 0,
      topTopics: {
        internal: 1,
        api: 1,
        frontend: 1,
      },
      recentRepos: ["acme/public-web", "acme/private-api"],
    });
  });
});
