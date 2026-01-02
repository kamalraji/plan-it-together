import React from 'react';
import 'grapesjs/dist/css/grapes.min.css';
import { useParams } from 'react-router-dom';
import { usePageBuilder } from './page-builder/usePageBuilder';
import { PageBuilderHeader } from './page-builder/PageBuilderHeader';

/**
 * EventPageBuilder
 *
 * Organizer-only GrapesJS-based landing page builder for events.
 * - Initializes a drag-and-drop editor with left blocks panel, center canvas, right styles panel
 * - Provides custom blocks (Hero, Schedule, Registration)
 * - Syncs default branding from the event's organization
 * - Saves HTML/CSS/meta into events.landing_page_data (jsonb)
 * - Manages a unique landing_page_slug per event
 */
export const EventPageBuilder: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  const {
    containerRef,
    slug,
    setSlug,
    loading,
    saving,
    device,
    hasCustomLanding,
    handleDeviceChange,
    handlePreview,
    handleSave,
  } = usePageBuilder({ eventId });

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      <PageBuilderHeader
        slug={slug}
        onSlugChange={setSlug}
        device={device}
        onDeviceChange={handleDeviceChange}
        onPreview={handlePreview}
        onSave={handleSave}
        saving={saving}
        hasCustomLanding={hasCustomLanding}
        eventId={eventId}
      />

      <div className="flex flex-1 min-h-0">
        {/* Left Panel - Blocks */}
        <aside className="w-56 flex-shrink-0 border-r border-border bg-card flex flex-col">
          <div className="p-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Blocks</h3>
            <p className="text-xs text-muted-foreground">Drag to add sections</p>
          </div>
          <div className="panel-blocks flex-1 overflow-y-auto p-2" />
        </aside>

        {/* Center - Canvas */}
        <main className="flex-1 min-w-0 bg-muted/30 overflow-hidden">
          <div 
            ref={containerRef}
            className="h-full w-full gjs-editor-container"
          />
        </main>

        {/* Right Panel - Styles */}
        <aside className="w-64 flex-shrink-0 border-l border-border bg-card flex flex-col">
          <div className="p-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Styles</h3>
            <p className="text-xs text-muted-foreground">Customize selected element</p>
          </div>
          <div className="panel-styles flex-1 overflow-y-auto p-2" />
          <div className="p-3 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground">Layers</h3>
            <p className="text-xs text-muted-foreground">Page structure</p>
          </div>
          <div className="panel-layers overflow-y-auto max-h-48 p-2" />
        </aside>
      </div>

      {/* GrapesJS Custom Styles */}
      <style>{`
        .gjs-editor-container {
          position: relative;
        }
        .gjs-editor {
          height: 100% !important;
        }
        .gjs-cv-canvas {
          width: 100% !important;
          height: 100% !important;
          top: 0 !important;
          left: 0 !important;
        }
        .gjs-frame-wrapper {
          background-color: hsl(var(--background));
        }
        /* Hide default GrapesJS panels - we use custom ones */
        .gjs-pn-panels {
          display: none !important;
        }
        /* Block styling */
        .gjs-block {
          width: 100%;
          min-height: auto;
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          border-radius: 0.5rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          transition: all 0.15s ease;
        }
        .gjs-block:hover {
          border-color: hsl(var(--primary));
          background: hsl(var(--accent));
        }
        .gjs-block-label {
          font-size: 0.75rem;
          color: hsl(var(--foreground));
        }
        /* Block categories */
        .gjs-block-category {
          border-bottom: 1px solid hsl(var(--border));
        }
        .gjs-block-category .gjs-title {
          padding: 0.75rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: hsl(var(--muted-foreground));
          background: transparent;
          border: none;
        }
        .gjs-block-category .gjs-caret-icon {
          color: hsl(var(--muted-foreground));
        }
        /* Style manager styling */
        .gjs-sm-sector {
          border-bottom: 1px solid hsl(var(--border));
        }
        .gjs-sm-sector-title {
          padding: 0.75rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: hsl(var(--foreground));
          background: transparent;
          border: none;
        }
        .gjs-sm-properties {
          padding: 0.5rem;
        }
        .gjs-sm-property {
          margin-bottom: 0.5rem;
        }
        .gjs-sm-label {
          font-size: 0.7rem;
          color: hsl(var(--muted-foreground));
        }
        .gjs-field {
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          border-radius: 0.375rem;
          color: hsl(var(--foreground));
        }
        .gjs-field input,
        .gjs-field select {
          color: hsl(var(--foreground));
        }
        /* Layer manager styling */
        .gjs-layer {
          background: transparent;
          font-size: 0.75rem;
        }
        .gjs-layer-name {
          color: hsl(var(--foreground));
        }
        .gjs-layer:hover {
          background: hsl(var(--accent));
        }
        .gjs-layer.gjs-selected {
          background: hsl(var(--primary) / 0.1);
        }
      `}</style>
    </div>
  );
};
