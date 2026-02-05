#!/usr/bin/env node

/**
 * Color Migration Script
 * Safely migrates hardcoded Tailwind colors to semantic design tokens
 * 
 * Usage:
 *   node scripts/migrate-colors.js --dry-run    # Preview changes (default)
 *   node scripts/migrate-colors.js --apply      # Apply changes
 *   node scripts/migrate-colors.js --report     # Generate report only
 */
 
 const fs = require('fs');
 const path = require('path');
 
 // Configuration
 const CONFIG = {
   srcDir: './src',
   backupDir: './backups/color-migration',
   extensions: ['.tsx', '.ts', '.jsx', '.js'],
   excludeDirs: ['node_modules', 'dist', 'build', '.git', 'backups'],
   excludeFiles: ['index.css', 'tokens.css', 'globals.css'], // Don't modify CSS variable definitions
 };
 
 // Color mapping: hardcoded -> semantic token
 // Organized by category for intelligent replacement
 const COLOR_MAPPINGS = {
   // Background colors
   backgrounds: {
     // Greens -> Success
     'bg-green-50': 'bg-success/10',
     'bg-green-100': 'bg-success/20',
     'bg-green-200': 'bg-success/30',
     'bg-green-500': 'bg-success',
     'bg-green-600': 'bg-success',
     'bg-green-700': 'bg-success',
     
     // Reds -> Destructive
     'bg-red-50': 'bg-destructive/10',
     'bg-red-100': 'bg-destructive/20',
     'bg-red-500': 'bg-destructive',
     'bg-red-600': 'bg-destructive',
     'bg-red-700': 'bg-destructive',
     
     // Yellows/Ambers -> Warning
     'bg-yellow-50': 'bg-warning/10',
     'bg-yellow-100': 'bg-warning/20',
     'bg-yellow-500': 'bg-warning',
     'bg-yellow-600': 'bg-warning',
     'bg-amber-50': 'bg-warning/10',
     'bg-amber-100': 'bg-warning/20',
     'bg-amber-500': 'bg-warning',
     'bg-amber-600': 'bg-warning',
     
     // Blues -> Info or Primary
     'bg-blue-50': 'bg-info/10',
     'bg-blue-100': 'bg-info/20',
     'bg-blue-500': 'bg-info',
     'bg-blue-600': 'bg-primary',
     'bg-blue-700': 'bg-primary',
     
     // Indigos/Violets -> Primary
     'bg-indigo-50': 'bg-primary/10',
     'bg-indigo-100': 'bg-primary/20',
     'bg-indigo-500': 'bg-primary',
     'bg-indigo-600': 'bg-primary',
     'bg-indigo-700': 'bg-primary',
     'bg-violet-500': 'bg-primary',
     'bg-violet-600': 'bg-primary',
     'bg-purple-500': 'bg-primary',
     'bg-purple-600': 'bg-primary',
     
     // Grays -> Muted
     'bg-gray-50': 'bg-muted/50',
     'bg-gray-100': 'bg-muted',
     'bg-gray-200': 'bg-muted',
     'bg-gray-300': 'bg-muted',
     'bg-gray-800': 'bg-card',
     'bg-gray-900': 'bg-background',
     'bg-slate-50': 'bg-muted/50',
     'bg-slate-100': 'bg-muted',
     'bg-slate-200': 'bg-muted',
     'bg-slate-800': 'bg-card',
     'bg-slate-900': 'bg-background',
     
     // Neutrals
     'bg-white': 'bg-background',
     'bg-black': 'bg-foreground',
   },
   
   // Text colors
   text: {
     // Greens -> Success
     'text-green-500': 'text-success',
     'text-green-600': 'text-success',
     'text-green-700': 'text-success',
     'text-green-800': 'text-success',
     
     // Reds -> Destructive
     'text-red-500': 'text-destructive',
     'text-red-600': 'text-destructive',
     'text-red-700': 'text-destructive',
     
     // Yellows/Ambers -> Warning
     'text-yellow-500': 'text-warning',
     'text-yellow-600': 'text-warning',
     'text-yellow-700': 'text-warning',
     'text-amber-500': 'text-warning',
     'text-amber-600': 'text-warning',
     
     // Blues -> Info
     'text-blue-500': 'text-info',
     'text-blue-600': 'text-info',
     'text-blue-700': 'text-info',
     
     // Indigos/Purples -> Primary
     'text-indigo-500': 'text-primary',
     'text-indigo-600': 'text-primary',
     'text-indigo-700': 'text-primary',
     'text-violet-500': 'text-primary',
     'text-violet-600': 'text-primary',
     'text-purple-500': 'text-primary',
     'text-purple-600': 'text-primary',
     
     // Grays -> Muted foreground
     'text-gray-400': 'text-muted-foreground',
     'text-gray-500': 'text-muted-foreground',
     'text-gray-600': 'text-muted-foreground',
     'text-gray-700': 'text-foreground',
     'text-gray-800': 'text-foreground',
     'text-gray-900': 'text-foreground',
     'text-slate-400': 'text-muted-foreground',
     'text-slate-500': 'text-muted-foreground',
     'text-slate-600': 'text-muted-foreground',
     'text-slate-700': 'text-foreground',
     'text-slate-800': 'text-foreground',
     'text-slate-900': 'text-foreground',
     
     // Neutrals
     'text-white': 'text-primary-foreground',
     'text-black': 'text-foreground',
   },
   
   // Border colors
   borders: {
     'border-green-500': 'border-success',
     'border-green-600': 'border-success',
     'border-red-500': 'border-destructive',
     'border-red-600': 'border-destructive',
     'border-yellow-500': 'border-warning',
     'border-amber-500': 'border-warning',
     'border-blue-500': 'border-info',
     'border-blue-600': 'border-primary',
     'border-indigo-500': 'border-primary',
     'border-indigo-600': 'border-primary',
     'border-gray-200': 'border-border',
     'border-gray-300': 'border-border',
     'border-gray-400': 'border-border',
     'border-slate-200': 'border-border',
     'border-slate-300': 'border-border',
     'border-white': 'border-border',
     'border-black': 'border-foreground',
   },
   
   // Ring colors (focus states)
   rings: {
     'ring-green-500': 'ring-success',
     'ring-red-500': 'ring-destructive',
     'ring-blue-500': 'ring-primary',
     'ring-indigo-500': 'ring-primary',
   },
 };
 
 // Context-aware patterns that should NOT be replaced
 const SAFE_PATTERNS = [
   /from-\w+-\d+/,  // Gradient start
   /to-\w+-\d+/,    // Gradient end
   /via-\w+-\d+/,   // Gradient middle
   /hover:\w+-\w+-\d+/, // Hover states need manual review
   /dark:\w+-\w+-\d+/,  // Dark mode overrides
 ];
 
 // Files that need manual review (complex logic)
 const MANUAL_REVIEW_PATTERNS = [
   /className.*\$\{.*\}/,  // Dynamic class names
   /cn\s*\(/,              // cn() utility usage
   /clsx\s*\(/,            // clsx utility usage
 ];
 
 // Statistics
 const stats = {
   filesScanned: 0,
   filesModified: 0,
   replacementsMade: 0,
   skippedSafe: 0,
   manualReviewNeeded: [],
   errors: [],
 };
 
 // Build flat mapping for quick lookup
 function buildFlatMapping() {
   const flat = {};
   for (const category of Object.values(COLOR_MAPPINGS)) {
     Object.assign(flat, category);
   }
   return flat;
 }
 
 const FLAT_MAPPINGS = buildFlatMapping();
 
 // Get all files recursively
 function getAllFiles(dir, files = []) {
   const items = fs.readdirSync(dir);
   
   for (const item of items) {
     const fullPath = path.join(dir, item);
     const stat = fs.statSync(fullPath);
     
     if (stat.isDirectory()) {
       if (!CONFIG.excludeDirs.includes(item)) {
         getAllFiles(fullPath, files);
       }
     } else if (stat.isFile()) {
       const ext = path.extname(item);
       if (CONFIG.extensions.includes(ext) && !CONFIG.excludeFiles.includes(item)) {
         files.push(fullPath);
       }
     }
   }
   
   return files;
 }
 
 // Check if a line contains patterns that should be skipped
 function shouldSkipLine(line) {
   return SAFE_PATTERNS.some(pattern => pattern.test(line));
 }
 
 // Check if file needs manual review
 function needsManualReview(content) {
   return MANUAL_REVIEW_PATTERNS.some(pattern => pattern.test(content));
 }
 
 // Process a single file
 function processFile(filePath, dryRun = true) {
   try {
     const content = fs.readFileSync(filePath, 'utf8');
     const lines = content.split('\n');
     let modified = false;
     let fileReplacements = 0;
     const changes = [];
     
     // Check for manual review
     if (needsManualReview(content)) {
       stats.manualReviewNeeded.push({
         file: filePath,
         reason: 'Contains dynamic class names or utility functions',
       });
     }
     
     const newLines = lines.map((line, index) => {
       let newLine = line;
       
       // Skip if line contains safe patterns
       if (shouldSkipLine(line)) {
         return line;
       }
       
       // Apply replacements
       for (const [oldColor, newColor] of Object.entries(FLAT_MAPPINGS)) {
         // Use word boundary matching to avoid partial replacements
         const regex = new RegExp(`\\b${oldColor}\\b`, 'g');
         
         if (regex.test(newLine)) {
           const before = newLine;
           newLine = newLine.replace(regex, newColor);
           
           if (before !== newLine) {
             modified = true;
             fileReplacements++;
             changes.push({
               line: index + 1,
               before: before.trim(),
               after: newLine.trim(),
               replacement: `${oldColor} -> ${newColor}`,
             });
           }
         }
       }
       
       return newLine;
     });
     
     if (modified) {
       stats.filesModified++;
       stats.replacementsMade += fileReplacements;
       
       if (!dryRun) {
         // Create backup
         const backupPath = path.join(CONFIG.backupDir, filePath);
         const backupDir = path.dirname(backupPath);
         
         if (!fs.existsSync(backupDir)) {
           fs.mkdirSync(backupDir, { recursive: true });
         }
         
         fs.writeFileSync(backupPath, content);
         fs.writeFileSync(filePath, newLines.join('\n'));
       }
       
       return { modified: true, changes, replacements: fileReplacements };
     }
     
     return { modified: false, changes: [], replacements: 0 };
   } catch (error) {
     stats.errors.push({ file: filePath, error: error.message });
     return { modified: false, changes: [], replacements: 0, error: error.message };
   }
 }
 
 // Generate migration report
 function generateReport(results) {
   const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
   const reportPath = `./migration-report-${timestamp}.json`;
   
   const report = {
     timestamp: new Date().toISOString(),
     summary: {
       filesScanned: stats.filesScanned,
       filesModified: stats.filesModified,
       totalReplacements: stats.replacementsMade,
       skippedSafePatterns: stats.skippedSafe,
       filesNeedingManualReview: stats.manualReviewNeeded.length,
       errors: stats.errors.length,
     },
     colorMappings: COLOR_MAPPINGS,
     changes: results.filter(r => r.result.modified),
     manualReview: stats.manualReviewNeeded,
     errors: stats.errors,
   };
   
   fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
   return reportPath;
 }
 
 // Main execution
 function main() {
   const args = process.argv.slice(2);
   const dryRun = !args.includes('--apply');
   const reportOnly = args.includes('--report');
   
   console.log('🎨 Color Migration Script');
   console.log('========================\n');
   
   if (dryRun && !reportOnly) {
     console.log('📋 Running in DRY-RUN mode (use --apply to make changes)\n');
   } else if (reportOnly) {
     console.log('📊 Generating report only\n');
   } else {
     console.log('⚠️  APPLYING CHANGES (backups will be created)\n');
   }
   
   // Get all files
   const files = getAllFiles(CONFIG.srcDir);
   stats.filesScanned = files.length;
   
   console.log(`📁 Scanning ${files.length} files...\n`);
   
   // Process each file
   const results = files.map(file => {
     const result = processFile(file, dryRun || reportOnly);
     return { file, result };
   });
   
   // Generate report
   const reportPath = generateReport(results);
   
   // Print summary
   console.log('\n📊 Summary');
   console.log('==========');
   console.log(`Files scanned:      ${stats.filesScanned}`);
   console.log(`Files to modify:    ${stats.filesModified}`);
   console.log(`Total replacements: ${stats.replacementsMade}`);
   console.log(`Manual review:      ${stats.manualReviewNeeded.length}`);
   console.log(`Errors:             ${stats.errors.length}`);
   console.log(`\n📄 Report saved to: ${reportPath}`);
   
   // Print files needing manual review
   if (stats.manualReviewNeeded.length > 0) {
     console.log('\n⚠️  Files needing manual review:');
     stats.manualReviewNeeded.slice(0, 10).forEach(item => {
       console.log(`   - ${item.file}`);
     });
     if (stats.manualReviewNeeded.length > 10) {
       console.log(`   ... and ${stats.manualReviewNeeded.length - 10} more`);
     }
   }
   
   // Print sample changes
   const changedFiles = results.filter(r => r.result.modified);
   if (changedFiles.length > 0 && !reportOnly) {
     console.log('\n📝 Sample changes:');
     changedFiles.slice(0, 5).forEach(({ file, result }) => {
       console.log(`\n   ${file} (${result.replacements} changes)`);
       result.changes.slice(0, 3).forEach(change => {
         console.log(`      Line ${change.line}: ${change.replacement}`);
       });
       if (result.changes.length > 3) {
         console.log(`      ... and ${result.changes.length - 3} more`);
       }
     });
   }
   
   if (dryRun && !reportOnly) {
     console.log('\n✅ Dry run complete. Run with --apply to make changes.');
   } else if (!reportOnly) {
     console.log('\n✅ Changes applied. Backups saved to:', CONFIG.backupDir);
   }
   
   console.log('\n💡 Next steps:');
   console.log('   1. Review the migration report');
   console.log('   2. Run: npm run build (to verify no errors)');
   console.log('   3. Test the application visually');
   console.log('   4. Manually review flagged files');
 }
 
 main();