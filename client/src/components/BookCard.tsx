import { Book } from "@shared/schema";
import { Play, Pause, Clock, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { useAudio } from "@/context/AudioContext";
import { cn } from "@/lib/utils";
import { PlayRipple } from "@/components/PlayRipple";

interface BookCardProps {
  book: Book;
  variant?: "vertical" | "horizontal" | "featured";
  className?: string;
  showDuration?: boolean;
}

export function BookCard({ book, variant = "vertical", className, showDuration = false }: BookCardProps) {
  const { currentBook, isPlaying, playBook } = useAudio();
  const isCurrent = currentBook?.id === book.id;
  const isPlayingCurrent = isCurrent && isPlaying;

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playBook(book);
  };
  
  if (variant === "horizontal") {
    return (
      <Link href={`/book/${book.id}`} className={cn("block group", className)}>
        <div className="flex gap-4 p-3 rounded-2xl bg-card hover:bg-muted/30 transition-colors border border-transparent hover:border-border/50">
          <div className="relative w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden shadow-sm">
            <img 
              src={book.coverUrl} 
              alt={book.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-book.svg';
              }}
            />
            <button 
              onClick={handlePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                {isCurrent && isPlaying ? (
                  <Pause className="w-4 h-4 text-primary fill-current" />
                ) : (
                  <Play className="w-4 h-4 text-primary fill-current ml-0.5" />
                )}
              </div>
            </button>
            <PlayRipple playing={isPlayingCurrent} />
            <span className="text-xs font-medium text-primary mb-1">{book.category}</span>
            <h3 className="font-display font-bold text-lg leading-tight mb-1 truncate">{book.title}</h3>
            <p className="text-sm text-muted-foreground truncate">{book.author}</p>
            <div className="mt-2 text-xs text-muted-foreground/70">
              {Math.floor(book.duration / 60)} min listen
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Featured variant - larger cards for hero sections
  if (variant === "featured") {
    return (
      <Link href={`/book/${book.id}`} className={cn("block group w-[180px] md:w-[200px] lg:w-[220px] flex-shrink-0", className)}>
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 shadow-md group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-[1.02]">
          <img 
            src={book.coverUrl} 
            alt={book.title} 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-book.svg';
            }}
          />
          
          {/* PDF Available Badge - All books have PDF */}
          <div className="absolute top-2 left-2 md:top-3 md:left-3 flex items-center gap-1 bg-primary/90 backdrop-blur-sm text-primary-foreground text-[9px] md:text-[10px] px-2 py-1 rounded-full font-medium shadow-lg">
            <BookOpen className="w-3 h-3" />
            PDF
          </div>
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Play button */}
          <button 
            onClick={handlePlay}
            className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-xl translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary/90 hover:scale-110"
          >
            {isCurrent && isPlaying ? (
              <Pause className="w-5 h-5 text-primary-foreground fill-current" />
            ) : (
              <Play className="w-5 h-5 text-primary-foreground fill-current ml-0.5" />
            )}
          </button>

          {/* Starburst animation on play */}
          <PlayRipple playing={isPlayingCurrent} />

          {/* Info overlay on hover */}
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <p className="text-xs text-white/80 truncate">{book.author}</p>
          </div>
        </div>
        <div className="px-1">
          <h3 className="font-bold text-sm md:text-base leading-tight mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {book.title}
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground truncate">{book.author}</p>
        </div>
      </Link>
    );
  }

  // Vertical (default) - responsive sizing
  return (
    <Link href={`/book/${book.id}`} className={cn("block group", className)}>
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 shadow-sm group-hover:shadow-lg transition-all duration-300 transform group-hover:scale-[1.02]">
        <img 
          src={book.coverUrl} 
          alt={book.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-book.svg';
          }}
        />
        
        {/* PDF Available Badge - All books have PDF */}
        <div className="absolute top-2 left-2 md:top-3 md:left-3 flex items-center gap-1 bg-primary/90 backdrop-blur-sm text-primary-foreground text-[9px] md:text-[10px] px-2 py-1 rounded-full font-medium shadow-lg z-10">
          <BookOpen className="w-3 h-3" />
          PDF
        </div>
        
        {/* Always visible subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-70" />
        
        {/* Hover gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Play button */}
        <button 
          onClick={handlePlay}
          className="absolute bottom-3 right-3 md:bottom-4 md:right-4 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/95 flex items-center justify-center shadow-lg translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
        >
          {isCurrent && isPlaying ? (
            <Pause className="w-4 h-4 md:w-5 md:h-5 text-primary fill-current" />
          ) : (
            <Play className="w-4 h-4 md:w-5 md:h-5 text-primary fill-current ml-0.5" />
          )}
        </button>

        {/* Starburst animation on play */}
        <PlayRipple playing={isPlayingCurrent} />

        {/* Duration badge */}
        {showDuration && book.duration > 0 && (
          <div className="absolute top-2 right-2 md:top-3 md:right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[10px] md:text-xs px-2 py-1 rounded-full">
            <Clock className="w-3 h-3" />
            {Math.floor(book.duration / 60)}m
          </div>
        )}
      </div>
      <div className="px-0.5">
        <h3 className="font-bold text-sm md:text-base leading-tight mb-1 line-clamp-2 group-hover:text-primary transition-colors">
          {book.title}
        </h3>
        <p className="text-xs md:text-sm text-muted-foreground truncate">{book.author}</p>
      </div>
    </Link>
  );
}
