import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./auth/index";
import { z } from "zod";
import { users, sessions } from "@db/schema";
import { hashPassword, verifyPassword, generateSessionId } from "./auth";
import { eq } from "drizzle-orm";

async function seedDatabase() {
  const books = await storage.getBooks();
  if (books.length === 0) {
    console.log("Seeding database with initial books...");
    const initialBooks = [
      {
        title: "Atomic Habits",
        author: "James Clear",
        description: "An easy & proven way to build good habits & break bad ones.",
        coverUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=300&h=450",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        duration: 900, // 15 mins
        category: "Self-Improvement",
        isFeatured: true,
      },
      {
        title: "Deep Work",
        author: "Cal Newport",
        description: "Rules for focused success in a distracted world.",
        coverUrl: "https://images.unsplash.com/photo-1555449377-5b65f04dc71c?auto=format&fit=crop&q=80&w=300&h=450",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        duration: 1200, // 20 mins
        category: "Productivity",
        isFeatured: true,
      },
      {
        title: "The Psychology of Money",
        author: "Morgan Housel",
        description: "Timeless lessons on wealth, greed, and happiness.",
        coverUrl: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=300&h=450",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        duration: 600, // 10 mins
        category: "Finance",
        isFeatured: false,
      },
      {
        title: "Rich Dad Poor Dad",
        author: "Robert Kiyosaki",
        description: "What the rich teach their kids about money that the poor and middle class do not.",
        coverUrl: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=300&h=450",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
        duration: 1500, // 25 mins
        category: "Finance",
        isFeatured: true,
      },
       {
        title: "Sapiens",
        author: "Yuval Noah Harari",
        description: "A brief history of humankind.",
        coverUrl: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=300&h=450",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
        duration: 1800, // 30 mins
        category: "History",
        isFeatured: false,
      },
    ];

    for (const book of initialBooks) {
      await storage.createBook(book);
    }
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth Setup
  await setupAuth(app);
  registerAuthRoutes(app);

  // Books Routes
  app.get(api.books.list.path, async (req, res) => {
    const params = {
      search: req.query.search as string,
      category: req.query.category as string,
      featured: req.query.featured === 'true' ? true : undefined,
    };
    const books = await storage.getBooks(params);
    res.json(books);
  });

  app.get(api.books.get.path, async (req, res) => {
    const book = await storage.getBook(Number(req.params.id));
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.json(book);
  });

  app.post(api.books.create.path, async (req, res) => {
    try {
      const input = api.books.create.input.parse(req.body);
      const book = await storage.createBook(input);
      res.status(201).json(book);
    } catch (error) {
       if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join('.'),
        });
      }
      throw error;
    }
  });

  // Favorites Routes
  app.get(api.favorites.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const favorites = await storage.getFavorites(userId);
    res.json(favorites);
  });

  app.post(api.favorites.toggle.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const bookId = Number(req.params.bookId);

    if (isNaN(bookId)) {
        return res.status(404).json({ message: "Book not found" });
    }

    const exists = await storage.isFavorite(userId, bookId);
    if (exists) {
      await storage.removeFavorite(userId, bookId);
      res.json({ isFavorite: false });
    } else {
      await storage.addFavorite(userId, bookId);
      res.json({ isFavorite: true });
    }
  });

  app.get(api.favorites.check.path, async (req: any, res) => {
     if (!req.isAuthenticated()) {
         return res.json({ isFavorite: false });
     }
     const userId = req.user.claims.sub;
     const bookId = Number(req.params.bookId);
     const isFavorite = await storage.isFavorite(userId, bookId);
     res.json({ isFavorite });
  });

  // Categories Route
  app.get(api.categories.list.path, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  // Playback Progress Routes
  app.get(api.playback.recentlyPlayed.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const recentlyPlayed = await storage.getRecentlyPlayed(userId, 10);
    res.json(recentlyPlayed);
  });

  app.get(api.playback.getProgress.path, async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.json({ progress: 0, currentTime: 0 });
    }
    const userId = req.user.claims.sub;
    const bookId = Number(req.params.bookId);
    const progress = await storage.getPlaybackProgress(userId, bookId);
    res.json({
      progress: progress?.progress || 0,
      currentTime: progress?.currentTime || 0,
    });
  });

  app.post(api.playback.saveProgress.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const bookId = Number(req.params.bookId);
    const { progress, currentTime } = req.body;
    
    if (typeof progress !== 'number' || typeof currentTime !== 'number') {
      return res.status(400).json({ message: "Invalid progress data" });
    }
    
    await storage.savePlaybackProgress(userId, bookId, progress, currentTime);
    res.json({ success: true });
  });

  // ============= SUBSCRIPTION & LISTENING ROUTES =============

  // Get subscription plans
  app.get('/api/subscription/plans', async (req, res) => {
    const plans = await storage.getSubscriptionPlans();
    res.json(plans);
  });

  // Check listening status (limits)
  app.get('/api/listening/status', async (req: any, res) => {
    const userId = req.isAuthenticated() ? req.user.claims.sub : undefined;
    const visitorId = req.query.visitorId as string;
    
    const status = await storage.checkListeningStatus(userId, visitorId);
    res.json(status);
  });

  // Record listening (when user plays a book)
  app.post('/api/listening/record', async (req: any, res) => {
    const userId = req.isAuthenticated() ? req.user.claims.sub : undefined;
    const { bookId, visitorId } = req.body;
    
    if (!bookId) {
      return res.status(400).json({ message: "Book ID is required" });
    }

    // Check if user can listen
    const status = await storage.checkListeningStatus(userId, visitorId);
    if (!status.canListen) {
      return res.status(403).json({ 
        message: "Listening limit reached",
        status 
      });
    }

    await storage.recordListening(bookId, userId, visitorId);
    
    // Return updated status
    const updatedStatus = await storage.checkListeningStatus(userId, visitorId);
    res.json({ success: true, status: updatedStatus });
  });

  // Get active subscription for logged in user
  app.get('/api/subscription/active', isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const subscription = await storage.getActiveSubscription(userId);
    res.json(subscription || null);
  });

  // Create payment transaction (generate Xendit invoice)
  app.post('/api/payment/create', isAuthenticated, async (req: any, res) => {
    const userId = req.user.id;
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ message: "Plan ID is required" });
    }

    const plan = await storage.getSubscriptionPlan(planId);
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    try {
      // Create Xendit invoice
      const xenditSecretKey = process.env.XENDIT_SECRET_KEY;
      if (!xenditSecretKey) {
        throw new Error("Xendit API key not configured");
      }

      const externalId = `storify-${userId}-${Date.now()}`;
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 24); // 24 hours expiry

      const xenditPayload = {
        external_id: externalId,
        amount: plan.price,
        description: `Storify Premium - ${plan.name}`,
        invoice_duration: 86400, // 24 hours in seconds
        customer: {
          given_names: req.user.username || "User",
          email: req.user.email || `${req.user.username}@storify.app`,
        },
        customer_notification_preference: {
          invoice_created: ["email"],
          invoice_reminder: ["email"],
          invoice_paid: ["email"],
        },
        success_redirect_url: `${process.env.APP_URL || 'http://localhost:5000'}/subscription?payment=success`,
        failure_redirect_url: `${process.env.APP_URL || 'http://localhost:5000'}/subscription?payment=failed`,
        currency: "IDR",
        payment_methods: ["QRIS", "EWALLET", "VIRTUAL_ACCOUNT", "RETAIL_OUTLET"],
      };

      const xenditResponse = await fetch("https://api.xendit.co/v2/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${Buffer.from(xenditSecretKey + ":").toString("base64")}`,
        },
        body: JSON.stringify(xenditPayload),
      });

      if (!xenditResponse.ok) {
        const error = await xenditResponse.json();
        throw new Error(error.message || "Failed to create Xendit invoice");
      }

      const xenditData = await xenditResponse.json();

      // Save transaction to database
      const transaction = await storage.createPaymentTransaction(
        userId, 
        planId, 
        plan.price,
        {
          xenditInvoiceId: xenditData.id,
          xenditInvoiceUrl: xenditData.invoice_url,
          xenditExternalId: externalId,
          expiredAt: new Date(xenditData.expiry_date),
        }
      );

      res.json(transaction);
    } catch (error: any) {
      console.error("Error creating Xendit invoice:", error);
      res.status(500).json({ message: error.message || "Failed to create payment" });
    }
  });

  // Update payment transaction (webhook from Xendit or manual update)
  app.post('/api/payment/:transactionId/update', isAuthenticated, async (req: any, res) => {
    const transactionId = Number(req.params.transactionId);
    const { status, xenditPaymentMethod, xenditPaymentChannel, paymentCustomerName } = req.body;

    const transaction = await storage.getPaymentTransaction(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const updatedData: any = {};
    
    if (status === 'paid') {
      updatedData.status = 'paid';
      updatedData.paidAt = new Date();
      if (xenditPaymentMethod) updatedData.xenditPaymentMethod = xenditPaymentMethod;
      if (xenditPaymentChannel) updatedData.xenditPaymentChannel = xenditPaymentChannel;
      if (paymentCustomerName) updatedData.paymentCustomerName = paymentCustomerName;

      // Create subscription when payment is successful
      await storage.createSubscription(transaction.userId, transaction.planId, transactionId.toString());
    } else if (status) {
      updatedData.status = status;
    }

    const updated = await storage.updatePaymentTransaction(transactionId, updatedData);
    res.json(updated);
  });

  // Get payment transaction status
  app.get('/api/payment/:transactionId', isAuthenticated, async (req: any, res) => {
    const transactionId = Number(req.params.transactionId);
    const transaction = await storage.getPaymentTransaction(transactionId);
    
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    
    res.json(transaction);
  });

  // Xendit webhook endpoint (no auth required, verified by callback token)
  app.post('/api/webhook/xendit', async (req, res) => {
    try {
      // Verify webhook token
      const webhookToken = req.headers['x-callback-token'];
      if (webhookToken !== process.env.XENDIT_WEBHOOK_TOKEN) {
        return res.status(401).json({ message: "Invalid webhook token" });
      }

      const { external_id, status, payment_method, payment_channel, paid_amount } = req.body;

      // Find transaction by external_id
      const transaction = await storage.getPaymentTransactionByExternalId(external_id);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      // Update transaction based on Xendit status
      const updatedData: any = {};
      
      if (status === 'PAID' || status === 'SETTLED') {
        updatedData.status = 'paid';
        updatedData.paidAt = new Date();
        updatedData.xenditPaymentMethod = payment_method;
        updatedData.xenditPaymentChannel = payment_channel;

        // Create subscription when payment is successful
        await storage.createSubscription(transaction.userId, transaction.planId, transaction.id.toString());
      } else if (status === 'EXPIRED') {
        updatedData.status = 'expired';
      } else if (status === 'FAILED') {
        updatedData.status = 'failed';
      }

      if (Object.keys(updatedData).length > 0) {
        await storage.updatePaymentTransaction(transaction.id, updatedData);
      }

      res.json({ message: "Webhook processed" });
    } catch (error: any) {
      console.error("Error processing Xendit webhook:", error);
      res.status(500).json({ message: error.message || "Webhook processing failed" });
    }
  });

  // Sign Up Route
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          name,
        })
        .returning();

      // Create session
      const sessionId = generateSessionId();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await db.insert(sessions).values({
        id: sessionId,
        userId: newUser.id,
        expiresAt,
      });

      req.session.userId = newUser.id;
      req.session.sessionId = sessionId;

      res.json({
        message: "Sign up successful",
        user: { id: newUser.id, email: newUser.email, name: newUser.name },
      });
    } catch (error) {
      console.error("Sign up error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Sign In Route
  app.post("/api/auth/signin", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isValid = await verifyPassword(user.password, password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Create session
      const sessionId = generateSessionId();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await db.insert(sessions).values({
        id: sessionId,
        userId: user.id,
        expiresAt,
      });

      req.session.userId = user.id;
      req.session.sessionId = sessionId;

      res.json({
        message: "Sign in successful",
        user: { id: user.id, email: user.email, name: user.name },
      });
    } catch (error) {
      console.error("Sign in error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Sign Out Route
  app.post("/api/auth/signout", async (req, res) => {
    try {
      if (req.session.sessionId) {
        await db.delete(sessions).where(eq(sessions.id, req.session.sessionId));
      }
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
        }
        res.json({ message: "Sign out successful" });
      });
    } catch (error) {
      console.error("Sign out error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get Current User Route
  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
        })
        .from(users)
        .where(eq(users.id, req.session.userId))
        .limit(1);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ user });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Seed Data
  await seedDatabase();
  
  // Seed subscription plans if not exists
  await seedSubscriptionPlans();

  return httpServer;
}

// Seed subscription plans
async function seedSubscriptionPlans() {
  const plans = await storage.getSubscriptionPlans();
  if (plans.length === 0) {
    console.log("Seeding subscription plans...");
    const { db } = await import("./db");
    const { subscriptionPlans } = await import("@shared/schema");
    
    await db.insert(subscriptionPlans).values([
      {
        name: "Mingguan",
        price: 15000, // Rp 15.000
        durationDays: 7,
        description: "Akses unlimited selama 1 minggu",
        isActive: true,
      },
      {
        name: "Bulanan",
        price: 49000, // Rp 49.000
        durationDays: 30,
        description: "Akses unlimited selama 1 bulan - BEST VALUE",
        isActive: true,
      },
      {
        name: "Tahunan",
        price: 399000, // Rp 399.000
        durationDays: 365,
        description: "Akses unlimited selama 1 tahun - Hemat 32%",
        isActive: true,
      },
    ]);
    console.log("Subscription plans seeded!");
  }
}
