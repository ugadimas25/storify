import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type Book, type InsertBook } from "@shared/routes";
import { apiUrl, API_BASE_URL } from "@/lib/api-config";

export function useBooks(filters?: { search?: string; category?: string; featured?: boolean }) {
  const queryKey = [api.books.list.path, filters];
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Construct URL with query params
      const baseOrigin = API_BASE_URL || window.location.origin;
      const url = new URL(baseOrigin + api.books.list.path);
      if (filters?.search) url.searchParams.append("search", filters.search);
      if (filters?.category) url.searchParams.append("category", filters.category);
      if (filters?.featured !== undefined) url.searchParams.append("featured", String(filters.featured));

      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch books");
      return api.books.list.responses[200].parse(await res.json());
    },
  });
}

export function useBook(id: number) {
  return useQuery({
    queryKey: [api.books.get.path, id],
    queryFn: async () => {
      const url = apiUrl(buildUrl(api.books.get.path, { id }));
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch book");
      return api.books.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertBook) => {
      const validated = api.books.create.input.parse(data);
      const res = await fetch(apiUrl(api.books.create.path), {
        method: api.books.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          throw new Error("Validation failed");
        }
        throw new Error("Failed to create book");
      }
      return api.books.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.books.list.path] });
    },
  });
}
