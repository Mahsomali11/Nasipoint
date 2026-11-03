import { useState, useRef, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScannedRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {
        // Ignore cleanup errors
      }
      scannerRef.current = null;
      setScanning(false);
    }
  }, [scanning]);

  const startScanner = useCallback(async () => {
    try {
      const scannerId = 'barcode-scanner-region';
      const scanner = new Html5Qrcode(scannerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.7778,
          disableFlip: false,
        },
        (decodedText) => {
          // Barcode detected
          const now = Date.now();
          if (
            lastScannedRef.current.code !== decodedText ||
            now - lastScannedRef.current.time > 2000
          ) {
            lastScannedRef.current = { code: decodedText, time: now };
            
            // Try to play a quick beep if available (standard HTML5 audio)
            try {
              const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
              const ctx = new AudioContext();
              const osc = ctx.createOscillator();
              osc.connect(ctx.destination);
              osc.frequency.value = 800;
              osc.start();
              osc.stop(ctx.currentTime + 0.1);
            } catch (e) {
              // Ignore audio errors
            }

            onScan(decodedText);
          }
        },
        () => {
          // QR code not found in frame - ignore
        }
      );
      setScanning(true);
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || err?.message?.includes('NotAllowedError')) {
        setError('Camera access denied. Please allow camera access in your browser settings, or enter the barcode manually.');
      } else if (err?.name === 'NotFoundError' || err?.message?.includes('NotFoundError')) {
        setError('No camera found. Enter the barcode manually below.');
      } else {
        setError('Could not access camera. Enter the barcode manually below.');
      }
    }
  }, [onScan, stopScanner]);

  useEffect(() => {
    // Small delay to ensure DOM element is mounted
    const timer = setTimeout(() => {
      startScanner();
    }, 100);
    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, []);

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
    }
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <h2 className="text-lg font-bold text-foreground capitalize">Scan Barcode</h2>
        <button onClick={handleClose} className="p-2 capitalize">
          <X size={24} className="text-foreground" />
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden" ref={containerRef}>
        <div id="barcode-scanner-region" className="w-full h-full" />

        {error && (
          <div className="absolute inset-x-4 top-4 bg-card/95 backdrop-blur rounded-xl p-4">
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}
      </div>

      {/* Manual Entry */}
      <div className="bg-card border-t border-border p-4 safe-bottom">
        <p className="text-sm text-muted-foreground mb-2">Or enter barcode manually:</p>
        <div className="flex gap-2">
          <input 
            value={manualCode} 
            onChange={e => setManualCode(e.target.value)} 
            placeholder="Enter barcode number..."
            className="flex-1 px-4 py-3 rounded-xl border border-input bg-accent/30 text-foreground placeholder:text-muted-foreground"
            onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
          />
          <button onClick={handleManualSubmit}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium active:scale-[0.98] transition-transform capitalize">
            Search
          </button>
        </div>
      </div>
    </div>
  );
}
