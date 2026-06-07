import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function debug() {
  const url = process.env.DATABASE_URL;
  console.log("🔍 Testing connection to:", url?.split('@')[1]); // Log host only for safety

  if (!url) {
    console.error("❌ DATABASE_URL is not set in .env.local");
    return;
  }

  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    console.log("⏳ Connecting...");
    const client = await pool.connect();
    console.log("✅ Connected successfully!");

    console.log("📊 Checking tables...");
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);

    if (tables.rows.length === 0) {
      console.error("❌ Database is EMPTY. No tables found. You need to run the migration script again.");
    } else {
      console.log("✅ Found tables:", tables.rows.map(r => r.table_name).join(', '));

      const posts = await client.query("SELECT COUNT(*) FROM posts");
      console.log(`📝 Post count: ${posts.rows[0].count}`);
    }

    client.release();
  } catch (err: any) {
    console.error("❌ Connection failed!");
    if (err.code === '28P01') {
      console.error("🔑 Error: Password authentication failed. Check your password in .env.local.");
    } else if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
      console.error("🌐 Error: Connection timed out. Make sure the EC2 Security Group allows port 5432 from your IP.");
    } else {
      console.error("📝 Full Error:", err.message);
    }
  } finally {
    await pool.end();
  }
}

debug();
