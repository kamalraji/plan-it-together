#!/usr/bin/env node

/**
 * Build integration script for design system merger
 * Handles build-time optimizations and validations
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🚀 Starting build integration process...\n');

// Step 1: Validate all configurations
console.log('1️⃣ Validating configurations...');
try {
  execSync('node validate-config.js', { stdio: 'inherit' });
  console.log('✅ Configuration validation passed\n');
} catch (error) {
  console.error('❌ Configuration validation failed');
  process.exit(1);
}

// Step 2: Type checking
console.log('2️⃣ Running TypeScript type checking...');
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ TypeScript type checking passed\n');
} catch (error) {
  console.error('❌ TypeScript type checking failed');
  process.exit(1);
}

// Step 3: Linting
console.log('3️⃣ Running ESLint...');
try {
  execSync('npx eslint src --ext .ts,.tsx --max-warnings 0', { stdio: 'inherit' });
  console.log('✅ ESLint passed\n');
} catch (error) {
  console.error('❌ ESLint failed');
  process.exit(1);
}

// Step 4: Build optimization check
console.log('4️⃣ Checking build optimization...');
try {
  // Check if design system files exist
  const requiredFiles = [
    'src/components/doodles',
    'src/components/enhanced',
    'src/lib/design-system',
    'src/styles'
  ];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    console.error(`❌ Missing required directories: ${missingFiles.join(', ')}`);
    process.exit(1);
  }
  
  console.log('✅ Build optimization check passed\n');
} catch (error) {
  console.error('❌ Build optimization check failed');
  process.exit(1);
}

// Step 5: Bundle analysis preparation
console.log('5️⃣ Preparing bundle analysis...');
try {
  // Create a build info file for analysis
  const buildInfo = {
    timestamp: new Date().toISOString(),
    designSystemVersion: process.env.npm_package_version || '1.0.0',
    nodeVersion: process.version,
    buildMode: process.env.NODE_ENV || 'production',
    features: {
      doodleComponents: fs.existsSync('src/components/doodles'),
      enhancedComponents: fs.existsSync('src/components/enhanced'),
      designSystemLib: fs.existsSync('src/lib/design-system'),
      animations: fs.existsSync('src/styles/animations.css'),
      tokens: fs.existsSync('src/styles/tokens.css')
    }
  };
  
  fs.writeFileSync('build-info.json', JSON.stringify(buildInfo, null, 2));
  console.log('✅ Bundle analysis preparation completed\n');
} catch (error) {
  console.error('❌ Bundle analysis preparation failed');
  process.exit(1);
}

console.log('🎉 Build integration process completed successfully!');
console.log('Ready to run: npm run build');