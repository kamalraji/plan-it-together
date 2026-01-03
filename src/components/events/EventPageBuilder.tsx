import React from 'react';
import 'grapesjs/dist/css/grapes.min.css';
import { useParams } from 'react-router-dom';
import { usePageBuilder } from './page-builder/usePageBuilder';

/**
 * EventPageBuilder
 *
 * Full-featured GrapesJS-based landing page builder for events.
 * Includes panels, layers, styles, traits, device preview, and custom blocks.
 */
export const EventPageBuilder: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  const {
    containerRef,
    loading,
  } = usePageBuilder({ eventId });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden">
      <div ref={containerRef} className="h-full w-full" />
      
      {/* GrapesJS Dark Theme Styling */}
      <style>{`
        /* CSS Custom Properties for theming */
        :root {
          --gjs-primary-color: hsl(220, 13%, 10%);
          --gjs-secondary-color: hsl(210, 40%, 96%);
          --gjs-tertiary-color: hsl(221, 83%, 53%);
          --gjs-quaternary-color: hsl(221, 83%, 53%);
        }

        /* Main editor background */
        .gjs-one-bg {
          background-color: hsl(220, 13%, 10%);
        }

        /* Text colors */
        .gjs-two-color {
          color: hsl(210, 40%, 96%);
        }

        /* Accent background */
        .gjs-three-bg {
          background-color: hsl(221, 83%, 53%);
          color: white;
        }

        /* Accent text */
        .gjs-four-color,
        .gjs-four-color-h:hover {
          color: hsl(221, 83%, 53%);
        }

        /* Editor container */
        .gjs-editor-cont {
          background-color: hsl(220, 13%, 10%);
        }

        /* Canvas */
        .gjs-cv-canvas {
          background-color: hsl(220, 13%, 8%);
        }

        /* Panels */
        .gjs-pn-panel {
          padding: 8px;
        }

        .gjs-pn-buttons {
          display: flex;
          gap: 4px;
        }

        .gjs-pn-btn {
          padding: 8px;
          border-radius: 6px;
          transition: all 0.15s ease;
          border: 1px solid transparent;
        }

        .gjs-pn-btn:hover {
          background-color: hsl(220, 13%, 18%);
        }

        .gjs-pn-btn.gjs-pn-active {
          background-color: hsl(221, 83%, 53%);
          color: white;
        }

        /* Blocks */
        .gjs-block {
          padding: 12px;
          margin: 4px;
          border-radius: 8px;
          border: 1px solid hsl(220, 13%, 20%);
          background: linear-gradient(135deg, hsl(220, 13%, 14%), hsl(220, 13%, 12%));
          transition: all 0.2s ease;
          cursor: grab;
        }

        .gjs-block:hover {
          border-color: hsl(221, 83%, 53%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .gjs-block-label {
          font-size: 11px;
          font-weight: 500;
          color: hsl(210, 40%, 96%);
        }

        .gjs-block svg {
          fill: hsl(215, 20%, 65%);
        }

        /* Block categories */
        .gjs-block-category {
          border-bottom: 1px solid hsl(220, 13%, 18%);
        }

        .gjs-block-category .gjs-title {
          padding: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: hsl(215, 20%, 55%);
          background: transparent;
        }

        /* Layers */
        .gjs-layer {
          padding: 8px 12px;
          border-radius: 4px;
          margin: 2px 4px;
          transition: background 0.15s ease;
        }

        .gjs-layer:hover {
          background: hsl(220, 13%, 15%);
        }

        .gjs-layer.gjs-selected {
          background: hsl(221, 83%, 53%, 0.2);
          border-left: 3px solid hsl(221, 83%, 53%);
        }

        .gjs-layer-name {
          color: hsl(210, 40%, 96%);
        }

        /* Style Manager */
        .gjs-sm-sector {
          border-bottom: 1px solid hsl(220, 13%, 18%);
        }

        .gjs-sm-sector-title {
          padding: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: hsl(210, 40%, 96%);
          background: transparent;
        }

        .gjs-sm-properties {
          padding: 10px 12px;
        }

        .gjs-sm-property {
          margin-bottom: 10px;
        }

        .gjs-sm-label {
          color: hsl(215, 20%, 60%);
          font-size: 11px;
          margin-bottom: 4px;
        }

        /* Input fields */
        .gjs-field {
          background: hsl(220, 13%, 12%);
          border: 1px solid hsl(220, 13%, 22%);
          border-radius: 6px;
          color: hsl(210, 40%, 96%);
          transition: border-color 0.15s ease;
        }

        .gjs-field:focus-within {
          border-color: hsl(221, 83%, 53%);
        }

        .gjs-field input,
        .gjs-field select {
          color: hsl(210, 40%, 96%);
          background: transparent;
        }

        /* Trait Manager */
        .gjs-trt-trait {
          padding: 10px 0;
          border-bottom: 1px solid hsl(220, 13%, 15%);
        }

        .gjs-trt-trait .gjs-label {
          color: hsl(215, 20%, 60%);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        /* Selection highlight */
        .gjs-selected {
          outline: 2px solid hsl(221, 83%, 53%) !important;
          outline-offset: -2px;
        }

        .gjs-hovered {
          outline: 1px dashed hsl(221, 83%, 53%, 0.5) !important;
        }

        /* Toolbar */
        .gjs-toolbar {
          background: hsl(220, 13%, 12%, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid hsl(220, 13%, 25%);
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          padding: 4px;
        }

        .gjs-toolbar-item {
          color: hsl(210, 40%, 96%);
          padding: 6px;
          border-radius: 4px;
          transition: all 0.15s;
        }

        .gjs-toolbar-item:hover {
          background: hsl(220, 13%, 18%);
          color: hsl(221, 83%, 66%);
        }

        /* Badge */
        .gjs-badge {
          background: hsl(221, 83%, 53%);
          color: white;
          font-size: 10px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 4px;
        }

        /* Placeholder */
        .gjs-placeholder {
          border: 2px dashed hsl(221, 83%, 53%);
          background: hsl(221, 83%, 53%, 0.1);
          border-radius: 4px;
        }

        /* Resizer handles */
        .gjs-resizer-h {
          border-color: hsl(221, 83%, 53%);
        }

        /* Modal */
        .gjs-mdl-dialog {
          background: hsl(220, 13%, 12%);
          border: 1px solid hsl(220, 13%, 22%);
          border-radius: 12px;
        }

        .gjs-mdl-header {
          border-bottom: 1px solid hsl(220, 13%, 18%);
        }

        .gjs-mdl-title {
          color: hsl(210, 40%, 96%);
        }

        /* Selector Manager */
        .gjs-clm-tags {
          padding: 8px;
        }

        .gjs-clm-tag {
          background: hsl(220, 13%, 15%);
          border: 1px solid hsl(220, 13%, 22%);
          border-radius: 4px;
          color: hsl(210, 40%, 96%);
          padding: 4px 8px;
        }

        /* Device buttons */
        .gjs-devices-c {
          padding: 8px;
        }

        /* Color picker */
        .gjs-field-color-picker {
          border-radius: 4px;
          overflow: hidden;
        }

        /* Rich Text Editor */
        .gjs-rte-toolbar {
          background: hsl(220, 13%, 12%);
          border: 1px solid hsl(220, 13%, 22%);
          border-radius: 6px;
        }

        .gjs-rte-action {
          color: hsl(210, 40%, 96%);
          padding: 6px;
          border-radius: 4px;
        }

        .gjs-rte-action:hover {
          background: hsl(220, 13%, 18%);
        }

        .gjs-rte-active {
          background: hsl(221, 83%, 53%);
          color: white;
        }

        /* Context menu */
        .gjs-ctx-menu {
          background: hsl(220, 13%, 12%);
          border: 1px solid hsl(220, 13%, 22%);
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
        }

        .gjs-ctx-menu-item {
          padding: 10px 16px;
          color: hsl(210, 40%, 96%);
          transition: background 0.15s;
        }

        .gjs-ctx-menu-item:hover {
          background: hsl(220, 13%, 18%);
        }

        /* Scrollbar styling */
        .gjs-editor ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .gjs-editor ::-webkit-scrollbar-track {
          background: hsl(220, 13%, 10%);
        }

        .gjs-editor ::-webkit-scrollbar-thumb {
          background: hsl(220, 13%, 25%);
          border-radius: 4px;
        }

        .gjs-editor ::-webkit-scrollbar-thumb:hover {
          background: hsl(220, 13%, 35%);
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .gjs-block,
        .gjs-layer,
        .gjs-sm-sector {
          animation: fadeIn 0.2s ease;
        }
      `}</style>
    </div>
  );
};
