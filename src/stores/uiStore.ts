/**
 * Zustand Store - UI State Management
 * Global UI state that persists across routes
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';
type ViewMode = 'grid' | 'list' | 'kanban' | 'timeline';

interface ModalState {
  id: string;
  props?: Record<string, unknown>;
}

interface UIState {
  // Theme
  theme: Theme;
  
  // View preferences
  taskViewMode: ViewMode;
  compactMode: boolean;
  showCompletedTasks: boolean;
  
  // Modals/Dialogs
  openModals: ModalState[];
  
  // Panels
  rightPanelOpen: boolean;
  rightPanelContent: string | null;
  
  // Toast queue
  toastQueue: Array<{
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  }>;
  
  // Loading states
  globalLoading: boolean;
  loadingMessage: string | null;
}

interface UIActions {
  // Theme
  setTheme: (theme: Theme) => void;
  
  // View preferences
  setTaskViewMode: (mode: ViewMode) => void;
  toggleCompactMode: () => void;
  toggleShowCompletedTasks: () => void;
  
  // Modals
  openModal: (id: string, props?: Record<string, unknown>) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  
  // Panels
  openRightPanel: (content: string) => void;
  closeRightPanel: () => void;
  toggleRightPanel: () => void;
  
  // Loading
  setGlobalLoading: (loading: boolean, message?: string) => void;
  
  // Toast
  addToast: (type: UIState['toastQueue'][0]['type'], message: string) => void;
  removeToast: (id: string) => void;
}

const initialState: UIState = {
  theme: 'system',
  taskViewMode: 'list',
  compactMode: false,
  showCompletedTasks: true,
  openModals: [],
  rightPanelOpen: false,
  rightPanelContent: null,
  toastQueue: [],
  globalLoading: false,
  loadingMessage: null,
};

export const useUIStore = create<UIState & UIActions>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        
        // Theme
        setTheme: (theme) => set({ theme }),
        
        // View preferences
        setTaskViewMode: (mode) => set({ taskViewMode: mode }),
        
        toggleCompactMode: () => set((state) => ({
          compactMode: !state.compactMode,
        })),
        
        toggleShowCompletedTasks: () => set((state) => ({
          showCompletedTasks: !state.showCompletedTasks,
        })),
        
        // Modals
        openModal: (id, props) => set((state) => ({
          openModals: [...state.openModals, { id, props }],
        })),
        
        closeModal: (id) => set((state) => ({
          openModals: state.openModals.filter((m) => m.id !== id),
        })),
        
        closeAllModals: () => set({ openModals: [] }),
        
        // Panels
        openRightPanel: (content) => set({
          rightPanelOpen: true,
          rightPanelContent: content,
        }),
        
        closeRightPanel: () => set({
          rightPanelOpen: false,
          rightPanelContent: null,
        }),
        
        toggleRightPanel: () => set((state) => ({
          rightPanelOpen: !state.rightPanelOpen,
        })),
        
        // Loading
        setGlobalLoading: (loading, message) => set({
          globalLoading: loading,
          loadingMessage: message ?? null,
        }),
        
        // Toast
        addToast: (type, message) => set((state) => ({
          toastQueue: [
            ...state.toastQueue,
            { id: crypto.randomUUID(), type, message },
          ].slice(-5), // Keep last 5
        })),
        
        removeToast: (id) => set((state) => ({
          toastQueue: state.toastQueue.filter((t) => t.id !== id),
        })),
      }),
      {
        name: 'ui-storage',
        partialize: (state) => ({
          theme: state.theme,
          taskViewMode: state.taskViewMode,
          compactMode: state.compactMode,
          showCompletedTasks: state.showCompletedTasks,
        }),
      }
    ),
    { name: 'UIStore' }
  )
);

// Selectors
export const useTheme = () => useUIStore((state) => state.theme);
export const useTaskViewMode = () => useUIStore((state) => state.taskViewMode);
export const useIsModalOpen = (id: string) =>
  useUIStore((state) => state.openModals.some((m) => m.id === id));
export const useModalProps = (id: string) =>
  useUIStore((state) => state.openModals.find((m) => m.id === id)?.props);
