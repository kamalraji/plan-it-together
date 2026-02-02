import { Editor } from 'grapesjs';

// Helper to create options with required id field
const opt = (value: string, name: string) => ({ id: value, value, name });

/**
 * Animation Plugin - Adds entrance animations and hover effects
 */
export function animationPlugin(editor: Editor) {
  // Add animation keyframes to canvas
  const animationStyles = `
    /* Entrance Animations */
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeInLeft {
      from { opacity: 0; transform: translateX(-30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes fadeInRight {
      from { opacity: 0; transform: translateX(30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes zoomIn {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes zoomOut {
      from { opacity: 0; transform: scale(1.2); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes bounceIn {
      0% { opacity: 0; transform: scale(0.3); }
      50% { opacity: 1; transform: scale(1.05); }
      70% { transform: scale(0.9); }
      100% { transform: scale(1); }
    }
    @keyframes slideInUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes slideInDown {
      from { transform: translateY(-100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes flipInX {
      from { transform: perspective(400px) rotateX(90deg); opacity: 0; }
      to { transform: perspective(400px) rotateX(0); opacity: 1; }
    }
    @keyframes flipInY {
      from { transform: perspective(400px) rotateY(90deg); opacity: 0; }
      to { transform: perspective(400px) rotateY(0); opacity: 1; }
    }
    @keyframes rotateIn {
      from { transform: rotate(-200deg); opacity: 0; }
      to { transform: rotate(0); opacity: 1; }
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    /* Animation Classes */
    .anim-fade-in { animation: fadeIn 0.5s ease-out forwards; }
    .anim-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
    .anim-fade-in-down { animation: fadeInDown 0.5s ease-out forwards; }
    .anim-fade-in-left { animation: fadeInLeft 0.5s ease-out forwards; }
    .anim-fade-in-right { animation: fadeInRight 0.5s ease-out forwards; }
    .anim-zoom-in { animation: zoomIn 0.5s ease-out forwards; }
    .anim-zoom-out { animation: zoomOut 0.5s ease-out forwards; }
    .anim-bounce-in { animation: bounceIn 0.6s ease-out forwards; }
    .anim-slide-in-up { animation: slideInUp 0.5s ease-out forwards; }
    .anim-slide-in-down { animation: slideInDown 0.5s ease-out forwards; }
    .anim-flip-in-x { animation: flipInX 0.6s ease-out forwards; }
    .anim-flip-in-y { animation: flipInY 0.6s ease-out forwards; }
    .anim-rotate-in { animation: rotateIn 0.6s ease-out forwards; }

    /* Duration modifiers */
    .anim-fast { animation-duration: 0.3s !important; }
    .anim-slow { animation-duration: 0.8s !important; }
    .anim-slower { animation-duration: 1.2s !important; }

    /* Delay modifiers */
    .anim-delay-100 { animation-delay: 0.1s; }
    .anim-delay-200 { animation-delay: 0.2s; }
    .anim-delay-300 { animation-delay: 0.3s; }
    .anim-delay-500 { animation-delay: 0.5s; }
    .anim-delay-700 { animation-delay: 0.7s; }
    .anim-delay-1000 { animation-delay: 1s; }

    /* Hover Effects */
    .hover-scale { transition: transform 0.3s ease; }
    .hover-scale:hover { transform: scale(1.05); }
    
    .hover-scale-down { transition: transform 0.3s ease; }
    .hover-scale-down:hover { transform: scale(0.95); }
    
    .hover-lift { transition: transform 0.3s ease, box-shadow 0.3s ease; }
    .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
    
    .hover-glow { transition: box-shadow 0.3s ease; }
    .hover-glow:hover { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); }
    
    .hover-brighten { transition: filter 0.3s ease; }
    .hover-brighten:hover { filter: brightness(1.1); }
    
    .hover-darken { transition: filter 0.3s ease; }
    .hover-darken:hover { filter: brightness(0.9); }
    
    .hover-rotate { transition: transform 0.3s ease; }
    .hover-rotate:hover { transform: rotate(5deg); }
    
    .hover-shake:hover { animation: shake 0.5s ease; }
    .hover-pulse:hover { animation: pulse 1s ease infinite; }
    .hover-bounce:hover { animation: bounce 0.5s ease infinite; }
  `;

  // Add styles to canvas on load
  editor.on('load', () => {
    const frame = editor.Canvas.getFrameEl();
    if (frame?.contentDocument) {
      const style = frame.contentDocument.createElement('style');
      style.id = 'gjs-animation-styles';
      style.innerHTML = animationStyles;
      frame.contentDocument.head.appendChild(style);
    }
  });

  // Add animation blocks
  const blockManager = editor.BlockManager;

  blockManager.add('animated-section', {
    label: 'Animated Section',
    category: 'Animations',
    content: `<section class="anim-fade-in-up" style="padding: 60px 20px; text-align: center;">
      <h2 style="font-size: 2rem; margin-bottom: 1rem;">Animated Content</h2>
      <p style="color: #666;">This section fades in with animation</p>
    </section>`,
    media: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>',
  });

  blockManager.add('hover-card', {
    label: 'Hover Card',
    category: 'Animations',
    content: `<div class="hover-lift" style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); cursor: pointer;">
      <h3 style="margin: 0 0 10px 0;">Hover Me</h3>
      <p style="margin: 0; color: #666;">I lift up on hover!</p>
    </div>`,
    media: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>',
  });
}

/**
 * Advanced Styling Plugin - Adds gradient, shadow, and filter controls
 */
export function advancedStylingPlugin(editor: Editor) {
  const styleManager = editor.StyleManager;

  // Add Gradients sector
  styleManager.addSector('gradients', {
    name: 'Gradients',
    open: false,
    properties: [
      {
        type: 'select',
        property: 'background-image',
        label: 'Gradient Type',
        options: [
          opt('none', 'None'),
          opt('linear-gradient(to right, #667eea, #764ba2)', 'Purple Dream'),
          opt('linear-gradient(to right, #f093fb, #f5576c)', 'Pink Sunset'),
          opt('linear-gradient(to right, #4facfe, #00f2fe)', 'Ocean Blue'),
          opt('linear-gradient(to right, #43e97b, #38f9d7)', 'Fresh Mint'),
          opt('linear-gradient(to right, #fa709a, #fee140)', 'Warm Flame'),
          opt('linear-gradient(to right, #a8edea, #fed6e3)', 'Soft Peach'),
          opt('linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 'Diagonal Purple'),
          opt('linear-gradient(180deg, #000000 0%, #434343 100%)', 'Dark Gradient'),
          opt('radial-gradient(circle, #667eea, #764ba2)', 'Radial Purple'),
        ],
      },
    ],
  });

  // Add Shadows sector
  styleManager.addSector('shadows', {
    name: 'Shadows',
    open: false,
    properties: [
      {
        type: 'select',
        property: 'box-shadow',
        label: 'Box Shadow',
        options: [
          opt('none', 'None'),
          opt('0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)', 'Subtle'),
          opt('0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)', 'Regular'),
          opt('0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)', 'Medium'),
          opt('0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)', 'Large'),
          opt('0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)', 'Extra Large'),
          opt('0 0 20px rgba(59, 130, 246, 0.5)', 'Blue Glow'),
          opt('0 0 20px rgba(139, 92, 246, 0.5)', 'Purple Glow'),
          opt('0 0 20px rgba(34, 197, 94, 0.5)', 'Green Glow'),
          opt('inset 0 2px 4px rgba(0,0,0,0.1)', 'Inner Shadow'),
        ],
      },
      {
        type: 'select',
        property: 'text-shadow',
        label: 'Text Shadow',
        options: [
          opt('none', 'None'),
          opt('1px 1px 2px rgba(0,0,0,0.3)', 'Subtle'),
          opt('2px 2px 4px rgba(0,0,0,0.5)', 'Medium'),
          opt('3px 3px 6px rgba(0,0,0,0.6)', 'Strong'),
          opt('0 0 10px rgba(255,255,255,0.8)', 'White Glow'),
          opt('0 0 10px rgba(59, 130, 246, 0.8)', 'Blue Glow'),
        ],
      },
    ],
  });

  // Add Filters sector
  styleManager.addSector('filters', {
    name: 'Filters & Effects',
    open: false,
    properties: [
      {
        type: 'select',
        property: 'filter',
        label: 'Filter',
        options: [
          opt('none', 'None'),
          opt('blur(2px)', 'Blur (Light)'),
          opt('blur(5px)', 'Blur (Medium)'),
          opt('blur(10px)', 'Blur (Heavy)'),
          opt('brightness(1.2)', 'Brighten'),
          opt('brightness(0.8)', 'Darken'),
          opt('contrast(1.2)', 'High Contrast'),
          opt('contrast(0.8)', 'Low Contrast'),
          opt('grayscale(1)', 'Grayscale'),
          opt('sepia(1)', 'Sepia'),
          opt('saturate(2)', 'Saturate'),
          opt('hue-rotate(90deg)', 'Hue Rotate 90°'),
          opt('hue-rotate(180deg)', 'Hue Rotate 180°'),
          opt('invert(1)', 'Invert'),
        ],
      },
      {
        type: 'select',
        property: 'backdrop-filter',
        label: 'Backdrop Filter',
        options: [
          opt('none', 'None'),
          opt('blur(5px)', 'Blur (Light)'),
          opt('blur(10px)', 'Blur (Medium)'),
          opt('blur(20px)', 'Blur (Heavy)'),
          opt('saturate(180%) blur(10px)', 'Glass Effect'),
        ],
      },
      {
        type: 'slider',
        property: 'opacity',
        label: 'Opacity',
        defaults: '1',
        min: 0,
        max: 1,
        step: 0.1,
      },
    ],
  });

  // Add Transforms sector
  styleManager.addSector('transforms', {
    name: 'Transforms',
    open: false,
    properties: [
      {
        type: 'select',
        property: 'transform',
        label: 'Transform',
        options: [
          opt('none', 'None'),
          opt('rotate(5deg)', 'Rotate 5°'),
          opt('rotate(-5deg)', 'Rotate -5°'),
          opt('rotate(15deg)', 'Rotate 15°'),
          opt('rotate(45deg)', 'Rotate 45°'),
          opt('rotate(90deg)', 'Rotate 90°'),
          opt('scale(1.1)', 'Scale Up 10%'),
          opt('scale(0.9)', 'Scale Down 10%'),
          opt('skewX(5deg)', 'Skew X 5°'),
          opt('skewY(5deg)', 'Skew Y 5°'),
          opt('perspective(500px) rotateX(10deg)', '3D Tilt X'),
          opt('perspective(500px) rotateY(10deg)', '3D Tilt Y'),
        ],
      },
    ],
  });

  // Add Transitions sector
  styleManager.addSector('transitions', {
    name: 'Transitions',
    open: false,
    properties: [
      {
        type: 'select',
        property: 'transition',
        label: 'Transition',
        options: [
          opt('none', 'None'),
          opt('all 0.2s ease', 'Fast (0.2s)'),
          opt('all 0.3s ease', 'Normal (0.3s)'),
          opt('all 0.5s ease', 'Slow (0.5s)'),
          opt('all 0.3s ease-in', 'Ease In'),
          opt('all 0.3s ease-out', 'Ease Out'),
          opt('all 0.3s ease-in-out', 'Ease In-Out'),
          opt('all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)', 'Bounce'),
          opt('transform 0.3s ease, opacity 0.3s ease', 'Transform + Opacity'),
        ],
      },
    ],
  });
}

/**
 * Typography Plugin - Enhanced text styling options
 */
export function typographyPlugin(editor: Editor) {
  const styleManager = editor.StyleManager;

  // Enhance Typography sector
  styleManager.addSector('typography-enhanced', {
    name: 'Typography Enhanced',
    open: false,
    properties: [
      {
        type: 'select',
        property: 'font-family',
        label: 'Font Family',
        options: [
          opt('inherit', 'Inherit'),
          opt('Inter, sans-serif', 'Inter'),
          opt('Poppins, sans-serif', 'Poppins'),
          opt('Roboto, sans-serif', 'Roboto'),
          opt('Open Sans, sans-serif', 'Open Sans'),
          opt('Montserrat, sans-serif', 'Montserrat'),
          opt('Lato, sans-serif', 'Lato'),
          opt('Playfair Display, serif', 'Playfair Display'),
          opt('Merriweather, serif', 'Merriweather'),
          opt('Georgia, serif', 'Georgia'),
          opt('Fira Code, monospace', 'Fira Code'),
          opt('JetBrains Mono, monospace', 'JetBrains Mono'),
        ],
      },
      {
        type: 'select',
        property: 'text-transform',
        label: 'Text Transform',
        options: [
          opt('none', 'None'),
          opt('uppercase', 'UPPERCASE'),
          opt('lowercase', 'lowercase'),
          opt('capitalize', 'Capitalize'),
        ],
      },
      {
        type: 'select',
        property: 'text-decoration',
        label: 'Text Decoration',
        options: [
          opt('none', 'None'),
          opt('underline', 'Underline'),
          opt('line-through', 'Strikethrough'),
          opt('overline', 'Overline'),
        ],
      },
      {
        type: 'select',
        property: 'font-style',
        label: 'Font Style',
        options: [
          opt('normal', 'Normal'),
          opt('italic', 'Italic'),
        ],
      },
      {
        type: 'select',
        property: 'white-space',
        label: 'White Space',
        options: [
          opt('normal', 'Normal'),
          opt('nowrap', 'No Wrap'),
          opt('pre', 'Pre'),
          opt('pre-wrap', 'Pre Wrap'),
        ],
      },
    ],
  });
}

/**
 * Flexbox/Grid Plugin - Layout utilities
 */
export function layoutPlugin(editor: Editor) {
  const styleManager = editor.StyleManager;

  styleManager.addSector('flexbox', {
    name: 'Flexbox',
    open: false,
    properties: [
      {
        type: 'select',
        property: 'display',
        label: 'Display',
        options: [
          opt('block', 'Block'),
          opt('inline-block', 'Inline Block'),
          opt('inline', 'Inline'),
          opt('flex', 'Flex'),
          opt('inline-flex', 'Inline Flex'),
          opt('grid', 'Grid'),
          opt('none', 'None'),
        ],
      },
      {
        type: 'select',
        property: 'flex-direction',
        label: 'Direction',
        options: [
          opt('row', 'Row'),
          opt('row-reverse', 'Row Reverse'),
          opt('column', 'Column'),
          opt('column-reverse', 'Column Reverse'),
        ],
      },
      {
        type: 'select',
        property: 'justify-content',
        label: 'Justify Content',
        options: [
          opt('flex-start', 'Start'),
          opt('flex-end', 'End'),
          opt('center', 'Center'),
          opt('space-between', 'Space Between'),
          opt('space-around', 'Space Around'),
          opt('space-evenly', 'Space Evenly'),
        ],
      },
      {
        type: 'select',
        property: 'align-items',
        label: 'Align Items',
        options: [
          opt('stretch', 'Stretch'),
          opt('flex-start', 'Start'),
          opt('flex-end', 'End'),
          opt('center', 'Center'),
          opt('baseline', 'Baseline'),
        ],
      },
      {
        type: 'select',
        property: 'flex-wrap',
        label: 'Wrap',
        options: [
          opt('nowrap', 'No Wrap'),
          opt('wrap', 'Wrap'),
          opt('wrap-reverse', 'Wrap Reverse'),
        ],
      },
      {
        type: 'select',
        property: 'gap',
        label: 'Gap',
        options: [
          opt('0', 'None'),
          opt('0.5rem', 'XS (0.5rem)'),
          opt('1rem', 'SM (1rem)'),
          opt('1.5rem', 'MD (1.5rem)'),
          opt('2rem', 'LG (2rem)'),
          opt('3rem', 'XL (3rem)'),
          opt('4rem', '2XL (4rem)'),
        ],
      },
    ],
  });
}

/**
 * Initialize all custom plugins
 */
export function initializePlugins(editor: Editor) {
  animationPlugin(editor);
  advancedStylingPlugin(editor);
  typographyPlugin(editor);
  layoutPlugin(editor);
}
