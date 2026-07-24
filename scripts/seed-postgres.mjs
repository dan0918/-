import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("Missing DATABASE_URL. Set it before running this script.");
  process.exit(1);
}

const isLocalDatabase = /localhost|127\.0\.0\.1/i.test(databaseUrl);
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: isLocalDatabase ? undefined : { rejectUnauthorized: false }
});

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

async function readJson(relativePath, fallback) {
  try {
    const content = await readFile(path.join(process.cwd(), relativePath), "utf8");
    return JSON.parse(content);
  } catch {
    return fallback;
  }
}

const communitiesFile = await readJson(path.join("src", "data", "communities.json"), { communities: [] });
const notesFile = await readJson(path.join("src", "data", "community-notes.json"), { entries: [] });
const communities = asArray(communitiesFile.communities);
const notes = asArray(notesFile.entries);
const communityIds = new Set(communities.map((community) => community.id));
const client = await pool.connect();

try {
  await client.query("BEGIN");

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
        community.name ?? "",
        community.address ?? "",
        community.station ?? "",
        Number(community.lat),
        Number(community.lng),
        community.pricePerPing ?? "",
        community.age ?? "",
        community.sourceUrl ?? "",
        community.note ?? "",
        Number(community.score ?? 0)
      ]
    );
  }

  const notesToSeed = notes.filter((entry) => communityIds.has(entry.communityId));

  for (const entry of notesToSeed) {
    await client.query(
      `
        INSERT INTO community_note_history (
          id, community_id, community_name, address, note, score, saved_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          community_id = EXCLUDED.community_id,
          community_name = EXCLUDED.community_name,
          address = EXCLUDED.address,
          note = EXCLUDED.note,
          score = EXCLUDED.score,
          saved_at = EXCLUDED.saved_at
      `,
      [
        entry.id,
        entry.communityId,
        entry.communityName ?? "",
        entry.address ?? "",
        entry.note ?? "",
        Number(entry.score ?? 0),
        entry.savedAt
      ]
    );
  }

  await client.query("COMMIT");
  console.log(`Seeded ${communities.length} communities and ${notesToSeed.length} note history entries.`);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
