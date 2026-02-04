import React, { useState } from 'react';
import {
  PlusIcon,
  XMarkIcon,
  ArrowsPointingOutIcon,
  Bars3Icon,
  ChartBarIcon,
  TableCellsIcon,
  ListBulletIcon,
  SignalIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { DashboardWidget } from '../../types';

interface CustomDashboardProps {
  widgets: DashboardWidget[];
  onWidgetsChange: (widgets: DashboardWidget[]) => void;
  availableWidgetTypes: string[];
}

interface WidgetTemplate {
  type: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultSize: 'small' | 'medium' | 'large';
  configurable: boolean;
}

export const CustomDashboard: React.FC<CustomDashboardProps> = ({
  widgets,
  onWidgetsChange,
  availableWidgetTypes,
}) => {
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [showAddWidget, setShowAddWidget] = useState(false);

  const widgetTemplates: WidgetTemplate[] = [
    {
      type: 'metric',
      name: 'Metric Card',
      description: 'Display a single key metric with trend',
      icon: ChartBarIcon,
      defaultSize: 'small',
      configurable: true,
    },
    {
      type: 'chart',
      name: 'Chart Widget',
      description: 'Visualize data with charts and graphs',
      icon: ChartBarIcon,
      defaultSize: 'large',
      configurable: true,
    },
    {
      type: 'table',
      name: 'Data Table',
      description: 'Display tabular data with sorting',
      icon: TableCellsIcon,
      defaultSize: 'medium',
      configurable: true,
    },
    {
      type: 'list',
      name: 'List Widget',
      description: 'Show items in a simple list format',
      icon: ListBulletIcon,
      defaultSize: 'medium',
      configurable: true,
    },
    {
      type: 'status',
      name: 'Status Indicator',
      description: 'Show system or service status',
      icon: SignalIcon,
      defaultSize: 'small',
      configurable: false,
    },
    {
      type: 'quickAction',
      name: 'Quick Actions',
      description: 'Provide quick access to common actions',
      icon: BoltIcon,
      defaultSize: 'small',
      configurable: true,
    },
  ];

  const handleAddWidget = (template: WidgetTemplate) => {
    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      type: template.type as any,
      title: template.name,
      size: template.defaultSize,
      data: getDefaultWidgetData(template.type),
    };

    onWidgetsChange([...widgets, newWidget]);
    setShowAddWidget(false);
  };

  const handleRemoveWidget = (widgetId: string) => {
    onWidgetsChange(widgets.filter(w => w.id !== widgetId));
  };

  const handleWidgetSizeChange = (widgetId: string, size: 'small' | 'medium' | 'large') => {
    onWidgetsChange(
      widgets.map(w => w.id === widgetId ? { ...w, size } : w)
    );
  };

  const handleDragStart = (widgetId: string) => {
    setDraggedWidget(widgetId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetWidgetId: string) => {
    e.preventDefault();
    
    if (!draggedWidget || draggedWidget === targetWidgetId) {
      setDraggedWidget(null);
      return;
    }

    const draggedIndex = widgets.findIndex(w => w.id === draggedWidget);
    const targetIndex = widgets.findIndex(w => w.id === targetWidgetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedWidget(null);
      return;
    }

    const newWidgets = [...widgets];
    const [draggedItem] = newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(targetIndex, 0, draggedItem);

    onWidgetsChange(newWidgets);
    setDraggedWidget(null);
  };

  const getDefaultWidgetData = (type: string) => {
    switch (type) {
      case 'metric':
        return {
          value: '0',
          change: '+0%',
          changeType: 'neutral',
          label: 'Configure this metric',
        };
      case 'chart':
        return {
          chartData: [],
          chartType: 'line',
        };
      case 'table':
        return {
          headers: ['Column 1', 'Column 2'],
          rows: [['Data 1', 'Data 2']],
        };
      case 'list':
        return {
          items: [
            { label: 'Item 1', value: 'Value 1' },
            { label: 'Item 2', value: 'Value 2' },
          ],
        };
      case 'status':
        return {
          status: 'healthy',
          message: 'System operational',
          details: 'All services running normally',
        };
      case 'quickAction':
        return {
          actions: [
            { label: 'Action 1', onClick: () => {} },
            { label: 'Action 2', onClick: () => {} },
          ],
        };
      default:
        return {};
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'small':
        return 'col-span-1 row-span-1';
      case 'medium':
        return 'col-span-2 row-span-1';
      case 'large':
        return 'col-span-2 row-span-2';
      default:
        return 'col-span-1 row-span-1';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Customize Dashboard</h2>
          <p className="text-sm text-gray-500">
            Add, remove, and rearrange widgets to create your perfect dashboard
          </p>
        </div>
        <button
          onClick={() => setShowAddWidget(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Widget
        </button>
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">
        {widgets.map((widget) => (
          <div
            key={widget.id}
            draggable
            onDragStart={() => handleDragStart(widget.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, widget.id)}
            className={`bg-white rounded-lg shadow border-2 border-dashed border-gray-300 hover:border-indigo-400 transition-colors cursor-move ${getSizeClasses(widget.size)}`}
          >
            <div className="p-4">
              {/* Widget Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Bars3Icon className="h-4 w-4 text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-900">{widget.title}</h3>
                </div>
                <div className="flex items-center space-x-1">
                  {/* Size Controls */}
                  <select
                    value={widget.size}
                    onChange={(e) => handleWidgetSizeChange(widget.id, e.target.value as any)}
                    className="text-xs border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                  <button
                    onClick={() => handleRemoveWidget(widget.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Widget Preview */}
              <div className="bg-gray-50 rounded p-3 text-center">
                <p className="text-xs text-gray-500 mb-2">{widget.type} widget</p>
                <div className="text-sm text-gray-700">
                  {widget.type === 'metric' && (
                    <div>
                      <div className="text-lg font-bold">123</div>
                      <div className="text-xs text-green-600">+5%</div>
                    </div>
                  )}
                  {widget.type === 'chart' && (
                    <div className="h-16 bg-gray-200 rounded flex items-center justify-center">
                      <ChartBarIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  {widget.type === 'table' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Header 1</span>
                        <span>Header 2</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Data 1</span>
                        <span>Data 2</span>
                      </div>
                    </div>
                  )}
                  {widget.type === 'list' && (
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Item 1</span>
                        <span>Value</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Item 2</span>
                        <span>Value</span>
                      </div>
                    </div>
                  )}
                  {widget.type === 'status' && (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs">Healthy</span>
                    </div>
                  )}
                  {widget.type === 'quickAction' && (
                    <div className="space-y-1">
                      <button className="w-full text-xs bg-indigo-100 text-indigo-700 py-1 rounded">
                        Action 1
                      </button>
                      <button className="w-full text-xs bg-indigo-100 text-indigo-700 py-1 rounded">
                        Action 2
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {widgets.length === 0 && (
          <div className="col-span-full text-center py-12">
            <ArrowsPointingOutIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No widgets added</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start customizing your dashboard by adding some widgets.
            </p>
          </div>
        )}
      </div>

      {/* Add Widget Modal */}
      {showAddWidget && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 sm:p-6 z-50">
          <div className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto shadow-lg rounded-md border mx-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add Widget</h3>
              <button
                onClick={() => setShowAddWidget(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-3">
              {widgetTemplates
                .filter(template => availableWidgetTypes.includes(template.type))
                .map((template) => (
                  <button
                    key={template.type}
                    onClick={() => handleAddWidget(template)}
                    className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <template.icon className="h-6 w-6 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">{template.name}</div>
                        <div className="text-sm text-gray-500">{template.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Customization Tips</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Drag widgets to reorder them</li>
          <li>• Use the dropdown to change widget sizes</li>
          <li>• Click the × button to remove widgets</li>
          <li>• Changes are saved automatically</li>
        </ul>
      </div>
    </div>
  );
};

export default CustomDashboard;