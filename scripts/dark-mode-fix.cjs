#!/usr/bin/env node

/**
 * Dark Mode Auto-Fix Script
 * 
 * Automatically replaces hardcoded Tailwind colors with semantic theme tokens
 * to ensure proper dark mode support across the entire codebase.
 * 
 * Usage:
 *   node scripts/dark-mode-fix.js --dry-run    # Preview changes without modifying
 *   node scripts/dark-mode-fix.js --backup     # Apply fixes with backups
 *   node scripts/dark-mode-fix.js              # Apply fixes without backups
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const CREATE_BACKUP = args.includes('--backup');

// Directories to scan
const SCAN_DIRS = ['src'];

// File extensions to process
const EXTENSIONS = ['.tsx', '.jsx', '.ts', '.js'];

// Patterns to ignore
const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.d.ts',
];

// Color replacement mappings (order matters - more specific patterns first)
const REPLACEMENTS = [
  // ===== BACKGROUNDS =====
  // White backgrounds
  { from: /\bbg-white\b/g, to: 'bg-card' },
  
  // Gray backgrounds (light to dark)
  { from: /\bbg-gray-50\b/g, to: 'bg-muted/50' },
  { from: /\bbg-gray-100\b/g, to: 'bg-muted' },
  { from: /\bbg-gray-200\b/g, to: 'bg-muted' },
  { from: /\bbg-gray-300\b/g, to: 'bg-muted' },
  { from: /\bbg-gray-400\b/g, to: 'bg-muted-foreground/20' },
  { from: /\bbg-gray-500\b/g, to: 'bg-muted-foreground/30' },
  { from: /\bbg-gray-600\b/g, to: 'bg-muted-foreground/40' },
  { from: /\bbg-gray-700\b/g, to: 'bg-muted-foreground/50' },
  { from: /\bbg-gray-800\b/g, to: 'bg-foreground/80' },
  { from: /\bbg-gray-900\b/g, to: 'bg-foreground/90' },
  
  // Slate backgrounds
  { from: /\bbg-slate-50\b/g, to: 'bg-muted/50' },
  { from: /\bbg-slate-100\b/g, to: 'bg-muted' },
  { from: /\bbg-slate-200\b/g, to: 'bg-muted' },
  { from: /\bbg-slate-800\b/g, to: 'bg-foreground/80' },
  { from: /\bbg-slate-900\b/g, to: 'bg-foreground/90' },
  
  // ===== TEXT COLORS =====
  // Black text
  { from: /\btext-black\b/g, to: 'text-foreground' },
  
  // Gray text (dark to light)
  { from: /\btext-gray-900\b/g, to: 'text-foreground' },
  { from: /\btext-gray-800\b/g, to: 'text-foreground' },
  { from: /\btext-gray-700\b/g, to: 'text-foreground' },
  { from: /\btext-gray-600\b/g, to: 'text-muted-foreground' },
  { from: /\btext-gray-500\b/g, to: 'text-muted-foreground' },
  { from: /\btext-gray-400\b/g, to: 'text-muted-foreground' },
  { from: /\btext-gray-300\b/g, to: 'text-muted-foreground/70' },
  
  // Slate text
  { from: /\btext-slate-900\b/g, to: 'text-foreground' },
  { from: /\btext-slate-800\b/g, to: 'text-foreground' },
  { from: /\btext-slate-700\b/g, to: 'text-foreground' },
  { from: /\btext-slate-600\b/g, to: 'text-muted-foreground' },
  { from: /\btext-slate-500\b/g, to: 'text-muted-foreground' },
  { from: /\btext-slate-400\b/g, to: 'text-muted-foreground' },
  
  // ===== BORDERS =====
  // Gray borders
  { from: /\bborder-gray-100\b/g, to: 'border-border' },
  { from: /\bborder-gray-200\b/g, to: 'border-border' },
  { from: /\bborder-gray-300\b/g, to: 'border-input' },
  { from: /\bborder-gray-400\b/g, to: 'border-input' },
  
  // Slate borders
  { from: /\bborder-slate-200\b/g, to: 'border-border' },
  { from: /\bborder-slate-300\b/g, to: 'border-input' },
  
  // White borders (rare but should be themed)
  { from: /\bborder-white\b/g, to: 'border-background' },
  
  // ===== HOVER STATES =====
  // Background hovers
  { from: /\bhover:bg-white\b/g, to: 'hover:bg-card' },
  { from: /\bhover:bg-gray-50\b/g, to: 'hover:bg-muted/50' },
  { from: /\bhover:bg-gray-100\b/g, to: 'hover:bg-muted' },
  { from: /\bhover:bg-gray-200\b/g, to: 'hover:bg-muted' },
  { from: /\bhover:bg-gray-300\b/g, to: 'hover:bg-muted' },
  { from: /\bhover:bg-slate-50\b/g, to: 'hover:bg-muted/50' },
  { from: /\bhover:bg-slate-100\b/g, to: 'hover:bg-muted' },
  
  // Text hovers
  { from: /\bhover:text-gray-900\b/g, to: 'hover:text-foreground' },
  { from: /\bhover:text-gray-800\b/g, to: 'hover:text-foreground' },
  { from: /\bhover:text-gray-700\b/g, to: 'hover:text-foreground' },
  { from: /\bhover:text-gray-600\b/g, to: 'hover:text-muted-foreground' },
  { from: /\bhover:text-slate-900\b/g, to: 'hover:text-foreground' },
  { from: /\bhover:text-slate-700\b/g, to: 'hover:text-foreground' },
  
  // Border hovers
  { from: /\bhover:border-gray-300\b/g, to: 'hover:border-input' },
  { from: /\bhover:border-gray-400\b/g, to: 'hover:border-input' },
  
  // ===== FOCUS STATES =====
  // Ring colors
  { from: /\bfocus:ring-gray-100\b/g, to: 'focus:ring-ring' },
  { from: /\bfocus:ring-gray-200\b/g, to: 'focus:ring-ring' },
  { from: /\bfocus:ring-gray-300\b/g, to: 'focus:ring-ring' },
  { from: /\bfocus:ring-gray-400\b/g, to: 'focus:ring-ring' },
  { from: /\bfocus:ring-gray-500\b/g, to: 'focus:ring-ring' },
  { from: /\bfocus:ring-indigo-500\b/g, to: 'focus-visible:ring-ring' },
  { from: /\bfocus:ring-blue-500\b/g, to: 'focus-visible:ring-ring' },
  
  // Border focus
  { from: /\bfocus:border-gray-300\b/g, to: 'focus:border-input' },
  { from: /\bfocus:border-gray-400\b/g, to: 'focus:border-input' },
  { from: /\bfocus:border-gray-500\b/g, to: 'focus:border-input' },
  { from: /\bfocus:border-indigo-500\b/g, to: 'focus-visible:border-primary' },
  { from: /\bfocus:border-blue-500\b/g, to: 'focus-visible:border-primary' },
  
  // Focus-visible variants
  { from: /\bfocus-visible:ring-gray-\d{3}\b/g, to: 'focus-visible:ring-ring' },
  
  // ===== ACTIVE STATES =====
  { from: /\bactive:bg-gray-100\b/g, to: 'active:bg-muted' },
  { from: /\bactive:bg-gray-200\b/g, to: 'active:bg-muted' },
  
  // ===== DIVIDERS =====
  { from: /\bdivide-gray-100\b/g, to: 'divide-border' },
  { from: /\bdivide-gray-200\b/g, to: 'divide-border' },
  { from: /\bdivide-gray-300\b/g, to: 'divide-border' },
  { from: /\bdivide-slate-200\b/g, to: 'divide-border' },
  
  // ===== RING COLORS =====
  { from: /\bring-gray-100\b/g, to: 'ring-border' },
  { from: /\bring-gray-200\b/g, to: 'ring-border' },
  { from: /\bring-gray-300\b/g, to: 'ring-border' },
  { from: /\bring-white\b/g, to: 'ring-background' },
  
  // ===== PLACEHOLDERS =====
  { from: /\bplaceholder-gray-300\b/g, to: 'placeholder:text-muted-foreground' },
  { from: /\bplaceholder-gray-400\b/g, to: 'placeholder:text-muted-foreground' },
  { from: /\bplaceholder-gray-500\b/g, to: 'placeholder:text-muted-foreground' },
  { from: /\bplaceholder:text-gray-300\b/g, to: 'placeholder:text-muted-foreground' },
  { from: /\bplaceholder:text-gray-400\b/g, to: 'placeholder:text-muted-foreground' },
  { from: /\bplaceholder:text-gray-500\b/g, to: 'placeholder:text-muted-foreground' },
  
  // ===== SHADOWS =====
  { from: /\bshadow-gray-100\b/g, to: 'shadow-border/10' },
  { from: /\bshadow-gray-200\b/g, to: 'shadow-border/20' },
  
  // ===== OUTLINES =====
  { from: /\boutline-gray-300\b/g, to: 'outline-border' },
  { from: /\boutline-gray-400\b/g, to: 'outline-border' },
  
  // ===== ACCENT COLORS =====
  { from: /\baccent-gray-200\b/g, to: 'accent-muted' },
  { from: /\baccent-gray-300\b/g, to: 'accent-muted' },
  
  // ===== CARET COLORS =====
  { from: /\bcaret-gray-500\b/g, to: 'caret-foreground' },
  { from: /\bcaret-gray-600\b/g, to: 'caret-foreground' },
  
  // ===== DECORATION COLORS =====
  { from: /\bdecoration-gray-300\b/g, to: 'decoration-border' },
  { from: /\bdecoration-gray-400\b/g, to: 'decoration-border' },
  
  // ===== RESPONSIVE VARIANTS =====
  // sm: prefix
  { from: /\bsm:bg-white\b/g, to: 'sm:bg-card' },
  { from: /\bsm:bg-gray-50\b/g, to: 'sm:bg-muted/50' },
  { from: /\bsm:bg-gray-100\b/g, to: 'sm:bg-muted' },
  { from: /\bsm:text-gray-900\b/g, to: 'sm:text-foreground' },
  { from: /\bsm:text-gray-600\b/g, to: 'sm:text-muted-foreground' },
  
  // md: prefix
  { from: /\bmd:bg-white\b/g, to: 'md:bg-card' },
  { from: /\bmd:bg-gray-50\b/g, to: 'md:bg-muted/50' },
  { from: /\bmd:bg-gray-100\b/g, to: 'md:bg-muted' },
  { from: /\bmd:text-gray-900\b/g, to: 'md:text-foreground' },
  { from: /\bmd:text-gray-600\b/g, to: 'md:text-muted-foreground' },
  
  // lg: prefix
  { from: /\blg:bg-white\b/g, to: 'lg:bg-card' },
  { from: /\blg:bg-gray-50\b/g, to: 'lg:bg-muted/50' },
  { from: /\blg:bg-gray-100\b/g, to: 'lg:bg-muted' },
  { from: /\blg:text-gray-900\b/g, to: 'lg:text-foreground' },
  { from: /\blg:text-gray-600\b/g, to: 'lg:text-muted-foreground' },
  
  // ===== GROUP VARIANTS =====
  { from: /\bgroup-hover:bg-gray-50\b/g, to: 'group-hover:bg-muted/50' },
  { from: /\bgroup-hover:bg-gray-100\b/g, to: 'group-hover:bg-muted' },
  { from: /\bgroup-hover:text-gray-900\b/g, to: 'group-hover:text-foreground' },
  { from: /\bgroup-hover:text-gray-700\b/g, to: 'group-hover:text-foreground' },
  
  // ===== PEER VARIANTS =====
  { from: /\bpeer-focus:border-gray-300\b/g, to: 'peer-focus:border-input' },
  { from: /\bpeer-focus:ring-gray-300\b/g, to: 'peer-focus:ring-ring' },
  
  // ===== DISABLED STATES =====
  { from: /\bdisabled:bg-gray-50\b/g, to: 'disabled:bg-muted/50' },
  { from: /\bdisabled:bg-gray-100\b/g, to: 'disabled:bg-muted' },
  { from: /\bdisabled:text-gray-400\b/g, to: 'disabled:text-muted-foreground' },
  { from: /\bdisabled:text-gray-500\b/g, to: 'disabled:text-muted-foreground' },
  
  // ===== SELECTION =====
  { from: /\bselection:bg-gray-200\b/g, to: 'selection:bg-muted' },
  { from: /\bselection:bg-gray-300\b/g, to: 'selection:bg-muted' },
];

// Statistics
let stats = {
  filesScanned: 0,
  filesModified: 0,
  totalReplacements: 0,
  replacementsByType: {},
  fileChanges: [],
};

/**
 * Check if a file path should be ignored
 */
function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern));
}

/**
 * Apply replacements to content
 */
function applyReplacements(content, filePath) {
  let modifiedContent = content;
  let fileReplacements = [];
  
  for (const { from, to } of REPLACEMENTS) {
    const matches = modifiedContent.match(from);
    if (matches) {
      const count = matches.length;
      modifiedContent = modifiedContent.replace(from, to);
      
      const patternKey = from.toString();
      stats.replacementsByType[patternKey] = (stats.replacementsByType[patternKey] || 0) + count;
      stats.totalReplacements += count;
      
      fileReplacements.push({
        from: from.toString().replace(/\/\\b|\\b\/g/g, ''),
        to,
        count,
      });
    }
  }
  
  return { modifiedContent, fileReplacements };
}

/**
 * Process a single file
 */
function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { modifiedContent, fileReplacements } = applyReplacements(content, filePath);
  
  if (fileReplacements.length > 0) {
    stats.filesModified++;
    stats.fileChanges.push({
      file: filePath,
      replacements: fileReplacements,
    });
    
    if (!DRY_RUN) {
      if (CREATE_BACKUP) {
        fs.writeFileSync(`${filePath}.backup`, content);
      }
      fs.writeFileSync(filePath, modifiedContent);
    }
  }
  
  stats.filesScanned++;
}

/**
 * Recursively scan a directory
 */
function scanDirectory(dir) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    
    if (shouldIgnore(fullPath)) continue;
    
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (stat.isFile() && EXTENSIONS.some(ext => item.endsWith(ext))) {
      processFile(fullPath);
    }
  }
}

/**
 * Format and print results
 */
function printResults() {
  console.log('\n' + '='.repeat(80));
  console.log(DRY_RUN ? '🔍 DRY RUN RESULTS' : '✅ FIX RESULTS');
  console.log('='.repeat(80));
  
  console.log(`\n📊 Summary:`);
  console.log(`   Files scanned: ${stats.filesScanned}`);
  console.log(`   Files ${DRY_RUN ? 'would be ' : ''}modified: ${stats.filesModified}`);
  console.log(`   Total replacements: ${stats.totalReplacements}`);
  
  if (stats.fileChanges.length > 0) {
    console.log(`\n📁 Files ${DRY_RUN ? 'to be ' : ''}modified:`);
    
    for (const { file, replacements } of stats.fileChanges) {
      const totalCount = replacements.reduce((sum, r) => sum + r.count, 0);
      console.log(`\n   ${file} (${totalCount} changes)`);
      
      for (const { from, to, count } of replacements) {
        console.log(`      ${from} → ${to} (${count}x)`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(80));
  
  if (DRY_RUN) {
    console.log('💡 This was a dry run. No files were modified.');
    console.log('   Run without --dry-run to apply changes.');
  } else if (CREATE_BACKUP) {
    console.log('💾 Backups created with .backup extension.');
  }
  
  console.log('='.repeat(80) + '\n');
}

// Main execution
console.log('\n🎨 Dark Mode Auto-Fix Script');
console.log('━'.repeat(40));
console.log(`Mode: ${DRY_RUN ? 'DRY RUN (preview only)' : CREATE_BACKUP ? 'FIX WITH BACKUPS' : 'FIX'}`);
console.log(`Scanning: ${SCAN_DIRS.join(', ')}`);
console.log('━'.repeat(40));

for (const dir of SCAN_DIRS) {
  if (fs.existsSync(dir)) {
    scanDirectory(dir);
  } else {
    console.warn(`⚠️  Directory not found: ${dir}`);
  }
}

printResults();

// Exit with appropriate code
process.exit(stats.filesModified > 0 && DRY_RUN ? 1 : 0);
