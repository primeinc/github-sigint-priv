export type RepoVisibility = "public" | "private" | "internal";

export type RepoSigint = {
  fullName: string;
  owner: string;
  visibility: RepoVisibility;
  archived: boolean;
  fork: boolean;
  defaultBranch: string;
  size: number;
  language?: string;
  topics?: string[];
  pushedAt?: string;
  updatedAt?: string;
  stars?: number;
  forks?: number;
  openIssues?: number;
  permissions?: {
    admin?: boolean;
    push?: boolean;
    pull?: boolean;
  };
};

export type OrgSigint = {
  owner: string;
  totalRepos: number;
  privateRepos: number;
  publicRepos: number;
  internalRepos: number;
  archivedRepos: number;
  forkRepos: number;
  totalSize: number;
  topLanguages: Record<string, number>;
  topTopics: Record<string, number>;
  defaultBranches: Record<string, number>;
  recentRepos: string[];
  lastPushedAt?: string;
  permissionCoverage: {
    admin: number;
    push: number;
    pull: number;
  };
};

export type InstallationSigint = {
  installationId?: number;
  accountLogin: string;
  accountType?: string;
  repositorySelection?: string;
  permissions?: Record<string, string>;
};

export type InventoryTotals = {
  owners: number;
  totalRepos: number;
  privateRepos: number;
  publicRepos: number;
  internalRepos: number;
  archivedRepos: number;
  forkRepos: number;
  totalSize: number;
  topLanguages: Record<string, number>;
};

export type GitHubInventorySummary = {
  collectedAt: string;
  authMode: "user-token" | "app-installation";
  ownerFilter?: string;
  installations: InstallationSigint[];
  totals: InventoryTotals;
  owners: OrgSigint[];
  repositories: RepoSigint[];
};
