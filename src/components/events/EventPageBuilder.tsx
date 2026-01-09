import React, { useRef } from 'react';
import 'grapesjs/dist/css/grapes.min.css';
import { useParams, useNavigate } from 'react-router-dom';
import { usePageBuilder } from './page-builder/usePageBuilder';
import { LeftPanel } from './page-builder/LeftPanel';
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * EventPageBuilder
 *
 * Full-featured GrapesJS-based landing page builder for events.
 * Uses a polished dark theme matching the app's design system.
 */
export const EventPageBuilder: React.FC = () => {
  const { eventId, orgSlug } = useParams<{ eventId: string; orgSlug: string }>();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = React.useState(true);
  const blocksContainerRef = useRef<HTMLDivElement>(null);
  const layersContainerRef = useRef<HTMLDivElement>(null);

  const {
    containerRef,
    loading,
  } = usePageBuilder({ eventId, blocksContainerRef, layersContainerRef });

  const handleBack = () => {
    navigate(`/${orgSlug}/eventmanagement/${eventId}`);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

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
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'h-screen w-full'} overflow-hidden bg-[hsl(222,47%,7%)]`}>
      {/* Top Navigation Bar */}
      <div className="flex h-12 items-center justify-between border-b border-[hsl(217,33%,18%)] bg-[hsl(222,47%,9%)] px-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-2 text-[hsl(210,40%,98%)] hover:bg-[hsl(217,33%,18%)] hover:text-[hsl(221,83%,66%)]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Event</span>
          </Button>
          <div className="h-5 w-px bg-[hsl(217,33%,18%)]" />
          <span className="text-sm font-medium text-[hsl(210,40%,98%)]">Page Builder</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-8 w-8 text-[hsl(215,20%,75%)] hover:bg-[hsl(217,33%,18%)] hover:text-[hsl(210,40%,98%)]"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Main Content Area with Left Panel */}
      <div className="flex h-[calc(100%-3rem)]">
        {/* Left Panel */}
        <LeftPanel
          blocksContainerRef={blocksContainerRef}
          layersContainerRef={layersContainerRef}
        />
        
        {/* GrapesJS Container */}
        <div ref={containerRef} className="flex-1" />
      </div>
      
      {/* GrapesJS Professional Dark Theme */}
      <style>{`
        /* ========================================
           GrapesJS Professional Dark Theme
           Matching App Design System
        ======================================== */

        /* CSS Custom Properties */
        .gjs-editor {
          --gjs-bg-primary: hsl(222, 47%, 7%);
          --gjs-bg-secondary: hsl(222, 47%, 9%);
          --gjs-bg-tertiary: hsl(222, 47%, 11%);
          --gjs-bg-hover: hsl(217, 33%, 18%);
          --gjs-border: hsl(217, 33%, 18%);
          --gjs-text-primary: hsl(210, 40%, 98%);
          --gjs-text-secondary: hsl(215, 20%, 75%);
          --gjs-text-muted: hsl(215, 20%, 55%);
          --gjs-accent: hsl(221, 83%, 66%);
          --gjs-accent-secondary: hsl(199, 89%, 60%);
        }

        /* Main Editor Container */
        .gjs-editor-cont {
          background-color: var(--gjs-bg-primary) !important;
        }

        .gjs-editor {
          font-family: 'Lato', system-ui, -apple-system, sans-serif !important;
        }

        /* One Background (panels, sidebars) */
        .gjs-one-bg {
          background-color: var(--gjs-bg-secondary) !important;
        }

        /* Two Color (primary text) */
        .gjs-two-color {
          color: var(--gjs-text-primary) !important;
        }

        /* Three Background (accent buttons) */
        .gjs-three-bg {
          background-color: var(--gjs-accent) !important;
          color: var(--gjs-bg-primary) !important;
        }

        /* Four Color (accent text/icons) */
        .gjs-four-color,
        .gjs-four-color-h:hover {
          color: var(--gjs-accent) !important;
        }

        /* ========== Canvas ========== */
        .gjs-cv-canvas {
          background-color: var(--gjs-bg-primary) !important;
          top: 0;
          width: calc(100% - 240px);
          height: 100%;
          left: 0;
        }

        .gjs-frame-wrapper {
          background: repeating-conic-gradient(
            hsl(217, 33%, 12%) 0% 25%,
            hsl(222, 47%, 9%) 0% 50%
          ) 50% / 24px 24px;
        }

        /* ========== Panels ========== */
        .gjs-pn-panel {
          padding: 0 !important;
        }

        .gjs-pn-views-container {
          width: 240px !important;
          border-left: 1px solid var(--gjs-border);
          background: var(--gjs-bg-secondary) !important;
          padding: 0;
        }

        .gjs-pn-views {
          border-bottom: 1px solid var(--gjs-border);
          background: var(--gjs-bg-tertiary) !important;
        }

        .gjs-pn-buttons {
          display: flex;
          justify-content: center;
          gap: 2px;
          padding: 6px 8px;
        }

        .gjs-pn-btn {
          min-width: 36px;
          height: 32px;
          padding: 0 10px;
          border-radius: 6px;
          transition: all 0.15s ease;
          border: 1px solid transparent;
          font-size: 12px;
          font-weight: 500;
          color: var(--gjs-text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .gjs-pn-btn:hover {
          background-color: var(--gjs-bg-hover);
          color: var(--gjs-text-primary);
        }

        .gjs-pn-btn.gjs-pn-active {
          background-color: var(--gjs-accent);
          color: var(--gjs-bg-primary);
          border-color: transparent;
        }

        /* Options Panel (top bar inside GrapesJS) */
        .gjs-pn-options {
          right: 240px !important;
          background: var(--gjs-bg-secondary) !important;
          border-bottom: 1px solid var(--gjs-border);
          padding: 6px 12px !important;
        }

        .gjs-pn-commands {
          left: 0;
          background: var(--gjs-bg-secondary) !important;
          border-bottom: 1px solid var(--gjs-border);
          padding: 6px 12px !important;
        }

        .gjs-pn-devices-c {
          padding: 6px 12px !important;
        }

        /* ========== Blocks ========== */
        .gjs-blocks-c {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          padding: 12px;
        }

        .gjs-block {
          width: 100% !important;
          min-height: 72px;
          padding: 12px 8px;
          margin: 0 !important;
          border-radius: 10px;
          border: 1px solid var(--gjs-border);
          background: linear-gradient(145deg, var(--gjs-bg-tertiary), var(--gjs-bg-secondary));
          transition: all 0.2s ease;
          cursor: grab;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .gjs-block:hover {
          border-color: var(--gjs-accent);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px -8px hsl(221, 83%, 66%, 0.25);
        }

        .gjs-block:active {
          cursor: grabbing;
          transform: scale(0.98);
        }

        .gjs-block-label {
          font-size: 10px;
          font-weight: 600;
          color: var(--gjs-text-secondary);
          text-align: center;
          line-height: 1.3;
        }

        .gjs-block svg {
          width: 24px;
          height: 24px;
          fill: var(--gjs-text-muted);
          opacity: 0.8;
        }

        .gjs-block:hover svg {
          fill: var(--gjs-accent);
          opacity: 1;
        }

        /* Block Categories */
        .gjs-block-categories {
          padding: 0;
        }

        .gjs-block-category {
          border: none;
        }

        .gjs-block-category .gjs-title {
          padding: 14px 16px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--gjs-text-muted);
          background: var(--gjs-bg-primary) !important;
          border-bottom: 1px solid var(--gjs-border);
          cursor: pointer;
          transition: all 0.15s;
        }

        .gjs-block-category .gjs-title:hover {
          color: var(--gjs-text-primary);
          background: var(--gjs-bg-tertiary) !important;
        }

        .gjs-block-category.gjs-open .gjs-title {
          color: var(--gjs-accent);
        }

        /* ========== Layers ========== */
        .gjs-layers {
          padding: 8px;
        }

        .gjs-layer {
          padding: 8px 12px;
          border-radius: 6px;
          margin: 2px 0;
          transition: all 0.15s ease;
          border-left: 2px solid transparent;
        }

        .gjs-layer:hover {
          background: var(--gjs-bg-tertiary);
        }

        .gjs-layer.gjs-selected {
          background: hsl(221, 83%, 66%, 0.12) !important;
          border-left-color: var(--gjs-accent);
        }

        .gjs-layer-title {
          padding: 0 !important;
        }

        .gjs-layer-name {
          color: var(--gjs-text-primary);
          font-size: 12px;
          font-weight: 500;
        }

        .gjs-layer-count {
          color: var(--gjs-text-muted);
          font-size: 10px;
        }

        .gjs-layer-caret {
          color: var(--gjs-text-muted);
          font-size: 9px;
        }

        .gjs-layer-vis {
          color: var(--gjs-text-muted);
        }

        /* ========== Style Manager ========== */
        .gjs-sm-sectors {
          padding: 0;
        }

        .gjs-sm-sector {
          border: none;
          margin-bottom: 0;
        }

        .gjs-sm-sector-title {
          padding: 14px 16px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--gjs-text-primary);
          background: var(--gjs-bg-primary) !important;
          border-bottom: 1px solid var(--gjs-border);
          cursor: pointer;
          transition: all 0.15s;
        }

        .gjs-sm-sector-title:hover {
          background: var(--gjs-bg-tertiary) !important;
        }

        .gjs-sm-sector.gjs-sm-open .gjs-sm-sector-title {
          color: var(--gjs-accent);
          border-left: 2px solid var(--gjs-accent);
        }

        .gjs-sm-properties {
          padding: 12px 16px;
          background: var(--gjs-bg-secondary);
        }

        .gjs-sm-property {
          margin-bottom: 14px;
        }

        .gjs-sm-property:last-child {
          margin-bottom: 0;
        }

        .gjs-sm-label {
          color: var(--gjs-text-muted);
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        /* ========== Input Fields ========== */
        .gjs-field {
          background: var(--gjs-bg-primary) !important;
          border: 1px solid var(--gjs-border) !important;
          border-radius: 8px !important;
          color: var(--gjs-text-primary) !important;
          transition: all 0.15s ease;
          overflow: hidden;
        }

        .gjs-field:focus-within {
          border-color: var(--gjs-accent) !important;
          box-shadow: 0 0 0 3px hsl(221, 83%, 66%, 0.15);
        }

        .gjs-field input,
        .gjs-field select,
        .gjs-field textarea {
          color: var(--gjs-text-primary) !important;
          background: transparent !important;
          font-size: 12px;
          padding: 8px 10px;
        }

        .gjs-field input::placeholder {
          color: var(--gjs-text-muted);
        }

        .gjs-field-arrows {
          color: var(--gjs-text-muted);
        }

        .gjs-field-arrow-u,
        .gjs-field-arrow-d {
          border-color: var(--gjs-text-muted) !important;
        }

        /* Select dropdown */
        .gjs-field select {
          cursor: pointer;
        }

        .gjs-field-select .gjs-d-s-arrow {
          color: var(--gjs-text-muted);
        }

        /* Radio buttons */
        .gjs-radio-item {
          border-radius: 6px;
          padding: 6px 10px;
          transition: all 0.15s;
        }

        .gjs-radio-item:hover {
          background: var(--gjs-bg-hover);
        }

        .gjs-radio-item input:checked + .gjs-radio-item-label {
          color: var(--gjs-accent);
        }

        /* ========== Trait Manager ========== */
        .gjs-trt-traits {
          padding: 12px 16px;
        }

        .gjs-trt-trait {
          padding: 10px 0;
          border-bottom: 1px solid var(--gjs-border);
        }

        .gjs-trt-trait:last-child {
          border-bottom: none;
        }

        .gjs-trt-trait .gjs-label {
          color: var(--gjs-text-muted);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 6px;
        }

        /* ========== Selector Manager ========== */
        .gjs-clm-tags {
          padding: 12px;
          border-bottom: 1px solid var(--gjs-border);
        }

        .gjs-clm-tag {
          background: var(--gjs-bg-tertiary) !important;
          border: 1px solid var(--gjs-border) !important;
          border-radius: 6px !important;
          color: var(--gjs-text-primary) !important;
          padding: 4px 10px;
          margin: 2px;
          font-size: 11px;
          font-weight: 500;
        }

        .gjs-clm-tag:hover {
          border-color: var(--gjs-accent) !important;
        }

        .gjs-clm-tag.gjs-three-bg {
          background: var(--gjs-accent) !important;
          border-color: var(--gjs-accent) !important;
          color: var(--gjs-bg-primary) !important;
        }

        .gjs-clm-sels-info {
          color: var(--gjs-text-muted);
          font-size: 10px;
        }

        /* ========== Selection & Hover States ========== */
        .gjs-selected {
          outline: 2px solid var(--gjs-accent) !important;
          outline-offset: -2px;
        }

        .gjs-hovered {
          outline: 1px dashed hsl(221, 83%, 66%, 0.6) !important;
        }

        /* ========== Toolbar (component toolbar) ========== */
        .gjs-toolbar {
          background: var(--gjs-bg-secondary) !important;
          backdrop-filter: blur(16px);
          border: 1px solid var(--gjs-border) !important;
          border-radius: 10px !important;
          box-shadow: 0 12px 48px -12px rgba(0, 0, 0, 0.5) !important;
          padding: 4px !important;
        }

        .gjs-toolbar-item {
          color: var(--gjs-text-primary);
          padding: 8px !important;
          border-radius: 6px !important;
          transition: all 0.15s;
          margin: 1px !important;
        }

        .gjs-toolbar-item:hover {
          background: var(--gjs-bg-hover) !important;
          color: var(--gjs-accent);
        }

        /* ========== Badge ========== */
        .gjs-badge {
          background: var(--gjs-accent) !important;
          color: var(--gjs-bg-primary) !important;
          font-size: 10px !important;
          font-weight: 700 !important;
          padding: 4px 10px !important;
          border-radius: 6px !important;
          letter-spacing: 0.02em;
        }

        /* ========== Placeholder ========== */
        .gjs-placeholder {
          border: 2px dashed var(--gjs-accent) !important;
          background: hsl(221, 83%, 66%, 0.08) !important;
          border-radius: 6px;
        }

        /* ========== Resizer ========== */
        .gjs-resizer-h {
          border: 2px solid var(--gjs-accent) !important;
          border-radius: 3px;
        }

        .gjs-resizer-h-tl,
        .gjs-resizer-h-tr,
        .gjs-resizer-h-bl,
        .gjs-resizer-h-br {
          background: var(--gjs-accent) !important;
          width: 10px !important;
          height: 10px !important;
          border-radius: 3px !important;
        }

        /* ========== Modal ========== */
        .gjs-mdl-container {
          background: rgba(0, 0, 0, 0.7) !important;
          backdrop-filter: blur(4px);
        }

        .gjs-mdl-dialog {
          background: var(--gjs-bg-secondary) !important;
          border: 1px solid var(--gjs-border) !important;
          border-radius: 16px !important;
          box-shadow: 0 24px 80px -20px rgba(0, 0, 0, 0.6) !important;
          overflow: hidden;
        }

        .gjs-mdl-header {
          padding: 16px 20px !important;
          border-bottom: 1px solid var(--gjs-border) !important;
          background: var(--gjs-bg-tertiary) !important;
        }

        .gjs-mdl-title {
          color: var(--gjs-text-primary) !important;
          font-size: 16px !important;
          font-weight: 600 !important;
        }

        .gjs-mdl-btn-close {
          color: var(--gjs-text-muted) !important;
          font-size: 24px !important;
          transition: color 0.15s;
        }

        .gjs-mdl-btn-close:hover {
          color: var(--gjs-text-primary) !important;
        }

        .gjs-mdl-content {
          padding: 20px !important;
        }

        /* ========== Rich Text Editor ========== */
        .gjs-rte-toolbar {
          background: var(--gjs-bg-secondary) !important;
          border: 1px solid var(--gjs-border) !important;
          border-radius: 8px !important;
          padding: 4px !important;
          box-shadow: 0 8px 32px -8px rgba(0, 0, 0, 0.4) !important;
        }

        .gjs-rte-action {
          color: var(--gjs-text-primary) !important;
          padding: 6px 8px !important;
          border-radius: 4px !important;
          transition: all 0.15s;
        }

        .gjs-rte-action:hover {
          background: var(--gjs-bg-hover) !important;
        }

        .gjs-rte-active {
          background: var(--gjs-accent) !important;
          color: var(--gjs-bg-primary) !important;
        }

        /* ========== Context Menu ========== */
        .gjs-ctx-menu {
          background: var(--gjs-bg-secondary) !important;
          border: 1px solid var(--gjs-border) !important;
          border-radius: 12px !important;
          box-shadow: 0 16px 48px -12px rgba(0, 0, 0, 0.5) !important;
          padding: 6px !important;
          overflow: hidden;
        }

        .gjs-ctx-menu-item {
          padding: 10px 16px !important;
          color: var(--gjs-text-primary) !important;
          border-radius: 6px !important;
          transition: all 0.15s;
          font-size: 12px;
        }

        .gjs-ctx-menu-item:hover {
          background: var(--gjs-bg-hover) !important;
          color: var(--gjs-accent) !important;
        }

        /* ========== Device Manager ========== */
        .gjs-devices-c {
          padding: 8px 12px !important;
        }

        .gjs-device-label {
          color: var(--gjs-text-muted);
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
        }

        /* ========== Color Picker ========== */
        .gjs-field-color-picker {
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid var(--gjs-border);
        }

        .sp-container {
          background: var(--gjs-bg-secondary) !important;
          border: 1px solid var(--gjs-border) !important;
          border-radius: 12px !important;
        }

        /* ========== Scrollbars ========== */
        .gjs-editor ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .gjs-editor ::-webkit-scrollbar-track {
          background: var(--gjs-bg-primary);
        }

        .gjs-editor ::-webkit-scrollbar-thumb {
          background: var(--gjs-border);
          border-radius: 4px;
        }

        .gjs-editor ::-webkit-scrollbar-thumb:hover {
          background: hsl(217, 33%, 28%);
        }

        /* ========== No Selection Info ========== */
        .gjs-no-select {
          color: var(--gjs-text-muted);
          font-size: 13px;
          padding: 20px;
          text-align: center;
        }

        /* ========== Animations ========== */
        @keyframes gjsFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .gjs-block,
        .gjs-layer,
        .gjs-sm-sector {
          animation: gjsFadeIn 0.2s ease-out;
        }

        /* ========== Save Button Styling ========== */
        .gjs-pn-btn[title="Save"] {
          background: linear-gradient(135deg, hsl(221, 83%, 60%), hsl(221, 83%, 50%));
          color: white !important;
          font-weight: 600;
          padding: 0 16px !important;
        }

        .gjs-pn-btn[title="Save"]:hover {
          background: linear-gradient(135deg, hsl(221, 83%, 65%), hsl(221, 83%, 55%));
          transform: translateY(-1px);
          box-shadow: 0 4px 12px -4px hsl(221, 83%, 50%, 0.4);
        }
      `}</style>
    </div>
  );
};

export default EventPageBuilder;
