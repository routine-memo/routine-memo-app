import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function addEmailUnique() {
  console.log('Removing google_id unique constraint...');

  try {
    // google_id unique 제약조건 제거
    await db.execute(sql`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_google_id_unique
    `);
    console.log('✓ Removed google_id unique constraint');
  } catch (err) {
    console.log('google_id unique constraint not found or already removed');
  }

  console.log('Adding email unique constraint...');

  try {
    // email unique 제약조건 추가
    await db.execute(sql`
      ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email)
    `);
    console.log('✓ Added email unique constraint');
  } catch (err: any) {
    if (err.message?.includes('already exists')) {
      console.log('email unique constraint already exists');
    } else {
      throw err;
    }
  }

  console.log('\nDone!');
}

addEmailUnique()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
