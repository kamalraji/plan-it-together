import { 
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { Workspace } from '../../../types';

interface MobileWorkspaceHeaderProps {
  workspace: Workspace;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
}

export function MobileWorkspaceHeader({ 
  workspace, 
  isMenuOpen, 
  onMenuToggle 
}: MobileWorkspaceHeaderProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PROVISIONING':
        return 'bg-yellow-100 text-yellow-800';
      case 'WINDING_DOWN':
        return 'bg-orange-100 text-orange-800';
      case 'DISSOLVED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side - Menu toggle and workspace info */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <button
            onClick={onMenuToggle}
            className="p-2 -ml-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            {isMenuOpen ? (
              <XMarkIcon className="w-6 h-6 text-gray-600" />
            ) : (
              <Bars3Icon className="w-6 h-6 text-gray-600" />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {workspace.name}
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(workspace.status)}`}>
                {workspace.status.toLowerCase().replace('_', ' ')}
              </span>
              {workspace.event && (
                <span className="text-xs text-gray-500 truncate">
                  {workspace.event.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-md hover:bg-gray-100 transition-colors relative">
            <BellIcon className="w-5 h-5 text-gray-600" />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              3
            </span>
          </button>
          
          <button className="p-2 rounded-md hover:bg-gray-100 transition-colors">
            <EllipsisVerticalIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}