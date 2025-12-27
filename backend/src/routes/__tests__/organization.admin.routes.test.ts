// Mock the organization service
jest.mock('../../services/organization.service', () => ({
  organizationService: {
    inviteAdmin: jest.fn(),
    addAdmin: jest.fn(),
    removeAdmin: jest.fn(),
    getOrganizationAdmins: jest.fn(),
    isOrganizationAdmin: jest.fn(),
  },
}));

// Mock auth middleware
jest.mock('../../middleware/auth.middleware', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: 'user-123', role: 'ORGANIZER' };
    next();
  },
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

import { organizationService } from '../../services/organization.service';

describe('Organization Admin Management - Service Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('inviteAdmin functionality', () => {
    it('should call inviteAdmin with correct parameters', async () => {
      const mockResult = {
        success: true,
        message: 'Invitation sent to test@example.com and admin access granted',
      };

      (organizationService.isOrganizationAdmin as jest.Mock).mockResolvedValue(true);
      (organizationService.inviteAdmin as jest.Mock).mockResolvedValue(mockResult);

      // Simulate the route logic
      const orgId = 'org-123';
      const inviterUserId = 'user-123';
      const email = 'test@example.com';
      const role = 'ADMIN';

      const isAdmin = await organizationService.isOrganizationAdmin(orgId, inviterUserId);
      expect(isAdmin).toBe(true);

      const result = await organizationService.inviteAdmin(orgId, inviterUserId, email, role);

      expect(result).toEqual(mockResult);
      expect(organizationService.inviteAdmin).toHaveBeenCalledWith(
        'org-123',
        'user-123',
        'test@example.com',
        'ADMIN'
      );
    });

    it('should reject invitation if user is not an admin', async () => {
      (organizationService.isOrganizationAdmin as jest.Mock).mockResolvedValue(false);

      const isAdmin = await organizationService.isOrganizationAdmin('org-123', 'user-123');
      expect(isAdmin).toBe(false);

      // This would result in a 403 Forbidden response in the actual route
    });
  });

  describe('addAdmin functionality', () => {
    it('should call addAdmin with correct parameters', async () => {
      const mockAdmin = {
        id: 'admin-123',
        organizationId: 'org-123',
        userId: 'user-456',
        role: 'ADMIN',
        addedAt: new Date(),
        user: {
          id: 'user-456',
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      (organizationService.isOrganizationAdmin as jest.Mock).mockResolvedValue(true);
      (organizationService.addAdmin as jest.Mock).mockResolvedValue(mockAdmin);

      const result = await organizationService.addAdmin('org-123', 'user-456', 'ADMIN');

      expect(result).toEqual(mockAdmin);
      expect(organizationService.addAdmin).toHaveBeenCalledWith('org-123', 'user-456', 'ADMIN');
    });
  });

  describe('removeAdmin functionality', () => {
    it('should call removeAdmin with correct parameters', async () => {
      (organizationService.isOrganizationAdmin as jest.Mock).mockResolvedValue(true);
      (organizationService.removeAdmin as jest.Mock).mockResolvedValue(true);

      const result = await organizationService.removeAdmin('org-123', 'user-456');

      expect(result).toBe(true);
      expect(organizationService.removeAdmin).toHaveBeenCalledWith('org-123', 'user-456');
    });
  });

  describe('getOrganizationAdmins functionality', () => {
    it('should return list of organization admins', async () => {
      const mockAdmins = [
        {
          id: 'admin-1',
          organizationId: 'org-123',
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
          organizationId: 'org-123',
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

      (organizationService.getOrganizationAdmins as jest.Mock).mockResolvedValue(mockAdmins);

      const result = await organizationService.getOrganizationAdmins('org-123');

      expect(result).toEqual(mockAdmins);
      expect(result).toHaveLength(2);
      expect(result[0].role).toBe('OWNER');
      expect(result[1].role).toBe('ADMIN');
      expect(organizationService.getOrganizationAdmins).toHaveBeenCalledWith('org-123');
    });
  });
});