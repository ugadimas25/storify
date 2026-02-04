import { useFavorites } from "@/hooks/use-favorites";
import { useAuth } from "@/hooks/use-auth";
import { BookCard } from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookMarked, Lock } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function Favorites() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: favorites, isLoading: favLoading } = useFavorites();

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
        <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-display font-bold mb-2">Login Required</h1>
        <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
          Sign in to access your library of saved summaries and continue listening where you left off.
        </p>
        <Button asChild size="lg" className="w-full max-w-xs">
          <a href="/api/login">Sign In</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-6 py-4 border-b border-border/50">
        <h1 className="text-2xl font-display font-bold">My Library</h1>
      </div>

      <div className="p-6">
        {favLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : favorites?.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-secondary/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookMarked className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold mb-2">No favorites yet</h3>
            <p className="text-muted-foreground text-sm mb-6">Start exploring to build your library.</p>
            <Link href="/explore">
              <Button variant="outline">Explore Books</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {favorites?.map((book, idx) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <BookCard book={book} variant="horizontal" className="bg-card/50" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
