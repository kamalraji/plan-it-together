import React from 'react';
import 'grapesjs/dist/css/grapes.min.css';
import { useParams, useNavigate } from 'react-router-dom';
import { usePageBuilder, LeftPanel, RightPanel, CanvasArea, pageBuilderTheme } from './page-builder';
import { ArrowLeft, Save, Eye, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * EventPageBuilder
 *
 * Full-featured GrapesJS-based landing page builder for events.
 * Three-panel layout: Left (Layers/Assets), Center (Canvas), Right (Styles/Prototype)
 */
export const EventPageBuilder: React.FC = () => {
  const { eventId, orgSlug } = useParams<{ eventId: string; orgSlug: string }>();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = React.useState(true);

  const {
    containerRef,
    blocksContainerRef,
    layersContainerRef,
    stylesContainerRef,
    traitsContainerRef,
    loading,
    saving,
    device,
    layers,
    selectedLayerId,
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
  } = usePageBuilder({ eventId });

  const handleBack = () => {
    navigate(`/${orgSlug}/eventmanagement/${eventId}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[hsl(222,47%,7%)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'h-screen w-full'} flex flex-col overflow-hidden bg-[hsl(222,47%,7%)]`}>
      {/* Top Navigation Bar */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-[hsl(217,33%,18%)] bg-[hsl(222,47%,9%)] px-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-2 text-[hsl(210,40%,98%)] hover:bg-[hsl(217,33%,18%)] hover:text-[hsl(221,83%,66%)]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="h-5 w-px bg-[hsl(217,33%,18%)]" />
          <span className="text-sm font-medium text-[hsl(210,40%,98%)]">Page Builder</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreview}
            className="gap-2 text-[hsl(215,20%,75%)] hover:bg-[hsl(217,33%,18%)] hover:text-[hsl(210,40%,98%)]"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Preview</span>
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-8 w-8 text-[hsl(215,20%,75%)] hover:bg-[hsl(217,33%,18%)] hover:text-[hsl(210,40%,98%)]"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Three-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Pages, Layers, Assets */}
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
        />

        {/* Center: Canvas Area */}
        <CanvasArea
          containerRef={containerRef}
          device={device}
          onDeviceChange={handleDeviceChange}
        />

        {/* Right Panel: Design & Prototype */}
        <RightPanel
          stylesContainerRef={stylesContainerRef}
          traitsContainerRef={traitsContainerRef}
          onApplyAnimation={handleApplyAnimation}
        />
      </div>

      {/* GrapesJS Professional Dark Theme */}
      <style>{pageBuilderTheme}</style>
    </div>
  );
};

export default EventPageBuilder;
