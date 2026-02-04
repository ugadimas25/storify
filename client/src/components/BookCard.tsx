import { Book } from "@shared/schema";
import { Play, Pause } from "lucide-react";
import { Link } from "wouter";
import { useAudio } from "@/context/AudioContext";
import { cn } from "@/lib/utils";

interface BookCardProps {
  book: Book;
  variant?: "vertical" | "horizontal";
  className?: string;
}

export function BookCard({ book, variant = "vertical", className }: BookCardProps) {
  const { currentBook, isPlaying, playBook } = useAudio();
  const isCurrent = currentBook?.id === book.id;
  
  if (variant === "horizontal") {
    return (
      <Link href={`/book/${book.id}`} className={cn("block group", className)}>
        <div className="flex gap-4 p-3 rounded-2xl bg-card hover:bg-muted/30 transition-colors border border-transparent hover:border-border/50">
          <div className="relative w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden shadow-sm">
            <img 
              src={book.coverUrl} 
              alt={book.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <button 
              onClick={(e) => {
                e.preventDefault();
                playBook(book);
              }}
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
          </div>
          <div className="flex flex-col justify-center min-w-0">
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

  // Vertical (default)
  return (
    <Link href={`/book/${book.id}`} className={cn("block group w-[140px] flex-shrink-0", className)}>
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 shadow-sm group-hover:shadow-md transition-all">
        <img 
          src={book.coverUrl} 
          alt={book.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <button 
          onClick={(e) => {
            e.preventDefault();
            playBook(book);
          }}
          className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
        >
          {isCurrent && isPlaying ? (
            <Pause className="w-5 h-5 text-primary fill-current" />
          ) : (
            <Play className="w-5 h-5 text-primary fill-current ml-0.5" />
          )}
        </button>
      </div>
      <div>
        <h3 className="font-bold text-sm leading-tight mb-1 line-clamp-2 group-hover:text-primary transition-colors">
          {book.title}
        </h3>
        <p className="text-xs text-muted-foreground truncate">{book.author}</p>
      </div>
    </Link>
  );
}
