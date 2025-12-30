import { EmailTemplate } from '../../types';

interface EmailTemplatesProps {
  templates: EmailTemplate[];
  isLoading: boolean;
  selectedTemplate: EmailTemplate | null;
  onTemplateSelect: (template: EmailTemplate) => void;
}

export function EmailTemplates({
  templates,
  isLoading,
  selectedTemplate,
  onTemplateSelect
}: EmailTemplatesProps) {
  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Email Templates</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
          <span>Loading templates...</span>
        </div>
      </div>
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Email Templates</h3>
        <div className="text-center py-6">
          <div className="text-gray-400 text-4xl mb-2">📧</div>
          <p className="text-gray-600">No email templates available</p>
          <p className="text-sm text-gray-500 mt-1">
            You can still compose emails manually below
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Email Templates</h3>
      <p className="text-sm text-gray-600 mb-4">
        Choose a pre-built template to get started quickly, or compose your own email from scratch.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
              selectedTemplate?.id === template.id
                ? 'border-indigo-500 bg-indigo-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
            onClick={() => onTemplateSelect(template)}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900">{template.name}</h4>
              {selectedTemplate?.id === template.id && (
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Subject:</p>
                <p className="text-sm text-gray-600 truncate">{template.subject}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Preview:</p>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {template.body.substring(0, 100)}
                  {template.body.length > 100 ? '...' : ''}
                </p>
              </div>

              {template.variables.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Variables:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.slice(0, 3).map((variable) => (
                      <span
                        key={variable}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {`{{${variable}}}`}
                      </span>
                    ))}
                    {template.variables.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{template.variables.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200">
              <button
                type="button"
                className={`w-full text-sm font-medium py-1 px-2 rounded transition-colors ${
                  selectedTemplate?.id === template.id
                    ? 'text-indigo-700 bg-indigo-100'
                    : 'text-gray-700 hover:text-indigo-600'
                }`}
              >
                {selectedTemplate?.id === template.id ? 'Selected' : 'Use Template'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedTemplate && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start space-x-2">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">
                Template "{selectedTemplate.name}" applied
              </p>
              <p className="text-sm text-blue-700 mt-1">
                The subject and body fields have been populated with the template content. 
                You can modify them as needed before sending.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}