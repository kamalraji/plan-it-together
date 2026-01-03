// Mock Prisma before importing the service
const mockPrisma = {
  organization: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    create: jest.fn(),
    delete: jest.fn(),
  },
  organizationAdmin: {
    create: jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
  },
  event: {
    create: jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
  },
  $disconnect: jest.fn(),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

import { eventService } from '../event.service';

describe('Event Access Control', () => {
  const testOrganizationId = 'test-org-id';
  const testUserId = 'test-user-id';
  const testEventId = 'test-event-id';
  const testInviteLink = 'test-invite-link';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validatePrivateEventAccess', () => {
    it('should allow access with valid invite link', async () => {
      // Mock event with private visibility and matching invite link
      mockPrisma.event.findUnique.mockResolvedValue({
        id: testEventId,
        visibility: 'PRIVATE',
        inviteLink: testInviteLink,
        organizationId: testOrganizationId,
        organization: { id: testOrganizationId },
      });

      const hasAccess = await eventService.validatePrivateEventAccess(
        testEventId,
        undefined,
        testInviteLink
      );
      expect(hasAccess).toBe(true);
    });

    it('should deny access with invalid invite link', async () => {
      // Mock event with private visibility and different invite link
      mockPrisma.event.findUnique.mockResolvedValue({
        id: testEventId,
        visibility: 'PRIVATE',
        inviteLink: testInviteLink,
        organizationId: testOrganizationId,
        organization: { id: testOrganizationId },
      });

      const hasAccess = await eventService.validatePrivateEventAccess(
        testEventId,
        undefined,
        'invalid-link'
      );
      expect(hasAccess).toBe(false);
    });

    it('should allow access for organization members', async () => {
      // Mock event with private visibility
      mockPrisma.event.findUnique.mockResolvedValue({
        id: testEventId,
        visibility: 'PRIVATE',
        inviteLink: testInviteLink,
        organizationId: testOrganizationId,
        organization: { id: testOrganizationId },
      });

      // Mock organization admin relationship
      mockPrisma.organizationAdmin.findUnique.mockResolvedValue({
        id: 'admin-id',
        organizationId: testOrganizationId,
        userId: testUserId,
        role: 'ADMIN',
      });

      const hasAccess = await eventService.validatePrivateEventAccess(
        testEventId,
        testUserId,
        undefined
      );
      expect(hasAccess).toBe(true);
    });

    it('should deny access for non-members without invite link', async () => {
      const nonMemberUserId = 'non-member-id';

      // Mock event with private visibility
      mockPrisma.event.findUnique.mockResolvedValue({
        id: testEventId,
        visibility: 'PRIVATE',
        inviteLink: testInviteLink,
        organizationId: testOrganizationId,
        organization: { id: testOrganizationId },
      });

      // Mock no organization admin relationship
      mockPrisma.organizationAdmin.findUnique.mockResolvedValue(null);

      const hasAccess = await eventService.validatePrivateEventAccess(
        testEventId,
        nonMemberUserId,
        undefined
      );
      expect(hasAccess).toBe(false);
    });

    it('should allow access to public events', async () => {
      // Mock event with public visibility
      mockPrisma.event.findUnique.mockResolvedValue({
        id: testEventId,
        visibility: 'PUBLIC',
        inviteLink: null,
        organizationId: testOrganizationId,
        organization: { id: testOrganizationId },
      });

      const hasAccess = await eventService.validatePrivateEventAccess(
        testEventId,
        undefined,
        undefined
      );
      expect(hasAccess).toBe(true);
    });

    it('should allow access to unlisted events', async () => {
      // Mock event with unlisted visibility
      mockPrisma.event.findUnique.mockResolvedValue({
        id: testEventId,
        visibility: 'UNLISTED',
        inviteLink: null,
        organizationId: testOrganizationId,
        organization: { id: testOrganizationId },
      });

      const hasAccess = await eventService.validatePrivateEventAccess(
        testEventId,
        undefined,
        undefined
      );
      expect(hasAccess).toBe(true);
    });
  });

  describe('getEventByInviteLink', () => {
    it('should return event for valid invite link', async () => {
      const mockEvent = {
        id: testEventId,
        name: 'Test Event',
        description: 'Test Description',
        mode: 'ONLINE',
        startDate: new Date(),
        endDate: new Date(),
        organizerId: testUserId,
        organizationId: testOrganizationId,
        visibility: 'PRIVATE',
        inviteLink: testInviteLink,
        branding: {},
        status: 'PUBLISHED',
        landingPageUrl: 'test-event',
        leaderboardEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        registrations: [],
      };

      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);

      const event = await eventService.getEventByInviteLink(testInviteLink);
      expect(event).toBeTruthy();
      expect(event!.id).toBe(testEventId);
      expect(mockPrisma.event.findUnique).toHaveBeenCalledWith({
        where: { inviteLink: testInviteLink },
        include: {
          registrations: {
            where: { status: 'CONFIRMED' },
          },
        },
      });
    });

    it('should return null for invalid invite link', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);

      const event = await eventService.getEventByInviteLink('invalid-link');
      expect(event).toBeNull();
    });
  });

  describe('isOrganizationMember', () => {
    it('should return true for organization admin', async () => {
      mockPrisma.organizationAdmin.findUnique.mockResolvedValue({
        id: 'admin-id',
        organizationId: testOrganizationId,
        userId: testUserId,
        role: 'ADMIN',
      });

      const isMember = await eventService.isOrganizationMember(
        testOrganizationId,
        testUserId
      );
      expect(isMember).toBe(true);
      expect(mockPrisma.organizationAdmin.findUnique).toHaveBeenCalledWith({
        where: {
          organizationId_userId: {
            organizationId: testOrganizationId,
            userId: testUserId,
          },
        },
      });
    });

    it('should return false for non-member', async () => {
      const nonMemberUserId = 'non-member-id';
      mockPrisma.organizationAdmin.findUnique.mockResolvedValue(null);

      const isMember = await eventService.isOrganizationMember(
        testOrganizationId,
        nonMemberUserId
      );
      expect(isMember).toBe(false);
    });
  });
});