import { db } from "./db";
import { 
  books, favorites, playbackProgress, subscriptionPlans, subscriptions, 
  listeningHistory, paymentTransactions,
  type Book, type InsertBook, type Favorite, type PlaybackProgress,
  type SubscriptionPlan, type Subscription, type ListeningHistory, type PaymentTransaction
} from "@shared/schema";
import { eq, and, desc, like, sql, gte, or, isNull } from "drizzle-orm";

// Listening limits
const GUEST_LISTEN_LIMIT = 1;
const FREE_USER_LISTEN_LIMIT = 3;

export interface ListeningStatus {
  canListen: boolean;
  listenCount: number;
  limit: number;
  hasSubscription: boolean;
  subscriptionEndsAt?: Date;
  reason?: 'guest_limit' | 'free_limit' | 'no_limit';
}

export interface IStorage {
  // Books
  getBooks(params?: { search?: string; category?: string; featured?: boolean }): Promise<Book[]>;
  getBook(id: number): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  getCategories(): Promise<string[]>;

  // Favorites
  getFavorites(userId: string): Promise<Book[]>;
  addFavorite(userId: string, bookId: number): Promise<void>;
  removeFavorite(userId: string, bookId: number): Promise<void>;
  isFavorite(userId: string, bookId: number): Promise<boolean>;

  // Playback Progress
  getPlaybackProgress(userId: string, bookId: number): Promise<PlaybackProgress | undefined>;
  savePlaybackProgress(userId: string, bookId: number, progress: number, currentTime: number): Promise<void>;
  getRecentlyPlayed(userId: string, limit?: number): Promise<(Book & { progress: number; currentTime: number })[]>;

  // Subscription Plans
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined>;

  // User Subscriptions
  getActiveSubscription(userId: string): Promise<Subscription | undefined>;
  createSubscription(userId: string, planId: number, transactionId: string): Promise<Subscription>;

  // Listening History & Limits
  checkListeningStatus(userId?: string, visitorId?: string): Promise<ListeningStatus>;
  recordListening(bookId: number, userId?: string, visitorId?: string): Promise<void>;
  getListeningCount(userId?: string, visitorId?: string): Promise<number>;

  // Payment Transactions
  createPaymentTransaction(userId: string, planId: number, amount: number, dokuData?: {
    dokuInvoiceNumber?: string;
    dokuPaymentUrl?: string;
    dokuSessionId?: string;
    dokuTokenId?: string;
    dokuRequestId?: string;
    expiredAt?: Date;
  }): Promise<PaymentTransaction>;
  updatePaymentTransaction(id: number, data: Partial<PaymentTransaction>): Promise<PaymentTransaction | undefined>;
  getPaymentTransaction(id: number): Promise<PaymentTransaction | undefined>;
  getPaymentTransactionByInvoiceNumber(invoiceNumber: string): Promise<PaymentTransaction | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getBooks(params?: { search?: string; category?: string; featured?: boolean }): Promise<Book[]> {
    let query = db.select().from(books);
    const conditions = [];

    if (params?.search) {
      conditions.push(like(books.title, `%${params.search}%`));
    }
    if (params?.category) {
      conditions.push(eq(books.category, params.category));
    }
    if (params?.featured !== undefined) {
      conditions.push(eq(books.isFeatured, params.featured));
    }

    if (conditions.length > 0) {
      // @ts-ignore - AND logic handling
      return await query.where(and(...conditions)).orderBy(desc(books.id));
    }

    return await query.orderBy(desc(books.id));
  }

  async getBook(id: number): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(eq(books.id, id));
    return book;
  }

  async createBook(book: InsertBook): Promise<Book> {
    const [newBook] = await db.insert(books).values(book).returning();
    return newBook;
  }

  async getCategories(): Promise<string[]> {
    const result = await db
      .selectDistinct({ category: books.category })
      .from(books)
      .orderBy(books.category);
    return result.map(r => r.category);
  }

  async getFavorites(userId: string): Promise<Book[]> {
    // Join favorites with books
    const result = await db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
        description: books.description,
        coverUrl: books.coverUrl,
        audioUrl: books.audioUrl,
        duration: books.duration,
        category: books.category,
        isFeatured: books.isFeatured,
      })
      .from(favorites)
      .innerJoin(books, eq(favorites.bookId, books.id))
      .where(eq(favorites.userId, userId));
    
    return result;
  }

  async addFavorite(userId: string, bookId: number): Promise<void> {
    // Check if already exists
    const exists = await this.isFavorite(userId, bookId);
    if (!exists) {
      await db.insert(favorites).values({ userId, bookId });
    }
  }

  async removeFavorite(userId: string, bookId: number): Promise<void> {
    await db.delete(favorites).where(
      and(eq(favorites.userId, userId), eq(favorites.bookId, bookId))
    );
  }

  async isFavorite(userId: string, bookId: number): Promise<boolean> {
    const [fav] = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.bookId, bookId)));
    return !!fav;
  }

  // Playback Progress
  async getPlaybackProgress(userId: string, bookId: number): Promise<PlaybackProgress | undefined> {
    const [progress] = await db
      .select()
      .from(playbackProgress)
      .where(and(eq(playbackProgress.userId, userId), eq(playbackProgress.bookId, bookId)));
    return progress;
  }

  async savePlaybackProgress(userId: string, bookId: number, progress: number, currentTime: number): Promise<void> {
    // Upsert: update if exists, insert if not
    const existing = await this.getPlaybackProgress(userId, bookId);
    
    if (existing) {
      await db
        .update(playbackProgress)
        .set({ progress, currentTime, updatedAt: new Date() })
        .where(and(eq(playbackProgress.userId, userId), eq(playbackProgress.bookId, bookId)));
    } else {
      await db.insert(playbackProgress).values({ userId, bookId, progress, currentTime });
    }
  }

  async getRecentlyPlayed(userId: string, limit: number = 10): Promise<(Book & { progress: number; currentTime: number })[]> {
    const result = await db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
        description: books.description,
        coverUrl: books.coverUrl,
        audioUrl: books.audioUrl,
        duration: books.duration,
        category: books.category,
        isFeatured: books.isFeatured,
        progress: playbackProgress.progress,
        currentTime: playbackProgress.currentTime,
      })
      .from(playbackProgress)
      .innerJoin(books, eq(playbackProgress.bookId, books.id))
      .where(eq(playbackProgress.userId, userId))
      .orderBy(desc(playbackProgress.updatedAt))
      .limit(limit);
    
    return result;
  }

  // Subscription Plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
  }

  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return plan;
  }

  // User Subscriptions
  async getActiveSubscription(userId: string): Promise<Subscription | undefined> {
    const now = new Date();
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active'),
        gte(subscriptions.endDate, now)
      ))
      .orderBy(desc(subscriptions.endDate))
      .limit(1);
    return sub;
  }

  async createSubscription(userId: string, planId: number, transactionId: string): Promise<Subscription> {
    const plan = await this.getSubscriptionPlan(planId);
    if (!plan) throw new Error('Plan not found');

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const [subscription] = await db.insert(subscriptions).values({
      userId,
      planId,
      startDate,
      endDate,
      status: 'active',
      paymentTransactionId: transactionId,
    }).returning();

    return subscription;
  }

  // Listening History & Limits
  async getListeningCount(userId?: string, visitorId?: string): Promise<number> {
    let condition;
    if (userId) {
      condition = eq(listeningHistory.userId, userId);
    } else if (visitorId) {
      condition = and(eq(listeningHistory.visitorId, visitorId), isNull(listeningHistory.userId));
    } else {
      return 0;
    }

    const result = await db
      .select({ count: sql<number>`count(distinct ${listeningHistory.bookId})` })
      .from(listeningHistory)
      .where(condition);

    return Number(result[0]?.count || 0);
  }

  async checkListeningStatus(userId?: string, visitorId?: string): Promise<ListeningStatus> {
    // If user is logged in, check subscription first
    if (userId) {
      const subscription = await this.getActiveSubscription(userId);
      if (subscription) {
        return {
          canListen: true,
          listenCount: 0,
          limit: Infinity,
          hasSubscription: true,
          subscriptionEndsAt: subscription.endDate,
          reason: 'no_limit',
        };
      }

      // No subscription - check free user limit
      const listenCount = await this.getListeningCount(userId);
      return {
        canListen: listenCount < FREE_USER_LISTEN_LIMIT,
        listenCount,
        limit: FREE_USER_LISTEN_LIMIT,
        hasSubscription: false,
        reason: 'free_limit',
      };
    }

    // Guest user (not logged in)
    if (visitorId) {
      const listenCount = await this.getListeningCount(undefined, visitorId);
      return {
        canListen: listenCount < GUEST_LISTEN_LIMIT,
        listenCount,
        limit: GUEST_LISTEN_LIMIT,
        hasSubscription: false,
        reason: 'guest_limit',
      };
    }

    return {
      canListen: true,
      listenCount: 0,
      limit: GUEST_LISTEN_LIMIT,
      hasSubscription: false,
      reason: 'guest_limit',
    };
  }

  async recordListening(bookId: number, userId?: string, visitorId?: string): Promise<void> {
    // Check if this book was already listened to by this user/visitor
    let existingCondition;
    if (userId) {
      existingCondition = and(eq(listeningHistory.userId, userId), eq(listeningHistory.bookId, bookId));
    } else if (visitorId) {
      existingCondition = and(
        eq(listeningHistory.visitorId, visitorId), 
        eq(listeningHistory.bookId, bookId),
        isNull(listeningHistory.userId)
      );
    } else {
      return;
    }

    const [existing] = await db.select().from(listeningHistory).where(existingCondition);
    
    // Only record if this is a new book for this user/visitor
    if (!existing) {
      await db.insert(listeningHistory).values({
        userId: userId || null,
        visitorId: userId ? null : visitorId, // Only set visitorId if no userId
        bookId,
      });
    }
  }

  // Payment Transactions
  async createPaymentTransaction(
    userId: string, 
    planId: number, 
    amount: number, 
    dokuData?: {
      dokuInvoiceNumber?: string;
      dokuPaymentUrl?: string;
      dokuSessionId?: string;
      dokuTokenId?: string;
      dokuRequestId?: string;
      expiredAt?: Date;
    }
  ): Promise<PaymentTransaction> {
    const expiredAt = dokuData?.expiredAt || (() => {
      const date = new Date();
      date.setMinutes(date.getMinutes() + 60); // 60 minutes expiry
      return date;
    })();

    const [transaction] = await db.insert(paymentTransactions).values({
      userId,
      planId,
      amount,
      status: 'pending',
      dokuInvoiceNumber: dokuData?.dokuInvoiceNumber || null,
      dokuPaymentUrl: dokuData?.dokuPaymentUrl || null,
      dokuSessionId: dokuData?.dokuSessionId || null,
      dokuTokenId: dokuData?.dokuTokenId || null,
      dokuRequestId: dokuData?.dokuRequestId || null,
      expiredAt,
    }).returning();

    return transaction;
  }

  async updatePaymentTransaction(id: number, data: Partial<PaymentTransaction>): Promise<PaymentTransaction | undefined> {
    const [updated] = await db
      .update(paymentTransactions)
      .set(data)
      .where(eq(paymentTransactions.id, id))
      .returning();
    return updated;
  }

  async getPaymentTransaction(id: number): Promise<PaymentTransaction | undefined> {
    const [transaction] = await db.select().from(paymentTransactions).where(eq(paymentTransactions.id, id));
    return transaction;
  }

  async getPaymentTransactionByInvoiceNumber(invoiceNumber: string): Promise<PaymentTransaction | undefined> {
    const [transaction] = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.dokuInvoiceNumber, invoiceNumber));
    return transaction;
  }
}

export const storage = new DatabaseStorage();
