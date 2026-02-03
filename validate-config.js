#!/usr/bin/env node

/**
 * Configuration validation script for design system merger
 * Validates that all build configurations are properly integrated
 */

import fs from 'fs';
import path from 'path';

const checks = [];

// Check if Tailwind config exists and has doodle colors
try {
  const tailwindConfig = fs.readFileSync('tailwind.config.js', 'utf8');
  if (tailwindConfig.includes('coral') && tailwindConfig.includes('teal') && tailwindConfig.includes('sunny')) {
    checks.push('✅ Tailwind config merged with doodle colors');
  } else {
    checks.push('❌ Tailwind config missing doodle colors');
  }
  
  if (tailwindConfig.includes('float') && tailwindConfig.includes('bounce-gentle')) {
    checks.push('✅ Tailwind config includes doodle animations');
  } else {
    checks.push('❌ Tailwind config missing doodle animations');
  }
  
  if (tailwindConfig.includes('animationDelay')) {
    checks.push('✅ Tailwind config includes animation delay utilities');
  } else {
    checks.push('❌ Tailwind config missing animation delay utilities');
  }
} catch (error) {
  checks.push('❌ Tailwind config not found');
}

// Check TypeScript config
try {
  const tsConfigContent = fs.readFileSync('tsconfig.json', 'utf8');
  
  // Instead of parsing JSON, just check for the presence of required strings
  if (tsConfigContent.includes('"@/components/doodles/*"')) {
    checks.push('✅ TypeScript config has doodle component paths');
  } else {
    checks.push('❌ TypeScript config missing doodle paths');
  }
  
  if (tsConfigContent.includes('"@/lib/design-system/*"')) {
    checks.push('✅ TypeScript config has design system paths');
  } else {
    checks.push('❌ TypeScript config missing design system paths');
  }
  
  if (tsConfigContent.includes('"strict": true')) {
    checks.push('✅ TypeScript strict mode enabled');
  } else {
    checks.push('❌ TypeScript strict mode disabled');
  }
} catch (error) {
  checks.push(`❌ TypeScript config not found or invalid: ${error.message}`);
}

// Check Vite config
try {
  const viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
  if (viteConfig.includes('react-swc') && viteConfig.includes('doodle-original')) {
    checks.push('✅ Vite config optimized for design system');
  } else {
    checks.push('❌ Vite config not optimized');
  }
  
  if (viteConfig.includes('manualChunks') && viteConfig.includes('design-system')) {
    checks.push('✅ Vite config has proper code splitting');
  } else {
    checks.push('❌ Vite config missing code splitting');
  }
  
  if (viteConfig.includes('cssCodeSplit')) {
    checks.push('✅ Vite config has CSS code splitting');
  } else {
    checks.push('❌ Vite config missing CSS code splitting');
  }
} catch (error) {
  checks.push('❌ Vite config not found');
}

// Check ESLint config
try {
  const eslintConfig = fs.readFileSync('eslint.config.js', 'utf8');
  if (eslintConfig.includes('typescript-eslint') && eslintConfig.includes('react-hooks')) {
    checks.push('✅ ESLint config properly configured');
  } else {
    checks.push('❌ ESLint config incomplete');
  }
  
  if (eslintConfig.includes('src/components/doodles/**/*.{ts,tsx}')) {
    checks.push('✅ ESLint config has doodle-specific rules');
  } else {
    checks.push('❌ ESLint config missing doodle rules');
  }
} catch (error) {
  checks.push('❌ ESLint config not found');
}

// Check PostCSS config
try {
  const postcssConfig = fs.readFileSync('postcss.config.js', 'utf8');
  if (postcssConfig.includes('tailwindcss') && postcssConfig.includes('autoprefixer')) {
    checks.push('✅ PostCSS config properly configured');
  } else {
    checks.push('❌ PostCSS config incomplete');
  }
} catch (error) {
  checks.push('❌ PostCSS config not found');
}

// Check Prettier config
try {
  const prettierConfig = fs.readFileSync('.prettierrc.json', 'utf8');
  const config = JSON.parse(prettierConfig);
  if (config.overrides && config.overrides.some(o => o.files.includes('src/components/doodles/**/*.{ts,tsx}'))) {
    checks.push('✅ Prettier config has doodle-specific formatting');
  } else {
    checks.push('❌ Prettier config missing doodle formatting rules');
  }
} catch (error) {
  checks.push('❌ Prettier config not found or invalid');
}

// Check design system files
const designSystemFiles = [
  'src/styles/tokens.css',
  'src/styles/animations.css',
  'src/styles/globals.css'
];

designSystemFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('coral') || content.includes('float') || content.includes('ligne-claire')) {
      checks.push(`✅ ${file} contains design system content`);
    } else {
      checks.push(`❌ ${file} missing design system content`);
    }
  } else {
    checks.push(`❌ ${file} not found`);
  }
});

// Check build script integration
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (packageJson.scripts && packageJson.scripts.build) {
    checks.push('✅ Build script available');
  } else {
    checks.push('❌ Build script missing');
  }
  
  if (packageJson.scripts && packageJson.scripts.dev) {
    checks.push('✅ Development script available');
  } else {
    checks.push('❌ Development script missing');
  }
  
  if (packageJson.scripts && packageJson.scripts.lint) {
    checks.push('✅ Lint script available');
  } else {
    checks.push('❌ Lint script missing');
  }
} catch (error) {
  checks.push('❌ Package.json not found or invalid');
}

// Check for TypeScript node config
if (fs.existsSync('tsconfig.node.json')) {
  try {
    const nodeConfigContent = fs.readFileSync('tsconfig.node.json', 'utf8');
    // Remove comments for JSON parsing
    const cleanedContent = nodeConfigContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    const nodeConfig = JSON.parse(cleanedContent);
    
    if (nodeConfig.include && nodeConfig.include.includes('vite.config.ts')) {
      checks.push('✅ TypeScript node config properly configured');
    } else {
      checks.push('❌ TypeScript node config incomplete');
    }
  } catch (error) {
    checks.push('❌ TypeScript node config invalid');
  }
} else {
  checks.push('❌ TypeScript node config missing');
}

console.log('\n🔍 Build Configuration Integration Validation\n');
checks.forEach(check => console.log(check));

const passed = checks.filter(check => check.startsWith('✅')).length;
const total = checks.length;

console.log(`\n📊 Results: ${passed}/${total} checks passed`);

if (passed === total) {
  console.log('🎉 All build configuration integration completed successfully!');
  process.exit(0);
} else {
  console.log('⚠️  Some build configuration issues detected');
  process.exit(1);
}