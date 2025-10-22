import { db } from "../src/lib/db/index.js";
import { sql } from "drizzle-orm";

async function check() {
  const result = await db.execute(
    sql`SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'tags'`
  );

  console.log("Tags column info:");
  console.log(JSON.stringify(result, null, 2));

  const posts = await db.execute(sql`SELECT id, tags FROM posts`);
  console.log("\nCurrent tags data:");
  console.log(JSON.stringify(posts.rows, null, 2));

  process.exit(0);
}

check();
