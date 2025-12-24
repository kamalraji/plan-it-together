import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../lib/api';
import { CheckInData, AttendanceRecord } from '../../types';

interface QRCodeScannerProps {
  eventId: string;
  sessionId?: string;
  onScanSuccess?: (result: AttendanceRecord) => void;
  onScanError?: (error: string) => void;
}

interface ScanResult {
  success: boolean;
  data?: AttendanceRecord;
  error?: string;
  participantInfo?: {
    name: string;
    email: string;
    registrationId: string;
  };
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  eventId: _eventId,
  sessionId,
  onScanSuccess,
  onScanError,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Validate QR code mutation
  const validateQRMutation = useMutation({
    mutationFn: async (qrCode: string) => {
      const response = await api.post('/attendance/validate-qr', { qrCode });
      return response.data.data;
    },
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async (data: CheckInData) => {
      const response = await api.post('/attendance/check-in', {
        qrCode: data.qrCode,
        sessionId: data.sessionId,
      });
      return response.data.data;
    },
    onSuccess: (result: AttendanceRecord) => {
      setLastScanResult({
        success: true,
        data: result,
      });
      if (onScanSuccess) {
        onScanSuccess(result);
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error?.message || 'Check-in failed';
      setLastScanResult({
        success: false,
        error: errorMessage,
      });
      if (onScanError) {
        onScanError(errorMessage);
      }
    },
  });

  // Start camera for QR scanning
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera if available
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setScanMode('manual');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // Handle manual QR code input
  const handleManualScan = async () => {
    if (!manualCode.trim()) return;

    try {
      // First validate the QR code
      const validation = await validateQRMutation.mutateAsync(manualCode.trim());
      
      if (validation.valid) {
        // If valid, proceed with check-in
        await checkInMutation.mutateAsync({
          qrCode: manualCode.trim(),
          sessionId,
        });
        setManualCode('');
      } else {
        setLastScanResult({
          success: false,
          error: 'Invalid QR code',
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Invalid QR code';
      setLastScanResult({
        success: false,
        error: errorMessage,
      });
    }
  };

  // Simulate QR code detection (in a real app, you'd use a QR code library like qr-scanner)
  const handleCameraCapture = () => {
    // This is a placeholder for actual QR code scanning
    // In a real implementation, you would use a library like qr-scanner or zxing-js
    const mockQRCode = prompt('Enter QR code (for demo purposes):');
    if (mockQRCode) {
      handleManualScan();
      setManualCode(mockQRCode);
    }
  };

  useEffect(() => {
    if (scanMode === 'camera') {
      startCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [scanMode]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">QR Code Check-in</h3>
        <p className="text-gray-600">
          Scan participant QR codes or enter codes manually for event check-in
        </p>
      </div>

      {/* Scan Mode Toggle */}
      <div className="flex mb-6">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setScanMode('camera')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              scanMode === 'camera'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Camera Scan
          </button>
          <button
            onClick={() => setScanMode('manual')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              scanMode === 'manual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Manual Entry
          </button>
        </div>
      </div>

      {/* Camera Scanner */}
      {scanMode === 'camera' && (
        <div className="mb-6">
          <div className="relative bg-gray-900 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-64 object-cover"
            />
            
            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  Position QR code here
                </span>
              </div>
            </div>

            {/* Capture button */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <button
                onClick={handleCameraCapture}
                disabled={!isScanning}
                className="bg-white text-gray-900 px-6 py-2 rounded-full font-medium hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50"
              >
                Scan QR Code
              </button>
            </div>
          </div>

          {!isScanning && (
            <div className="mt-4 text-center">
              <p className="text-gray-600 mb-2">Camera not available</p>
              <button
                onClick={startCamera}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Manual Entry */}
      {scanMode === 'manual' && (
        <div className="mb-6">
          <label htmlFor="manualCode" className="block text-sm font-medium text-gray-700 mb-2">
            Enter QR Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="manualCode"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Paste or type QR code here..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleManualScan();
                }
              }}
            />
            <button
              onClick={handleManualScan}
              disabled={!manualCode.trim() || checkInMutation.isPending}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkInMutation.isPending ? 'Checking...' : 'Check In'}
            </button>
          </div>
        </div>
      )}

      {/* Scan Result */}
      {lastScanResult && (
        <div className={`mb-6 p-4 rounded-lg ${
          lastScanResult.success 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start">
            {lastScanResult.success ? (
              <svg className="h-6 w-6 text-green-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-6 w-6 text-red-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <div className="flex-1">
              <h4 className={`font-medium ${
                lastScanResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {lastScanResult.success ? 'Check-in Successful!' : 'Check-in Failed'}
              </h4>
              <p className={`text-sm mt-1 ${
                lastScanResult.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {lastScanResult.success 
                  ? `Participant checked in at ${new Date(lastScanResult.data!.checkInTime).toLocaleTimeString()}`
                  : lastScanResult.error
                }
              </p>
              {lastScanResult.participantInfo && (
                <div className="mt-2 text-sm text-green-700">
                  <p><strong>Name:</strong> {lastScanResult.participantInfo.name}</p>
                  <p><strong>Email:</strong> {lastScanResult.participantInfo.email}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading States */}
      {(validateQRMutation.isPending || checkInMutation.isPending) && (
        <div className="mb-6 flex items-center justify-center p-4 bg-blue-50 rounded-lg">
          <svg className="animate-spin h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-blue-800">
            {validateQRMutation.isPending ? 'Validating QR code...' : 'Processing check-in...'}
          </span>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Instructions</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• <strong>Camera Mode:</strong> Point camera at participant's QR code and tap "Scan QR Code"</p>
          <p>• <strong>Manual Mode:</strong> Ask participant to read their QR code aloud or copy/paste it</p>
          <p>• Green confirmation means successful check-in</p>
          <p>• Red error means invalid code or participant already checked in</p>
          <p>• If scanning fails, you can manually check in participants using their registration ID</p>
        </div>
      </div>
    </div>
  );
};