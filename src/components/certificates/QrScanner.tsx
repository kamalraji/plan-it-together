import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Camera, X, RefreshCw } from 'lucide-react';

interface QrScannerProps {
  onScan: (certificateId: string) => void;
  onClose: () => void;
}

export function QrScanner({ onScan, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;

    const startScanner = async () => {
      try {
        setIsStarting(true);
        setError(null);

        // Get available video devices
        const videoInputDevices = await codeReader.listVideoInputDevices();
        
        if (videoInputDevices.length === 0) {
          setError('No camera found on this device.');
          setIsStarting(false);
          return;
        }

        // Prefer back camera on mobile
        const backCamera = videoInputDevices.find(
          device => device.label.toLowerCase().includes('back') || 
                    device.label.toLowerCase().includes('rear') ||
                    device.label.toLowerCase().includes('environment')
        );
        const selectedDeviceId = backCamera?.deviceId || videoInputDevices[0].deviceId;

        if (!videoRef.current) return;

        // Start continuous decoding
        await codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result, err) => {
            if (result) {
              const scannedText = result.getText();
              // Extract certificate ID - could be full URL or just the ID
              let certificateId = scannedText;
              
              // If it's a URL, extract the ID from it
              if (scannedText.includes('/verify/')) {
                const match = scannedText.match(/\/verify\/([^/?]+)/);
                if (match) {
                  certificateId = match[1];
                }
              } else if (scannedText.includes('id=')) {
                const match = scannedText.match(/id=([^&]+)/);
                if (match) {
                  certificateId = match[1];
                }
              }

              // Stop scanning and callback
              codeReader.reset();
              onScan(certificateId);
            }
            if (err && !(err instanceof NotFoundException)) {
              // NotFoundException is expected when no QR is in view
              console.warn('QR scan error:', err);
            }
          }
        );

        setIsStarting(false);
      } catch (err) {
        console.error('Camera access error:', err);
        if (err instanceof Error) {
          if (err.name === 'NotAllowedError') {
            setError('Camera access was denied. Please allow camera access to scan QR codes.');
          } else if (err.name === 'NotFoundError') {
            setError('No camera found on this device.');
          } else {
            setError(`Camera error: ${err.message}`);
          }
        } else {
          setError('Unable to access camera. Please try manual entry.');
        }
        setIsStarting(false);
      }
    };

    startScanner();

    return () => {
      codeReader.reset();
    };
  }, [onScan]);

  const handleRetry = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    setError(null);
    setIsStarting(true);
    // Re-trigger effect by forcing component update
    window.location.reload();
  };

  return (
    <div className="relative bg-card rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" />
          <h3 className="font-medium text-foreground">Scan QR Code</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-muted rounded-md transition-colors"
          aria-label="Close scanner"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Scanner Area */}
      <div className="relative aspect-square max-h-[400px] bg-black">
        {isStarting && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/90 z-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4" />
            <p className="text-muted-foreground text-sm">Starting camera...</p>
          </div>
        )}

        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <Camera className="w-8 h-8 text-destructive" />
            </div>
            <p className="text-foreground font-medium mb-2">Camera Error</p>
            <p className="text-muted-foreground text-sm mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            {/* Scan overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Semi-transparent overlay */}
              <div className="absolute inset-0 bg-black/40" />
              {/* Clear scanning area */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56">
                <div className="absolute inset-0 bg-transparent" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)' }} />
                {/* Corner brackets */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                {/* Scanning line animation */}
                <div className="absolute left-2 right-2 h-0.5 bg-primary/80 animate-pulse top-1/2" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground text-center">
          Position the QR code within the frame to scan
        </p>
      </div>
    </div>
  );
}
