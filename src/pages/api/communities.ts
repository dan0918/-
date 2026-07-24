import type { NextApiRequest, NextApiResponse } from "next";
import { query, transaction } from "@/lib/db";
import type { Community } from "@/types/community";

type CommunityRow = {
  id: string;
  name: string;
  address: string;
  station: string;
  lat: number;
  lng: number;
  price_per_ping: string;
  age: string;
  source_url: string;
  note: string;
  score: number;
};

function rowToCommunity(row: CommunityRow): Community {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    station: row.station,
    lat: Number(row.lat),
    lng: Number(row.lng),
    pricePerPing: row.price_per_ping,
    age: row.age,
    sourceUrl: row.source_url || undefined,
    note: row.note,
    score: Number(row.score)
  };
}

function isCommunity(value: unknown): value is Community {
  const community = value as Community;
  return (
    typeof community?.id === "string" &&
    typeof community.name === "string" &&
    typeof community.address === "string" &&
    typeof community.station === "string" &&
    typeof community.lat === "number" &&
    typeof community.lng === "number" &&
    typeof community.pricePerPing === "string" &&
    typeof community.age === "string" &&
    typeof community.note === "string" &&
    typeof community.score === "number" &&
    (community.sourceUrl === undefined || typeof community.sourceUrl === "string")
  );
}

async function getCommunities() {
  const result = await query<CommunityRow>(
    `
      SELECT id, name, address, station, lat, lng, price_per_ping, age, source_url, note, score
      FROM communities
      ORDER BY created_at ASC, id ASC
    `
  );

  return result.rows.map(rowToCommunity);
}

async function replaceCommunities(communities: Community[]) {
  await transaction(async (client) => {
    for (const community of communities) {
      await client.query(
        `
          INSERT INTO communities (
            id, name, address, station, lat, lng, price_per_ping, age, source_url, note, score, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now())
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            address = EXCLUDED.address,
            station = EXCLUDED.station,
            lat = EXCLUDED.lat,
            lng = EXCLUDED.lng,
            price_per_ping = EXCLUDED.price_per_ping,
            age = EXCLUDED.age,
            source_url = EXCLUDED.source_url,
            note = EXCLUDED.note,
            score = EXCLUDED.score,
            updated_at = now()
        `,
        [
          community.id,
          community.name,
          community.address,
          community.station,
          community.lat,
          community.lng,
          community.pricePerPing,
          community.age,
          community.sourceUrl ?? "",
          community.note,
          community.score
        ]
      );
    }

    const ids = communities.map((community) => community.id);
    await client.query("DELETE FROM communities WHERE NOT (id = ANY($1::text[]))", [ids]);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const communities = await getCommunities();
      res.status(200).json({ communities });
      return;
    }

    if (req.method !== "PUT") {
      res.setHeader("Allow", "GET, PUT");
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const communities = req.body?.communities;
    if (!Array.isArray(communities) || !communities.every(isCommunity)) {
      res.status(400).json({ error: "Invalid communities data" });
      return;
    }

    await replaceCommunities(communities);
    res.status(200).json({ communities });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database request failed" });
  }
}
