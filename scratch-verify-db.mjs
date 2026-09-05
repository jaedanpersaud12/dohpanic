import fs from "node:fs";
import { Pool } from "@neondatabase/serverless";
import { S3Client, ListObjectsV2Command, HeadObjectCommand } from "@aws-sdk/client-s3";

for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && m[2]) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const { rows } = await pool.query(
  `SELECT id, buyer_name, buyer_whatsapp, claimed_cents, status,
          screenshot_key, buyer_note, created_at
     FROM orders ORDER BY created_at DESC LIMIT 3`
);
console.log("=== orders in Neon ===");
for (const r of rows) {
  console.log(` ${r.id}  ${r.buyer_name}  ${r.buyer_whatsapp}`);
  console.log(`   claimed=${r.claimed_cents} status=${r.status}`);
  console.log(`   key=${r.screenshot_key}`);
  console.log(`   note=${r.buyer_note}`);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const list = await s3.send(
  new ListObjectsV2Command({ Bucket: process.env.R2_BUCKET, MaxKeys: 5 })
);
console.log(`\n=== objects in R2 bucket "${process.env.R2_BUCKET}" ===`);
for (const o of list.Contents ?? []) {
  console.log(` ${o.Key}  ${o.Size} bytes`);
}

if (rows[0]?.screenshot_key) {
  const head = await s3.send(
    new HeadObjectCommand({ Bucket: process.env.R2_BUCKET, Key: rows[0].screenshot_key })
  );
  console.log(
    `\nnewest order's object exists: ${head.ContentType}, ${head.ContentLength} bytes`
  );
}

await pool.end();
