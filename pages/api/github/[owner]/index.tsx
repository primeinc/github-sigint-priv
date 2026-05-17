import type { NextApiRequest, NextApiResponse } from "next";
import { collectGitHubInventory } from "../../../../lib/github/collectRepos";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { owner } = req.query;

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const data = await collectGitHubInventory(owner as string);
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    res.status(200).json(data);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
}
