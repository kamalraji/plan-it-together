import React from 'react';

interface RightPanelProps {
  stylesContainerRef?: React.RefObject<HTMLDivElement>;
  traitsContainerRef?: React.RefObject<HTMLDivElement>;
  onApplyAnimation?: (animationType: string, config: AnimationConfig) => void;
}

export interface AnimationConfig {
  type: string;
  duration: number;
  delay: number;
  easing: string;
}

export const RightPanel: React.FC<RightPanelProps> = ({ 
  stylesContainerRef, 
  traitsContainerRef,
}) => {
  return (
    <div className="flex h-full w-48 sm:w-56 md:w-60 lg:w-64 xl:w-72 flex-col border-l border-[hsl(220,13%,18%)] bg-[hsl(220,13%,10%)]">
      {/* GrapesJS Traits Panel */}
      <div 
        ref={traitsContainerRef} 
        className="gjs-traits-container border-b border-[hsl(220,13%,18%)]"
      />
      
      {/* GrapesJS Styles Panel */}
      <div 
        ref={stylesContainerRef} 
        className="gjs-styles-container flex-1 overflow-y-auto"
      />
    </div>
  );
};
