import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import { InstallationSigint } from "../../types/github-sigint";

const USER_AGENT = "github-sigint-priv";

export type AuthenticatedGitHubClient = InstallationSigint & {
  octokit: Octokit;
};

export type GitHubAuthContext = {
  mode: "user-token" | "app-installation";
  clients: AuthenticatedGitHubClient[];
  installations: InstallationSigint[];
};

const normalizePrivateKey = (value: string) => value.replace(/\\n/g, "\n");

const parseInstallationIds = () => {
  const raw = process.env.GITHUB_INSTALLATION_IDS;
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isFinite(value));
};

const matchesOwner = (candidate: string | undefined, ownerFilter?: string) => {
  if (!ownerFilter) {
    return true;
  }

  return candidate?.toLowerCase() === ownerFilter.toLowerCase();
};

const getInstallationAccountLogin = (installation: any) => {
  const account = installation.account;
  if (!account) {
    return undefined;
  }

  if ("login" in account) {
    return account.login;
  }

  return undefined;
};

const getInstallationAccountType = (installation: any) => {
  const account = installation.account;
  if (!account) {
    return undefined;
  }

  if ("type" in account) {
    return account.type;
  }

  return "Enterprise";
};

export async function getGitHubAuthContext(ownerFilter?: string): Promise<GitHubAuthContext> {
  const userToken = process.env.GITHUB_USER_TOKEN || process.env.GITHUB_TOKEN;
  if (userToken) {
    const octokit = new Octokit({
      auth: userToken,
      userAgent: USER_AGENT,
    });
    const viewer = await octokit.request("GET /user");

    return {
      mode: "user-token",
      clients: [
        {
          octokit,
          accountLogin: viewer.data.login,
          accountType: viewer.data.type,
        },
      ],
      installations: [
        {
          accountLogin: viewer.data.login,
          accountType: viewer.data.type,
        },
      ],
    };
  }

  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY;

  if (!appId || !privateKey) {
    throw new Error(
      "Missing GitHub auth configuration. Set GITHUB_USER_TOKEN (or GITHUB_TOKEN), or configure GITHUB_APP_ID and GITHUB_PRIVATE_KEY."
    );
  }

  const appConfig = {
    appId,
    privateKey: normalizePrivateKey(privateKey),
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  };

  const appOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth: appConfig,
    userAgent: USER_AGENT,
  });

  const configuredInstallationIds = parseInstallationIds();
  const installationData = configuredInstallationIds.length
    ? await Promise.all(
        configuredInstallationIds.map(async (installationId) => {
          const response = await appOctokit.request(
            "GET /app/installations/{installation_id}",
            { installation_id: installationId }
          );
          return response.data;
        })
      )
    : await appOctokit.paginate("GET /app/installations", {
        per_page: 100,
      });

  const filteredInstallations = installationData.filter((installation) =>
    matchesOwner(getInstallationAccountLogin(installation), ownerFilter)
  );

  if (!filteredInstallations.length) {
    if (ownerFilter) {
      throw new Error(`No GitHub App installation found for owner "${ownerFilter}".`);
    }
    throw new Error("No GitHub App installations are available for collection.");
  }

  const auth = createAppAuth(appConfig);
  const clients = await Promise.all(
    filteredInstallations.map(async (installation) => {
      const installationAuth = await auth({
        type: "installation",
        installationId: installation.id,
      });

      return {
        octokit: new Octokit({
          auth: installationAuth.token,
          userAgent: USER_AGENT,
        }),
        installationId: installation.id,
        accountLogin: getInstallationAccountLogin(installation) || `installation-${installation.id}`,
        accountType: getInstallationAccountType(installation),
        repositorySelection: installation.repository_selection,
        permissions: installation.permissions || {},
      };
    })
  );

  return {
    mode: "app-installation",
    clients,
    installations: clients.map(
      ({ octokit: _octokit, ...installation }) => installation
    ),
  };
}
