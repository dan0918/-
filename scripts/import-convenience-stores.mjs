import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const inputPath = path.join(root, "database", "convenience store.csv");
const outputPath = path.join(root, "src", "data", "convenience-stores.json");

const bounds = {
  west: 121.2833333333,
  east: 121.3305555556,
  south: 24.95,
  north: 25.0472222222
};

function parseCsv(content) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      field = "";
      if (row.some((value) => value.length)) rows.push(row);
      row = [];
      continue;
    }
    field += char;
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  const [headers, ...records] = rows;
  return records.map((record) => Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ""])));
}

function inside(lat, lng) {
  return lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east;
}

function normalizeAddress(address) {
  return address.replace(/\s+/g, "").replace(/^臺灣/, "").replace(/^台灣/, "");
}

function slug(value) {
  return value
    .normalize("NFKC")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

const rows = parseCsv(fs.readFileSync(inputPath, "utf8").replace(/^\uFEFF/, ""));
const stores = rows
  .map((row, index) => {
    const brand = row["超商"]?.trim() || "超商";
    const address = normalizeAddress(row.Address ?? "");
    const lng = Number(row.Response_X);
    const lat = Number(row.Response_Y);

    return {
      id: `convenience-store-${slug(`${brand}-${address}`) || index}`,
      type: "convenience-store",
      name: brand,
      address,
      lat,
      lng
    };
  })
  .filter((store) => store.address && Number.isFinite(store.lat) && Number.isFinite(store.lng) && inside(store.lat, store.lng));

fs.writeFileSync(outputPath, `${JSON.stringify(stores, null, 2)}\n`, "utf8");
console.log(`Read ${rows.length} convenience rows; wrote ${stores.length} stores to ${outputPath}`);
