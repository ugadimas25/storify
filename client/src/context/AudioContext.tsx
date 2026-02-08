import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Book } from '@shared/schema';
import { useAuth } from '../hooks/use-auth';
import { getVisitorId } from '../hooks/use-subscription';
import { apiUrl } from '../lib/api-config';

interface AudioContextType {
  currentBook: Book | null;
  isPlaying: boolean;
  progress: number; // 0 to 100
  currentTime: number; // in seconds
  duration: number; // in seconds
  listeningError: string | null;
  playBook: (book: Book, startTime?: number) => Promise<boolean>;
  togglePlay: () => void;
  seek: (value: number) => void;
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
  closePlayer: () => void;
  clearListeningError: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

// Debounce function for saving progress
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [listeningError, setListeningError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const saveProgressRef = useRef<((bookId: number, progress: number, currentTime: number) => void) | null>(null);

  const clearListeningError = useCallback(() => {
    setListeningError(null);
  }, []);

  // Save progress to server (debounced)
  const saveProgress = useCallback(
    debounce(async (bookId: number, prog: number, time: number) => {
      if (!user) return;
      try {
        await fetch(apiUrl(`/api/playback/${bookId}`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ progress: prog, currentTime: time }),
        });
      } catch (error) {
        console.error('Failed to save playback progress:', error);
      }
    }, 5000), // Save every 5 seconds at most
    [user]
  );

  // Update ref when saveProgress changes
  useEffect(() => {
    saveProgressRef.current = saveProgress;
  }, [saveProgress]);

  useEffect(() => {
    // Create audio element once
    audioRef.current = new Audio();
    
    const audio = audioRef.current;
    
    const updateProgress = () => {
      if (audio.duration) {
        const prog = (audio.currentTime / audio.duration) * 100;
        setProgress(prog);
        setCurrentTime(audio.currentTime);
      }
    };

    const updateDuration = () => {
      setDuration(audio.duration || 0);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(100);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, []);

  // Save progress when time updates (using ref to get latest function)
  useEffect(() => {
    if (currentBook && user && progress > 0 && progress < 100) {
      saveProgressRef.current?.(currentBook.id, progress, currentTime);
    }
  }, [currentTime, currentBook?.id, user, progress]);

  // Save progress when player closes or book changes
  useEffect(() => {
    return () => {
      if (currentBook && user && progress > 0) {
        // Save immediately on unmount
        fetch(apiUrl(`/api/playback/${currentBook.id}`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ progress, currentTime }),
        }).catch(console.error);
      }
    };
  }, [currentBook?.id]);

  const playBook = async (book: Book, startTime?: number): Promise<boolean> => {
    // If same book is playing, just toggle
    if (currentBook?.id === book.id && startTime === undefined) {
      togglePlay();
      return true;
    }

    // Check listening limits before playing
    try {
      const visitorId = getVisitorId();
      const res = await fetch(apiUrl('/api/listening/record'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bookId: book.id,
          visitorId: user ? undefined : visitorId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Set error message to display in UI
        setListeningError(data.message || 'Anda telah mencapai batas mendengarkan');
        return false;
      }
    } catch (error) {
      console.error('Failed to check/record listening:', error);
      // Allow playback on network error (graceful degradation)
    }

    // Clear any previous error
    setListeningError(null);

    if (audioRef.current) {
      setCurrentBook(book);
      // Using a sample MP3 for MVP demonstration purposes if audioUrl is a placeholder
      const demoAudio = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"; 
      audioRef.current.src = book.audioUrl?.startsWith('http') ? book.audioUrl : demoAudio;
      
      // Wait for metadata to load before seeking
      audioRef.current.addEventListener('loadedmetadata', async () => {
        if (audioRef.current) {
          // If startTime provided, use it; otherwise fetch from server
          if (startTime !== undefined) {
            audioRef.current.currentTime = startTime;
          } else if (user) {
            try {
              const res = await fetch(apiUrl(`/api/playback/${book.id}`), { credentials: 'include' });
              const data = await res.json();
              if (data.currentTime > 0 && audioRef.current) {
                audioRef.current.currentTime = data.currentTime;
              }
            } catch (error) {
              console.error('Failed to fetch playback progress:', error);
            }
          }
        }
      }, { once: true });
      
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
      return true;
    }
    return false;
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seek = (value: number) => {
    if (audioRef.current && audioRef.current.duration) {
      const time = (value / 100) * audioRef.current.duration;
      audioRef.current.currentTime = time;
      setProgress(value);
      setCurrentTime(time);
    }
  };

  const skipForward = (seconds: number = 15) => {
    if (audioRef.current) {
      const newTime = Math.min(audioRef.current.currentTime + seconds, audioRef.current.duration || 0);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      if (audioRef.current.duration) {
        setProgress((newTime / audioRef.current.duration) * 100);
      }
    }
  };

  const skipBackward = (seconds: number = 15) => {
    if (audioRef.current) {
      const newTime = Math.max(audioRef.current.currentTime - seconds, 0);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      if (audioRef.current.duration) {
        setProgress((newTime / audioRef.current.duration) * 100);
      }
    }
  };

  const closePlayer = () => {
    // Save progress before closing
    if (currentBook && user && progress > 0) {
      fetch(apiUrl(`/api/playback/${currentBook.id}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ progress, currentTime }),
      }).catch(console.error);
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentBook(null);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  };

  return (
    <AudioContext.Provider value={{ 
      currentBook, 
      isPlaying, 
      progress, 
      currentTime, 
      duration,
      listeningError,
      playBook, 
      togglePlay, 
      seek, 
      skipForward,
      skipBackward,
      closePlayer,
      clearListeningError,
    }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
