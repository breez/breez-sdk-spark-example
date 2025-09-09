import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { 
  DialogHeader, 
  BottomSheetContainer,
  BottomSheetCard,
  PrimaryButton,
  FormError
} from './ui';

interface QrScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

const QrScannerDialog: React.FC<QrScannerDialogProps> = ({ isOpen, onClose, onScan }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Wait for the transition to complete (300ms) plus a buffer
      const timer = setTimeout(() => {
        console.log('Checking video element after transition:', videoRef.current);
        if (videoRef.current) {
          startScanning();
        } else {
          console.error('Video element still null after transition');
          setError('Video element not available');
        }
      }, 400); // 300ms transition + 100ms buffer

      return () => {
        clearTimeout(timer);
        stopScanning();
      };
    } else {
      stopScanning();
    }
  }, [isOpen]);

  const startScanning = async () => {
    try {
      setError(null);
      setIsInitializing(true);
      setIsScanning(false);

      if (!videoRef.current) {
        setError('Video element not available');
        setIsInitializing(false);
        return;
      }

      // Check if camera is available
      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        setError('No camera found on this device');
        setIsInitializing(false);
        return;
      }

      // Try to get available cameras
      const cameras = await QrScanner.listCameras(true);
      console.log('Available cameras:', cameras);
      
      // Select camera - prefer back camera on mobile, any camera on desktop
      let selectedCamera = 'environment';
      if (cameras.length > 0) {
        const backCamera = cameras.find(camera => 
          camera.label.toLowerCase().includes('back') || 
          camera.label.toLowerCase().includes('rear')
        );
        selectedCamera = backCamera ? backCamera.id : cameras[0].id;
      }

      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('QR Code detected:', result.data);
          onScan(result.data);
          stopScanning();
          onClose();
        },
        {
          onDecodeError: (error) => {
            // Ignore decode errors - they happen frequently while scanning
            console.debug('QR decode error:', error);
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: selectedCamera,
          maxScansPerSecond: 5, // Limit scan frequency
        }
      );

      // Add event listener for video loading
      videoRef.current.addEventListener('loadedmetadata', () => {
        console.log('Video metadata loaded');
      });

      videoRef.current.addEventListener('canplay', () => {
        console.log('Video can play');
      });

      await qrScannerRef.current.start();
      console.log('QR Scanner started successfully');
      setIsInitializing(false);
      setIsScanning(true);
    } catch (err) {
      console.error('Failed to start QR scanner:', err);
      let errorMessage = 'Camera access denied or not available';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please allow camera access and try again.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Camera is already in use by another application';
        } else if (err.name === 'OverconstrainedError') {
          errorMessage = 'Camera constraints not supported';
        }
      }
      
      setError(errorMessage);
      setIsInitializing(false);
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanning();
    setError(null);
    onClose();
  };

  return (
    <BottomSheetContainer isOpen={isOpen} onClose={handleClose}>
      <BottomSheetCard className="bottom-sheet-card">
        <DialogHeader title="Scan QR Code" onClose={handleClose} />
        
        <div className="p-6 space-y-4">
          <div className="text-center mb-4">
            <p className="text-sm text-[rgb(var(--text-white))] opacity-70">
              Point your camera at a QR code to scan
            </p>
          </div>

          <div className="relative">
            <video
              ref={videoRef}
              className="w-full h-64 bg-black rounded-lg object-cover"
              playsInline
              muted
            />
            
            {isInitializing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                <div className="text-center text-white p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-sm">Initializing camera...</p>
                </div>
              </div>
            )}

            {isScanning && !isInitializing && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-[rgb(var(--primary-blue))] rounded-lg opacity-50"></div>
              </div>
            )}

            {!isScanning && !isInitializing && error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                <div className="text-center text-white p-4">
                  <p className="text-sm mb-2">Camera not available</p>
                  <p className="text-xs opacity-70">{error}</p>
                </div>
              </div>
            )}
          </div>

          <FormError error={error} />

          <div className="flex gap-3">
            <PrimaryButton
              onClick={handleClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700"
            >
              Cancel
            </PrimaryButton>
          </div>
        </div>
      </BottomSheetCard>
    </BottomSheetContainer>
  );
};

export default QrScannerDialog;
