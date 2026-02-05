import { useState } from "react";
import { useBooks } from "@/hooks/use-books";
import { BookCard } from "@/components/BookCard";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

export default function Explore() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Fetch categories from database
  const { data: categories = [], isLoading: loadingCategories } = useQuery<string[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
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
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-safe">
        <div className="px-6 py-4 space-y-4">
          <h1 className="text-2xl font-display font-bold">Explore</h1>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Title, author, or keyword..." 
              className="pl-10 h-12 rounded-xl bg-secondary/50 border-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-background transition-all"
            />
            {search && (
              <button 
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 -mx-6 px-6">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === null 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary/50 text-foreground hover:bg-secondary"
              }`}
            >
              All
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
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    cat === selectedCategory 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-secondary/50 text-foreground hover:bg-secondary"
                  }`}
                >
                  {cat}
                </button>
              ))
            )}
          </div>
        </div>
        <div className="h-px bg-border/50 mx-6" />
      </div>

      {/* Content Grid */}
      <main className="px-6 py-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8">
            {Array.from({ length: 6 }).map((_, i) => (
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
                <p>No books found matching your criteria.</p>
              </motion.div>
            ) : (
              <motion.div 
                layout
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8"
              >
                {books?.map((book) => (
                  <motion.div
                    layout
                    key={book.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <BookCard book={book} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
