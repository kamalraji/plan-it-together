import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types for certificate verification
export interface CertificateVerificationResult {
  valid: boolean;
  certificate?: {
    id: string;
    certificateId: string;
    recipientName: string;
    eventName: string;
    eventOrganization?: string;
    type: 'MERIT' | 'COMPLETION' | 'APPRECIATION';
    issuedAt: string;
    issuerName: string;
  };
  error?: string;
}

interface CertificateVerificationProps {
  certificateId?: string;
}

export function CertificateVerification({ certificateId: propCertificateId }: CertificateVerificationProps) {
  const { certificateId: paramCertificateId } = useParams<{ certificateId: string }>();
  const [searchParams] = useSearchParams();
  const [inputCertificateId, setInputCertificateId] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);

  // Determine which certificate ID to use
  const certificateId = propCertificateId || paramCertificateId || searchParams.get('id');

  // Set verification ID when component mounts or certificate ID changes
  useEffect(() => {
    if (certificateId) {
      setVerificationId(certificateId);
      setInputCertificateId(certificateId);
    }
  }, [certificateId]);

  // Query for certificate verification
  const {
    data: verificationResult,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['certificate-verification', verificationId],
    queryFn: async () => {
      if (!verificationId) return null;

      const { data, error } = await supabase.functions.invoke('certificates', {
        body: { action: 'verify', certificateId: verificationId },
      });
      if (error) {
        if ((error as any).status === 404) {
          return {
            valid: false,
            error: 'Certificate not found. Please check the certificate ID and try again.',
          } as CertificateVerificationResult;
        }
        throw error;
      }
      return data as CertificateVerificationResult;
    },
    enabled: !!verificationId,
    retry: false, // Don't retry on 404s
  });

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCertificateId.trim()) {
      setVerificationId(inputCertificateId.trim());
    }
  };

  const handleReset = () => {
    setVerificationId(null);
    setInputCertificateId('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Certificate Verification</h1>
          <p className="text-gray-600">
            Verify the authenticity of certificates issued through Thittam1Hub
          </p>
        </div>

        {/* Verification Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="certificateId" className="block text-sm font-medium text-gray-700 mb-2">
                Certificate ID
              </label>
              <div className="flex space-x-4">
                <input
                  type="text"
                  id="certificateId"
                  value={inputCertificateId}
                  onChange={(e) => setInputCertificateId(e.target.value)}
                  placeholder="Enter certificate ID (e.g., CERT-2024-ABC123)"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputCertificateId.trim()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Enter the certificate ID found on your certificate or scan the QR code to be redirected here automatically.
            </p>
          </form>
        </div>

        {/* Verification Results */}
        {verificationResult && (
          <div className="bg-white rounded-lg shadow-md p-6">
            {verificationResult.valid && verificationResult.certificate ? (
              // Valid Certificate Display
              <div className="text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-green-600 mb-2">Certificate Verified</h2>
                  <p className="text-gray-600">This certificate is authentic and valid.</p>
                </div>

                {/* Certificate Details */}
                <div className="bg-gray-50 rounded-lg p-6 text-left">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificate Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Certificate ID</dt>
                      <dd className="text-sm text-gray-900 font-mono">{verificationResult.certificate.certificateId}</dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Certificate Type</dt>
                      <dd className="text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          verificationResult.certificate.type === 'MERIT' ? 'bg-yellow-100 text-yellow-800' :
                          verificationResult.certificate.type === 'COMPLETION' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {verificationResult.certificate.type}
                        </span>
                      </dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Recipient Name</dt>
                      <dd className="text-sm text-gray-900 font-medium">{verificationResult.certificate.recipientName}</dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Event Name</dt>
                      <dd className="text-sm text-gray-900">{verificationResult.certificate.eventName}</dd>
                    </div>
                    
                    {verificationResult.certificate.eventOrganization && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Organization</dt>
                        <dd className="text-sm text-gray-900">{verificationResult.certificate.eventOrganization}</dd>
                      </div>
                    )}
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Issued Date</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(verificationResult.certificate.issuedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Issued By</dt>
                      <dd className="text-sm text-gray-900">{verificationResult.certificate.issuerName}</dd>
                    </div>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800">Security Information</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        This certificate has been verified against our secure database. 
                        The verification was performed on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Invalid Certificate Display
              <div className="text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-red-600 mb-2">Certificate Not Verified</h2>
                  <p className="text-gray-600 mb-4">
                    {verificationResult.error || 'This certificate could not be verified.'}
                  </p>
                </div>

                {/* Troubleshooting */}
                <div className="bg-gray-50 rounded-lg p-6 text-left">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Troubleshooting</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start">
                      <span className="text-gray-400 mr-2">•</span>
                      Double-check the certificate ID for any typos
                    </li>
                    <li className="flex items-start">
                      <span className="text-gray-400 mr-2">•</span>
                      Ensure you're entering the complete certificate ID
                    </li>
                    <li className="flex items-start">
                      <span className="text-gray-400 mr-2">•</span>
                      Try scanning the QR code on the certificate instead
                    </li>
                    <li className="flex items-start">
                      <span className="text-gray-400 mr-2">•</span>
                      Contact the certificate issuer if you believe this is an error
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex justify-center space-x-4">
              <button
                onClick={handleReset}
                className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Verify Another Certificate
              </button>
              {verificationResult.valid && (
                <button
                  onClick={() => window.print()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Print Verification
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && !verificationResult && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-red-600 mb-2">Verification Error</h2>
              <p className="text-gray-600 mb-4">
                An error occurred while verifying the certificate. Please try again.
              </p>
              <button
                onClick={() => refetch()}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Information Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">About Certificate Verification</h3>
          <div className="prose text-sm text-gray-600">
            <p className="mb-3">
              This verification portal allows you to confirm the authenticity of certificates issued through the Thittam1Hub platform. 
              Each certificate contains a unique ID and QR code that can be verified against our secure database.
            </p>
            <p className="mb-3">
              <strong>How to verify:</strong>
            </p>
            <ul className="list-disc list-inside mb-3 space-y-1">
              <li>Enter the certificate ID found on your certificate</li>
              <li>Scan the QR code on the certificate with your device</li>
              <li>Click "Verify" to check the certificate against our database</li>
            </ul>
            <p>
              <strong>Security:</strong> All verifications are performed in real-time against our secure database. 
              No personal information is stored during the verification process.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}