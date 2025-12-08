import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { albums, entries, users, dailyEntries } from '../lib/db/schema';

const DATABASE_URL = "postgresql://neondb_owner:npg_YpZHz0Bo8fcW@ep-wispy-bar-ad3hoiho-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(DATABASE_URL);
const db = drizzle(sql);

async function checkDatabase() {
  console.log('=== Users ===');
  const allUsers = await db.select().from(users);
  console.log('Users count:', allUsers.length);
  allUsers.forEach(u => console.log(`  - ${u.id}: ${u.email} (${u.name})`));

  console.log('\n=== Albums ===');
  const allAlbums = await db.select().from(albums);
  console.log('Albums count:', allAlbums.length);
  allAlbums.forEach(a => console.log(`  - ${a.id}: ${a.name} (user: ${a.userId})`));

  console.log('\n=== Entries ===');
  const allEntries = await db.select().from(entries);
  console.log('Entries count:', allEntries.length);
  allEntries.forEach(e => console.log(`  - ${e.id}: album ${e.albumId}`));

  console.log('\n=== Daily Entries ===');
  const allDailyEntries = await db.select().from(dailyEntries);
  console.log('Daily Entries count:', allDailyEntries.length);
  allDailyEntries.forEach(de => console.log(`  - ${de.id}`));
}

checkDatabase()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
