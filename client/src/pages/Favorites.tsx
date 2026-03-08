import { useFavorites } from "@/hooks/use-favorites";
import { useAuth } from "@/hooks/use-auth";
import { BookCard } from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookMarked, Lock } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/use-i18n";

export default function Favorites() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: favorites, isLoading: favLoading } = useFavorites();
  const { t } = useTranslation();

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
        <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-display font-bold mb-2">{t("favorites.loginRequired")}</h1>
        <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
          {t("favorites.loginMsg")}
        </p>
        <Button asChild size="lg" className="w-full max-w-xs">
          <a href="/api/login">{t("favorites.signin")}</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-6 lg:px-8 py-4 lg:py-6 border-b border-border/50">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold">{t("favorites.title")}</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">{t("favorites.subtitle")}</p>
        </div>
      </div>

      <div className="p-6 lg:px-8 max-w-7xl mx-auto">
        {favLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
            ))}
          </div>
        ) : favorites?.length === 0 ? (
          <div className="text-center py-20 lg:py-32">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-secondary/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookMarked className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg md:text-xl font-bold mb-2">{t("favorites.noFavorites")}</h3>
            <p className="text-muted-foreground text-sm md:text-base mb-6 max-w-md mx-auto">{t("favorites.noFavorites.sub")}</p>
            <Link href="/explore">
              <Button variant="outline" size="lg">{t("favorites.exploreBooks")}</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop: Grid view */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {favorites?.map((book, idx) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <BookCard book={book} showDuration />
                </motion.div>
              ))}
            </div>

            {/* Mobile: List view */}
            <div className="md:hidden grid gap-4">
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
          </>
        )}
      </div>
    </div>
  );
}
