import React from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

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
    const baseClasses = 'inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors';

    if (disabled || loading) {
      return `${baseClasses} opacity-50 cursor-not-allowed bg-gray-100 border-gray-300 text-gray-500`;
    }

    switch (variant) {
      case 'primary':
        return `${baseClasses} border-transparent text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500`;
      case 'danger':
        return `${baseClasses} border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500`;
      case 'secondary':
      default:
        return `${baseClasses} border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-indigo-500`;
    }
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex py-3" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              {breadcrumbs.map((item, index) => (
                <li key={index}>
                  <div className="flex items-center">
                    {index > 0 && (
                      <ChevronRightIcon className="flex-shrink-0 h-4 w-4 text-gray-400 mr-4" />
                    )}
                    {item.href && !item.current ? (
                      <a
                        href={item.href}
                        className="text-sm font-medium text-gray-500 hover:text-gray-700"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <span
                        className={`text-sm font-medium ${item.current ? 'text-gray-900' : 'text-gray-500'
                          }`}
                      >
                        {item.label}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Title and Actions */}
        <div className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
              )}
            </div>

            {/* Actions */}
            {actions && actions.length > 0 && (
              <div className="flex space-x-3">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    disabled={action.disabled || action.loading}
                    className={getButtonClasses(action.variant, action.disabled, action.loading)}
                  >
                    {action.loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      action.icon && <action.icon className="h-4 w-4 mr-2" />
                    )}
                    {action.label}
                  </button>
                ))}
              </div>
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
        {tabs && tabs.length > 0 && (
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={tab.onClick}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${tab.current
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  {tab.label}
                  {tab.badge && (
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tab.current
                        ? 'bg-indigo-100 text-indigo-600'
                        : 'bg-gray-100 text-gray-600'
                      }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Filters and View Controls */}
        {(filters || viewControls) && (
          <div className="py-4 flex items-center justify-between">
            {/* Filters */}
            {filters && filters.length > 0 && (
              <div className="flex items-center space-x-4">
                {filters.map((filter) => (
                  <div key={filter.id} className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">
                      {filter.label}:
                    </label>
                    {filter.type === 'select' && (
                      <select
                        value={filter.value}
                        onChange={(e) => filter.onChange(e.target.value)}
                        className="border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
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
        )}
      </div>
    </div>
  );
};

export default PageHeader;