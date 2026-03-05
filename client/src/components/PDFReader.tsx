import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, X, Loader2, AlertCircle } from "lucide-react";
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Setup PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFReaderProps {
  pdfUrl: string;
  bookTitle: string;
  onClose?: () => void;
}

export function PDFReader({ pdfUrl, bookTitle, onClose }: PDFReaderProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.5);
  const [loading, setLoading] = useState(true);
  const [renderingPage, setRenderingPage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-adjust scale for mobile
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    console.log('[PDFReader] Initial setup, isMobile:', isMobile, 'window.innerWidth:', window.innerWidth);
    if (isMobile) {
      setScale(1.2);
    }
  }, []);

  // Track page and scale changes
  useEffect(() => {
    console.log('[PDFReader] State changed:', { pageNumber, scale, renderingPage, numPages });
    
    // Safety timeout: clear renderingPage after 5s if onRenderSuccess never fires
    if (renderingPage) {
      const timeout = setTimeout(() => {
        console.warn('[PDFReader] Render timeout - forcing renderingPage=false');
        setRenderingPage(false);
      }, 5000);
      renderTimeoutRef.current = timeout;
      
      return () => {
        if (renderTimeoutRef.current) {
          clearTimeout(renderTimeoutRef.current);
        }
      };
    }
  }, [pageNumber, scale, renderingPage, numPages]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    console.log('[PDFReader] Document loaded successfully, numPages:', numPages);
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }

  function onDocumentLoadError(error: Error) {
    console.error('[PDFReader] Error loading PDF:', error);
    setError(error.message);
    setLoading(false);
  }

  function onPageRenderSuccess() {
    console.log('[PDFReader] Page rendered successfully, page:', pageNumber, 'scale:', scale);
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
      renderTimeoutRef.current = null;
    }
    setRenderingPage(false);
  }

  const changePage = (offset: number) => {
    const newPage = Math.min(Math.max(pageNumber + offset, 1), numPages);
    console.log('[PDFReader] changePage called:', { 
      offset, 
      currentPage: pageNumber, 
      newPage, 
      renderingPage,
      willChange: newPage !== pageNumber 
    });
    
    // Prevent page change while already rendering to avoid PDF.js worker crash
    if (renderingPage) {
      console.warn('[PDFReader] Ignoring page change - already rendering');
      return;
    }
    
    if (newPage !== pageNumber) {
      console.log('[PDFReader] Setting renderingPage=true, changing to page:', newPage);
      setRenderingPage(true);
      setPageNumber(newPage);
    }
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  const zoomIn = () => {
    if (renderingPage) {
      console.warn('[PDFReader] Ignoring zoom - already rendering');
      return;
    }
    const newScale = Math.min(scale + 0.2, 3);
    console.log('[PDFReader] Zoom in:', { currentScale: scale, newScale, renderingPage });
    setRenderingPage(true);
    setScale(newScale);
  };
  
  const zoomOut = () => {
    if (renderingPage) {
      console.warn('[PDFReader] Ignoring zoom - already rendering');
      return;
    }
    const newScale = Math.max(scale - 0.2, 0.5);
    console.log('[PDFReader] Zoom out:', { currentScale: scale, newScale, renderingPage });
    setRenderingPage(true);
    setScale(newScale);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Fallback to Google Docs Viewer if react-pdf fails
  if (useFallback) {
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
        <iframe
          src={`https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`}
          className="w-full h-full border-0"
          title={bookTitle}
        />
      </div>
    );
  }

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
            <p className="text-xs text-muted-foreground">
              {renderingPage ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Memuat...
                </span>
              ) : numPages > 0 ? (
                `Halaman ${pageNumber} dari ${numPages}`
              ) : (
                'Memuat...'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="hidden md:flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={zoomOut}
              disabled={scale <= 0.5}
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
              onClick={zoomIn}
              disabled={scale >= 3}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(pdfUrl, '_blank')}
            className="text-xs hidden md:flex"
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
      <div className="flex-1 relative overflow-auto bg-muted/20" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="flex flex-col items-center py-4 min-h-full">
          {loading && !error && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">Memuat PDF...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-96 px-4">
              <div className="text-center space-y-4 max-w-md">
                <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
                <div className="space-y-2">
                  <p className="font-semibold">Gagal Memuat PDF</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button onClick={() => window.open(pdfUrl, '_blank')}>
                    Buka di Tab Baru
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setUseFallback(true);
                      setError(null);
                      setLoading(true);
                    }}
                  >
                    Coba Viewer Alternatif
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!error && (
            <Document
              file={{
                url: pdfUrl,
                httpHeaders: {
                  'Accept': 'application/pdf',
                },
                withCredentials: false,
              }}
              options={{
                cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
                cMapPacked: true,
                standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
                disableAutoFetch: false,
                disableStream: false,
                enableXfa: true,
              }}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={null}
              error={null}
              className="max-w-full"
            >
              <div className="relative min-h-[500px] flex items-center justify-center">
                {renderingPage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/20 backdrop-blur-[2px] z-10 rounded-lg">
                    <div className="flex flex-col items-center gap-2 bg-background/90 px-4 py-3 rounded-lg shadow-lg">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">
                        Memuat halaman {pageNumber}... 
                        <span className="text-xs block mt-1">(Check console untuk debug info)</span>
                      </span>
                    </div>
                  </div>
                )}
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  width={window.innerWidth < 768 ? window.innerWidth - 32 : undefined}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  onRenderSuccess={onPageRenderSuccess}
                  onRenderError={(error) => {
                    console.error('[PDFReader] Page render error:', error);
                    setRenderingPage(false);
                  }}
                  loading={
                    <div className="flex items-center justify-center h-96 w-full">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Memuat PDF...</span>
                      </div>
                    </div>
                  }
                  className="shadow-lg transition-opacity duration-200"
                  style={{ opacity: renderingPage ? 0.3 : 1 }}
                />
              </div>
            </Document>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      {!error && numPages > 0 && (
        <div className="border-t bg-background/95 backdrop-blur-sm px-4 py-3">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={previousPage}
              disabled={pageNumber <= 1}
              className="rounded-full"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Sebelumnya</span>
            </Button>

            {/* Page Input for Desktop */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Halaman
              </span>
              <input
                type="number"
                min={1}
                max={numPages}
                value={pageNumber}
                onChange={(e) => {
                  if (renderingPage) {
                    console.warn('[PDFReader] Ignoring page input - already rendering');
                    return;
                  }
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= numPages && page !== pageNumber) {
                    console.log('[PDFReader] Page input changed to:', page);
                    setRenderingPage(true);
                    setPageNumber(page);
                  }
                }}
                className="w-16 px-2 py-1 text-center text-sm border rounded-md bg-background"
              />
              <span className="text-sm text-muted-foreground">
                / {numPages}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={pageNumber >= numPages}
              className="rounded-full"
            >
              <span className="hidden sm:inline">Selanjutnya</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
