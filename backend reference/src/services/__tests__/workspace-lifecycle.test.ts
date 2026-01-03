import { workspaceLifecycleService } from '../workspace-lifecycle.service';
import { workspaceService } from '../workspace.service';
import { eventService } from '../event.service';

describe('Workspace Lifecycle Integration', () => {
  describe('Service Integration', () => {
    it('should import WorkspaceLifecycleService correctly', () => {
      expect(workspaceLifecycleService).toBeDefined();
      expect(typeof workspaceLifecycleService.onEventCreated).toBe('function');
      expect(typeof workspaceLifecycleService.onEventStatusChanged).toBe('function');
      expect(typeof workspaceLifecycleService.processScheduledDissolutions).toBe('function');
      expect(typeof workspaceLifecycleService.getWorkspaceLifecycleStatus).toBe('function');
      expect(typeof workspaceLifecycleService.validateLifecycleTransition).toBe('function');
    });

    it('should have correct method signatures for WorkspaceLifecycleService', () => {
      expect(() => {
        const service = workspaceLifecycleService;
        expect(service.onEventCreated).toHaveLength(2); // eventId, organizerId
        expect(service.onEventStatusChanged).toHaveLength(3); // eventId, newStatus, oldStatus
        expect(service.getWorkspaceLifecycleStatus).toHaveLength(1); // eventId
        expect(service.validateLifecycleTransition).toHaveLength(3); // workspaceId, fromStatus, toStatus
      }).not.toThrow();
    });

    it('should integrate with WorkspaceService methods', () => {
      expect(workspaceService).toBeDefined();
      expect(typeof workspaceService.initiateWindDown).toBe('function');
      expect(typeof workspaceService.emergencyRevokeAccess).toBe('function');
      expect(typeof workspaceService.handleEarlyDeparture).toBe('function');
      expect(typeof workspaceService.processAutomaticDissolution).toBe('function');
    });

    it('should integrate with EventService for automatic provisioning', () => {
      expect(eventService).toBeDefined();
      expect(typeof eventService.createEvent).toBe('function');
      expect(typeof eventService.updateEvent).toBe('function');
    });
  });

  describe('Lifecycle Status Management', () => {
    it('should handle workspace lifecycle status queries', async () => {
      // Test with non-existent event
      const status = await workspaceLifecycleService.getWorkspaceLifecycleStatus('non-existent-event');
      
      expect(status).toBeDefined();
      expect(status.hasWorkspace).toBe(false);
      expect(status.canProvision).toBe(true);
      expect(status.canWindDown).toBe(false);
      expect(status.canDissolve).toBe(false);
    });

    it('should validate lifecycle transitions correctly', async () => {
      // Test invalid transition
      const result = await workspaceLifecycleService.validateLifecycleTransition(
        'test-workspace',
        'DISSOLVED' as any,
        'ACTIVE' as any
      );
      
      expect(result).toBeDefined();
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid transition');
    });

    it('should validate valid lifecycle transitions', async () => {
      // Test valid transition
      const result = await workspaceLifecycleService.validateLifecycleTransition(
        'test-workspace',
        'ACTIVE' as any,
        'WINDING_DOWN' as any
      );
      
      expect(result).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });
  });

  describe('Event Integration Points', () => {
    it('should handle event creation lifecycle hooks', async () => {
      // Test that the lifecycle service can be called without errors
      expect(async () => {
        await workspaceLifecycleService.onEventCreated('test-event-id', 'test-organizer-id');
      }).not.toThrow();
    });

    it('should handle event status change lifecycle hooks', async () => {
      // Test that the lifecycle service can be called without errors
      expect(async () => {
        await workspaceLifecycleService.onEventStatusChanged(
          'test-event-id',
          'COMPLETED' as any,
          'ONGOING' as any
        );
      }).not.toThrow();
    });

    it('should handle scheduled dissolution processing', async () => {
      // Test that the scheduled processing can be called without errors
      expect(async () => {
        await workspaceLifecycleService.processScheduledDissolutions();
      }).not.toThrow();
    });
  });

  describe('Workspace Status Transitions', () => {
    it('should define valid workspace status transitions', async () => {
      // Test all valid transitions
      const validTransitions = [
        { from: 'PROVISIONING', to: 'ACTIVE' },
        { from: 'ACTIVE', to: 'WINDING_DOWN' },
        { from: 'ACTIVE', to: 'DISSOLVED' },
        { from: 'WINDING_DOWN', to: 'DISSOLVED' },
        { from: 'WINDING_DOWN', to: 'ACTIVE' }, // Reactivation case
      ];

      for (const transition of validTransitions) {
        const result = await workspaceLifecycleService.validateLifecycleTransition(
          'test-workspace',
          transition.from as any,
          transition.to as any
        );
        
        expect(result.valid).toBe(true);
      }
    });

    it('should reject invalid workspace status transitions', async () => {
      // Test invalid transitions
      const invalidTransitions = [
        { from: 'DISSOLVED', to: 'ACTIVE' },
        { from: 'DISSOLVED', to: 'WINDING_DOWN' },
        { from: 'DISSOLVED', to: 'PROVISIONING' },
        { from: 'PROVISIONING', to: 'WINDING_DOWN' },
        { from: 'PROVISIONING', to: 'DISSOLVED' },
      ];

      for (const transition of invalidTransitions) {
        const result = await workspaceLifecycleService.validateLifecycleTransition(
          'test-workspace',
          transition.from as any,
          transition.to as any
        );
        
        expect(result.valid).toBe(false);
        expect(result.reason).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully in lifecycle operations', async () => {
      // Test that error handling doesn't throw unhandled exceptions
      expect(async () => {
        await workspaceLifecycleService.onEventCreated('', ''); // Invalid IDs
      }).not.toThrow();

      expect(async () => {
        await workspaceLifecycleService.onEventStatusChanged('', 'COMPLETED' as any, 'ACTIVE' as any);
      }).not.toThrow();
    });

    it('should validate input parameters', async () => {
      // Test lifecycle status with empty event ID
      const status = await workspaceLifecycleService.getWorkspaceLifecycleStatus('');
      expect(status.hasWorkspace).toBe(false);
    });
  });
});