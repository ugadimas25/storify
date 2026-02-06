import { useBooks } from "@/hooks/use-books";
import { useAuth } from "@/hooks/use-auth";
import { useAudio } from "@/context/AudioContext";
import { BookCard } from "@/components/BookCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Search, Play, ChevronRight, Headphones, BookOpen, Sparkles, ArrowRight } from "lucide-react";
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
    if (hour < 12) return "Selamat pagi";
    if (hour < 18) return "Selamat siang";
    return "Selamat malam";
  };

  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700" />
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl" />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-blue-400/15 rounded-full blur-2xl" />

        <div className="relative px-6 pt-12 pb-8">
          {user ? (
            /* Logged-in hero */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium">{getTimeGreeting()} 👋</p>
                  <h1 className="text-2xl font-bold text-white mt-1">
                    {user.firstName || 'Reader'}
                  </h1>
                </div>
                <button
                  onClick={() => setLocation("/explore")}
                  className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center"
                >
                  <Search className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Quick stats bar */}
              <div className="flex gap-3 mt-4">
                <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
                  <Headphones className="w-5 h-5 text-white/80 mx-auto mb-1" />
                  <p className="text-xs text-white/60">Listening</p>
                  <p className="text-lg font-bold text-white">{recentlyPlayed?.length || 0}</p>
                </div>
                <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
                  <BookOpen className="w-5 h-5 text-white/80 mx-auto mb-1" />
                  <p className="text-xs text-white/60">Library</p>
                  <p className="text-lg font-bold text-white">{allBooks?.length || 0}</p>
                </div>
                <div
                  className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center cursor-pointer hover:bg-white/20 transition-colors"
                  onClick={() => setLocation("/explore")}
                >
                  <Sparkles className="w-5 h-5 text-yellow-300 mx-auto mb-1" />
                  <p className="text-xs text-white/60">Explore</p>
                  <p className="text-lg font-bold text-white">
                    <ArrowRight className="w-5 h-5 mx-auto" />
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Guest hero */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-5"
            >
              {/* Logo / Brand */}
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mx-auto">
                <Headphones className="w-4 h-4 text-yellow-300" />
                <span className="text-sm font-semibold text-white">Storify Insights</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold text-white leading-tight">
                  Dengarkan Ringkasan<br />
                  <span className="bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                    Buku Terbaik
                  </span>
                </h1>
                <p className="text-white/70 text-sm max-w-xs mx-auto leading-relaxed">
                  Akses ratusan ringkasan audiobook kapan saja, di mana saja. Belajar lebih cepat, lebih cerdas.
                </p>
              </div>

              <div className="flex gap-3 justify-center pt-2">
                <Button
                  size="lg"
                  onClick={() => setLocation("/auth/signin")}
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white rounded-xl px-6 backdrop-blur-sm"
                >
                  Masuk
                </Button>
                <Button
                  size="lg"
                  onClick={() => setLocation("/auth/signup")}
                  className="bg-white text-purple-700 hover:bg-white/90 rounded-xl px-6 font-semibold shadow-lg shadow-black/10"
                >
                  Daftar Gratis
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              {/* Trust badge */}
              <div className="flex items-center justify-center gap-1.5 pt-1">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-white/20 border-2 border-purple-600 flex items-center justify-center">
                      <span className="text-[8px] text-white font-bold">{['A', 'R', 'M'][i-1]}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-white/60 ml-1">Bergabung dengan 1000+ pembaca</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Curved bottom edge */}
        <div className="relative h-6">
          <svg viewBox="0 0 1440 48" fill="none" className="absolute bottom-0 w-full" preserveAspectRatio="none">
            <path d="M0 48h1440V0C1200 40 240 40 0 0v48z" className="fill-background" />
          </svg>
        </div>
      </section>

      <main className="space-y-8 pt-2">
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
