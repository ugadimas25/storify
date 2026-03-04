import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PDFReaderProps {
  pdfUrl: string;
  bookTitle: string;
  onClose?: () => void;
}

export function PDFReader({ pdfUrl, bookTitle, onClose }: PDFReaderProps) {
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Start with Google Viewer by default for better compatibility
  const [useGoogleViewer, setUseGoogleViewer] = useState(true);
  const [useDirectPDF, setUseDirectPDF] = useState(false);

  console.log('PDFReader mounted:', { pdfUrl, bookTitle, useDirectPDF });

  // Use Google Docs Viewer by default, with option to try direct PDF
  const viewerUrl = useDirectPDF
    ? `${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`
    : `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
  
  console.log('Viewer URL:', viewerUrl);
  
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
          {/* Zoom Controls - Hidden on mobile, disabled when using Google Viewer */}
          {useDirectPDF && (
            <div className="hidden md:flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setScale(Math.max(0.5, scale - 0.1))}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs font-medium px-2 min-w-[3rem] text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setScale(Math.min(2, scale + 0.1))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Action Buttons */}
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
      <div className="flex-1 overflow-auto bg-muted/20 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {loading && (
            <div className="space-y-4">
              <Skeleton className="w-full aspect-[8.5/11] rounded-lg" />
            </div>
          )}
          
          {/* Using iframe for PDF display with Google Docs Viewer by default */}
          <iframe
            src={viewerUrl}
            className={cn(
              "w-full rounded-lg shadow-2xl bg-white transition-all duration-300",
              loading && "hidden"
            )}
            style={{ 
              height: "calc(100vh - 200px)",
              transform: useDirectPDF ? `scale(${scale})` : 'scale(1)',
              transformOrigin: "top center",
            }}
            onLoad={() => setLoading(false)}
            onError={() => {
              console.log('PDF load error');
              setLoading(false);
            }}
            title={bookTitle}
            allow="fullscreen"
          />

          {/* Option to switch between viewers */}
          {!loading && (
            <div className="text-center mt-4">
              <p className="text-xs text-muted-foreground mb-2">
                {useDirectPDF ? 'Menggunakan Direct PDF' : 'Menggunakan Google Docs Viewer'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setUseDirectPDF(!useDirectPDF);
                  setLoading(true);
                }}
              >
                {useDirectPDF ? 'Gunakan Google Viewer' : 'Coba Direct PDF'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <div className="md:hidden border-t bg-background/95 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Button
            variant="outline"
            size="sm"
            disabled
            className="rounded-full"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Prev
          </Button>

          <span className="text-sm text-muted-foreground">
            Scroll untuk membaca
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled
            className="rounded-full"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
