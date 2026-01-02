import React from 'react';
import 'grapesjs/dist/css/grapes.min.css';
import { useParams } from 'react-router-dom';
import { usePageBuilder } from './page-builder/usePageBuilder';
import { TopHeader } from './page-builder/TopHeader';
import { LeftSidebar } from './page-builder/LeftSidebar';
import { RightSidebar } from './page-builder/RightSidebar';
import { CanvasHeader } from './page-builder/CanvasHeader';

/**
 * EventPageBuilder
 *
 * Framer-style GrapesJS landing page builder for events.
 * Features:
 * - Dark-themed UI with professional appearance
 * - Top toolbar with editor tools
 * - Left sidebar with Pages/Layers/Assets tabs
 * - Center canvas with device preview controls
 * - Right sidebar with Design/Prototype panels
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
    handleDeviceChange,
    handlePreview,
    handleSave,
  } = usePageBuilder({ eventId });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading page builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      {/* Top Header with tools and actions */}
      <TopHeader
        eventName="Event Landing Page"
        slug={slug}
        onSlugChange={setSlug}
        onPreview={handlePreview}
        onSave={handleSave}
        saving={saving}
      />

      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar - Layers & Assets */}
        <LeftSidebar eventName="Event Page" />

        {/* Center - Canvas Area */}
        <main className="flex-1 min-w-0 flex flex-col bg-muted/20 overflow-hidden">
          {/* Canvas Header with device controls */}
          <CanvasHeader
            device={device}
            onDeviceChange={handleDeviceChange}
          />

          {/* GrapesJS Canvas */}
          <div className="flex-1 overflow-hidden relative">
            <div 
              ref={containerRef}
              className="absolute inset-0 gjs-editor-container"
            />
          </div>
        </main>

        {/* Right Sidebar - Styles */}
        <RightSidebar />
      </div>

      {/* GrapesJS Custom Styles - Framer-inspired dark theme */}
      <style>{`
        /* Editor container */
        .gjs-editor-container {
          position: relative;
        }
        .gjs-editor {
          height: 100% !important;
          background-color: hsl(var(--muted) / 0.3);
        }
        .gjs-cv-canvas {
          width: 100% !important;
          height: 100% !important;
          top: 0 !important;
          left: 0 !important;
        }
        .gjs-frame-wrapper {
          background-color: hsl(var(--muted) / 0.5);
          padding: 20px;
        }
        .gjs-frame {
          border-radius: 8px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        
        /* Hide default GrapesJS panels - we use custom ones */
        .gjs-pn-panels {
          display: none !important;
        }
        
        /* Block styling - Framer-like cards */
        .gjs-block {
          width: 100%;
          min-height: auto;
          padding: 12px;
          margin-bottom: 8px;
          border-radius: 8px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          transition: all 0.15s ease;
          cursor: grab;
        }
        .gjs-block:hover {
          border-color: hsl(var(--primary));
          background: hsl(var(--accent));
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .gjs-block-label {
          font-size: 12px;
          font-weight: 500;
          color: hsl(var(--foreground));
        }
        
        /* Block categories */
        .gjs-block-category {
          border-bottom: 1px solid hsl(var(--border));
        }
        .gjs-block-category .gjs-title {
          padding: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: hsl(var(--muted-foreground));
          background: transparent;
          border: none;
        }
        .gjs-block-category .gjs-caret-icon {
          color: hsl(var(--muted-foreground));
        }
        
        /* Style manager - Framer-inspired */
        .gjs-sm-sector {
          border-bottom: 1px solid hsl(var(--border));
        }
        .gjs-sm-sector-title {
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 500;
          color: hsl(var(--foreground));
          background: transparent;
          border: none;
        }
        .gjs-sm-properties {
          padding: 8px 12px 16px;
        }
        .gjs-sm-property {
          margin-bottom: 12px;
        }
        .gjs-sm-label {
          font-size: 11px;
          font-weight: 500;
          color: hsl(var(--muted-foreground));
          margin-bottom: 6px;
        }
        .gjs-field {
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          border-radius: 6px;
          color: hsl(var(--foreground));
          padding: 6px 10px;
        }
        .gjs-field:focus-within {
          border-color: hsl(var(--primary));
          box-shadow: 0 0 0 2px hsl(var(--primary) / 0.2);
        }
        .gjs-field input,
        .gjs-field select {
          color: hsl(var(--foreground));
          background: transparent;
        }
        
        /* Slider styling */
        .gjs-field input[type="range"] {
          accent-color: hsl(var(--primary));
        }
        
        /* Button toggle groups */
        .gjs-radio-items {
          display: flex;
          gap: 4px;
        }
        .gjs-radio-item {
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          color: hsl(var(--muted-foreground));
          transition: all 0.15s ease;
        }
        .gjs-radio-item.active,
        .gjs-radio-item:hover {
          border-color: hsl(var(--primary));
          background: hsl(var(--primary) / 0.1);
          color: hsl(var(--foreground));
        }
        
        /* Layer manager - tree view */
        .gjs-layer {
          background: transparent;
          font-size: 13px;
          border-radius: 6px;
          margin: 2px 0;
        }
        .gjs-layer-name {
          color: hsl(var(--foreground));
          padding: 8px 12px;
        }
        .gjs-layer:hover {
          background: hsl(var(--accent));
        }
        .gjs-layer.gjs-selected {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
        .gjs-layer.gjs-selected .gjs-layer-name {
          color: hsl(var(--primary-foreground));
        }
        .gjs-layer-caret {
          color: hsl(var(--muted-foreground));
        }
        
        /* Selection highlight */
        .gjs-selected {
          outline: 2px solid hsl(var(--primary)) !important;
          outline-offset: -2px;
        }
        .gjs-hovered {
          outline: 1px dashed hsl(var(--primary) / 0.5) !important;
        }
        
        /* Toolbar elements */
        .gjs-toolbar {
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          border-radius: 8px;
          padding: 4px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .gjs-toolbar-item {
          padding: 6px;
          border-radius: 4px;
          color: hsl(var(--muted-foreground));
        }
        .gjs-toolbar-item:hover {
          background: hsl(var(--accent));
          color: hsl(var(--foreground));
        }
        
        /* Resize handlers */
        .gjs-resizer-h {
          background: hsl(var(--primary));
        }
        .gjs-resizer-v {
          background: hsl(var(--primary));
        }
        
        /* Badge for component type */
        .gjs-badge {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};
