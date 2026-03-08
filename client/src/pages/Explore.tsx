import { useState } from "react";
import { useBooks } from "@/hooks/use-books";
import { apiUrl } from "@/lib/api-config";
import { BookCard } from "@/components/BookCard";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X, Filter, LayoutGrid, List } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/use-i18n";

export default function Explore() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { t } = useTranslation();
  
  // Fetch categories from database
  const { data: categories = [], isLoading: loadingCategories } = useQuery<string[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/categories'));
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: books, isLoading } = useBooks({ 
    search: search || undefined,
    category: selectedCategory || undefined
  });

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header - Fixed on mobile, sticky on desktop */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-safe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
          {/* Title and View Toggle */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-display font-bold">{t("explore.title")}</h1>
            
            {/* Desktop View Toggle */}
            <div className="hidden md:flex items-center gap-2 bg-secondary/50 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-background shadow-sm" : "hover:bg-background/50"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-background shadow-sm" : "hover:bg-background/50"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Search Bar - Wider on desktop */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("explore.search")} 
              className="pl-12 h-12 md:h-14 rounded-xl md:rounded-2xl bg-secondary/50 border-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-background transition-all text-base md:text-lg"
            />
            {search && (
              <button 
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Categories - Better desktop layout */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 -mx-4 sm:-mx-0 px-4 sm:px-0 md:flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 px-4 py-2 md:px-5 md:py-2.5 rounded-full text-sm md:text-base font-medium transition-all ${
                selectedCategory === null 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "bg-secondary/50 text-foreground hover:bg-secondary hover:shadow-sm"
              }`}
            >
              {t("explore.all")}
            </button>
            {loadingCategories ? (
              // Loading skeleton for categories
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-24 rounded-full flex-shrink-0" />
              ))
            ) : (
              categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                  className={`flex-shrink-0 px-4 py-2 md:px-5 md:py-2.5 rounded-full text-sm md:text-base font-medium transition-all ${
                    cat === selectedCategory 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "bg-secondary/50 text-foreground hover:bg-secondary hover:shadow-sm"
                  }`}
                >
                  {cat}
                </button>
              ))
            )}
          </div>
        </div>
        <div className="h-px bg-border/50 max-w-7xl mx-auto" />
      </div>

      {/* Content Grid - Responsive */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 lg:gap-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[2/3] rounded-xl w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {books?.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="text-center py-20 text-muted-foreground"
              >
                <div className="max-w-sm mx-auto space-y-4">
                  <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center">
                    <Search className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-lg font-medium">{t("explore.noBooks")}</p>
                  <p className="text-sm">{t("explore.noBooks.sub")}</p>
                </div>
              </motion.div>
            ) : viewMode === "grid" ? (
              <motion.div 
                layout
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 lg:gap-8"
              >
                {books?.map((book, idx) => (
                  <motion.div
                    layout
                    key={book.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                  >
                    <BookCard book={book} showDuration />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                layout
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {books?.map((book, idx) => (
                  <motion.div
                    layout
                    key={book.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                  >
                    <BookCard book={book} variant="horizontal" />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
        
        {/* Results count */}
        {!isLoading && books && books.length > 0 && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            {t("explore.showing")} {books.length} {books.length !== 1 ? t("explore.books") : t("explore.book")}
            {selectedCategory && ` ${t("explore.in")} ${selectedCategory}`}
            {search && ` ${t("explore.matching")} "${search}"`}
          </div>
        )}
      </main>
    </div>
  );
}
