# github-sigint-priv

Authenticated GitHub inventory collection plus AI summarization for private, public, and internal repository access you already have.

## What it does

- Enumerates repositories server-side with either:
  - a user token (`GITHUB_USER_TOKEN` or `GITHUB_TOKEN`), or
  - GitHub App credentials (`GITHUB_APP_ID`, `GITHUB_PRIVATE_KEY`, optional `GITHUB_INSTALLATION_IDS`)
- Aggregates owner/repo metrics into a private inventory snapshot
- Streams that summary into the existing AI flow to produce a concise SIGINT-style report
- Avoids third-party scraping of GitHub profile pages

## API shape

- `GET /api/github/private-summary`
  - Optional `owner` query parameter to scope results to a specific org/user
- `POST /api/generate_user`
  - Accepts the collected inventory summary and produces a first-pass analysis
- `POST /api/generate_profile`
  - Refines that analysis into a tailored report

## Environment

Add the following to `.env`:

```bash
OPENAI_API_KEY=

# Use one auth mode:
GITHUB_USER_TOKEN=
# or
GITHUB_APP_ID=
GITHUB_PRIVATE_KEY=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_INSTALLATION_IDS=
```

## Running locally

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Notes

- Tokens and GitHub App credentials stay server-side.
- The collector only summarizes repositories accessible to the configured token or installation.
- It does not scrape private repository content from third parties because that would be clown behavior.
