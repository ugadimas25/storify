import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useFavorites() {
  return useQuery({
    queryKey: [api.favorites.list.path],
    queryFn: async () => {
      const res = await fetch(api.favorites.list.path, { credentials: "include" });
      if (res.status === 401) return null; // Handle unauth gracefully
      if (!res.ok) throw new Error("Failed to fetch favorites");
      return api.favorites.list.responses[200].parse(await res.json());
    },
  });
}

export function useIsFavorite(bookId: number) {
  return useQuery({
    queryKey: [api.favorites.check.path, bookId],
    queryFn: async () => {
      const url = buildUrl(api.favorites.check.path, { bookId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) return { isFavorite: false };
      return api.favorites.check.responses[200].parse(await res.json());
    },
    enabled: !!bookId,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (bookId: number) => {
      const url = buildUrl(api.favorites.toggle.path, { bookId });
      const res = await fetch(url, { 
        method: api.favorites.toggle.method,
        credentials: "include" 
      });
      
      if (res.status === 401) {
        throw new Error("Unauthorized");
      }
      
      if (!res.ok) throw new Error("Failed to toggle favorite");
      return api.favorites.toggle.responses[200].parse(await res.json());
    },
    onSuccess: (data, bookId) => {
      queryClient.invalidateQueries({ queryKey: [api.favorites.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.favorites.check.path, bookId] });
      
      toast({
        title: data.isFavorite ? "Added to favorites" : "Removed from favorites",
        duration: 2000,
      });
    },
    onError: (error) => {
      if (error.message === "Unauthorized") {
        toast({
          title: "Sign in required",
          description: "Please login to save favorites.",
          variant: "destructive",
        });
      }
    }
  });
}
