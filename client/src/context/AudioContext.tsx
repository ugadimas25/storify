import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Book } from '@shared/schema';

interface AudioContextType {
  currentBook: Book | null;
  isPlaying: boolean;
  progress: number; // 0 to 100
  playBook: (book: Book) => void;
  togglePlay: () => void;
  seek: (value: number) => void;
  closePlayer: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element once
    audioRef.current = new Audio();
    
    const audio = audioRef.current;
    
    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, []);

  const playBook = (book: Book) => {
    if (currentBook?.id === book.id) {
      togglePlay();
      return;
    }

    if (audioRef.current) {
      setCurrentBook(book);
      // Using a sample MP3 for MVP demonstration purposes if audioUrl is a placeholder
      // In a real app, use book.audioUrl directly
      const demoAudio = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"; 
      audioRef.current.src = book.audioUrl.startsWith('http') ? book.audioUrl : demoAudio;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
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
    }
  };

  const closePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentBook(null);
  };

  return (
    <AudioContext.Provider value={{ currentBook, isPlaying, progress, playBook, togglePlay, seek, closePlayer }}>
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
