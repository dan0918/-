require("dotenv").config();

const cors = require("cors");
const express = require("express");
const db = require("./db");

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000" }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/communities", async (_req, res, next) => {
  try {
    const { rows } = await db.query(
      `
      SELECT
        c.id,
        c.name,
        c.district,
        c.address,
        c.station,
        c.lat,
        c.lng,
        c.price_per_ping AS "pricePerPing",
        c.age,
        c.transit,
        c.cover_photo AS "coverPhoto",
        c.album,
        c.tags,
        COALESCE(
          json_agg(
            json_build_object(
              'id', l.id,
              'title', l.title,
              'rooms', l.rooms,
              'floor', l.floor,
              'areaPing', l.area_ping,
              'totalPrice', l.total_price,
              'url', l.url
            )
          ) FILTER (WHERE l.id IS NOT NULL),
          '[]'
        ) AS listings,
        COALESCE(v.note, '') AS note,
        COALESCE(v.score, 0) AS score,
        COALESCE(v.favorite, false) AS favorite,
        COALESCE(v.visited, false) AS visited
      FROM communities c
      LEFT JOIN listings l ON l.community_id = c.id
      LEFT JOIN visit_notes v ON v.community_id = c.id
      GROUP BY c.id, v.note, v.score, v.favorite, v.visited
      ORDER BY c.name ASC
      `
    );
    res.json({ communities: rows });
  } catch (error) {
    next(error);
  }
});

app.post("/api/communities/:communityId/listings", async (req, res, next) => {
  try {
    const { communityId } = req.params;
    const { title, rooms, floor, areaPing, totalPrice, url } = req.body;

    const { rows } = await db.query(
      `
      INSERT INTO listings (community_id, title, rooms, floor, area_ping, total_price, url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, title, rooms, floor, area_ping AS "areaPing", total_price AS "totalPrice", url
      `,
      [communityId, title, rooms, floor, areaPing, totalPrice, url || null]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.patch("/api/communities/:communityId/visit", async (req, res, next) => {
  try {
    const { communityId } = req.params;
    const { note = "", score = 0, favorite = false, visited = false } = req.body;

    const { rows } = await db.query(
      `
      INSERT INTO visit_notes (community_id, note, score, favorite, visited)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (community_id)
      DO UPDATE SET
        note = EXCLUDED.note,
        score = EXCLUDED.score,
        favorite = EXCLUDED.favorite,
        visited = EXCLUDED.visited,
        updated_at = now()
      RETURNING community_id AS "communityId", note, score, favorite, visited
      `,
      [communityId, note, score, favorite, visited]
    );

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Community API listening on http://localhost:${port}`);
});
