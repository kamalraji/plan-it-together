/**
 * Zustand Store - Workspace State Management
 * Centralized state for complex cross-component workspace data
 */
import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';

export interface WorkspaceTask {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeIds: string[];
  workspaceId: string;
  dueDate?: string;
  tags?: string[];
}

export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message?: string;
  read: boolean;
  createdAt: string;
}

interface WorkspaceState {
  // Current workspace context
  currentWorkspaceId: string | null;
  currentWorkspaceName: string | null;
  
  // UI State
  sidebarCollapsed: boolean;
  activeTab: string;
  commandPaletteOpen: boolean;
  
  // Selection state
  selectedTaskIds: Set<string>;
  
  // Cached data for cross-component access
  tasks: Map<string, WorkspaceTask>;
  members: Map<string, WorkspaceMember>;
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  
  // Sync state
  isSyncing: boolean;
  lastSyncedAt: string | null;
  pendingChanges: number;
}

interface WorkspaceActions {
  // Workspace navigation
  setCurrentWorkspace: (id: string | null, name?: string | null) => void;
  
  // UI actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveTab: (tab: string) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  
  // Task selection
  selectTask: (taskId: string) => void;
  deselectTask: (taskId: string) => void;
  toggleTaskSelection: (taskId: string) => void;
  selectAllTasks: (taskIds: string[]) => void;
  clearTaskSelection: () => void;
  
  // Cache management
  setTasks: (tasks: WorkspaceTask[]) => void;
  updateTask: (taskId: string, updates: Partial<WorkspaceTask>) => void;
  removeTask: (taskId: string) => void;
  setMembers: (members: WorkspaceMember[]) => void;
  
  // Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  
  // Sync
  setSyncing: (syncing: boolean) => void;
  updateSyncStatus: (lastSynced: string, pendingChanges: number) => void;
  
  // Reset
  reset: () => void;
}

const initialState: WorkspaceState = {
  currentWorkspaceId: null,
  currentWorkspaceName: null,
  sidebarCollapsed: false,
  activeTab: 'overview',
  commandPaletteOpen: false,
  selectedTaskIds: new Set(),
  tasks: new Map(),
  members: new Map(),
  notifications: [],
  unreadCount: 0,
  isSyncing: false,
  lastSyncedAt: null,
  pendingChanges: 0,
};

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>()(
  devtools(
    subscribeWithSelector(
      persist(
        (set, get) => ({
          ...initialState,
          
          // Workspace navigation
          setCurrentWorkspace: (id, name = null) => set({
            currentWorkspaceId: id,
            currentWorkspaceName: name,
            selectedTaskIds: new Set(), // Clear selection on workspace change
          }),
          
          // UI actions
          toggleSidebar: () => set((state) => ({ 
            sidebarCollapsed: !state.sidebarCollapsed 
          })),
          
          setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
          
          setActiveTab: (tab) => set({ activeTab: tab }),
          
          setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
          
          // Task selection
          selectTask: (taskId) => set((state) => {
            const newSet = new Set(state.selectedTaskIds);
            newSet.add(taskId);
            return { selectedTaskIds: newSet };
          }),
          
          deselectTask: (taskId) => set((state) => {
            const newSet = new Set(state.selectedTaskIds);
            newSet.delete(taskId);
            return { selectedTaskIds: newSet };
          }),
          
          toggleTaskSelection: (taskId) => {
            const { selectedTaskIds } = get();
            if (selectedTaskIds.has(taskId)) {
              get().deselectTask(taskId);
            } else {
              get().selectTask(taskId);
            }
          },
          
          selectAllTasks: (taskIds) => set({
            selectedTaskIds: new Set(taskIds),
          }),
          
          clearTaskSelection: () => set({
            selectedTaskIds: new Set(),
          }),
          
          // Cache management
          setTasks: (tasks) => set({
            tasks: new Map(tasks.map(t => [t.id, t])),
          }),
          
          updateTask: (taskId, updates) => set((state) => {
            const newTasks = new Map(state.tasks);
            const existing = newTasks.get(taskId);
            if (existing) {
              newTasks.set(taskId, { ...existing, ...updates });
            }
            return { tasks: newTasks };
          }),
          
          removeTask: (taskId) => set((state) => {
            const newTasks = new Map(state.tasks);
            newTasks.delete(taskId);
            const newSelected = new Set(state.selectedTaskIds);
            newSelected.delete(taskId);
            return { tasks: newTasks, selectedTaskIds: newSelected };
          }),
          
          setMembers: (members) => set({
            members: new Map(members.map(m => [m.id, m])),
          }),
          
          // Notifications
          addNotification: (notification) => set((state) => ({
            notifications: [
              {
                ...notification,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                read: false,
              },
              ...state.notifications,
            ].slice(0, 100), // Keep last 100
            unreadCount: state.unreadCount + 1,
          })),
          
          markNotificationRead: (id) => set((state) => {
            const notification = state.notifications.find(n => n.id === id);
            if (notification && !notification.read) {
              return {
                notifications: state.notifications.map(n =>
                  n.id === id ? { ...n, read: true } : n
                ),
                unreadCount: Math.max(0, state.unreadCount - 1),
              };
            }
            return state;
          }),
          
          markAllNotificationsRead: () => set((state) => ({
            notifications: state.notifications.map(n => ({ ...n, read: true })),
            unreadCount: 0,
          })),
          
          clearNotifications: () => set({
            notifications: [],
            unreadCount: 0,
          }),
          
          // Sync
          setSyncing: (syncing) => set({ isSyncing: syncing }),
          
          updateSyncStatus: (lastSynced, pendingChanges) => set({
            lastSyncedAt: lastSynced,
            pendingChanges,
          }),
          
          // Reset
          reset: () => set(initialState),
        }),
        {
          name: 'workspace-storage',
          partialize: (state) => ({
            sidebarCollapsed: state.sidebarCollapsed,
            currentWorkspaceId: state.currentWorkspaceId,
          }),
        }
      )
    ),
    { name: 'WorkspaceStore' }
  )
);

// Selectors for optimized subscriptions
export const useSelectedTaskCount = () => 
  useWorkspaceStore((state) => state.selectedTaskIds.size);

export const useIsTaskSelected = (taskId: string) =>
  useWorkspaceStore((state) => state.selectedTaskIds.has(taskId));

export const useUnreadNotifications = () =>
  useWorkspaceStore((state) => state.unreadCount);

export const useIsSyncing = () =>
  useWorkspaceStore((state) => state.isSyncing);
