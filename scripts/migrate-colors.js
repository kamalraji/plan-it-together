#!/usr/bin/env node
/**
 * Color Migration Script - Industrial Grade
  * 
  * Safely migrates hardcoded Tailwind colors to semantic design tokens.
  * 
  * Usage:
  *   node scripts/migrate-colors.js --dry-run     # Preview changes (default)
  *   node scripts/migrate-colors.js --apply       # Apply changes with backups
  *   node scripts/migrate-colors.js --report      # Generate detailed report only
  * 
  * Safety Features:
  *   - Automatic backups before modification
  *   - Context-aware regex to skip gradients, hovers, dark mode
  *   - Flags files with dynamic classes for manual review
  *   - Detailed migration report with line numbers
  */
 
 const fs = require('fs');
 const path = require('path');
 
 // ============================================================================
 // CONFIGURATION
 // ============================================================================
 
 const SRC_DIR = path.join(__dirname, '..', 'src');
 const BACKUP_DIR = path.join(__dirname, '..', 'backups', 'color-migration');
 const REPORT_FILE = path.join(__dirname, '..', 'migration-report.json');
 
 // Color mappings: hardcoded -> semantic token
 const COLOR_MAPPINGS = {
   // Success (green)
   'bg-green-50': 'bg-success/10',
   'bg-green-100': 'bg-success/20',
   'bg-green-200': 'bg-success/30',
   'bg-green-500': 'bg-success',
   'bg-green-600': 'bg-success',
   'bg-green-700': 'bg-success',
   'text-green-500': 'text-success',
   'text-green-600': 'text-success',
   'text-green-700': 'text-success',
   'text-green-800': 'text-success',
   'border-green-200': 'border-success/30',
   'border-green-500': 'border-success',
   'ring-green-500': 'ring-success',
   
   // Destructive (red)
   'bg-red-50': 'bg-destructive/10',
   'bg-red-100': 'bg-destructive/20',
   'bg-red-200': 'bg-destructive/30',
   'bg-red-500': 'bg-destructive',
   'bg-red-600': 'bg-destructive',
   'bg-red-700': 'bg-destructive',
   'text-red-500': 'text-destructive',
   'text-red-600': 'text-destructive',
   'text-red-700': 'text-destructive',
   'text-red-800': 'text-destructive',
   'border-red-200': 'border-destructive/30',
   'border-red-300': 'border-destructive/40',
   'border-red-500': 'border-destructive',
   'ring-red-500': 'ring-destructive',
   
   // Warning (yellow/amber)
   'bg-yellow-50': 'bg-warning/10',
   'bg-yellow-100': 'bg-warning/20',
   'bg-yellow-200': 'bg-warning/30',
   'bg-yellow-500': 'bg-warning',
   'bg-yellow-600': 'bg-warning',
   'text-yellow-500': 'text-warning',
   'text-yellow-600': 'text-warning',
   'text-yellow-700': 'text-warning',
   'text-yellow-800': 'text-warning',
   'border-yellow-200': 'border-warning/30',
   'border-yellow-500': 'border-warning',
   'bg-amber-50': 'bg-warning/10',
   'bg-amber-100': 'bg-warning/20',
   'bg-amber-500': 'bg-warning',
   'bg-amber-600': 'bg-warning',
   'text-amber-500': 'text-warning',
   'text-amber-600': 'text-warning',
   'text-amber-700': 'text-warning',
   'text-amber-800': 'text-warning',
   'border-amber-500': 'border-warning',
   
   // Info (blue)
   'bg-blue-50': 'bg-info/10',
   'bg-blue-100': 'bg-info/20',
   'bg-blue-200': 'bg-info/30',
   'bg-blue-500': 'bg-info',
   'bg-blue-600': 'bg-info',
   'bg-blue-700': 'bg-info',
   'text-blue-500': 'text-info',
   'text-blue-600': 'text-info',
   'text-blue-700': 'text-info',
   'text-blue-800': 'text-info',
   'border-blue-200': 'border-info/30',
   'border-blue-500': 'border-info',
   'ring-blue-500': 'ring-info',
   
   // Primary (indigo/purple)
   'bg-indigo-50': 'bg-primary/10',
   'bg-indigo-100': 'bg-primary/20',
   'bg-indigo-500': 'bg-primary',
   'bg-indigo-600': 'bg-primary',
   'bg-indigo-700': 'bg-primary',
   'text-indigo-500': 'text-primary',
   'text-indigo-600': 'text-primary',
   'text-indigo-700': 'text-primary',
   'border-indigo-500': 'border-primary',
   'ring-indigo-500': 'ring-primary',
   
   // Secondary/Accent (purple)
   'bg-purple-50': 'bg-accent/10',
   'bg-purple-100': 'bg-accent/20',
   'bg-purple-500': 'bg-accent',
   'bg-purple-600': 'bg-accent',
   'text-purple-500': 'text-accent-foreground',
   'text-purple-600': 'text-accent-foreground',
   'text-purple-700': 'text-accent-foreground',
   'text-purple-800': 'text-accent-foreground',
   'border-purple-500': 'border-accent',
   
   // Neutral (gray) - map to muted
   'bg-gray-50': 'bg-muted/50',
   'bg-gray-100': 'bg-muted',
   'bg-gray-200': 'bg-muted',
   'text-gray-400': 'text-muted-foreground',
   'text-gray-500': 'text-muted-foreground',
   'text-gray-600': 'text-foreground/80',
   'text-gray-700': 'text-foreground',
   'text-gray-800': 'text-foreground',
   'text-gray-900': 'text-foreground',
   'border-gray-200': 'border-border',
   'border-gray-300': 'border-border',
   
   // Orange - map to warning variant
   'bg-orange-50': 'bg-warning/10',
   'bg-orange-100': 'bg-warning/20',
   'bg-orange-500': 'bg-warning',
   'text-orange-500': 'text-warning',
   'text-orange-600': 'text-warning',
   'text-orange-800': 'text-warning',
 };
 
 // Patterns to SKIP (context-aware safety)
 const SKIP_PATTERNS = [
   /from-\w+-\d+/,           // Gradient: from-green-500
   /to-\w+-\d+/,             // Gradient: to-blue-600
   /via-\w+-\d+/,            // Gradient: via-purple-500
   /hover:\w+-\w+-\d+/,      // Hover states
   /focus:\w+-\w+-\d+/,      // Focus states
   /active:\w+-\w+-\d+/,     // Active states
   /dark:\w+-\w+-\d+/,       // Dark mode overrides
   /group-hover:\w+-\w+-\d+/, // Group hover
   /peer-\w+:\w+-\w+-\d+/,   // Peer states
 ];
 
 // Patterns that require manual review
 const MANUAL_REVIEW_PATTERNS = [
   /cn\s*\(/,                // clsx/cn utility
   /clsx\s*\(/,              // clsx utility
   /classNames\s*\(/,        // classNames utility
   /\$\{.*\}/,               // Template literals with interpolation
   /\?\s*['"`][^'"`]*\w+-\d+/, // Ternary with colors
 ];
 
 // ============================================================================
 // CORE LOGIC
 // ============================================================================
 
 function shouldSkipMatch(line, match) {
   // Check if this match is part of a pattern we should skip
   const matchIndex = line.indexOf(match);
   const contextStart = Math.max(0, matchIndex - 20);
   const contextEnd = Math.min(line.length, matchIndex + match.length + 20);
   const context = line.slice(contextStart, contextEnd);
   
   return SKIP_PATTERNS.some(pattern => pattern.test(context));
 }
 
 function needsManualReview(content) {
   return MANUAL_REVIEW_PATTERNS.some(pattern => pattern.test(content));
 }
 
 function migrateContent(content, filePath) {
   const changes = [];
   const lines = content.split('\n');
   let newContent = content;
   
   for (const [oldColor, newColor] of Object.entries(COLOR_MAPPINGS)) {
     // Create word-boundary regex to avoid partial matches
     const regex = new RegExp(`\\b${oldColor.replace(/\//g, '\\/')}\\b`, 'g');
     
     lines.forEach((line, index) => {
       const matches = line.match(regex);
       if (matches) {
         matches.forEach(match => {
           if (!shouldSkipMatch(line, match)) {
             changes.push({
               line: index + 1,
               old: match,
               new: newColor,
               context: line.trim().slice(0, 100)
             });
           }
         });
       }
     });
     
     // Apply replacement (skip patterns handled by context check)
     newContent = newContent.replace(regex, (match, offset) => {
       const lineStart = newContent.lastIndexOf('\n', offset) + 1;
       const lineEnd = newContent.indexOf('\n', offset);
       const line = newContent.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
       
       if (shouldSkipMatch(line, match)) {
         return match; // Keep original
       }
       return newColor;
     });
   }
   
   return { newContent, changes };
 }
 
 function getAllTsxFiles(dir) {
   const files = [];
   
   function walk(currentDir) {
     const entries = fs.readdirSync(currentDir, { withFileTypes: true });
     
     for (const entry of entries) {
       const fullPath = path.join(currentDir, entry.name);
       
       if (entry.isDirectory()) {
         // Skip node_modules, .git, etc.
         if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
           walk(fullPath);
         }
       } else if (entry.isFile() && /\.(tsx|ts|jsx|js)$/.test(entry.name)) {
         files.push(fullPath);
       }
     }
   }
   
   walk(dir);
   return files;
 }
 
 function createBackup(filePath) {
   const relativePath = path.relative(SRC_DIR, filePath);
   const backupPath = path.join(BACKUP_DIR, relativePath);
   
   fs.mkdirSync(path.dirname(backupPath), { recursive: true });
   fs.copyFileSync(filePath, backupPath);
   
   return backupPath;
 }
 
 function runMigration(mode = 'dry-run') {
   console.log(`\n🎨 Color Migration Script - Mode: ${mode.toUpperCase()}\n`);
   console.log('='.repeat(60));
   
   const files = getAllTsxFiles(SRC_DIR);
   const report = {
     timestamp: new Date().toISOString(),
     mode,
     totalFiles: files.length,
     modifiedFiles: 0,
     totalChanges: 0,
     manualReviewRequired: [],
     changes: {}
   };
   
   let modifiedCount = 0;
   let totalChanges = 0;
   
   for (const filePath of files) {
     const relativePath = path.relative(SRC_DIR, filePath);
     const content = fs.readFileSync(filePath, 'utf8');
     
     // Check if file needs manual review
     if (needsManualReview(content)) {
       // Still process, but flag for review
       const hasHardcodedColors = Object.keys(COLOR_MAPPINGS).some(color => 
         content.includes(color)
       );
       if (hasHardcodedColors) {
         report.manualReviewRequired.push(relativePath);
       }
     }
     
     const { newContent, changes } = migrateContent(content, filePath);
     
     if (changes.length > 0) {
       modifiedCount++;
       totalChanges += changes.length;
       report.changes[relativePath] = changes;
       
       console.log(`\n📄 ${relativePath}`);
       console.log(`   ${changes.length} change(s)`);
       
       if (mode === 'apply') {
         // Create backup
         createBackup(filePath);
         // Write changes
         fs.writeFileSync(filePath, newContent, 'utf8');
         console.log('   ✅ Applied');
       } else {
         // Show preview of changes
         changes.slice(0, 3).forEach(change => {
           console.log(`   Line ${change.line}: ${change.old} → ${change.new}`);
         });
         if (changes.length > 3) {
           console.log(`   ... and ${changes.length - 3} more`);
         }
       }
     }
   }
   
   report.modifiedFiles = modifiedCount;
   report.totalChanges = totalChanges;
   
   // Write report
   fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
   
   // Summary
   console.log('\n' + '='.repeat(60));
   console.log('\n📊 SUMMARY\n');
   console.log(`   Total files scanned: ${files.length}`);
   console.log(`   Files with changes: ${modifiedCount}`);
   console.log(`   Total replacements: ${totalChanges}`);
   console.log(`   Manual review needed: ${report.manualReviewRequired.length}`);
   
   if (mode === 'dry-run') {
     console.log('\n💡 This was a DRY RUN. No files were modified.');
     console.log('   Run with --apply to make changes.');
   } else if (mode === 'apply') {
     console.log('\n✅ Changes applied! Backups saved to:', BACKUP_DIR);
   }
   
   console.log(`\n📋 Full report saved to: ${REPORT_FILE}\n`);
   
   if (report.manualReviewRequired.length > 0) {
     console.log('⚠️  Files requiring manual review:');
     report.manualReviewRequired.slice(0, 10).forEach(f => console.log(`   - ${f}`));
     if (report.manualReviewRequired.length > 10) {
       console.log(`   ... and ${report.manualReviewRequired.length - 10} more`);
     }
     console.log('');
   }
   
   return report;
 }
 
 // ============================================================================
 // CLI
 // ============================================================================
 
 const args = process.argv.slice(2);
 let mode = 'dry-run';
 
 if (args.includes('--apply')) {
   mode = 'apply';
 } else if (args.includes('--report')) {
   mode = 'report';
 }
 
 // Ensure backup directory exists
 fs.mkdirSync(BACKUP_DIR, { recursive: true });
 
 runMigration(mode);