import { pgTable, text, timestamp, uuid, jsonb, integer } from "drizzle-orm/pg-core";

// 사용자 테이블
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  googleId: text("google_id").notNull(), // unique 제거 (동일 이메일이면 같은 사용자)
  email: text("email").unique().notNull(), // email을 unique로 변경
  name: text("name"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 앨범(템플릿) 테이블
export const albums = pgTable("albums", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  blocks: jsonb("blocks").notNull().default([]), // BlockPosition[] 구조
  pageCount: integer("page_count").notNull().default(0), // 기록 수
  notification: jsonb("notification"), // AlbumNotification 구조
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 기록(엔트리) 테이블
export const entries = pgTable("entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  albumId: uuid("album_id").references(() => albums.id, { onDelete: "cascade" }).notNull(),
  blockValues: jsonb("block_values").notNull().default([]), // BlockValue[] 구조
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 즉석 앨범 기록 테이블
export const dailyEntries = pgTable("daily_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  blocks: jsonb("blocks").notNull().default([]), // BlockPosition[] 구조 (즉석앨범은 매번 다름)
  blockValues: jsonb("block_values").notNull().default([]), // BlockValue[] 구조
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 미디어 파일 테이블 (Blob URL 참조)
export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  entryId: uuid("entry_id"),
  dailyEntryId: uuid("daily_entry_id"),
  blobUrl: text("blob_url").notNull(),
  fileName: text("file_name"),
  fileType: text("file_type"), // image, video
  fileSize: integer("file_size"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 푸시 알림 구독 테이블
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(), // 암호화 키
  auth: text("auth").notNull(), // 인증 키
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 타입 추론을 위한 export
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Album = typeof albums.$inferSelect;
export type NewAlbum = typeof albums.$inferInsert;
export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;
export type DailyEntry = typeof dailyEntries.$inferSelect;
export type NewDailyEntry = typeof dailyEntries.$inferInsert;
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
