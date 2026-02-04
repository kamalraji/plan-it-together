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

// Parse QR code to extract check-in identifier
// Supports multiple formats:
// 1. Direct user profile ID (UUID)
// 2. "attendee:{attendee_id}" format from ID cards
// 3. "registration:{registration_id}" format
// 4. URL format: https://example.com/checkin/{id}
function parseQRCode(qrText: string): { type: 'user' | 'attendee' | 'registration'; id: string } | null {
  const trimmed = qrText.trim();
  
  // Check for attendee: prefix (from ID cards)
  if (trimmed.startsWith('attendee:')) {
    const id = trimmed.replace('attendee:', '').trim();
    if (id) return { type: 'attendee', id };
  }
  
  // Check for registration: prefix
  if (trimmed.startsWith('registration:')) {
    const id = trimmed.replace('registration:', '').trim();
    if (id) return { type: 'registration', id };
  }
  
  // Check for user: prefix
  if (trimmed.startsWith('user:')) {
    const id = trimmed.replace('user:', '').trim();
    if (id) return { type: 'user', id };
  }
  
  // Check for URL format
  try {
    const url = new URL(trimmed);
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length >= 2) {
      const lastPart = pathParts[pathParts.length - 1];
      const secondLastPart = pathParts[pathParts.length - 2];
      
      if (secondLastPart === 'checkin' || secondLastPart === 'check-in') {
        return { type: 'user', id: lastPart };
      }
      if (secondLastPart === 'attendee') {
        return { type: 'attendee', id: lastPart };
      }
    }
  } catch {
    // Not a URL, continue
  }
  
  // Check if it's a UUID format (assume it's a user ID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(trimmed)) {
    return { type: 'user', id: trimmed };
  }
  
  // Fallback: treat as generic code (will be handled by edge function)
  return { type: 'user', id: trimmed };
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

  // Check-in mutation that handles different QR code formats
  const checkInMutation = useMutation<any, Error, string>({
    mutationFn: async (qrCode: string) => {
      const parsed = parseQRCode(qrCode);
      
      if (!parsed) {
        throw new Error('Invalid QR code format');
      }

      // If it's an attendee ID from an ID card, look up the registration first
      if (parsed.type === 'attendee') {
        // Look up the attendee to get their registration
        const { data: attendee, error: attendeeError } = await supabase
          .from('registration_attendees')
          .select('registration_id, full_name, email')
          .eq('id', parsed.id)
          .maybeSingle();

        if (attendeeError || !attendee) {
          throw new Error('Attendee not found');
        }

        // Get the registration to find the user
        const { data: registration, error: regError } = await supabase
          .from('registrations')
          .select('id, user_id, event_id')
          .eq('id', attendee.registration_id)
          .maybeSingle();

        if (regError || !registration) {
          throw new Error('Registration not found');
        }

        // Verify the registration is for this event
        if (registration.event_id !== eventId) {
          throw new Error('This attendee is not registered for this event');
        }

        // Check if already checked in
        let query = supabase
          .from('attendance_records')
          .select('id')
          .eq('registration_id', registration.id)
          .eq('event_id', eventId);
        
        if (sessionId) {
          query = query.eq('session_id', sessionId);
        } else {
          query = query.is('session_id', null);
        }
        
        const { data: existingRecord } = await query
          .maybeSingle();

        if (existingRecord) {
          throw new Error('Already checked in');
        }

        // Get current user (volunteer) info
        const { data: userData } = await supabase.auth.getUser();

        // Create attendance record directly
        const { data: attendanceRecord, error: insertError } = await supabase
          .from('attendance_records')
          .insert({
            event_id: eventId,
            registration_id: registration.id,
            user_id: registration.user_id,
            session_id: sessionId || null,
            check_in_method: 'id_card_qr',
            volunteer_id: userData.user?.id,
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        return {
          success: true,
          data: {
            attendanceRecord,
            participantInfo: {
              userId: registration.user_id,
              name: attendee.full_name || 'Unknown',
              email: attendee.email,
              registrationId: registration.id,
              qrCode: qrCode,
            }
          }
        };
      }

      // For user/registration types, use the existing edge function
      const { data, error } = await supabase.functions.invoke('attendance-checkin', {
        body: { qrCode: parsed.id, eventId, sessionId },
      });

      if (error || !data?.success) {
        throw error || new Error(data?.error || 'Check-in failed');
      }

      return data.data;
    },
    onSuccess: (result: any, qrCodeUsed: string) => {
      // Handle both direct DB result and edge function result
      const attendanceRecord = result.attendanceRecord || result;
      const participantInfo = result.participantInfo || result.participantInfo;

      const attendance: AttendanceRecord = {
        id: attendanceRecord.id,
        registrationId: attendanceRecord.registration_id,
        sessionId: attendanceRecord.session_id,
        checkInTime: attendanceRecord.check_in_time,
        checkInMethod: attendanceRecord.check_in_method,
        volunteerId: attendanceRecord.volunteer_id,
      };

      setLastScanResult(() => ({
        success: true,
        data: attendance,
        participantInfo: participantInfo ? {
          qrCode: qrCodeUsed,
          userId: participantInfo.userId || '',
          name: participantInfo.name || 'Unknown',
          email: participantInfo.email,
          organization: participantInfo.organization,
          registrationId: participantInfo.registrationId || '',
        } : {
          qrCode: qrCodeUsed,
          userId: '',
          name: 'Check-in successful',
          registrationId: '',
        },
      }));
      
      // Keep attendance lists fresh for organizers
      queryClient.invalidateQueries({ queryKey: ['attendance-report', eventId, sessionId] });
      queryClient.invalidateQueries({ queryKey: ['id-card-attendees', eventId] });
      
      if (onScanSuccess) {
        onScanSuccess(attendance);
      }
    },
    onError: (error: any) => {
      const errorMessage = error.message || error.response?.data?.error?.message || 'Check-in failed';
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
              const errorMessage = error.message || error.response?.data?.error?.message || 'Invalid QR code';
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
    } catch (_error) {
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
      const errorMessage = error.message || error.response?.data?.error?.message || 'Invalid QR code';
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
    } catch (_error) {
      // Loading badge metadata failed silently
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
          Scan attendee QR codes from ID cards or registration confirmations
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
          <div className="relative bg-foreground/90 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-64 object-cover"
            />
            
            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-background border-dashed rounded-lg flex items-center justify-center">
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
            Enter QR Code or Attendee ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="manualCode"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Paste QR code, attendee ID, or registration ID..."
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
          <p className="mt-2 text-xs text-muted-foreground">
            Supports: ID card QR codes (attendee:...), registration IDs, or user profile IDs
          </p>
        </div>
      )}

      {/* Scan Result */}
      {lastScanResult && (
        <div className={`mb-6 p-4 rounded-lg ${
          lastScanResult.success 
            ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800' 
            : 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'
        }`}>
          <div className="flex items-start">
            {lastScanResult.success ? (
              <svg className="h-6 w-6 text-green-600 dark:text-green-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-6 w-6 text-red-600 dark:text-red-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <div className="flex-1">
              <h4 className={`font-medium ${
                lastScanResult.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
              }`}>
                {lastScanResult.success ? 'Check-in Successful!' : 'Check-in Failed'}
              </h4>
              <p className={`text-sm mt-1 ${
                lastScanResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
              }`}>
                {lastScanResult.success 
                  ? `Participant checked in at ${new Date(lastScanResult.data!.checkInTime).toLocaleTimeString()}`
                  : lastScanResult.error
                }
              </p>
              {lastScanResult.participantInfo && (
                <div className="mt-2 text-sm text-green-700 dark:text-green-400 space-y-1">
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
                    className="mt-2 inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-foreground/90 text-white hover:bg-foreground/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
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
        <div className="mb-6 flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <svg className="animate-spin h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-blue-800 dark:text-blue-300">
            Processing check-in...
          </span>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-muted rounded-lg p-4">
        <h4 className="font-medium text-foreground mb-2">Supported QR Code Formats</h4>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• <strong>ID Card QR:</strong> Scans QR codes from printed ID cards</p>
          <p>• <strong>Registration QR:</strong> Scans codes from registration confirmations</p>
          <p>• <strong>Manual Entry:</strong> Enter attendee ID, registration ID, or user profile ID</p>
          <p>• Green confirmation means successful check-in</p>
          <p>• Red error means invalid code or participant already checked in</p>
        </div>
      </div>
    </div>
  );
};
