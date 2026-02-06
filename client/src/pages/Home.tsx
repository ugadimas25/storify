import { useBooks } from "@/hooks/use-books";
import { useAuth } from "@/hooks/use-auth";
import { useAudio } from "@/context/AudioContext";
import { BookCard } from "@/components/BookCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Bell, Search, Play, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Book } from "@shared/schema";

// Format seconds to mm:ss
function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface RecentlyPlayedBook extends Book {
  progress: number;
  currentTime: number;
}

export default function Home() {
  const { user } = useAuth();
  const { playBook } = useAudio();
  const { data: featuredBooks, isLoading: loadingFeatured } = useBooks({ featured: true });
  const { data: allBooks, isLoading: loadingAll } = useBooks();

  // Fetch recently played books for logged-in users
  const { data: recentlyPlayed, isLoading: loadingRecent } = useQuery<RecentlyPlayedBook[]>({
    queryKey: ['recently-played'],
    queryFn: async () => {
      const res = await fetch('/api/playback/recently-played', { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-32">
        <div className="flex gap-4 justify-center">
          {user ? (
            <Button
              size="lg"
              onClick={() => setLocation("/dashboard")}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button
                size="lg"
                onClick={() => setLocation("/auth/signin")}
                variant="outline"
              >
                Sign In
              </Button>
              <Button
                size="lg"
                onClick={() => setLocation("/auth/signup")}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Sign Up
              </Button>
            </>
          )}
        </div>
      </section>

      <main className="space-y-8 pt-4">
        {/* Continue Listening Section - Only show if user has recently played books */}
        {user && recentlyPlayed && recentlyPlayed.length > 0 && (
          <section>
            <div className="px-6 mb-4 flex justify-between items-end">
              <div>
                <h2 className="text-lg font-bold font-display">Continue Listening</h2>
                <p className="text-xs text-muted-foreground">Pick up where you left off</p>
              </div>
            </div>
            
            <div className="overflow-x-auto hide-scrollbar px-6 pb-4">
              <div className="flex gap-4 w-max">
                {loadingRecent ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-72 rounded-xl" />
                  ))
                ) : (
                  recentlyPlayed.slice(0, 5).map((book, idx) => (
                    <motion.div
                      key={book.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-card rounded-xl p-3 flex gap-3 min-w-[280px] max-w-[300px] border border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => playBook(book, book.currentTime)}
                    >
                      <div className="relative w-16 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={book.coverUrl} 
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Play className="w-6 h-6 text-white fill-current" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div>
                          <h3 className="font-semibold text-sm truncate">{book.title}</h3>
                          <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                        </div>
                        <div className="space-y-1">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${book.progress}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-muted-foreground">
                              {Math.round(book.progress)}% completed
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatTime(book.currentTime)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {/* Featured Section */}
        <section>
          <div className="px-6 mb-4 flex justify-between items-end">
            <h2 className="text-lg font-bold font-display">Featured</h2>
            <Link href="/explore" className="text-xs font-semibold text-primary">View All</Link>
          </div>
          
          <div className="overflow-x-auto hide-scrollbar px-6 pb-4 -mx-0">
            <div className="flex gap-4 w-max">
              {loadingFeatured ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="w-[140px] space-y-3">
                    <Skeleton className="h-[210px] w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))
              ) : (
                featuredBooks?.map((book, idx) => (
                  <motion.div
                    key={book.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <BookCard book={book} />
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* New Arrivals Section */}
        <section className="px-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold font-display">New Arrivals</h2>
            <p className="text-xs text-muted-foreground">Fresh summaries just for you</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {loadingAll ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="w-20 h-28 rounded-lg" />
                  <div className="space-y-2 flex-1 pt-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))
            ) : (
              allBooks?.slice(0, 5).map((book, idx) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + (idx * 0.05) }}
                >
                  <BookCard book={book} variant="horizontal" />
                </motion.div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
