import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
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

  // Fetch QR code data
  const { data: qrCodeData, isLoading, error } = useQuery<QRCodeData>({
    queryKey: ['qr-code', registration.id],
    queryFn: async () => {
      const response = await api.get(`/attendance/registrations/${registration.id}/qr-code`);
      return response.data.data;
    },
  });

  // Fetch attendance records to show check-in status
  const { data: attendanceRecords } = useQuery<AttendanceRecord[]>({
    queryKey: ['attendance-records', registration.id],
    queryFn: async () => {
      const response = await api.get(`/attendance/registrations/${registration.id}`);
      return response.data.data;
    },
  });

  const handleDownload = async () => {
    if (!qrCodeData) return;

    try {
      setDownloadError(null);
      
      // Convert data URL to blob
      const response = await fetch(qrCodeData.imageUrl);
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
    if (!qrCodeData) return;

    try {
      if (navigator.share) {
        // Convert data URL to blob for sharing
        const response = await fetch(qrCodeData.imageUrl);
        const blob = await response.blob();
        const file = new File([blob], `${eventName}_qr_code.png`, { type: 'image/png' });
        
        await navigator.share({
          title: `${eventName} - QR Code`,
          text: 'My QR code for event check-in',
          files: [file],
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(qrCodeData.code);
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Event QR Code</h3>
        <p className="text-gray-600 mb-6">
          Show this QR code at the event for quick check-in
        </p>

        {/* Check-in Status */}
        {isCheckedIn ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <svg className="h-6 w-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-800 font-medium">Checked In</span>
            </div>
            <p className="text-sm text-green-700">
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-blue-800 font-medium">Ready for Check-in</span>
            </div>
            <p className="text-sm text-blue-700">
              Present this QR code to volunteers at the event entrance
            </p>
          </div>
        )}

        {/* QR Code Image */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6 inline-block">
          <img
            src={qrCodeData.imageUrl}
            alt="Event QR Code"
            className="w-64 h-64 mx-auto"
          />
        </div>

        {/* QR Code Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <h4 className="font-medium text-gray-900 mb-3">QR Code Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Event:</span>
              <span className="font-medium text-gray-900">{eventName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Registration ID:</span>
              <span className="font-mono text-gray-900">{registration.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">QR Code:</span>
              <span className="font-mono text-gray-900 break-all">{qrCodeData.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                registration.status === 'CONFIRMED' 
                  ? 'bg-green-100 text-green-800'
                  : registration.status === 'WAITLISTED'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {registration.status}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download QR Code
          </button>
          
          <button
            onClick={handleShare}
            className="flex-1 sm:flex-none bg-gray-200 text-gray-800 px-4 py-2 rounded-md font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            Share
          </button>
        </div>

        {/* Error Display */}
        {downloadError && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">{downloadError}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 text-left">
          <h4 className="font-medium text-gray-900 mb-3">How to Use Your QR Code</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full text-xs font-medium mr-3 mt-0.5">1</span>
              <span>Save this QR code to your phone or take a screenshot</span>
            </div>
            <div className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full text-xs font-medium mr-3 mt-0.5">2</span>
              <span>Arrive at the event venue at the scheduled time</span>
            </div>
            <div className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full text-xs font-medium mr-3 mt-0.5">3</span>
              <span>Show your QR code to volunteers at the check-in desk</span>
            </div>
            <div className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full text-xs font-medium mr-3 mt-0.5">4</span>
              <span>Wait for the green confirmation after scanning</span>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4 text-left">
          <h4 className="font-medium text-gray-900 mb-2">Troubleshooting</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• If the QR code won't scan, show your registration ID to volunteers</p>
            <p>• Make sure your phone screen brightness is at maximum</p>
            <p>• Clean your phone screen for better scanning</p>
            <p>• If you're having issues, volunteers can check you in manually</p>
          </div>
        </div>
      </div>
    </div>
  );
};