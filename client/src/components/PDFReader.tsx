import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PDFReaderProps {
  pdfUrl: string;
  bookTitle: string;
  onClose?: () => void;
}

export function PDFReader({ pdfUrl, bookTitle, onClose }: PDFReaderProps) {
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Start with Google Viewer for faster initial load (streaming)
  const [useNativeViewer, setUseNativeViewer] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);

  const directPdfUrl = `${pdfUrl}#view=FitH&scrollbar=1`;
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
  
  // Auto-switch to native if Google Viewer takes too long (15 seconds)
  useEffect(() => {
    if (!useNativeViewer && loading) {
      const timer = setTimeout(() => {
        setLoadTimeout(true);
      }, 15000);
      
      return () => clearTimeout(timer);
    }
  }, [useNativeViewer, loading]);
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header Controls */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h2 className="font-semibold text-sm md:text-base line-clamp-1">{bookTitle}</h2>
            <p className="text-xs text-muted-foreground">PDF Reader</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(pdfUrl, '_blank')}
            className="text-xs"
          >
            Buka di Tab Baru
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="rounded-full"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Viewer Container */}
      <div className="flex-1 relative bg-muted/20 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20">
            <div className="text-center space-y-4 max-w-md mx-auto p-6">
              <Skeleton className="w-[200px] h-[280px] mx-auto rounded-lg" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Memuat PDF...</p>
                <p className="text-xs text-muted-foreground">
                  {useNativeViewer 
                    ? 'Mengunduh file PDF untuk tampilan optimal' 
                    : 'Memuat preview dari Google Docs'}
                </p>
                {loadTimeout && !useNativeViewer && (
                  <div className="pt-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setUseNativeViewer(true);
                        setLoading(true);
                        setLoadTimeout(false);
                      }}
                    >
                      Coba Native Viewer
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Use iframe with Google Docs Viewer by default for faster streaming */}
        {!useNativeViewer ? (
          <iframe
            src={googleViewerUrl}
            className={cn(
              "w-full h-full border-0",
              loading && "opacity-0"
            )}
            onLoad={() => setLoading(false)}
            onError={() => {
              console.log('Google Viewer failed, switching to native');
              setUseNativeViewer(true);
              setLoading(true);
            }}
            title={bookTitle}
            allow="fullscreen"
          />
        ) : (
          <object
            data={directPdfUrl}
            type="application/pdf"
            className={cn(
              "w-full h-full",
              loading && "opacity-0"
            )}
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
            title={bookTitle}
          >
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center space-y-4 max-w-md">
                <p className="text-muted-foreground">
                  Browser Anda tidak mendukung PDF viewer bawaan.
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button onClick={() => window.open(pdfUrl, '_blank')}>
                    Buka PDF di Tab Baru
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setUseNativeViewer(false);
                      setLoading(true);
                    }}
                  >
                    Coba Google Viewer
                  </Button>
                </div>
              </div>
            </div>
          </object>
        )}

        {/* Switch viewer option - shown after loaded */}
        {!loading && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-2 border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUseNativeViewer(!useNativeViewer);
                  setLoading(true);
                  setLoadTimeout(false);
                }}
                className="text-xs"
              >
                {useNativeViewer ? '📄 Google Viewer (Lebih Cepat)' : '🔍 Native Viewer (Scroll Lebih Baik)'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
