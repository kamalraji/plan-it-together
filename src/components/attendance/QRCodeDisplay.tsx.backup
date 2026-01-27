import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeData, Registration, AttendanceRecord } from '../../types';

interface QRCodeDisplayProps {
  registration: Registration;
  eventName: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  registration,
  eventName,
}) => {
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const { data: qrCodeData, isLoading, error } = useQuery<QRCodeData>({
    queryKey: ['qr-code', registration.userId, registration.eventId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('attendance-qr', {
        body: { eventId: registration.eventId },
      });
      if (error || !data?.success) {
        throw error || new Error('Failed to load QR code');
      }
      return data.data as QRCodeData;
    },
  });

  const { data: attendanceRecords } = useQuery<AttendanceRecord[]>({
    queryKey: ['attendance-records', registration.eventId, registration.userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('registration_id, user_id, check_in_time, check_in_method')
        .eq('event_id', registration.eventId)
        .eq('user_id', registration.userId)
        .order('check_in_time', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        registrationId: row.registration_id,
        sessionId: row.session_id ?? null,
        checkInTime: row.check_in_time,
        checkInMethod: row.check_in_method as 'QR_SCAN' | 'MANUAL',
        volunteerId: row.volunteer_id ?? null,
      })) as AttendanceRecord[];
    },
    enabled: !!registration,
  });
  const qrImageUrl = qrCodeData
    ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCodeData.qrCode)}&size=256x256`
    : '';

  const handleDownload = async () => {
    if (!qrCodeData || !qrImageUrl) return;

    try {
      setDownloadError(null);
      
      // Fetch generated QR image for download
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr_code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setDownloadError('Failed to download QR code. Please try again.');
    }
  };

  const handleShare = async () => {
    if (!qrCodeData || !qrImageUrl) return;

    try {
      if (navigator.share) {
        // Fetch QR image as blob for sharing
        const response = await fetch(qrImageUrl);
        const blob = await response.blob();
        const file = new File([blob], `${eventName}_qr_code.png`, { type: 'image/png' });
        
        await navigator.share({
          title: `${eventName} - QR Code`,
          text: 'My QR code for event check-in',
          files: [file],
        });
      } else {
        // Fallback: copy raw QR code string to clipboard
        await navigator.clipboard.writeText(qrCodeData.qrCode);
        alert('QR code copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing QR code:', error);
    }
  };

  const isCheckedIn = attendanceRecords && attendanceRecords.length > 0;
  const latestCheckIn = attendanceRecords?.[0];

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error || !qrCodeData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">QR Code Unavailable</h3>
          <p className="text-gray-600">
            Unable to load your QR code. Please contact support if this issue persists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 max-w-md w-full mx-auto max-h-[90vh] flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-6">
        <div className="text-center">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Your Event QR Code</h3>
          <p className="text-gray-600 text-sm mb-2">
            Show this QR code at the event for quick check-in.
          </p>
          <p className="text-gray-500 text-[11px] sm:text-xs mb-4">
            This is your personal check-in QR from your profile and stays the same across all events you join.
          </p>

          {/* Check-in Status */}
          {isCheckedIn ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-center justify-center mb-1.5 sm:mb-2">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-800 text-sm sm:text-base font-medium">Checked In</span>
              </div>
              <p className="text-xs sm:text-sm text-green-700">
                {latestCheckIn && (
                  <>
                    Check-in time: {new Date(latestCheckIn.checkInTime).toLocaleString()}
                    <br />
                    Method: {latestCheckIn.checkInMethod === 'QR_SCAN' ? 'QR Code Scan' : 'Manual Check-in'}
                  </>
                )}
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-center justify-center mb-1.5 sm:mb-2">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-blue-800 text-sm sm:text-base font-medium">Ready for Check-in</span>
              </div>
              <p className="text-xs sm:text-sm text-blue-700">
                Present this QR code to volunteers at the event entrance.
              </p>
            </div>
          )}

          {/* QR Code Image */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 inline-block">
            <img
              src={qrImageUrl}
              alt="Event QR Code"
              className="w-56 h-56 sm:w-64 sm:h-64 mx-auto"
            />
          </div>
        </div>

        {/* QR Code Details */}
        <div className="bg-gray-50 rounded-xl p-3 sm:p-4 text-left">
          <h4 className="font-medium text-gray-900 text-sm sm:text-base mb-2 sm:mb-3">QR Code Details</h4>
          <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
            <div className="flex items-start justify-between gap-3">
              <span className="text-gray-600">Event:</span>
              <span className="font-medium text-gray-900 text-right line-clamp-2">{eventName}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-gray-600">Registration ID:</span>
              <span className="font-mono text-[11px] sm:text-xs text-gray-900 break-all text-right">
                {registration.id}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-gray-600">QR Code:</span>
              <span className="font-mono text-[11px] sm:text-xs text-gray-900 break-all text-right">
                {qrCodeData.qrCode}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-600">Status:</span>
              <span
                className={`inline-flex px-2 py-0.5 text-[11px] sm:text-xs font-semibold rounded-full ${
                  registration.status === 'CONFIRMED'
                    ? 'bg-green-100 text-green-800'
                    : registration.status === 'WAITLISTED'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {registration.status}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-left">
          <h4 className="font-medium text-gray-900 text-sm sm:text-base mb-2 sm:mb-3">
            How to Use Your QR Code
          </h4>
          <div className="space-y-2 text-xs sm:text-sm text-gray-600">
            <div className="flex items-start">
              <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-indigo-100 text-indigo-600 rounded-full text-[10px] sm:text-xs font-medium mr-2.5 sm:mr-3 mt-0.5">
                1
              </span>
              <span>Save this personal QR code from your profile to your phone or take a screenshot.</span>
            </div>
            <div className="flex items-start">
              <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-indigo-100 text-indigo-600 rounded-full text-[10px] sm:text-xs font-medium mr-2.5 sm:mr-3 mt-0.5">
                2
              </span>
              <span>Arrive at the event venue at the scheduled time.</span>
            </div>
            <div className="flex items-start">
              <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-indigo-100 text-indigo-600 rounded-full text-[10px] sm:text-xs font-medium mr-2.5 sm:mr-3 mt-0.5">
                3
              </span>
              <span>Show your QR code to volunteers at the check-in desk for any event you&apos;re registered for.</span>
            </div>
            <div className="flex items-start">
              <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-indigo-100 text-indigo-600 rounded-full text-[10px] sm:text-xs font-medium mr-2.5 sm:mr-3 mt-0.5">
                4
              </span>
              <span>Wait for the green confirmation after scanning.</span>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-gray-50 rounded-xl p-3 sm:p-4 text-left mb-2">
          <h4 className="font-medium text-gray-900 text-sm sm:text-base mb-1.5 sm:mb-2">Troubleshooting</h4>
          <div className="text-xs sm:text-sm text-gray-600 space-y-1">
            <p>• If the QR code won&apos;t scan, show your registration ID to volunteers.</p>
            <p>• Make sure your phone screen brightness is at maximum.</p>
            <p>• Clean your phone screen for better scanning.</p>
            <p>• If you&apos;re having issues, volunteers can check you in manually.</p>
          </div>
        </div>
      </div>

      {/* Action Buttons (sticky at bottom on mobile) */}
      <div className="pt-3 sm:pt-4 mt-2 border-t border-gray-200 flex flex-col sm:flex-row gap-2 sm:gap-3">
        <button
          onClick={handleDownload}
          className="w-full sm:flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
        >
          <svg className="h-5 w-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download QR Code
        </button>

        <button
          onClick={handleShare}
          className="w-full sm:flex-none bg-gray-200 text-gray-800 px-4 py-2.5 rounded-md text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
        >
          <svg className="h-5 w-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
          Share
        </button>
      </div>

      {/* Error Display */}
      {downloadError && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-md p-2.5">
          <p className="text-xs sm:text-sm text-red-800 text-center">{downloadError}</p>
        </div>
      )}
    </div>
  );
};