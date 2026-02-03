import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AttendanceRecord } from '../../types';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import type { Result } from '@zxing/library';

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
    userId: string;
    name: string;
    email?: string;
    organization?: string | null;
    registrationId: string;
    qrCode: string;
  };
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  eventId,
  sessionId,
  onScanSuccess,
  onScanError,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera');
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const queryClient = useQueryClient();

  const checkInMutation = useMutation<any, Error, string>({
    mutationFn: async (qrCode: string) => {
      const { data, error } = await supabase.functions.invoke('attendance-checkin', {
        body: { qrCode, eventId, sessionId },
      });
      if (error || !data?.success) {
        throw error || new Error(data?.error || 'Check-in failed');
      }
      return data.data as any;
    },
    onSuccess: (result: any, qrCodeUsed: string) => {
      const attendance: AttendanceRecord = {
        id: result.attendanceRecord.id,
        registrationId: result.attendanceRecord.registration_id,
        sessionId: result.attendanceRecord.session_id,
        checkInTime: result.attendanceRecord.check_in_time,
        checkInMethod: result.attendanceRecord.check_in_method,
        volunteerId: result.attendanceRecord.volunteer_id,
      };

      setLastScanResult(() => ({
        success: true,
        data: attendance,
        participantInfo: {
          qrCode: qrCodeUsed,
          ...(result.participantInfo || {}),
        },
      }));
      // Keep attendance lists fresh for organizers
      queryClient.invalidateQueries({ queryKey: ['attendance-report', eventId, sessionId] });
      if (onScanSuccess) {
        onScanSuccess(attendance);
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

  // Start camera and begin QR scanning
  const startCamera = async () => {
    if (!videoRef.current) return;

    try {
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserQRCodeReader();
      }

      setIsScanning(true);

      const controls = await codeReaderRef.current.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        async (result: Result | undefined, _err: Error | undefined) => {
          if (result) {
            const qrText = result.getText();

            try {
              await checkInMutation.mutateAsync(qrText.trim());
            } catch (error: any) {
              const errorMessage = error.response?.data?.error?.message || 'Invalid QR code';
              setLastScanResult({
                success: false,
                error: errorMessage,
              });
            } finally {
              // Stop scanning after a successful decode to avoid duplicates
              if (controlsRef.current) {
                controlsRef.current.stop();
                controlsRef.current = null;
              }
              setIsScanning(false);
            }
          }
        },
      );

      controlsRef.current = controls;
    } catch (error) {
      console.error('Error accessing camera or decoding QR:', error);
      setIsScanning(false);
      setScanMode('manual');
    }
  };

  // Stop camera and QR scanning
  const stopCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    setIsScanning(false);
  };

  // Handle manual QR code input
  const handleManualScan = async () => {
    if (!manualCode.trim()) return;

    try {
      await checkInMutation.mutateAsync(manualCode.trim());
      setManualCode('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Invalid QR code';
      setLastScanResult({
        success: false,
        error: errorMessage,
      });
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

  const handlePrintBadge = async () => {
    if (!lastScanResult?.success || !lastScanResult.participantInfo) return;

    const { userId, name, email, organization, registrationId, qrCode } = lastScanResult.participantInfo;

    let roleLabel = 'Participant';
    let trackLabel: string | undefined;

    try {
      if (userId) {
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);

        if (rolesData && rolesData.length > 0) {
          roleLabel = rolesData.map((r: any) => r.role).join(', ');
        }
      }

      if (registrationId) {
        const { data: registrationData } = await supabase
          .from('registrations')
          .select('form_responses')
          .eq('id', registrationId)
          .maybeSingle();

        const formResponses = (registrationData as any)?.form_responses || {};
        trackLabel =
          formResponses.track ||
          formResponses.Track ||
          formResponses.track_name ||
          formResponses.TrackName ||
          undefined;
      }
    } catch (error) {
      console.error('Error loading badge metadata:', error);
    }

    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
      qrCode,
    )}&size=256x256`;

    const printWindow = window.open('', '_blank', 'width=600,height=400');
    if (!printWindow) return;

    const doc = printWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charSet="utf-8" />
    <title>Event Badge</title>
    <style>
      body { margin: 0; padding: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      .badge-wrapper { width: 320px; height: 200px; padding: 16px; box-sizing: border-box; display: flex; flex-direction: row; border: 2px solid #111827; border-radius: 12px; margin: 24px auto; }
      .badge-main { flex: 1; display: flex; flex-direction: column; justify-content: space-between; margin-right: 12px; }
      .badge-name { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 4px; }
      .badge-email { font-size: 11px; color: #4B5563; margin-bottom: 4px; }
      .badge-org { font-size: 12px; color: #1F2933; margin-bottom: 8px; }
      .badge-label-row { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }
      .badge-label { padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 600; border: 1px solid #D1D5DB; color: #111827; }
      .badge-label-role { background-color: #EEF2FF; border-color: #C7D2FE; color: #3730A3; }
      .badge-label-track { background-color: #ECFEFF; border-color: #A5F3FC; color: #0369A1; }
      .badge-footer { font-size: 10px; color: #6B7280; }
      .badge-qr { width: 96px; height: 96px; border-radius: 8px; border: 1px solid #E5E7EB; padding: 4px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; }
      .badge-qr img { max-width: 100%; max-height: 100%; }
    </style>
  </head>
  <body>
    <div class="badge-wrapper">
      <div class="badge-main">
        <div>
          <div class="badge-name">${name || ''}</div>
          ${email ? `<div class="badge-email">${email}</div>` : ''}
          ${organization ? `<div class="badge-org">${organization}</div>` : ''}
          <div class="badge-label-row">
            <div class="badge-label badge-label-role">${roleLabel}</div>
            ${trackLabel ? `<div class="badge-label badge-label-track">${trackLabel}</div>` : ''}
          </div>
        </div>
        <div class="badge-footer">QR: ${qrCode}</div>
      </div>
      <div class="badge-qr">
        <img src="${qrImageUrl}" alt="QR Code" />
      </div>
    </div>
    <script>window.print();</script>
  </body>
</html>`);
    doc.close();
  };

  return (
    <div className="bg-card rounded-lg shadow-md p-6 border border-border">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground mb-2">QR Code Check-in</h3>
        <p className="text-muted-foreground">
          Scan participant QR codes or enter codes manually for event check-in
        </p>
      </div>

      {/* Scan Mode Toggle */}
      <div className="flex mb-6">
        <div className="flex bg-muted rounded-lg p-1">
          <button
            onClick={() => setScanMode('camera')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              scanMode === 'camera'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Camera Scan
          </button>
          <button
            onClick={() => setScanMode('manual')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              scanMode === 'manual'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
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
                onClick={startCamera}
                disabled={isScanning}
                className="bg-card text-foreground px-6 py-2 rounded-full font-medium hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
              >
                {isScanning ? 'Scanning…' : 'Start Scanner'}
              </button>
            </div>
          </div>

          {!isScanning && (
            <div className="mt-4 text-center">
              <p className="text-muted-foreground mb-2">Camera not available</p>
              <button
                onClick={startCamera}
                className="text-primary hover:text-primary/80 font-medium"
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
          <label htmlFor="manualCode" className="block text-sm font-medium text-foreground mb-2">
            Enter QR Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="manualCode"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Paste or type QR code here..."
              className="flex-1 px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleManualScan();
                }
              }}
            />
            <button
              onClick={handleManualScan}
              disabled={!manualCode.trim() || checkInMutation.isPending}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="mt-2 text-sm text-green-700 space-y-1">
                  <p><strong>Name:</strong> {lastScanResult.participantInfo.name}</p>
                  {lastScanResult.participantInfo.email && (
                    <p><strong>Email:</strong> {lastScanResult.participantInfo.email}</p>
                  )}
                  {lastScanResult.participantInfo.organization && (
                    <p><strong>Organization:</strong> {lastScanResult.participantInfo.organization}</p>
                  )}
                  <button
                    type="button"
                    onClick={handlePrintBadge}
                    className="mt-2 inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-gray-900 text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
                  >
                    Print Badge
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading States */}
      {checkInMutation.isPending && (
        <div className="mb-6 flex items-center justify-center p-4 bg-blue-50 rounded-lg">
          <svg className="animate-spin h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-blue-800">
            Processing check-in...
          </span>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-muted rounded-lg p-4">
        <h4 className="font-medium text-foreground mb-2">Instructions</h4>
        <div className="text-sm text-muted-foreground space-y-1">
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