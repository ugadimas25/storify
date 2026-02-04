import { useAudio } from "@/context/AudioContext";
import { Play, Pause, X, SkipBack, SkipForward } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export function GlobalAudioPlayer() {
  const { currentBook, isPlaying, progress, togglePlay, seek, closePlayer } = useAudio();

  // If no book is playing, don't render anything
  if (!currentBook) return null;

  return (
    <AnimatePresence>
      {currentBook && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-16 left-0 right-0 z-50 px-2 pb-2"
        >
          <div className="bg-card/95 backdrop-blur-md border border-border/50 rounded-2xl shadow-xl shadow-black/5 overflow-hidden max-w-md mx-auto">
            {/* Progress Bar - Top Edge */}
            <div className="relative w-full h-1 bg-muted">
              <div 
                className="absolute left-0 top-0 h-full bg-primary transition-all duration-300 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center p-3 gap-3">
              {/* Cover Thumbnail */}
              <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                <img 
                  src={currentBook.coverUrl} 
                  alt={currentBook.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold truncate leading-tight">{currentBook.title}</h4>
                <p className="text-xs text-muted-foreground truncate">{currentBook.author}</p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => seek(Math.max(0, progress - 5))}
                >
                  <SkipBack className="w-4 h-4" />
                </Button>

                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                  size="icon"
                  className="h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </Button>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => seek(Math.min(100, progress + 5))}
                >
                  <SkipForward className="w-4 h-4" />
                </Button>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={closePlayer}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
