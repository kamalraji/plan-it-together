import { useParams, useNavigate } from 'react-router-dom';
import { TemplateManagementPage } from '@/components/workspace/templates';
import { EnhancedWorkspaceTemplate } from '@/lib/workspaceTemplates';
import { ArrowLeftIcon, FolderIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

export function OrgTemplatesPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const navigate = useNavigate();

  const handleSelectTemplate = (template: EnhancedWorkspaceTemplate) => {
    // Navigate to workspace creation with pre-selected template
    navigate(`/${orgSlug}/workspaces/create?template=${template.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(`/${orgSlug}/dashboard`)}
            className="mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FolderIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Workspace Templates</h1>
              <p className="text-sm text-muted-foreground">Browse and select templates to quickly set up workspaces for your events</p>
            </div>
          </div>
        </div>

        <TemplateManagementPage
          onSelectTemplate={handleSelectTemplate}
          title="Available Templates"
          description="Choose a template to create a new workspace with pre-configured departments, committees, tasks, and milestones"
        />
      </div>
    </div>
  );
}