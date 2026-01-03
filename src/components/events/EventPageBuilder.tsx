import React from 'react';
import 'grapesjs/dist/css/grapes.min.css';
import { useParams } from 'react-router-dom';
import { usePageBuilder } from './page-builder/usePageBuilder';
import { BuilderToolbar } from './page-builder/BuilderToolbar';
import { LeftPanel } from './page-builder/LeftPanel';
import { RightPanel } from './page-builder/RightPanel';
import { CanvasArea } from './page-builder/CanvasArea';

/**
 * EventPageBuilder
 *
 * Framer-inspired GrapesJS-based landing page builder for events.
 * - Dark theme with professional design tools layout
 * - Top toolbar with tools and actions
 * - Left panel: Pages/Layers/Assets tabs
 * - Center: Canvas with device/breakpoint controls
 * - Right panel: Design/Prototype tabs with style management
 */
export const EventPageBuilder: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  const {
    containerRef,
    slug,
    loading,
    saving,
    device,
    canUndo,
    canRedo,
    layers,
    selectedLayerId,
    handleDeviceChange,
    handleUndo,
    handleRedo,
    handlePreview,
    handleSave,
    handleLayersReorder,
    handleLayerSelect,
    handleLayerVisibilityToggle,
    handleLayerLockToggle,
    handleLayerDelete,
    handleApplyAnimation,
  } = usePageBuilder({ eventId });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[hsl(220,13%,6%)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent shadow-[0_0_15px_hsl(221,83%,53%/0.3)]" />
          <p className="text-sm text-muted-foreground">Loading builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[hsl(220,13%,6%)]">
      {/* Top Toolbar */}
      <BuilderToolbar
        projectName={slug || 'Event Page'}
        onSave={handleSave}
        onPreview={handlePreview}
        onUndo={handleUndo}
        onRedo={handleRedo}
        saving={saving}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Left Panel */}
        <LeftPanel
          layers={layers}
          selectedLayerId={selectedLayerId}
          onLayersReorder={handleLayersReorder}
          onLayerSelect={handleLayerSelect}
          onLayerVisibilityToggle={handleLayerVisibilityToggle}
          onLayerLockToggle={handleLayerLockToggle}
          onLayerDelete={handleLayerDelete}
        />

        {/* Canvas Area */}
        <CanvasArea
          containerRef={containerRef}
          device={device}
          onDeviceChange={handleDeviceChange}
        />

        {/* Right Panel */}
        <RightPanel onApplyAnimation={handleApplyAnimation} />
      </div>

      {/* GrapesJS Custom Styles for dark theme with Framer polish */}
      <style>{`
        /* Custom scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(220, 13%, 25%);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(220, 13%, 35%);
        }

        /* Force dark theme on GrapesJS */
        .gjs-editor-container {
          position: relative;
          background: hsl(220, 13%, 6%);
        }
        .gjs-editor {
          height: 100% !important;
          background: hsl(220, 13%, 6%) !important;
        }
        .gjs-cv-canvas {
          width: 100% !important;
          height: 100% !important;
          top: 0 !important;
          left: 0 !important;
          background: hsl(220, 13%, 6%) !important;
        }
        .gjs-frame-wrapper {
          background-color: hsl(220, 13%, 12%);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        
        /* Hide default GrapesJS panels */
        .gjs-pn-panels {
          display: none !important;
        }
        
        /* Block styling with glow effects */
        .gjs-block {
          width: 100%;
          min-height: auto;
          padding: 12px;
          margin-bottom: 8px;
          border-radius: 8px;
          border: 1px solid hsl(220, 13%, 20%);
          background: linear-gradient(135deg, hsl(220, 13%, 12%), hsl(220, 13%, 10%));
          color: hsl(210, 40%, 98%);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: grab;
        }
        .gjs-block:hover {
          border-color: hsl(221, 83%, 53%);
          background: linear-gradient(135deg, hsl(220, 13%, 15%), hsl(220, 13%, 12%));
          box-shadow: 0 0 20px hsl(221, 83%, 53% / 0.15), inset 0 1px 0 hsl(220, 13%, 25%);
          transform: translateY(-1px);
        }
        .gjs-block:active {
          cursor: grabbing;
          transform: scale(0.98);
        }
        .gjs-block svg {
          fill: hsl(215, 20%, 65%);
        }
        .gjs-block-label {
          font-size: 11px;
          font-weight: 500;
          color: hsl(210, 40%, 98%);
        }
        
        /* Block categories */
        .gjs-block-category {
          border-bottom: 1px solid hsl(220, 13%, 18%);
          background: transparent !important;
        }
        .gjs-block-category .gjs-title {
          padding: 12px 10px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: hsl(215, 20%, 55%);
          background: transparent !important;
          border: none;
          transition: color 0.15s;
        }
        .gjs-block-category .gjs-title:hover {
          color: hsl(210, 40%, 98%);
        }
        .gjs-block-category .gjs-caret-icon {
          color: hsl(215, 20%, 55%);
        }
        
        /* Style manager with refined borders */
        .gjs-sm-sector {
          border-bottom: 1px solid hsl(220, 13%, 18%);
          background: transparent !important;
        }
        .gjs-sm-sector-title {
          padding: 12px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: hsl(210, 40%, 98%);
          background: transparent !important;
          border: none;
        }
        .gjs-sm-properties {
          padding: 10px;
          background: transparent !important;
        }
        .gjs-sm-property {
          margin-bottom: 10px;
        }
        .gjs-sm-label {
          font-size: 10px;
          color: hsl(215, 20%, 60%);
          margin-bottom: 4px;
        }
        .gjs-field {
          background: hsl(220, 13%, 10%);
          border: 1px solid hsl(220, 13%, 22%);
          border-radius: 6px;
          color: hsl(210, 40%, 98%);
          transition: all 0.15s;
        }
        .gjs-field:focus-within {
          border-color: hsl(221, 83%, 53%);
          box-shadow: 0 0 0 3px hsl(221, 83%, 53% / 0.1);
        }
        .gjs-field input,
        .gjs-field select {
          color: hsl(210, 40%, 98%);
          background: transparent;
          font-size: 12px;
        }
        .gjs-field input::placeholder {
          color: hsl(215, 20%, 40%);
        }
        
        /* Color picker */
        .gjs-sm-colorp-c {
          background: hsl(220, 13%, 10%);
          border: 1px solid hsl(220, 13%, 22%);
          border-radius: 6px;
        }
        
        /* Layer manager */
        .gjs-layers {
          background: transparent !important;
        }
        .gjs-layer {
          background: transparent;
          font-size: 11px;
          color: hsl(210, 40%, 98%);
          padding: 6px 8px;
          border-radius: 4px;
          margin: 2px 0;
          transition: all 0.15s;
        }
        .gjs-layer-name {
          color: hsl(210, 40%, 98%);
        }
        .gjs-layer:hover {
          background: hsl(220, 13%, 15%);
        }
        .gjs-layer.gjs-selected {
          background: linear-gradient(135deg, hsl(221, 83%, 53% / 0.2), hsl(221, 83%, 53% / 0.1));
          border: 1px solid hsl(221, 83%, 53% / 0.3);
        }
        .gjs-layer-title {
          background: transparent !important;
        }
        .gjs-layer-caret {
          color: hsl(215, 20%, 55%);
        }
        
        /* Trait manager (component properties) */
        .gjs-trt-traits {
          padding: 8px 0;
        }
        .gjs-trt-trait {
          padding: 8px 0;
          border-bottom: 1px solid hsl(220, 13%, 15%);
        }
        .gjs-trt-trait:last-child {
          border-bottom: none;
        }
        .gjs-trt-trait .gjs-label {
          color: hsl(215, 20%, 60%);
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          margin-bottom: 6px;
        }
        .gjs-trt-trait .gjs-field {
          background: hsl(220, 13%, 10%);
          border-radius: 6px;
        }
        
        /* Selection highlight with glow */
        .gjs-selected {
          outline: 2px solid hsl(221, 83%, 53%) !important;
          outline-offset: -2px;
          box-shadow: 0 0 20px hsl(221, 83%, 53% / 0.25);
        }
        
        /* Resize handles */
        .gjs-resizer-h {
          border-color: hsl(221, 83%, 53%);
        }
        
        /* Toolbar floating with glass effect */
        .gjs-toolbar {
          background: hsl(220, 13%, 12% / 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid hsl(220, 13%, 25%);
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          padding: 4px;
        }
        .gjs-toolbar-item {
          color: hsl(210, 40%, 98%);
          padding: 6px;
          border-radius: 4px;
          transition: all 0.15s;
        }
        .gjs-toolbar-item:hover {
          color: hsl(221, 83%, 66%);
          background: hsl(220, 13%, 18%);
        }
        
        /* Badge */
        .gjs-badge {
          background: linear-gradient(135deg, hsl(221, 83%, 53%), hsl(221, 83%, 45%));
          color: hsl(210, 40%, 98%);
          font-size: 10px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 4px;
          box-shadow: 0 2px 8px hsl(221, 83%, 53% / 0.3);
        }
        
        /* Placeholder when dragging */
        .gjs-placeholder {
          border: 2px dashed hsl(221, 83%, 53%);
          background: hsl(221, 83%, 53% / 0.08);
          border-radius: 8px;
        }

        /* Highlighter */
        .gjs-highlighter {
          outline: 2px solid hsl(221, 83%, 53% / 0.5) !important;
        }

        /* Component hover state */
        .gjs-hovered {
          outline: 1px dashed hsl(221, 83%, 53% / 0.5) !important;
        }
      `}</style>
    </div>
  );
};
