import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QrScanner } from './QrScanner';
import { CertificateQr } from './CertificateQr';
import { 
  QrCode, 
  Keyboard, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Award,
  Calendar,
  Building2,
  User,
  Printer,
  RotateCcw,
  ArrowLeft,
  Sparkles,
  Lock,
  Search
} from 'lucide-react';

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

const typeConfig = {
  MERIT: { 
    label: 'Certificate of Merit', 
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/20'
  },
  COMPLETION: { 
    label: 'Certificate of Completion', 
    gradient: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20'
  },
  APPRECIATION: { 
    label: 'Certificate of Appreciation', 
    gradient: 'from-blue-500 to-indigo-500',
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/20'
  },
};

export function CertificateVerification({ certificateId: propCertificateId }: CertificateVerificationProps) {
  const { certificateId: paramCertificateId } = useParams<{ certificateId: string }>();
  const [searchParams] = useSearchParams();
  const [inputCertificateId, setInputCertificateId] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

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
    retry: false,
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
    setShowScanner(false);
  };

  const handleScanResult = (scannedId: string) => {
    setInputCertificateId(scannedId);
    setVerificationId(scannedId);
    setShowScanner(false);
  };

  const cert = verificationResult?.certificate;
  const config = cert ? typeConfig[cert.type] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-teal/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-coral/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Back to Home</span>
        </Link>

        {/* Hero Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground mb-6 shadow-lg shadow-primary/25">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 tracking-tight">
            Certificate Verification
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Instantly verify the authenticity of certificates issued through Thittam1Hub's secure platform
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-xl border border-border/60 p-1.5 bg-card/80 backdrop-blur-sm shadow-sm">
            <button
              onClick={() => setShowScanner(false)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                !showScanner 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              Manual Entry
            </button>
            <button
              onClick={() => setShowScanner(true)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                showScanner 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <QrCode className="w-4 h-4" />
              Scan QR Code
            </button>
          </div>
        </div>

        {/* QR Scanner */}
        {showScanner && (
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <QrScanner 
              onScan={handleScanResult} 
              onClose={() => setShowScanner(false)} 
            />
          </div>
        )}

        {/* Verification Form */}
        {!showScanner && !verificationResult && (
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/60 shadow-xl shadow-black/5 p-6 sm:p-8 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <label htmlFor="certificateId" className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  Certificate ID
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      id="certificateId"
                      value={inputCertificateId}
                      onChange={(e) => setInputCertificateId(e.target.value)}
                      placeholder="e.g., CERT-2024-ABC123-XYZ789"
                      className="w-full border border-input bg-background text-foreground rounded-xl px-4 py-3 pl-4 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-mono text-sm"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !inputCertificateId.trim()}
                    className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none whitespace-nowrap font-medium flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        Verify
                      </>
                    )}
                  </button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground flex items-start gap-2">
                <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                Enter the certificate ID printed on your certificate, or switch to QR scanning mode for instant verification.
              </p>
            </form>
          </div>
        )}

        {/* Verification Results */}
        {verificationResult && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {verificationResult.valid && cert && config ? (
              // Valid Certificate Display
              <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/60 shadow-xl shadow-black/5 overflow-hidden">
                {/* Success Banner */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-1">Certificate Verified</h2>
                      <p className="text-white/80">This certificate is authentic and valid</p>
                    </div>
                  </div>
                </div>

                {/* Certificate Details */}
                <div className="p-6 sm:p-8">
                  {/* Type Badge */}
                  <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${config.bg} ${config.text} border ${config.border}`}>
                      <Award className="w-4 h-4" />
                      <span className="font-semibold text-sm">{config.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CertificateQr certificateId={cert.certificateId} size={64} />
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <QrCode className="w-4 h-4" />
                        Certificate ID
                      </div>
                      <p className="font-mono text-foreground font-medium bg-muted/50 px-3 py-2 rounded-lg text-sm break-all">
                        {cert.certificateId}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <User className="w-4 h-4" />
                        Recipient
                      </div>
                      <p className="text-foreground font-semibold text-lg">{cert.recipientName}</p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Sparkles className="w-4 h-4" />
                        Event
                      </div>
                      <p className="text-foreground font-medium">{cert.eventName}</p>
                    </div>

                    {cert.eventOrganization && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Building2 className="w-4 h-4" />
                          Organization
                        </div>
                        <p className="text-foreground font-medium">{cert.eventOrganization}</p>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Calendar className="w-4 h-4" />
                        Issue Date
                      </div>
                      <p className="text-foreground font-medium">
                        {new Date(cert.issuedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Building2 className="w-4 h-4" />
                        Issued By
                      </div>
                      <p className="text-foreground font-medium">{cert.issuerName}</p>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-1">Verification Details</h4>
                      <p className="text-sm text-muted-foreground">
                        Verified against our secure blockchain-anchored database on{' '}
                        {new Date().toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })} at {new Date().toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-border/60 p-6 bg-muted/30 flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted transition-colors font-medium"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Verify Another
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                  >
                    <Printer className="w-4 h-4" />
                    Print Verification
                  </button>
                </div>
              </div>
            ) : (
              // Invalid Certificate Display
              <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/60 shadow-xl shadow-black/5 overflow-hidden">
                {/* Error Banner */}
                <div className="bg-gradient-to-r from-red-500 to-rose-500 p-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <XCircle className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-1">Verification Failed</h2>
                      <p className="text-white/80">
                        {verificationResult.error || 'This certificate could not be verified'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Troubleshooting */}
                <div className="p-6 sm:p-8">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-muted-foreground" />
                    Troubleshooting Tips
                  </h3>
                  <ul className="space-y-3">
                    {[
                      'Double-check the certificate ID for any typos or missing characters',
                      'Ensure you\'re entering the complete certificate ID including all dashes',
                      'Try scanning the QR code on the certificate for automatic verification',
                      'Contact the certificate issuer if you believe this is an error',
                    ].map((tip, i) => (
                      <li key={i} className="flex items-start gap-3 text-muted-foreground">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-medium">{i + 1}</span>
                        </div>
                        <span className="text-sm">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="border-t border-border/60 p-6 bg-muted/30 flex justify-center">
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && !verificationResult && (
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-destructive/20 shadow-xl shadow-black/5 p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Connection Error</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Unable to connect to our verification servers. Please check your internet connection and try again.
              </p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                Retry Verification
              </button>
            </div>
          </div>
        )}

        {/* Information Section */}
        {!verificationResult && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: 'Secure Verification',
                description: 'Every certificate is cryptographically signed and stored in our secure database.',
              },
              {
                icon: QrCode,
                title: 'QR Code Support',
                description: 'Scan the QR code on any certificate for instant verification results.',
              },
              {
                icon: Lock,
                title: 'Privacy Protected',
                description: 'No personal data is stored during verification. Your privacy is our priority.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-card/60 backdrop-blur-sm rounded-xl border border-border/40 p-5 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
