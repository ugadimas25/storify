import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, List, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioChapter {
  chapterNumber: number;
  title: string;
  url: string;
  size: number;
}

interface ChapterAudioPlayerProps {
  bookId: number;
  bookTitle: string;
  onClose?: () => void;
}

export function ChapterAudioPlayer({ bookId, bookTitle, onClose }: ChapterAudioPlayerProps) {
  const [chapters, setChapters] = useState<AudioChapter[]>([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch audio chapters
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/books/${bookId}/audio-chapters`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch audio chapters');
        }
        
        const data = await response.json();
        setChapters(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching chapters:', err);
        setError('Gagal memuat daftar bab audio');
      } finally {
        setLoading(false);
      }
    };

    fetchChapters();
  }, [bookId]);

  // Load audio when chapter changes
  useEffect(() => {
    if (chapters.length > 0 && audioRef.current) {
      const audio = audioRef.current;
      audio.src = chapters[currentChapterIndex].url;
      audio.load();
      
      if (isPlaying) {
        audio.play();
      }
    }
  }, [currentChapterIndex, chapters]);

  // Update time
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      // Auto-play next chapter
      if (currentChapterIndex < chapters.length - 1) {
        setCurrentChapterIndex(prev => prev + 1);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentChapterIndex, chapters.length]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skipToChapter = (index: number) => {
    setCurrentChapterIndex(index);
    setShowChapterList(false);
  };

  const previousChapter = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(prev => prev - 1);
    }
  };

  const nextChapter = () => {
    if (currentChapterIndex < chapters.length - 1) {
      setCurrentChapterIndex(prev => prev + 1);
    }
  };

  const seek = (time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (value: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = value;
      setVolume(value);
      setIsMuted(value === 0);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      if (isMuted) {
        audio.volume = volume || 0.5;
        setIsMuted(false);
      } else {
        audio.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Memuat audio...</p>
        </div>
      </div>
    );
  }

  if (error || chapters.length === 0) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          )}
          <h2 className="font-semibold flex-1 ml-2">{bookTitle}</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md">
            <p className="font-semibold">
              {error || 'Audio belum tersedia untuk buku ini'}
            </p>
            <Button onClick={onClose}>Kembali</Button>
          </div>
        </div>
      </div>
    );
  }

  const currentChapter = chapters[currentChapterIndex];

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="shrink-0"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm md:text-base line-clamp-1">{bookTitle}</h2>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {currentChapter.title}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowChapterList(!showChapterList)}
          className="shrink-0"
        >
          <List className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Daftar Bab</span>
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Player Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
          <div className="w-full max-w-2xl space-y-8">
            {/* Chapter Info */}
            <div className="text-center space-y-2">
              <div className="text-sm text-muted-foreground font-medium">
                Bab {currentChapter.chapterNumber + 1} dari {chapters.length}
              </div>
              <h3 className="text-2xl font-bold">{currentChapter.title}</h3>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={(e) => seek(Number(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={previousChapter}
                disabled={currentChapterIndex === 0}
                className="h-12 w-12"
              >
                <SkipBack className="w-5 h-5" />
              </Button>

              <Button
                size="icon"
                onClick={togglePlay}
                className="h-16 w-16 rounded-full"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-1" />
                )}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={nextChapter}
                disabled={currentChapterIndex === chapters.length - 1}
                className="h-12 w-12"
              >
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-4 justify-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="shrink-0"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </Button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-32 h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Chapter List Sidebar */}
        {showChapterList && (
          <div className="w-full md:w-80 border-l bg-background overflow-y-auto">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Daftar Bab ({chapters.length})</h3>
            </div>
            <div className="divide-y">
              {chapters.map((chapter, index) => (
                <button
                  key={index}
                  onClick={() => skipToChapter(index)}
                  className={cn(
                    "w-full text-left p-4 hover:bg-secondary/50 transition-colors",
                    index === currentChapterIndex && "bg-primary/10 border-l-4 border-primary"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {chapter.chapterNumber + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-2">{chapter.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(chapter.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} preload="metadata" />

      {/* Custom Slider Styles */}
      <style>{`
        input[type="range"].slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
        }
        
        input[type="range"].slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
