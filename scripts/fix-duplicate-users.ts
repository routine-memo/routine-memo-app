import { db } from '../lib/db';
import { users, albums, entries, dailyEntries, media, pushSubscriptions } from '../lib/db/schema';
import { eq, sql } from 'drizzle-orm';

async function fixDuplicateUsers() {
  console.log('Finding duplicate emails...');

  // 중복 이메일 찾기
  const duplicates = await db.execute(sql`
    SELECT email, COUNT(*) as count, array_agg(id ORDER BY created_at) as user_ids
    FROM users
    GROUP BY email
    HAVING COUNT(*) > 1
  `);

  console.log('Duplicates found:', duplicates.rows);

  for (const row of duplicates.rows) {
    const email = row.email as string;
    const userIds = row.user_ids as string[];

    console.log(`\nProcessing email: ${email}`);
    console.log(`User IDs: ${userIds.join(', ')}`);

    // 첫 번째 사용자(가장 오래된)를 유지하고 나머지 삭제
    const keepUserId = userIds[0];
    const deleteUserIds = userIds.slice(1);

    console.log(`Keeping user: ${keepUserId}`);
    console.log(`Deleting users: ${deleteUserIds.join(', ')}`);

    // 삭제할 사용자들의 데이터를 유지할 사용자로 이전
    for (const deleteUserId of deleteUserIds) {
      // albums 이전
      await db.update(albums)
        .set({ userId: keepUserId })
        .where(eq(albums.userId, deleteUserId));
      console.log(`  - Migrated albums from ${deleteUserId}`);

      // entries 이전
      await db.update(entries)
        .set({ userId: keepUserId })
        .where(eq(entries.userId, deleteUserId));
      console.log(`  - Migrated entries from ${deleteUserId}`);

      // dailyEntries 이전
      await db.update(dailyEntries)
        .set({ userId: keepUserId })
        .where(eq(dailyEntries.userId, deleteUserId));
      console.log(`  - Migrated dailyEntries from ${deleteUserId}`);

      // media 이전
      await db.update(media)
        .set({ userId: keepUserId })
        .where(eq(media.userId, deleteUserId));
      console.log(`  - Migrated media from ${deleteUserId}`);

      // pushSubscriptions 이전
      await db.update(pushSubscriptions)
        .set({ userId: keepUserId })
        .where(eq(pushSubscriptions.userId, deleteUserId));
      console.log(`  - Migrated pushSubscriptions from ${deleteUserId}`);

      // 중복 사용자 삭제
      await db.delete(users).where(eq(users.id, deleteUserId));
      console.log(`  - Deleted user ${deleteUserId}`);
    }
  }

  console.log('\nDone! All duplicate users have been merged.');
}

fixDuplicateUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
