// AdVerse - 広告プラットフォームのスキーマ
// https://orm.drizzle.team/docs/sql-schema-declaration

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// ユーザーテーブル（シンプルな実装）
export const usersTable = sqliteTable('users', {
  userId: text('userId').primaryKey(),
  username: text('username').notNull(),
  email: text('email'),
  createdAt: integer('createdAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

// 広告テーブル
export const advertisementsTable = sqliteTable('advertisements', {
  adId: text('adId').primaryKey(),
  userId: text('userId').notNull(),
  title: text('title'),
  message: text('message'),
  targetUrl: text('targetUrl'),
  color: text('color').notNull().default('#3b82f6'), // 広告の色（HEX形式）
  clickCount: integer('clickCount').notNull().default(0),
  viewCount: integer('viewCount').notNull().default(0),
  createdAt: integer('createdAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

// グリッドセルテーブル（1000x1000のグリッド）
export const gridCellsTable = sqliteTable('grid_cells', {
  cellId: text('cellId').primaryKey(), // "x_y" 形式（例: "100_200"）
  x: integer('x').notNull(),
  y: integer('y').notNull(),
  adId: text('adId'), // 広告ID（nullの場合は空きマス）
  userId: text('userId'), // マスの所有者
  isSpecial: integer('isSpecial', { mode: 'boolean' }).notNull().default(false), // 創世エリアなど
  createdAt: integer('createdAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

// クリック追跡テーブル（分析用）
export const clicksTable = sqliteTable('clicks', {
  clickId: text('clickId').primaryKey(),
  adId: text('adId').notNull(),
  cellId: text('cellId').notNull(),
  userAgent: text('userAgent'),
  ipAddress: text('ipAddress'),
  referrer: text('referrer'),
  createdAt: integer('createdAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

// レガシー：customerTable（後で削除可能）
export const customerTable = sqliteTable('customer', {
  customerId: integer('customerId').primaryKey(),
  companyName: text('companyName').notNull(),
  contactName: text('contactName').notNull(),
});
