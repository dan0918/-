import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputPath = path.join(root, "src", "data", "schools.json");
const bounds = {
  west: 121.2833333333,
  east: 121.3305555556,
  south: 24.95,
  north: 25.0472222222
};

const services = [
  {
    itemId: "398d3e1cb14c4d9d90311b87e52b6813",
    fallbackUrl: "https://services4.arcgis.com/qxKrACmhWOm9bbby/arcgis/rest/services/110學年度各級學校分布位置_國小/FeatureServer"
  },
  {
    itemId: "5b75bd9035c74d4985a9a118acc55064",
    fallbackUrl: "https://services4.arcgis.com/qxKrACmhWOm9bbby/arcgis/rest/services/110學年度各級學校分布位置_國中/FeatureServer"
  }
];

function inside(lat, lng) {
  return lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east;
}

async function getServiceUrl(service) {
  const itemUrl = `https://www.arcgis.com/sharing/rest/content/items/${service.itemId}?f=json`;
  const response = await fetch(itemUrl);
  if (!response.ok) return service.fallbackUrl;
  const item = await response.json();
  return item.url || service.fallbackUrl;
}

function pickName(attributes) {
  const key = Object.keys(attributes).find((name) => /校名|學校|name|Name|NAME/.test(name));
  return key ? String(attributes[key]) : "學校";
}

function pickAddress(attributes) {
  const key = Object.keys(attributes).find((name) => /地址|addr|Addr|ADDR/.test(name));
  return key ? String(attributes[key]) : "";
}

const schools = [];

for (const service of services) {
  const serviceUrl = await getServiceUrl(service);
  const queryUrl = new URL(`${serviceUrl}/0/query`);
  queryUrl.searchParams.set("f", "json");
  queryUrl.searchParams.set("where", "1=1");
  queryUrl.searchParams.set("outFields", "*");
  queryUrl.searchParams.set("returnGeometry", "true");
  queryUrl.searchParams.set("geometry", `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`);
  queryUrl.searchParams.set("geometryType", "esriGeometryEnvelope");
  queryUrl.searchParams.set("inSR", "4326");
  queryUrl.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  queryUrl.searchParams.set("outSR", "4326");

  const response = await fetch(queryUrl);
  if (!response.ok) {
    throw new Error(`ArcGIS query failed for ${service.itemId}: ${response.status}`);
  }
  const payload = await response.json();
  for (const feature of payload.features ?? []) {
    const lat = Number(feature.geometry?.y);
    const lng = Number(feature.geometry?.x);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !inside(lat, lng)) continue;
    schools.push({
      id: `school-${service.itemId}-${feature.attributes?.OBJECTID ?? schools.length}`,
      type: "school",
      name: pickName(feature.attributes ?? {}),
      address: pickAddress(feature.attributes ?? {}),
      lat,
      lng
    });
  }
}

fs.writeFileSync(outputPath, `${JSON.stringify(schools, null, 2)}\n`, "utf8");
console.log(`Wrote ${schools.length} schools to ${outputPath}`);
