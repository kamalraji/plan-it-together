/**
 * Zustand Stores - Centralized State Management
 * 
 * Usage:
 * ```tsx
 * import { useWorkspaceStore, useUIStore } from '@/stores';
 * 
 * function MyComponent() {
 *   const currentWorkspaceId = useWorkspaceStore(state => state.currentWorkspaceId);
 *   const theme = useUIStore(state => state.theme);
 *   
 *   // Or use selectors for optimized re-renders
 *   const selectedCount = useSelectedTaskCount();
 * }
 * ```
 */

export {
  useWorkspaceStore,
  useSelectedTaskCount,
  useIsTaskSelected,
  useUnreadNotifications,
  useIsSyncing,
  type WorkspaceTask,
  type WorkspaceMember,
  type Notification,
} from './workspaceStore';

export {
  useUIStore,
  useTheme,
  useTaskViewMode,
  useIsModalOpen,
  useModalProps,
} from './uiStore';
