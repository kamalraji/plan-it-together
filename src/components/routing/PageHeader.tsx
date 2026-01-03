import React from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';
import { MobileActionsDropdown } from './MobileActionsDropdown';
interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export interface PageAction {
  label: string;
  action: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}

export interface TabConfig {
  id: string;
  label: string;
  current: boolean;
  badge?: string | number;
  href?: string;
  onClick?: () => void;
}

export interface FilterConfig {
  id: string;
  label: string;
  type: 'select' | 'search' | 'date' | 'toggle';
  value: any;
  options?: { label: string; value: any }[];
  onChange: (value: any) => void;
}

export interface ViewControlConfig {
  type: 'table' | 'cards' | 'list';
  active: boolean;
  onChange: (type: string) => void;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: PageAction[];
  tabs?: TabConfig[];
  filters?: FilterConfig[];
  viewControls?: ViewControlConfig[];
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  tabs,
  filters,
  viewControls,
  children,
}) => {
  const getButtonClasses = (variant: string, disabled?: boolean, loading?: boolean) => {
    const baseClasses = 'inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border text-xs sm:text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all';

    if (disabled || loading) {
      return `${baseClasses} opacity-50 cursor-not-allowed bg-muted border-border text-muted-foreground`;
    }

    switch (variant) {
      case 'primary':
        return `${baseClasses} border-transparent text-primary-foreground bg-primary hover:bg-primary/90 focus:ring-primary shadow-sm`;
      case 'danger':
        return `${baseClasses} border-transparent text-destructive-foreground bg-destructive hover:bg-destructive/90 focus:ring-destructive`;
      case 'secondary':
      default:
        return `${baseClasses} border-border text-foreground bg-background hover:bg-muted focus:ring-primary`;
    }
  };

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <div className="px-4 sm:px-6">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex py-3 overflow-x-auto" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 sm:gap-4">
              {breadcrumbs.map((item, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && (
                    <ChevronRightIcon className="flex-shrink-0 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground mr-2 sm:mr-4" />
                  )}
                  {item.href && !item.current ? (
                    <a
                      href={item.href}
                      className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <span
                      className={`text-xs sm:text-sm font-medium whitespace-nowrap ${item.current ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                    >
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Title and Actions */}
        <div className="py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight text-foreground truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>

            {/* Actions */}
            {actions && actions.length > 0 && (
              <>
                {/* Mobile: Dropdown Menu */}
                <MobileActionsDropdown actions={actions} />
                
                {/* Desktop: Full Button List */}
                <div className="hidden sm:flex flex-wrap gap-2">
                  {actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      disabled={action.disabled || action.loading}
                      className={getButtonClasses(action.variant, action.disabled, action.loading)}
                    >
                      {action.loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      ) : (
                        action.icon && <action.icon className="h-4 w-4 mr-1.5 sm:mr-2" />
                      )}
                      <span className="text-xs sm:text-sm whitespace-nowrap">{action.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Custom Content */}
          {children && (
            <div className="mt-4">
              {children}
            </div>
          )}
        </div>

        {/* Tabs */}
        {
          tabs && tabs.length > 0 && (
            <div className="border-t border-border -mx-4 sm:-mx-6 px-4 sm:px-6">
              <nav className="-mb-px flex gap-1 sm:gap-2 overflow-x-auto py-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={tab.onClick}
                    className={`py-2.5 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${tab.current
                      ? 'border-primary text-primary bg-primary/5 rounded-t-lg'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                      }`}
                  >
                    {tab.label}
                    {tab.badge && (
                      <Badge
                        variant={tab.current ? 'default' : 'outline'}
                        className="ml-1.5 sm:ml-2 rounded-full px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium"
                      >
                        {tab.badge}
                      </Badge>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          )
        }

        {/* Filters and View Controls */}
        {
          (filters || viewControls) && (
            <div className="py-4 flex items-center justify-between">
              {/* Filters */}
              {filters && filters.length > 0 && (
                <div className="flex items-center space-x-4">
                  {filters.map((filter) => (
                    <div key={filter.id} className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-foreground">
                        {filter.label}:
                      </label>
                      {filter.type === 'select' && (
                        <select
                          value={filter.value}
                          onChange={(e) => filter.onChange(e.target.value)}
                          className="border-input rounded-md text-sm focus:ring-primary focus:border-primary bg-background/80"
                        >
                          {filter.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}
                      {filter.type === 'search' && (
                        <input
                          type="text"
                          value={filter.value}
                          onChange={(e) => filter.onChange(e.target.value)}
                          placeholder={`Search ${filter.label.toLowerCase()}...`}
                          className="border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      )}
                      {filter.type === 'toggle' && (
                        <button
                          onClick={() => filter.onChange(!filter.value)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${filter.value ? 'bg-indigo-600' : 'bg-gray-200'
                            }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${filter.value ? 'translate-x-5' : 'translate-x-0'
                              }`}
                          />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* View Controls */}
              {viewControls && viewControls.length > 0 && (
                <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
                  {viewControls.map((control) => (
                    <button
                      key={control.type}
                      onClick={() => control.onChange(control.type)}
                      className={`px-3 py-1 text-sm font-medium rounded ${control.active
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      {control.type.charAt(0).toUpperCase() + control.type.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        }
      </div>
    </div>
  );
};

export default PageHeader;