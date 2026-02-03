import React from 'react';
import 'grapesjs/dist/css/grapes.min.css';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  usePageBuilder, 
  LeftPanel, 
  RightPanel, 
  CanvasArea, 
  pageBuilderTheme,
  SaveIndicator,
  PublishDialog,
  PreviewOverlay,
  VersionHistory,
} from './page-builder';
import { BuilderThemeProvider, useBuilderTheme } from './page-builder/BuilderThemeContext';
import { ArrowLeft, Save, Eye, Maximize2, Minimize2, Sun, Moon, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * EventPageBuilder
 *
 * Full-featured GrapesJS-based landing page builder for events.
 * Three-panel layout: Left (Layers/Assets), Center (Canvas), Right (Styles/Prototype)
 */
const EventPageBuilderContent: React.FC = () => {
  const { eventId, orgSlug } = useParams<{ eventId: string; orgSlug: string }>();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = React.useState(true);
  const { theme, toggleTheme, isDark } = useBuilderTheme();

  const {
    containerRef,
    blocksContainerRef,
    layersContainerRef,
    stylesContainerRef,
    traitsContainerRef,
    loading,
    saving,
    publishing,
    device,
    layers,
    selectedLayerId,
    slug,
    saveStatus,
    lastSavedAt,
    hasPublishedVersion,
    showPreview,
    setShowPreview,
    showPublishDialog,
    setShowPublishDialog,
    previewContent,
    handleDeviceChange,
    handleSave,
    handlePreview,
    handleSelectTemplate,
    handleApplyAnimation,
    handleLayerSelect,
    handleLayerVisibilityToggle,
    handleLayerLockToggle,
    handleLayerDelete,
    handleLayersReorder,
    handlePublish,
    handleRestoreVersion,
  } = usePageBuilder({ eventId });

  const handleBack = () => {
    navigate(`/${orgSlug}/eventmanagement/${eventId}`);
  };

  if (loading) {
    return (
      <div className={`flex h-screen items-center justify-center ${isDark ? 'bg-[var(--gjs-bg-primary)]' : 'bg-[var(--gjs-bg-primary)]'}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-[var(--gjs-text-muted)]">Loading builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`builder-theme-${theme} ${isFullscreen ? 'fixed inset-0 z-50' : 'h-screen w-full'} flex flex-col overflow-hidden bg-[var(--gjs-bg-primary)]`}>
      {/* Top Navigation Bar */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--gjs-border)] bg-[var(--gjs-bg-secondary)] px-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-2 text-[var(--gjs-text-primary)] hover:bg-[var(--gjs-bg-hover)] hover:text-[var(--gjs-accent)]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="h-5 w-px bg-[var(--gjs-border)]" />
          <span className="text-sm font-medium text-[var(--gjs-text-primary)]">Page Builder</span>
          
          {/* Save Status Indicator */}
          <SaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} />
        </div>
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 text-[var(--gjs-text-secondary)] hover:bg-[var(--gjs-bg-hover)] hover:text-[var(--gjs-text-primary)]"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreview}
            className="gap-2 text-[var(--gjs-text-secondary)] hover:bg-[var(--gjs-bg-hover)] hover:text-[var(--gjs-text-primary)]"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Preview</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button
            size="sm"
            onClick={() => setShowPublishDialog(true)}
            disabled={publishing}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Globe className="h-4 w-4" />
            {publishing ? 'Publishing...' : 'Publish'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-8 w-8 text-[var(--gjs-text-secondary)] hover:bg-[var(--gjs-bg-hover)] hover:text-[var(--gjs-text-primary)]"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Three-Panel Layout */}
      <div className="flex flex-1 overflow-hidden min-w-0">
        {/* Left Panel: Pages, Layers, Assets - hidden on small screens */}
        <div className="hidden sm:flex flex-shrink-0 h-full">
          <LeftPanel
            blocksContainerRef={blocksContainerRef}
            layersContainerRef={layersContainerRef}
            layers={layers}
            selectedLayerId={selectedLayerId}
            onLayerSelect={handleLayerSelect}
            onLayerVisibilityToggle={handleLayerVisibilityToggle}
            onLayerLockToggle={handleLayerLockToggle}
            onLayerDelete={handleLayerDelete}
            onLayersReorder={handleLayersReorder}
            onSelectTemplate={handleSelectTemplate}
          >
            {/* Version History in Left Panel */}
            {eventId && (
              <VersionHistory
                eventId={eventId}
                onPreview={() => {
                  // Preview handled by VersionHistory internally
                  setShowPreview(true);
                }}
                onRestore={handleRestoreVersion}
              />
            )}
          </LeftPanel>
        </div>

        {/* Center: Canvas Area */}
        <div className="flex-1 min-w-0 h-full">
          <CanvasArea
            containerRef={containerRef}
            device={device}
            onDeviceChange={handleDeviceChange}
          />
        </div>

        {/* Right Panel: Design & Prototype - hidden on smaller screens */}
        <div className="hidden md:flex flex-shrink-0 h-full">
          <RightPanel
            stylesContainerRef={stylesContainerRef}
            traitsContainerRef={traitsContainerRef}
            onApplyAnimation={handleApplyAnimation}
            html={previewContent.html}
          />
        </div>
      </div>

      {/* GrapesJS Theme */}
      <style>{pageBuilderTheme}</style>

      {/* Preview Overlay */}
      <PreviewOverlay
        open={showPreview}
        onClose={() => setShowPreview(false)}
        html={previewContent.html}
        css={previewContent.css}
        eventId={eventId}
      />

      {/* Publish Dialog */}
      <PublishDialog
        open={showPublishDialog}
        onOpenChange={setShowPublishDialog}
        onPublish={handlePublish}
        eventSlug={slug}
        isPublishing={publishing}
        hasPublishedVersion={hasPublishedVersion}
      />
    </div>
  );
};

export const EventPageBuilder: React.FC = () => (
  <BuilderThemeProvider>
    <EventPageBuilderContent />
  </BuilderThemeProvider>
);

export default EventPageBuilder;
