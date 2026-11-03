import { useEffect, useRef, useCallback } from 'react';

export interface UseBarcodeScannerProps {
  onScan: (barcode: string) => void;
  // Threshold in milliseconds between keypresses. 
  // Barcode scanners usually fire keypresses very fast (e.g., < 20ms).
  // Human typing is typically > 50ms per key.
  typingThreshold?: number; 
  // Minimum length of a valid barcode
  minLength?: number;
}

export function useBarcodeScanner({
  onScan,
  typingThreshold = 40,
  minLength = 3
}: UseBarcodeScannerProps) {
  const buffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore key combinations (Ctrl, Alt, Meta)
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    
    const now = performance.now();
    const timeSinceLastKey = now - lastKeyTime.current;
    
    // If time since last key is greater than our threshold, it's likely human typing.
    if (timeSinceLastKey > typingThreshold) {
      buffer.current = '';
    }

    if (e.key === 'Enter') {
      if (buffer.current.length >= minLength) {
        // It's a rapid succession of keys ending in Enter -> Valid Barcode Scan!
        
        // Prevent default action for Enter to avoid submitting forms accidentally
        e.preventDefault(); 
        e.stopPropagation();
        
        const scannedCode = buffer.current.trim();
        buffer.current = ''; // Reset buffer immediately
        
        // Execute the callback
        onScan(scannedCode);
      } else {
        // Not a barcode (maybe just pressing Enter normally)
        buffer.current = '';
      }
    } else if (e.key.length === 1) {
      // Only append printable characters (length 1)
      buffer.current += e.key;
    }

    lastKeyTime.current = now;
  }, [onScan, typingThreshold, minLength]);

  useEffect(() => {
    // We use capture phase so we intercept before active elements (like inputs) process it
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [handleKeyDown]);
}
