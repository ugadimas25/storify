import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export * from "./models/auth";

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  description: text("description").notNull(),
  coverUrl: text("cover_url").notNull(),
  audioUrl: text("audio_url").notNull(),
  duration: integer("duration").notNull(), // in seconds
  category: text("category").notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // References users.id (which is varchar)
  bookId: integer("book_id").notNull(),
});

export const insertBookSchema = createInsertSchema(books).omit({ id: true });
export const insertFavoriteSchema = createInsertSchema(favorites).omit({ id: true });

export type Book = typeof books.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;

export type CreateBookRequest = InsertBook;
export type UpdateBookRequest = Partial<InsertBook>;
