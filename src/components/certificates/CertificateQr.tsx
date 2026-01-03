import React from 'react';

interface CertificateQrProps {
  certificateId: string;
  size?: number;
}

/**
 * Simple QR image component using a public QR code generation API.
 * Encodes the certificateId, which the verification page uses to look up details.
 */
export const CertificateQr: React.FC<CertificateQrProps> = ({ certificateId, size = 128 }) => {
  if (!certificateId) return null;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    certificateId,
  )}`;

  return (
    <img
      src={qrUrl}
      alt={`QR code for certificate ${certificateId}`}
      className="rounded-md border border-border/60 bg-background object-contain"
      loading="lazy"
      width={size}
      height={size}
    />
  );
};
