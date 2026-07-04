import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /** Particle Auth wallet address (EOA) */
  walletAddress: varchar("walletAddress", { length: 42 }),
  /** EVM Universal Account address */
  evmUniversalAddress: varchar("evmUniversalAddress", { length: 42 }),
  /** Solana Universal Account address */
  solanaUniversalAddress: varchar("solanaUniversalAddress", { length: 88 }),
  /** Username for payment requests */
  username: varchar("username", { length: 64 }).unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Transaction history for cross-chain payments
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  senderAddress: varchar("senderAddress", { length: 42 }).notNull(),
  recipientAddress: varchar("recipientAddress", { length: 88 }).notNull(), // Support both EVM and Solana
  token: varchar("token", { length: 64 }).notNull(), // e.g., "USDC", "ETH"
  amount: decimal("amount", { precision: 30, scale: 8 }).notNull(),
  sourceChain: varchar("sourceChain", { length: 64 }).notNull(), // e.g., "ethereum", "base"
  destinationChain: varchar("destinationChain", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "failed"]).default("pending").notNull(),
  transactionHash: varchar("transactionHash", { length: 256 }),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Saved contacts for quick payment access
 */
export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  address: varchar("address", { length: 88 }).notNull(),
  isFavorite: boolean("isFavorite").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

/**
 * EIP-7702 delegation status per chain
 */
export const delegations = mysqlTable("delegations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  chainId: int("chainId").notNull(),
  chainName: varchar("chainName", { length: 64 }).notNull(),
  isDelegated: boolean("isDelegated").default(false).notNull(),
  delegatedAddress: varchar("delegatedAddress", { length: 42 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Delegation = typeof delegations.$inferSelect;
export type InsertDelegation = typeof delegations.$inferInsert;