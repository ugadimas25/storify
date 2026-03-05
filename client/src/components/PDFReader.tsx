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
  const [useNativeViewer, setUseNativeViewer] = useState(true);

  const directPdfUrl = `${pdfUrl}#view=FitH&scrollbar=1`;
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
  
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
            className="hidden md:flex"
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
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Skeleton className="w-[300px] h-[400px] mx-auto rounded-lg" />
              <p className="text-sm text-muted-foreground">Memuat PDF...</p>
            </div>
          </div>
        )}
        
        {/* Use object tag for native PDF rendering - better scroll support */}
        {useNativeViewer ? (
          <object
            data={directPdfUrl}
            type="application/pdf"
            className={cn(
              "w-full h-full",
              loading && "hidden"
            )}
            onLoad={() => setLoading(false)}
            title={bookTitle}
          >
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center space-y-4 max-w-md">
                <p className="text-muted-foreground">
                  Browser Anda tidak mendukung PDF viewer bawaan.
                </p>
                <div className="space-x-2">
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
        ) : (
          <iframe
            src={googleViewerUrl}
            className={cn(
              "w-full h-full border-0",
              loading && "hidden"
            )}
            onLoad={() => setLoading(false)}
            title={bookTitle}
            allow="fullscreen"
          />
        )}

        {/* Switch viewer option */}
        {!loading && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setUseNativeViewer(!useNativeViewer);
                setLoading(true);
              }}
              className="shadow-lg"
            >
              {useNativeViewer ? 'Gunakan Google Viewer' : 'Gunakan Native Viewer'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
