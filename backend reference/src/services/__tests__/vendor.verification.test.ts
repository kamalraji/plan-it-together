import { VendorService } from '../vendor.service';
import { VerificationStatus, ServiceCategory } from '@prisma/client';

describe('Vendor Verification System', () => {
  let vendorService: VendorService;

  beforeEach(() => {
    vendorService = new VendorService();
  });

  describe('getVerificationBadge', () => {
    it('should return correct badge for verified vendor', () => {
      const badge = vendorService.getVerificationBadge(VerificationStatus.VERIFIED);
      
      expect(badge.isVerified).toBe(true);
      expect(badge.badgeText).toBe('Verified');
      expect(badge.badgeColor).toBe('green');
      expect(badge.description).toContain('verified by our team');
    });

    it('should return correct badge for pending vendor', () => {
      const badge = vendorService.getVerificationBadge(VerificationStatus.PENDING);
      
      expect(badge.isVerified).toBe(false);
      expect(badge.badgeText).toBe('Verification Pending');
      expect(badge.badgeColor).toBe('yellow');
      expect(badge.description).toContain('under review');
    });

    it('should return correct badge for rejected vendor', () => {
      const badge = vendorService.getVerificationBadge(VerificationStatus.REJECTED);
      
      expect(badge.isVerified).toBe(false);
      expect(badge.badgeText).toBe('Not Verified');
      expect(badge.badgeColor).toBe('red');
      expect(badge.description).toContain('not completed');
    });
  });

  describe('validateVerificationDocuments', () => {
    it('should require business license for all vendors', () => {
      const serviceCategories = [ServiceCategory.PHOTOGRAPHY];
      const documents = {
        identityVerification: 'id-doc.pdf',
        // Missing businessLicense
      };

      expect(() => {
        (vendorService as any).validateVerificationDocuments(serviceCategories, documents);
      }).toThrow('Business license is required');
    });

    it('should require identity verification for all vendors', () => {
      const serviceCategories = [ServiceCategory.PHOTOGRAPHY];
      const documents = {
        businessLicense: 'license.pdf',
        // Missing identityVerification
      };

      expect(() => {
        (vendorService as any).validateVerificationDocuments(serviceCategories, documents);
      }).toThrow('Identity verification document is required');
    });

    it('should require insurance for high-risk categories', () => {
      const serviceCategories = [ServiceCategory.CATERING];
      const documents = {
        businessLicense: 'license.pdf',
        identityVerification: 'id-doc.pdf',
        // Missing insuranceCertificate
      };

      expect(() => {
        (vendorService as any).validateVerificationDocuments(serviceCategories, documents);
      }).toThrow('Insurance certificate is required');
    });

    it('should require portfolio for creative services', () => {
      const serviceCategories = [ServiceCategory.PHOTOGRAPHY];
      const documents = {
        businessLicense: 'license.pdf',
        identityVerification: 'id-doc.pdf',
        // Missing portfolioSamples
      };

      expect(() => {
        (vendorService as any).validateVerificationDocuments(serviceCategories, documents);
      }).toThrow('Portfolio samples are required');
    });

    it('should pass validation with all required documents', () => {
      const serviceCategories = [ServiceCategory.PHOTOGRAPHY];
      const documents = {
        businessLicense: 'license.pdf',
        identityVerification: 'id-doc.pdf',
        portfolioSamples: ['sample1.jpg', 'sample2.jpg'],
      };

      expect(() => {
        (vendorService as any).validateVerificationDocuments(serviceCategories, documents);
      }).not.toThrow();
    });
  });
});