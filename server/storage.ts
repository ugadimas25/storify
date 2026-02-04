import { db } from "./db";
import { books, favorites, type Book, type InsertBook, type Favorite } from "@shared/schema";
import { eq, and, desc, like } from "drizzle-orm";

export interface IStorage {
  // Books
  getBooks(params?: { search?: string; category?: string; featured?: boolean }): Promise<Book[]>;
  getBook(id: number): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;

  // Favorites
  getFavorites(userId: string): Promise<Book[]>;
  addFavorite(userId: string, bookId: number): Promise<void>;
  removeFavorite(userId: string, bookId: number): Promise<void>;
  isFavorite(userId: string, bookId: number): Promise<boolean>;
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
}

export const storage = new DatabaseStorage();
