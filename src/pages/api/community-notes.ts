import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "@/lib/db";

type CommunityNoteEntry = {
  id: string;
  communityId: string;
  communityName: string;
  address: string;
  note: string;
  score: number;
  savedAt: string;
};

type CommunityNoteRow = {
  id: string;
  community_id: string;
  community_name: string;
  address: string;
  note: string;
  score: number;
  saved_at: Date | string;
};

function rowToEntry(row: CommunityNoteRow): CommunityNoteEntry {
  const savedAt = row.saved_at instanceof Date ? row.saved_at.toISOString() : new Date(row.saved_at).toISOString();

  return {
    id: row.id,
    communityId: row.community_id,
    communityName: row.community_name,
    address: row.address,
    note: row.note,
    score: Number(row.score),
    savedAt
  };
}

function latestByCommunity(entries: CommunityNoteEntry[]) {
  return Object.values(
    entries.reduce<Record<string, CommunityNoteEntry>>((latest, entry) => {
      const current = latest[entry.communityId];
      if (!current || entry.savedAt > current.savedAt) latest[entry.communityId] = entry;
      return latest;
    }, {})
  );
}

async function getEntries() {
  const result = await query<CommunityNoteRow>(
    `
      SELECT id, community_id, community_name, address, note, score, saved_at
      FROM community_note_history
      ORDER BY saved_at ASC, id ASC
    `
  );

  return result.rows.map(rowToEntry);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const entries = await getEntries();
      res.status(200).json({ entries, latest: latestByCommunity(entries) });
      return;
    }

    if (req.method === "DELETE") {
      const communityId = typeof req.query.communityId === "string" ? req.query.communityId : "";
      if (!communityId) {
        res.status(400).json({ error: "Missing communityId" });
        return;
      }

      await query("DELETE FROM community_note_history WHERE community_id = $1", [communityId]);
      const entries = await getEntries();
      res.status(200).json({ entries, latest: latestByCommunity(entries) });
      return;
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST, DELETE");
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { communityId, communityName, address, note, score } = req.body ?? {};

    if (typeof communityId !== "string" || typeof communityName !== "string" || typeof address !== "string") {
      res.status(400).json({ error: "Missing community data" });
      return;
    }

    const savedAt = new Date();
    const id = `${communityId}-${savedAt.toISOString()}`;
    const normalizedNote = typeof note === "string" ? note : "";
    const normalizedScore = typeof score === "number" ? score : 0;

    const result = await query<CommunityNoteRow>(
      `
        INSERT INTO community_note_history (
          id, community_id, community_name, address, note, score, saved_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, community_id, community_name, address, note, score, saved_at
      `,
      [id, communityId, communityName, address, normalizedNote, normalizedScore, savedAt]
    );

    await query("UPDATE communities SET note = $1, score = $2, updated_at = now() WHERE id = $3", [normalizedNote, normalizedScore, communityId]);

    const entries = await getEntries();
    res.status(200).json({ entry: rowToEntry(result.rows[0]), latest: latestByCommunity(entries) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database request failed" });
  }
}
