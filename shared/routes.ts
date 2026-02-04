import { z } from 'zod';
import { insertBookSchema, insertFavoriteSchema, books, favorites } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  books: {
    list: {
      method: 'GET' as const,
      path: '/api/books',
      input: z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        featured: z.boolean().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof books.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/books/:id',
      responses: {
        200: z.custom<typeof books.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    // Admin only in real app, but open for MVP/Admin simulation
    create: {
      method: 'POST' as const,
      path: '/api/books',
      input: insertBookSchema,
      responses: {
        201: z.custom<typeof books.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  favorites: {
    list: {
      method: 'GET' as const,
      path: '/api/favorites',
      responses: {
        200: z.array(z.custom<typeof books.$inferSelect>()), // Returns full book objects
        401: errorSchemas.unauthorized,
      },
    },
    toggle: {
      method: 'POST' as const,
      path: '/api/favorites/:bookId',
      responses: {
        200: z.object({ isFavorite: z.boolean() }),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    check: {
      method: 'GET' as const,
      path: '/api/favorites/:bookId/check',
      responses: {
        200: z.object({ isFavorite: z.boolean() }),
      }
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
