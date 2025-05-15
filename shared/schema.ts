import { pgTable, text, serial, integer, boolean, timestamp, decimal, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const tokens = pgTable("tokens", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull().unique(),
  description: text("description"),
  supply: text("supply").notNull(),
  decimals: integer("decimals").notNull(),
  mint_authority: text("mint_authority").notNull(),
  freeze_authority: text("freeze_authority"),
  token_address: text("token_address").notNull().unique(),
  transaction_id: text("transaction_id").notNull(),
  owner_address: text("owner_address").notNull(),
  created_at: text("created_at").notNull(),
});

// New schema for Plaid items (linked bank accounts)
export const plaidItems = pgTable("plaid_items", {
  id: serial("id").primaryKey(),
  wallet_address: text("wallet_address").notNull(),
  item_id: text("item_id").notNull().unique(),
  access_token: text("access_token").notNull(),
  institution_id: text("institution_id"),
  institution_name: text("institution_name"),
  account_id: text("account_id"),
  account_name: text("account_name"),
  account_mask: text("account_mask"),
  current_balance: decimal("current_balance", { precision: 12, scale: 2 }),
  available_balance: decimal("available_balance", { precision: 12, scale: 2 }),
  last_updated: timestamp("last_updated").defaultNow().notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    walletAddressIdx: uniqueIndex("wallet_address_idx").on(table.wallet_address),
  }
});

// Table to track stablecoin minting status
export const stablecoinMints = pgTable("stablecoin_mints", {
  id: serial("id").primaryKey(),
  wallet_address: text("wallet_address").notNull(),
  plaid_item_id: integer("plaid_item_id").references(() => plaidItems.id),
  token_address: text("token_address").notNull(),
  amount_minted: decimal("amount_minted", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull(),  // "pending", "completed", "failed"
  transaction_id: text("transaction_id"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  completed_at: timestamp("completed_at"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTokenSchema = createInsertSchema(tokens).omit({
  id: true,
  created_at: true,
});

export const insertPlaidItemSchema = createInsertSchema(plaidItems).omit({
  id: true,
  created_at: true,
  last_updated: true,
});

export const insertStablecoinMintSchema = createInsertSchema(stablecoinMints).omit({
  id: true,
  created_at: true,
  completed_at: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertToken = z.infer<typeof insertTokenSchema>;
export type Token = typeof tokens.$inferSelect;

export type InsertPlaidItem = z.infer<typeof insertPlaidItemSchema>;
export type PlaidItem = typeof plaidItems.$inferSelect;

export type InsertStablecoinMint = z.infer<typeof insertStablecoinMintSchema>;
export type StablecoinMint = typeof stablecoinMints.$inferSelect;
