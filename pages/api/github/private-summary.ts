import type { NextApiRequest, NextApiResponse } from "next";
import { collectGitHubInventory } from "../../../lib/github/collectRepos";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const ownerFilter =
    typeof req.query.owner === "string" && req.query.owner.trim()
      ? req.query.owner.trim()
      : undefined;

  try {
    const data = await collectGitHubInventory(ownerFilter);
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Unexpected error." });
  }
}
