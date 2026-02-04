import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { z } from "zod";

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

  // Seed Data
  await seedDatabase();

  return httpServer;
}
