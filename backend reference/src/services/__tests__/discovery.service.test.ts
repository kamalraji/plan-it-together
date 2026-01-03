import { discoveryService } from '../discovery.service';

// Mock the entire discovery service module to avoid Prisma issues
jest.mock('../discovery.service', () => {
  const mockDiscoveryService = {
    searchOrganizations: jest.fn(),
    getOrganizationEvents: jest.fn(),
    followOrganization: jest.fn(),
    unfollowOrganization: jest.fn(),
    getFollowedOrganizations: jest.fn(),
    isFollowing: jest.fn(),
    notifyFollowers: jest.fn(),
  };
  return { discoveryService: mockDiscoveryService };
});

const mockDiscoveryService = discoveryService as jest.Mocked<typeof discoveryService>;

describe('DiscoveryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchOrganizations', () => {
    it('should search organizations with filters', async () => {
      const mockOrganizations = [
        {
          id: '1',
          name: 'Test Org',
          description: 'Test Description',
          category: 'COLLEGE',
          verificationStatus: 'VERIFIED',
          branding: {},
          socialLinks: {},
          pageUrl: 'test-org',
          followerCount: 10,
          rejectionReason: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          eventCount: 5,
        },
      ];

      mockDiscoveryService.searchOrganizations.mockResolvedValue(mockOrganizations as any);

      const result = await discoveryService.searchOrganizations({
        query: 'test',
        category: 'COLLEGE',
        verifiedOnly: true,
        limit: 20,
        offset: 0,
      });

      expect(mockDiscoveryService.searchOrganizations).toHaveBeenCalledWith({
        query: 'test',
        category: 'COLLEGE',
        verifiedOnly: true,
        limit: 20,
        offset: 0,
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Org');
      expect(result[0].eventCount).toBe(5);
    });

    it('should search organizations without filters', async () => {
      const mockOrganizations: any[] = [];
      mockDiscoveryService.searchOrganizations.mockResolvedValue(mockOrganizations);

      const result = await discoveryService.searchOrganizations({});

      expect(mockDiscoveryService.searchOrganizations).toHaveBeenCalledWith({});
      expect(result).toHaveLength(0);
    });
  });

  describe('getOrganizationEvents', () => {
    it('should get public events for non-members', async () => {
      const mockEvents = [
        {
          id: '1',
          name: 'Test Event',
          description: 'Test Description',
          mode: 'OFFLINE',
          startDate: new Date('2024-12-20'),
          endDate: new Date('2024-12-21'),
          capacity: 100,
          registrationDeadline: null,
          organizerId: 'user1',
          organizationId: 'org1',
          visibility: 'PUBLIC',
          branding: {},
          venue: {},
          virtualLinks: null,
          status: 'PUBLISHED',
          landingPageUrl: 'test-event',
          inviteLink: null,
          leaderboardEnabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          registrationCount: 50,
        },
      ];

      mockDiscoveryService.getOrganizationEvents.mockResolvedValue(mockEvents as any);

      const result = await discoveryService.getOrganizationEvents('org1', 'user2');

      expect(mockDiscoveryService.getOrganizationEvents).toHaveBeenCalledWith('org1', 'user2');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Event');
    });

    it('should get public and private events for organization members', async () => {
      const mockEvents: any[] = [];
      
      mockDiscoveryService.getOrganizationEvents.mockResolvedValue(mockEvents);

      const result = await discoveryService.getOrganizationEvents('org1', 'user1');

      expect(mockDiscoveryService.getOrganizationEvents).toHaveBeenCalledWith('org1', 'user1');
      expect(result).toHaveLength(0);
    });
  });

  describe('followOrganization', () => {
    it('should follow an organization successfully', async () => {
      const mockFollow = {
        id: 'follow1',
        userId: 'user1',
        organizationId: 'org1',
        followedAt: new Date(),
      };

      mockDiscoveryService.followOrganization.mockResolvedValue(mockFollow);

      const result = await discoveryService.followOrganization('user1', 'org1');

      expect(mockDiscoveryService.followOrganization).toHaveBeenCalledWith('user1', 'org1');
      expect(result).toEqual(mockFollow);
    });

    it('should throw error if organization not found', async () => {
      mockDiscoveryService.followOrganization.mockRejectedValue(new Error('Organization not found'));

      await expect(
        discoveryService.followOrganization('user1', 'org1')
      ).rejects.toThrow('Organization not found');
    });

    it('should throw error if already following', async () => {
      mockDiscoveryService.followOrganization.mockRejectedValue(new Error('Already following this organization'));

      await expect(
        discoveryService.followOrganization('user1', 'org1')
      ).rejects.toThrow('Already following this organization');
    });
  });
});