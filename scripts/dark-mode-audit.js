#!/usr/bin/env node

/**
 * Dark Mode Audit Script
 * Scans for hardcoded Tailwind colors that don't adapt to dark mode
 * 
 * Usage: node scripts/dark-mode-audit.js
 */

const fs = require('fs');
const path = require('path');

// Patterns to detect hardcoded colors
const HARDCODED_PATTERNS = [
  // White/Black backgrounds
  { pattern: /\bbg-white\b/g, suggestion: 'bg-background or bg-card', severity: 'high' },
  { pattern: /\bbg-black\b/g, suggestion: 'bg-foreground (for inverted)', severity: 'medium' },
  
  // Gray backgrounds
  { pattern: /\bbg-gray-50\b/g, suggestion: 'bg-muted or bg-muted/50', severity: 'high' },
  { pattern: /\bbg-gray-100\b/g, suggestion: 'bg-muted', severity: 'high' },
  { pattern: /\bbg-gray-200\b/g, suggestion: 'bg-muted', severity: 'high' },
  { pattern: /\bbg-gray-[3-9]00\b/g, suggestion: 'bg-muted-foreground or custom', severity: 'medium' },
  
  // Gray text
  { pattern: /\btext-gray-900\b/g, suggestion: 'text-foreground', severity: 'high' },
  { pattern: /\btext-gray-800\b/g, suggestion: 'text-foreground', severity: 'high' },
  { pattern: /\btext-gray-700\b/g, suggestion: 'text-foreground', severity: 'high' },
  { pattern: /\btext-gray-600\b/g, suggestion: 'text-muted-foreground', severity: 'high' },
  { pattern: /\btext-gray-500\b/g, suggestion: 'text-muted-foreground', severity: 'high' },
  { pattern: /\btext-gray-400\b/g, suggestion: 'text-muted-foreground', severity: 'high' },
  { pattern: /\btext-gray-300\b/g, suggestion: 'text-muted-foreground', severity: 'medium' },
  { pattern: /\btext-white\b/g, suggestion: 'text-primary-foreground (on colored bg)', severity: 'low' },
  { pattern: /\btext-black\b/g, suggestion: 'text-foreground', severity: 'medium' },
  
  // Gray borders
  { pattern: /\bborder-gray-100\b/g, suggestion: 'border-border', severity: 'high' },
  { pattern: /\bborder-gray-200\b/g, suggestion: 'border-border', severity: 'high' },
  { pattern: /\bborder-gray-300\b/g, suggestion: 'border-input', severity: 'high' },
  { pattern: /\bborder-gray-[4-9]00\b/g, suggestion: 'border-border', severity: 'medium' },
  { pattern: /\bborder-white\b/g, suggestion: 'border-background', severity: 'medium' },
  
  // Slate/Zinc/Neutral (other gray scales)
  { pattern: /\b(bg|text|border)-(slate|zinc|neutral|stone)-\d{2,3}\b/g, suggestion: 'Use semantic tokens', severity: 'high' },
  
  // Hover states with hardcoded colors
  { pattern: /\bhover:bg-gray-\d{2,3}\b/g, suggestion: 'hover:bg-muted or hover:bg-accent', severity: 'high' },
  { pattern: /\bhover:text-gray-\d{2,3}\b/g, suggestion: 'hover:text-foreground', severity: 'high' },
  
  // Focus states
  { pattern: /\bfocus:ring-gray-\d{2,3}\b/g, suggestion: 'focus:ring-ring', severity: 'medium' },
  { pattern: /\bfocus:border-gray-\d{2,3}\b/g, suggestion: 'focus:border-ring', severity: 'medium' },
  
  // Divide colors
  { pattern: /\bdivide-gray-\d{2,3}\b/g, suggestion: 'divide-border', severity: 'high' },
  
  // Ring colors
  { pattern: /\bring-gray-\d{2,3}\b/g, suggestion: 'ring-border or ring-ring', severity: 'medium' },
  
  // Placeholder
  { pattern: /\bplaceholder-gray-\d{2,3}\b/g, suggestion: 'placeholder:text-muted-foreground', severity: 'medium' },
  
  // Shadow (less critical but worth noting)
  { pattern: /\bshadow-gray-\d{2,3}\b/g, suggestion: 'Use default shadow', severity: 'low' },
];

// Directories to scan
const SCAN_DIRS = ['src'];

// File extensions to check
const EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.css'];

// Files/directories to ignore
const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.d.ts',
  'types.ts', // Generated types
];

function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];

  lines.forEach((line, lineIndex) => {
    HARDCODED_PATTERNS.forEach(({ pattern, suggestion, severity }) => {
      const matches = line.match(pattern);
      if (matches) {
        matches.forEach(match => {
          issues.push({
            file: filePath,
            line: lineIndex + 1,
            match,
            suggestion,
            severity,
            context: line.trim().substring(0, 100),
          });
        });
      }
    });
  });

  return issues;
}

function scanDirectory(dir) {
  let allIssues = [];

  function walk(currentPath) {
    if (shouldIgnore(currentPath)) return;

    const stat = fs.statSync(currentPath);

    if (stat.isDirectory()) {
      fs.readdirSync(currentPath).forEach(file => {
        walk(path.join(currentPath, file));
      });
    } else if (stat.isFile() && EXTENSIONS.some(ext => currentPath.endsWith(ext))) {
      const issues = scanFile(currentPath);
      allIssues = allIssues.concat(issues);
    }
  }

  walk(dir);
  return allIssues;
}

function formatResults(issues) {
  // Group by file
  const byFile = {};
  issues.forEach(issue => {
    if (!byFile[issue.file]) {
      byFile[issue.file] = [];
    }
    byFile[issue.file].push(issue);
  });

  // Count by severity
  const bySeverity = { high: 0, medium: 0, low: 0 };
  issues.forEach(issue => {
    bySeverity[issue.severity]++;
  });

  console.log('\n' + '='.repeat(80));
  console.log('🌙 DARK MODE AUDIT REPORT');
  console.log('='.repeat(80));
  
  console.log('\n📊 SUMMARY');
  console.log('-'.repeat(40));
  console.log(`Total issues found: ${issues.length}`);
  console.log(`  🔴 High severity:   ${bySeverity.high}`);
  console.log(`  🟡 Medium severity: ${bySeverity.medium}`);
  console.log(`  🟢 Low severity:    ${bySeverity.low}`);
  console.log(`Files affected: ${Object.keys(byFile).length}`);

  console.log('\n📁 ISSUES BY FILE');
  console.log('-'.repeat(40));

  Object.keys(byFile)
    .sort((a, b) => byFile[b].length - byFile[a].length)
    .forEach(file => {
      const fileIssues = byFile[file];
      const highCount = fileIssues.filter(i => i.severity === 'high').length;
      const icon = highCount > 0 ? '🔴' : '🟡';
      
      console.log(`\n${icon} ${file} (${fileIssues.length} issues)`);
      
      fileIssues.forEach(issue => {
        const severityIcon = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
        console.log(`   Line ${issue.line}: ${severityIcon} ${issue.match}`);
        console.log(`      → Suggestion: ${issue.suggestion}`);
      });
    });

  console.log('\n' + '='.repeat(80));
  console.log('💡 QUICK REFERENCE - Common Replacements');
  console.log('='.repeat(80));
  console.log(`
  BACKGROUNDS:
    bg-white          → bg-background or bg-card
    bg-gray-50/100    → bg-muted
    
  TEXT:
    text-gray-900/800 → text-foreground
    text-gray-600-400 → text-muted-foreground
    
  BORDERS:
    border-gray-200   → border-border
    border-gray-300   → border-input
    
  STATES:
    hover:bg-gray-*   → hover:bg-muted or hover:bg-accent
    focus:ring-*      → focus:ring-ring
  `);
}

// Main execution
console.log('🔍 Scanning for hardcoded colors...\n');

let allIssues = [];
SCAN_DIRS.forEach(dir => {
  if (fs.existsSync(dir)) {
    allIssues = allIssues.concat(scanDirectory(dir));
  }
});

formatResults(allIssues);

// Exit with error code if high severity issues found
const highSeverityCount = allIssues.filter(i => i.severity === 'high').length;
if (highSeverityCount > 0) {
  console.log(`\n⚠️  Found ${highSeverityCount} high-severity issues that should be fixed.`);
  process.exit(1);
}
