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

// System log - comprehensive user action log for admin dashboard
export const sfSysLog = pgTable("sf_sys_log", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  userEmail: text("user_email"),
  userName: text("user_name"),
  action: text("action").notNull(),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
  metadata: jsonb("metadata"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const books = pgTable("books_list", {
  id: serial("id").primaryKey(),
  title: text("title"),
  titleFix: text("fix_title"),  // Maps to fix_title column in database
  author: text("author"),
  description: text("description"),
  coverUrl: text("cover_url"),
  audioUrl: text("audio_url"),
  pdfUrl: text("pdf_url"), // URL to PDF file in COS
  cosFilename: text("cos_filename"),
  duration: integer("duration"), // in seconds
  category: text("category"),
  isFeatured: boolean("is_featured").default(false),
  isBestSeller: boolean("is_best_seller").default(false),
  isHaveAudio: text("is_have_audio"), // 'no' = no audio available
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

// Referral codes - users can share to get benefits
export const referralCodes = pgTable("referral_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // e.g. "STORIFY123"
  userId: text("user_id").notNull(), // Owner of the referral code
  discountPercent: integer("discount_percent").notNull().default(10), // Discount percentage (default 10%)
  commissionPercent: integer("commission_percent").notNull().default(5), // Commission for referral owner (default 5%)
  usageCount: integer("usage_count").notNull().default(0), // How many times used
  maxUsage: integer("max_usage"), // Max times can be used (null = unlimited)
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"), // Optional expiration date
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payment transactions for DOKU and QRIS (Pewaca)
export const paymentTransactions = pgTable("payment_transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  planId: integer("plan_id").notNull(),
  amount: integer("amount").notNull(),
  originalAmount: integer("original_amount"), // Original price before discount
  discountAmount: integer("discount_amount").default(0), // Discount applied
  referralCode: text("referral_code"), // Referral code used (if any)
  referralOwnerId: text("referral_owner_id"), // Owner of the referral code
  referralOwnerName: text("referral_owner_name"), // Snapshot of referral owner name
  referralCommissionPercent: integer("referral_commission_percent").default(0), // Commission percent snapshot
  referralCommissionAmount: integer("referral_commission_amount").default(0), // Commission amount snapshot
  referralCommissionStatus: text("referral_commission_status"), // pending | approved | paid | cancelled
  referralCommissionPaidAt: timestamp("referral_commission_paid_at"),
  status: text("status").notNull().default("pending"), // pending, paid, expired, failed
  paymentGateway: text("payment_gateway").notNull().default("doku"), // 'doku' | 'qris_pewaca'
  
  // DOKU specific fields
  dokuInvoiceNumber: text("doku_invoice_number"), // Our invoice number sent to DOKU
  dokuPaymentUrl: text("doku_payment_url"), // DOKU Checkout page URL
  dokuSessionId: text("doku_session_id"), // DOKU session ID from response
  dokuTokenId: text("doku_token_id"), // DOKU token from response
  dokuPaymentMethod: text("doku_payment_method"), // VIRTUAL_ACCOUNT, QRIS, EMONEY, etc
  dokuPaymentChannel: text("doku_payment_channel"), // BCA, GOPAY, OVO, etc
  dokuRequestId: text("doku_request_id"), // Unique request ID for DOKU
  
  // QRIS Pewaca specific fields
  qrisContent: text("qris_content"), // QR Code content string
  qrisInvoiceId: text("qris_invoice_id"), // Pewaca invoice ID
  qrisTransactionNumber: text("qris_transaction_number"), // Pewaca transaction number
  paymentMethodBy: text("payment_method_by"), // GoPay, OVO, DANA, etc (for QRIS)
  
  // Midtrans specific fields
  midtransOrderId: text("midtrans_order_id"), // Our order ID sent to Midtrans
  midtransSnapToken: text("midtrans_snap_token"), // Snap token for payment page
  midtransRedirectUrl: text("midtrans_redirect_url"), // Snap payment page URL
  midtransTransactionId: text("midtrans_transaction_id"), // Midtrans transaction ID
  midtransPaymentType: text("midtrans_payment_type"), // credit_card, gopay, bank_transfer, etc
  midtransTransactionTime: text("midtrans_transaction_time"), // Transaction time from Midtrans
  midtransTransactionStatus: text("midtrans_transaction_status"), // capture, settlement, pending, deny, cancel, expire
  
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
export const insertReferralCodeSchema = createInsertSchema(referralCodes).omit({ id: true, createdAt: true });
export const insertSfSysLogSchema = createInsertSchema(sfSysLog).omit({ id: true, createdAt: true });

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
export type SfSysLog = typeof sfSysLog.$inferSelect;
export type InsertSfSysLog = z.infer<typeof insertSfSysLogSchema>;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCode = z.infer<typeof insertReferralCodeSchema>;

export type CreateBookRequest = InsertBook;
export type UpdateBookRequest = Partial<InsertBook>;
