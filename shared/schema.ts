import { pgTable, text, serial, integer, boolean, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export * from "./models/auth";

// Activity logs - tracks all user actions
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  action: text("action").notNull(), // login, logout, view_book, play_book, favorite, unfavorite, subscribe, page_view, search
  resourceType: text("resource_type"), // book, subscription, page, etc.
  resourceId: text("resource_id"), // book ID, plan ID, page path, etc.
  metadata: jsonb("metadata"), // extra data (book title, search query, device info, etc.)
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  description: text("description").notNull(),
  coverUrl: text("cover_url").notNull(),
  audioUrl: text("audio_url").notNull(),
  cosFilename: text("cos_filename"), // COS filename for matching validation
  duration: integer("duration").notNull(), // in seconds
  category: text("category").notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // References users.id (which is varchar)
  bookId: integer("book_id").notNull(),
});

// Playback progress tracking for resume functionality
export const playbackProgress = pgTable("playback_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  bookId: integer("book_id").notNull(),
  progress: real("progress").notNull().default(0), // 0-100 percentage
  currentTime: real("current_time").notNull().default(0), // seconds
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "Weekly", "Monthly", "Yearly"
  price: integer("price").notNull(), // Price in IDR
  durationDays: integer("duration_days").notNull(), // 7, 30, 365
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
});

// User subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  planId: integer("plan_id").notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull().default("active"), // active, expired, cancelled
  paymentTransactionId: text("payment_transaction_id"), // QRIS transaction reference
  createdAt: timestamp("created_at").defaultNow(),
});

// Listening history - tracks each book played by user
export const listeningHistory = pgTable("listening_history", {
  id: serial("id").primaryKey(),
  visitorId: text("visitor_id"), // For non-logged-in users (localStorage uuid)
  userId: text("user_id"), // For logged-in users
  bookId: integer("book_id").notNull(),
  playedAt: timestamp("played_at").defaultNow().notNull(),
});

// Payment transactions for DOKU
export const paymentTransactions = pgTable("payment_transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  planId: integer("plan_id").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"), // pending, paid, expired, failed
  
  // DOKU specific fields
  dokuInvoiceNumber: text("doku_invoice_number"), // Our invoice number sent to DOKU
  dokuPaymentUrl: text("doku_payment_url"), // DOKU Checkout page URL
  dokuSessionId: text("doku_session_id"), // DOKU session ID from response
  dokuTokenId: text("doku_token_id"), // DOKU token from response
  dokuPaymentMethod: text("doku_payment_method"), // VIRTUAL_ACCOUNT, QRIS, EMONEY, etc
  dokuPaymentChannel: text("doku_payment_channel"), // BCA, GOPAY, OVO, etc
  dokuRequestId: text("doku_request_id"), // Unique request ID for DOKU
  
  expiredAt: timestamp("expired_at"),
  paidAt: timestamp("paid_at"),
  paymentCustomerName: text("payment_customer_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBookSchema = createInsertSchema(books).omit({ id: true });
export const insertFavoriteSchema = createInsertSchema(favorites).omit({ id: true });
export const insertPlaybackProgressSchema = createInsertSchema(playbackProgress).omit({ id: true, updatedAt: true });
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({ id: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true });
export const insertListeningHistorySchema = createInsertSchema(listeningHistory).omit({ id: true, playedAt: true });
export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions).omit({ id: true, createdAt: true });
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, createdAt: true });

export type Book = typeof books.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type PlaybackProgress = typeof playbackProgress.$inferSelect;
export type InsertPlaybackProgress = z.infer<typeof insertPlaybackProgressSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type ListeningHistory = typeof listeningHistory.$inferSelect;
export type InsertListeningHistory = z.infer<typeof insertListeningHistorySchema>;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type CreateBookRequest = InsertBook;
export type UpdateBookRequest = Partial<InsertBook>;
