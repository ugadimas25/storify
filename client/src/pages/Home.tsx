import { useBooks } from "@/hooks/use-books";
import { useAuth } from "@/hooks/use-auth";
import { useAudio } from "@/context/AudioContext";
import { SEO } from "@/components/SEO";
import { apiUrl } from "@/lib/api-config";
import { BookCard } from "@/components/BookCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Search, Play, ChevronLeft, ChevronRight, Headphones, BookOpen, Sparkles, ArrowRight, Clock } from "lucide-react";
import { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/use-i18n";
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
      const res = await fetch(apiUrl('/api/playback/recently-played'), { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });

  // Slider refs and scroll logic
  const featuredRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  const scrollFeatured = (direction: "left" | "right") => {
    const el = featuredRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.7;
    el.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
    setTimeout(() => updateScrollState(el), 350);
  };

  const { t, locale, setLocale } = useTranslation();

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("home.greeting.morning");
    if (hour < 18) return t("home.greeting.afternoon");
    return t("home.greeting.evening");
  };

  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background pb-24">
      <SEO
        title="Audiobook & Ringkasan Buku Indonesia"
        description="Dengarkan ringkasan buku dan audiobook berbahasa Indonesia. Pelajari ide-ide terbaik dari buku populer dalam 15 menit."
        canonical="/"
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#253494] via-[#2c7fb8] to-[#41b6c4]" />
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#a1dab4]/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-[#41b6c4]/20 rounded-full blur-2xl" />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-[#ffffcc]/10 rounded-full blur-2xl" />

        <div className="relative px-6 pt-12 pb-8 lg:pt-16 lg:pb-12 max-w-7xl mx-auto">
          {user ? (
            /* Logged-in hero */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 lg:space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm md:text-base font-medium">{getTimeGreeting()} 👋</p>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mt-1">
                    {user.firstName || 'Reader'}
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLocale(locale === "id" ? "en" : "id")}
                    className="w-10 h-10 md:w-12 md:h-12 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/25 transition-colors text-xs md:text-sm font-bold text-white"
                  >
                    {locale === "id" ? "EN" : "ID"}
                  </button>
                  <button
                    onClick={() => setLocation("/explore")}
                    className="w-10 h-10 md:w-12 md:h-12 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/25 transition-colors"
                  >
                    <Search className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </button>
                </div>
              </div>

              {/* Quick stats bar - larger on desktop */}
              <div className="flex gap-3 md:gap-4 lg:gap-6 mt-4 lg:mt-6">
                <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl p-3 md:p-4 lg:p-5 text-center hover:bg-white/20 transition-colors">
                  <Headphones className="w-5 h-5 md:w-6 md:h-6 text-white/80 mx-auto mb-1" />
                  <p className="text-xs md:text-sm text-white/60">{t("home.stats.listening")}</p>
                  <p className="text-lg md:text-xl lg:text-2xl font-bold text-white">{recentlyPlayed?.length || 0}</p>
                </div>
                <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl p-3 md:p-4 lg:p-5 text-center hover:bg-white/20 transition-colors">
                  <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-white/80 mx-auto mb-1" />
                  <p className="text-xs md:text-sm text-white/60">{t("home.stats.library")}</p>
                  <p className="text-lg md:text-xl lg:text-2xl font-bold text-white">{allBooks?.length || 0}</p>
                </div>
                <div
                  className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl p-3 md:p-4 lg:p-5 text-center cursor-pointer hover:bg-white/25 transition-colors"
                  onClick={() => setLocation("/explore")}
                >
                  <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-[#ffffcc] mx-auto mb-1" />
                  <p className="text-xs md:text-sm text-white/60">{t("home.stats.explore")}</p>
                  <p className="text-lg md:text-xl lg:text-2xl font-bold text-white">
                    <ArrowRight className="w-5 h-5 md:w-6 md:h-6 mx-auto" />
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Guest hero - improved for desktop */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-5 lg:space-y-8 lg:py-8"
            >
              {/* Logo / Brand */}
              <div className="flex items-center justify-between">
                <div />
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 md:px-5 md:py-2">
                  <Headphones className="w-4 h-4 md:w-5 md:h-5 text-[#ffffcc]" />
                  <span className="text-sm md:text-base font-semibold text-white">{t("home.brand")}</span>
                </div>
                <button
                  onClick={() => setLocale(locale === "id" ? "en" : "id")}
                  className="w-10 h-10 md:w-12 md:h-12 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/25 transition-colors text-xs md:text-sm font-bold text-white"
                >
                  {locale === "id" ? "EN" : "ID"}
                </button>
              </div>

              <div className="space-y-3 lg:space-y-4">
                <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
                  {t("home.hero.title1")}<br />
                  <span className="bg-gradient-to-r from-[#ffffcc] to-[#a1dab4] bg-clip-text text-transparent">
                    {t("home.hero.title2")}
                  </span>
                </h1>
                <p className="text-white/70 text-sm md:text-base lg:text-lg max-w-xs md:max-w-md lg:max-w-xl mx-auto leading-relaxed">
                  {t("home.hero.subtitle")}
                </p>
              </div>

              <div className="flex gap-3 md:gap-4 justify-center pt-2">
                <Button
                  size="lg"
                  onClick={() => setLocation("/auth/signin")}
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white rounded-xl px-6 md:px-8 backdrop-blur-sm md:text-base lg:text-lg"
                >
                  {t("home.hero.signin")}
                </Button>
                <Button
                  size="lg"
                  onClick={() => setLocation("/auth/signup")}
                  className="bg-[#ffffcc] text-[#253494] hover:bg-[#ffffcc]/90 rounded-xl px-6 md:px-8 font-semibold shadow-lg shadow-black/10 md:text-base lg:text-lg"
                >
                  {t("home.hero.signup")}
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-1" />
                </Button>
              </div>

              {/* Trust badge */}
              <div className="flex items-center justify-center gap-1.5 pt-1">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white/20 border-2 border-[#2c7fb8] flex items-center justify-center">
                      <span className="text-[8px] md:text-[10px] text-white font-bold">{['A', 'R', 'M'][i-1]}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs md:text-sm text-white/60 ml-1">{t("home.hero.trust")}</p>
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
          <section className="max-w-7xl mx-auto">
            <div className="px-4 sm:px-6 lg:px-8 mb-4 flex justify-between items-end">
              <div>
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold font-display">{t("home.continue")}</h2>
                <p className="text-xs md:text-sm text-muted-foreground">{t("home.continue.sub")}</p>
              </div>
            </div>
            
            <div className="overflow-x-auto hide-scrollbar px-4 sm:px-6 lg:px-8 pb-4">
              <div className="flex gap-4 md:gap-6 w-max">
                {loadingRecent ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-72 md:w-80 rounded-xl" />
                  ))
                ) : (
                  recentlyPlayed.slice(0, 5).map((book, idx) => (
                    <motion.div
                      key={book.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-card rounded-xl md:rounded-2xl p-3 md:p-4 flex gap-3 md:gap-4 min-w-[280px] md:min-w-[320px] max-w-[320px] md:max-w-[380px] border border-border/50 shadow-sm hover:shadow-lg transition-all cursor-pointer hover:border-primary/30 hover:scale-[1.01]"
                      onClick={() => playBook(book, book.currentTime)}
                    >
                      <div className="relative w-16 h-20 md:w-20 md:h-24 rounded-lg md:rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                        <img 
                          src={book.coverUrl} 
                          alt={book.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-book.svg';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Play className="w-6 h-6 md:w-8 md:h-8 text-white fill-current" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div>
                          <h3 className="font-semibold text-sm md:text-base truncate">{book.title}</h3>
                          <p className="text-xs md:text-sm text-muted-foreground truncate">{book.author}</p>
                        </div>
                        <div className="space-y-1.5">
                          <div className="h-1.5 md:h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${book.progress}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] md:text-xs text-muted-foreground">
                              {Math.round(book.progress)}% {t("home.completed")}
                            </span>
                            <span className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
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

        {/* Featured Section - Netflix style horizontal slider */}
        <section className="relative group/featured">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 flex justify-between items-end">
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold font-display">{t("home.featured")}</h2>
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={() => scrollFeatured("left")}
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full border border-border flex items-center justify-center transition-all ${canScrollLeft ? 'bg-primary text-primary-foreground shadow-sm hover:shadow-md hover:scale-105' : 'bg-muted/50 text-muted-foreground/40 cursor-default'}`}
                disabled={!canScrollLeft}
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button
                onClick={() => scrollFeatured("right")}
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full border border-border flex items-center justify-center transition-all ${canScrollRight ? 'bg-primary text-primary-foreground shadow-sm hover:shadow-md hover:scale-105' : 'bg-muted/50 text-muted-foreground/40 cursor-default'}`}
                disabled={!canScrollRight}
              >
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <Link href="/explore" className="text-xs md:text-sm font-semibold text-primary ml-1 hover:underline">{t("home.viewAll")}</Link>
            </div>
          </div>
          
          <div
            ref={featuredRef}
            onScroll={(e) => updateScrollState(e.currentTarget)}
            className="overflow-x-auto hide-scrollbar scroll-smooth"
          >
            <div className="flex gap-4 md:gap-6 w-max px-4 sm:px-6 lg:px-8 pb-4">
              {/* Add padding element for proper edge alignment on large screens */}
              <div className="hidden lg:block w-[calc((100vw-1280px)/2)] flex-shrink-0" />
              
              {loadingFeatured ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="w-[140px] md:w-[180px] lg:w-[200px] space-y-3 flex-shrink-0">
                    <Skeleton className="aspect-[2/3] w-full rounded-xl" />
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
                    transition={{ delay: idx * 0.05 }}
                  >
                    <BookCard book={book} variant="featured" />
                  </motion.div>
                ))
              )}
              
              {/* Add padding element for proper edge alignment on large screens */}
              <div className="hidden lg:block w-[calc((100vw-1280px)/2)] flex-shrink-0" />
            </div>
          </div>
        </section>

        {/* New Arrivals Section - Grid on desktop */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-4 md:mb-6 flex justify-between items-end">
            <div>
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold font-display">{t("home.newArrivals")}</h2>
              <p className="text-xs md:text-sm text-muted-foreground">{t("home.newArrivals.sub")}</p>
            </div>
            <Link href="/explore" className="text-xs md:text-sm font-semibold text-primary hover:underline">
              {t("home.seeAll")} <ArrowRight className="w-3 h-3 md:w-4 md:h-4 inline ml-1" />
            </Link>
          </div>

          {/* Mobile: List view, Desktop: Grid view */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {loadingAll ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[2/3] rounded-xl w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : (
              allBooks?.slice(0, 8).map((book, idx) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + (idx * 0.03) }}
                >
                  <BookCard book={book} showDuration />
                </motion.div>
              ))
            )}
          </div>

          {/* Mobile: Horizontal list */}
          <div className="md:hidden grid grid-cols-1 gap-4">
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
