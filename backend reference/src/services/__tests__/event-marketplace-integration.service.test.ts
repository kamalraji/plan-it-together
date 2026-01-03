import { eventMarketplaceIntegrationService } from '../event-marketplace-integration.service';

describe('EventMarketplaceIntegrationService', () => {
  describe('getServiceRecommendationsForEvent', () => {
    it('should be defined', () => {
      expect(eventMarketplaceIntegrationService.getServiceRecommendationsForEvent).toBeDefined();
    });
  });

  describe('synchronizeVendorTimelines', () => {
    it('should be defined', () => {
      expect(eventMarketplaceIntegrationService.synchronizeVendorTimelines).toBeDefined();
    });
  });

  describe('createIntegratedCommunication', () => {
    it('should be defined', () => {
      expect(eventMarketplaceIntegrationService.createIntegratedCommunication).toBeDefined();
    });
  });

  describe('getEventMarketplaceDashboard', () => {
    it('should be defined', () => {
      expect(eventMarketplaceIntegrationService.getEventMarketplaceDashboard).toBeDefined();
    });
  });

  describe('getVendorCoordinationData', () => {
    it('should be defined', () => {
      expect(eventMarketplaceIntegrationService.getVendorCoordinationData).toBeDefined();
    });
  });
});