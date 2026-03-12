import { useBook } from "@/hooks/use-books";
import { useRoute } from "wouter";
import { useAudio } from "@/context/AudioContext";
import { useFavorites, useToggleFavorite, useIsFavorite } from "@/hooks/use-favorites";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Play, Pause, Heart, Share2, Clock, BookOpen, Headphones, List } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { PDFReader } from "@/components/PDFReader";
import { ChapterAudioPlayer } from "@/components/ChapterAudioPlayer";
import { PlayRipple } from "@/components/PlayRipple";
import { useState } from "react";
import { useTranslation } from "@/hooks/use-i18n";
import { SEO } from "@/components/SEO";

export default function BookDetail() {
  const [, params] = useRoute("/book/:id");
  const id = parseInt(params?.id || "0");
  const [showPDFReader, setShowPDFReader] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  
  const { data: book, isLoading } = useBook(id);
  const { currentBook, isPlaying, playBook, togglePlay } = useAudio();
  const { isAuthenticated } = useAuth();
  
  const { data: favoriteStatus } = useIsFavorite(id);
  const toggleFavorite = useToggleFavorite();
  const { t } = useTranslation();

  const isCurrent = currentBook?.id === book?.id;
  const isPlayingCurrent = isCurrent && isPlaying;

  // Generate PDF URL based on book ID
  const pdfUrl = book ? `https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/pdf/${book.id}.pdf` : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 space-y-8">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="w-48 h-72 rounded-xl" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!book) return <div className="p-8 text-center">{t("book.notFound")}</div>;

  return (
    <div className="min-h-screen bg-background pb-32">
      <SEO
        title={book.title}
        description={book.description || `Dengarkan ringkasan buku ${book.title} oleh ${book.author} di Storify.`}
        canonical={`/book/${book.id}`}
        ogImage={book.coverUrl}
        ogType="book"
      />
      {/* Dynamic Background Blur */}
      <div 
        className="fixed inset-0 z-0 opacity-20 pointer-events-none blur-3xl"
        style={{ 
          background: `radial-gradient(circle at 50% 30%, ${'var(--primary)'}, transparent 70%)` 
        }} 
      />

      <div className="relative z-10">
        {/* Nav */}
        <div className="flex justify-between items-center p-6 sticky top-0 bg-background/0 backdrop-blur-sm z-20">
          <Link href="/">
            <Button variant="outline" size="icon" className="rounded-full bg-background/80 border-transparent shadow-sm">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className={cn(
                "rounded-full bg-background/80 border-transparent shadow-sm transition-colors",
                favoriteStatus?.isFavorite && "text-red-500 hover:text-red-600"
              )}
              onClick={() => toggleFavorite.mutate(id)}
              disabled={toggleFavorite.isPending}
            >
              <Heart className={cn("w-5 h-5", favoriteStatus?.isFavorite && "fill-current")} />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full bg-background/80 border-transparent shadow-sm">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Hero Content */}
        <div className="flex flex-col items-center px-6 pb-8">
          <div className="relative w-48 aspect-[2/3] rounded-2xl shadow-2xl shadow-primary/20 mb-8 overflow-hidden">
            <img 
              src={book.coverUrl} 
              alt={book.title} 
              className="w-full h-full object-cover"
            />
            <PlayRipple playing={isPlayingCurrent} />
          </div>

          <div className="text-center space-y-2 mb-8 max-w-sm">
            <h1 className="text-2xl font-display font-bold leading-tight">{book.title}</h1>
            <p className="text-muted-foreground font-medium">{book.author}</p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/80 mt-2">
              <span className="bg-secondary px-3 py-1 rounded-full">{book.category}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {Math.floor(book.duration / 60)} min
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full max-w-md space-y-3">
            {/* Play Audio Summary */}
            <Button 
              size="lg" 
              className="w-full rounded-xl h-14 text-base font-semibold shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
              onClick={() => isCurrent ? togglePlay() : playBook(book)}
            >
              {isPlayingCurrent ? (
                <>
                  <Pause className="w-5 h-5 mr-2 fill-current" /> Pause Summary
                </>
              ) : (
                <>
                  <Headphones className="w-5 h-5 mr-2" /> Listen to Summary
                </>
              )}
            </Button>

            {/* Read Full Book - PDF available for all books */}
            <Button 
              size="lg" 
              variant="outline"
              className="w-full rounded-xl h-14 text-base font-semibold border-2 hover:bg-primary/5 transition-all"
              onClick={(e) => {
                e.preventDefault();
                console.log('Opening PDF reader for:', book.title, 'URL:', pdfUrl);
                setShowPDFReader(true);
              }}
            >
              <BookOpen className="w-5 h-5 mr-2" /> Read Full Book
            </Button>

            {/* Listen by Chapters */}
            <Button 
              size="lg" 
              variant="outline"
              className="w-full rounded-xl h-14 text-base font-semibold border-2 hover:bg-primary/5 transition-all"
              onClick={() => setShowAudioPlayer(true)}
            >
              <List className="w-5 h-5 mr-2" /> Listen by Chapters
            </Button>
          </div>
        </div>

        {/* Details Section */}
        <div className="px-6 max-w-2xl mx-auto space-y-6">
          <div>
            <h3 className="text-lg font-bold font-display mb-3">About this book</h3>
            <p className="text-muted-foreground leading-relaxed">
              {book.description}
            </p>
          </div>

          {/* Format Info */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-secondary/30 rounded-lg p-4 text-center">
              <Headphones className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Audio Summary</p>
              <p className="text-xs text-muted-foreground mt-1">{Math.floor(book.duration / 60)} minutes</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-4 text-center">
              <BookOpen className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Full Book (PDF)</p>
              <p className="text-xs text-muted-foreground mt-1">Read Complete</p>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Reader Modal */}
      {showPDFReader && pdfUrl && (
        <PDFReader 
          pdfUrl={pdfUrl} 
          bookTitle={book.title} 
          onClose={() => setShowPDFReader(false)}
        />
      )}

      {/* Audio Player Modal */}
      {showAudioPlayer && (
        <ChapterAudioPlayer 
          bookId={book.id}
          bookTitle={book.title} 
          onClose={() => setShowAudioPlayer(false)}
        />
      )}
    </div>
  );
}
