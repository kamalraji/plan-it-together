// Mock Prisma before importing the service
const mockPrisma = {
  organization: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  organizationAdmin: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

// Mock communication service
jest.mock('../communication.service', () => ({
  communicationService: {
    sendEmail: jest.fn().mockResolvedValue({ success: true }),
  },
}));

import { organizationService } from '../organization.service';

describe('OrganizationService - Admin Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('inviteAdmin', () => {
    it('should successfully invite a user as admin', async () => {
      const orgId = 'org-123';
      const inviterUserId = 'user-123';
      const inviteeEmail = 'invitee@example.com';

      // Mock organization exists
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: orgId,
        name: 'Test Organization',
      });

      // Mock inviter is admin
      mockPrisma.organizationAdmin.findUnique
        .mockResolvedValueOnce({ id: 'admin-123' }) // inviter is admin
        .mockResolvedValueOnce(null); // invitee is not admin yet

      // Mock invitee user exists (called twice - once in inviteAdmin, once in addAdmin)
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({
          id: 'invitee-123',
          name: 'Invitee User',
          email: inviteeEmail,
        })
        .mockResolvedValueOnce({
          id: inviterUserId,
          name: 'Inviter User',
          email: 'inviter@example.com',
        })
        .mockResolvedValueOnce({
          id: 'invitee-123',
          name: 'Invitee User',
          email: inviteeEmail,
        });

      // Mock admin creation (called in addAdmin)
      mockPrisma.organizationAdmin.create.mockResolvedValue({
        id: 'new-admin-123',
        organizationId: orgId,
        userId: 'invitee-123',
        role: 'ADMIN',
        addedAt: new Date(),
        user: {
          id: 'invitee-123',
          name: 'Invitee User',
          email: inviteeEmail,
        },
      });

      // Mock organization lookup for addAdmin
      mockPrisma.organization.findUnique.mockResolvedValueOnce({
        id: orgId,
        name: 'Test Organization',
      });

      // Mock admin check for addAdmin (user is not already admin)
      mockPrisma.organizationAdmin.findUnique.mockResolvedValueOnce(null);

      const result = await organizationService.inviteAdmin(
        orgId,
        inviterUserId,
        inviteeEmail,
        'ADMIN'
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('Invitation sent');
      expect(mockPrisma.organizationAdmin.create).toHaveBeenCalledWith({
        data: {
          organizationId: orgId,
          userId: 'invitee-123',
          role: 'ADMIN',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    it('should throw error if organization not found', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);

      await expect(
        organizationService.inviteAdmin('invalid-org', 'user-123', 'test@example.com')
      ).rejects.toThrow('Organization not found');
    });

    it('should throw error if inviter is not an admin', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org-123',
        name: 'Test Organization',
      });
      mockPrisma.organizationAdmin.findUnique.mockResolvedValue(null);

      await expect(
        organizationService.inviteAdmin('org-123', 'user-123', 'test@example.com')
      ).rejects.toThrow('You do not have permission to invite admins');
    });

    it('should throw error if user does not exist', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org-123',
        name: 'Test Organization',
      });
      mockPrisma.organizationAdmin.findUnique.mockResolvedValue({ id: 'admin-123' });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        organizationService.inviteAdmin('org-123', 'user-123', 'nonexistent@example.com')
      ).rejects.toThrow('User with this email does not exist');
    });

    it('should throw error if user is already an admin', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org-123',
        name: 'Test Organization',
      });
      mockPrisma.organizationAdmin.findUnique
        .mockResolvedValueOnce({ id: 'admin-123' }) // inviter is admin
        .mockResolvedValueOnce({ id: 'existing-admin' }); // invitee is already admin
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-456',
        email: 'existing@example.com',
      });

      await expect(
        organizationService.inviteAdmin('org-123', 'user-123', 'existing@example.com')
      ).rejects.toThrow('User is already an admin of this organization');
    });
  });

  describe('addAdmin', () => {
    it('should successfully add a user as admin', async () => {
      const orgId = 'org-123';
      const userId = 'user-456';

      mockPrisma.organization.findUnique.mockResolvedValue({
        id: orgId,
        name: 'Test Organization',
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
      });

      mockPrisma.organizationAdmin.findUnique.mockResolvedValue(null);

      mockPrisma.organizationAdmin.create.mockResolvedValue({
        id: 'admin-123',
        organizationId: orgId,
        userId,
        role: 'ADMIN',
        addedAt: new Date(),
        user: {
          id: userId,
          name: 'Test User',
          email: 'test@example.com',
        },
      });

      const result = await organizationService.addAdmin(orgId, userId, 'ADMIN');

      expect(result.organizationId).toBe(orgId);
      expect(result.userId).toBe(userId);
      expect(result.role).toBe('ADMIN');
      expect(result.user.email).toBe('test@example.com');
    });
  });

  describe('removeAdmin', () => {
    it('should successfully remove an admin', async () => {
      const orgId = 'org-123';
      const userId = 'user-456';

      mockPrisma.organizationAdmin.findUnique.mockResolvedValue({
        id: 'admin-123',
        organizationId: orgId,
        userId,
        role: 'ADMIN',
      });

      mockPrisma.organizationAdmin.delete.mockResolvedValue({});

      const result = await organizationService.removeAdmin(orgId, userId);

      expect(result).toBe(true);
      expect(mockPrisma.organizationAdmin.delete).toHaveBeenCalledWith({
        where: {
          organizationId_userId: {
            organizationId: orgId,
            userId,
          },
        },
      });
    });

    it('should throw error when trying to remove the only owner', async () => {
      const orgId = 'org-123';
      const userId = 'user-456';

      mockPrisma.organizationAdmin.findUnique.mockResolvedValue({
        id: 'admin-123',
        organizationId: orgId,
        userId,
        role: 'OWNER',
      });

      mockPrisma.organizationAdmin.count.mockResolvedValue(1);

      await expect(
        organizationService.removeAdmin(orgId, userId)
      ).rejects.toThrow('Cannot remove the only owner of the organization');
    });
  });

  describe('getOrganizationAdmins', () => {
    it('should return list of organization admins', async () => {
      const orgId = 'org-123';
      const mockAdmins = [
        {
          id: 'admin-1',
          organizationId: orgId,
          userId: 'user-1',
          role: 'OWNER',
          addedAt: new Date(),
          user: {
            id: 'user-1',
            name: 'Owner User',
            email: 'owner@example.com',
          },
        },
        {
          id: 'admin-2',
          organizationId: orgId,
          userId: 'user-2',
          role: 'ADMIN',
          addedAt: new Date(),
          user: {
            id: 'user-2',
            name: 'Admin User',
            email: 'admin@example.com',
          },
        },
      ];

      mockPrisma.organizationAdmin.findMany.mockResolvedValue(mockAdmins);

      const result = await organizationService.getOrganizationAdmins(orgId);

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe('OWNER');
      expect(result[1].role).toBe('ADMIN');
      expect(mockPrisma.organizationAdmin.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          addedAt: 'asc',
        },
      });
    });
  });

  describe('isOrganizationAdmin', () => {
    it('should return true if user is an admin', async () => {
      mockPrisma.organizationAdmin.findUnique.mockResolvedValue({
        id: 'admin-123',
      });

      const result = await organizationService.isOrganizationAdmin('org-123', 'user-456');

      expect(result).toBe(true);
    });

    it('should return false if user is not an admin', async () => {
      mockPrisma.organizationAdmin.findUnique.mockResolvedValue(null);

      const result = await organizationService.isOrganizationAdmin('org-123', 'user-456');

      expect(result).toBe(false);
    });
  });
});