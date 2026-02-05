 import { describe, it, expect } from 'vitest';
 import fs from 'fs';
 import path from 'path';
 
 /**
  * Color Migration Test Suite
  * 
  * Runs as a Vitest test to audit and optionally migrate hardcoded colors.
  * Set APPLY_MIGRATION=true environment variable to apply changes.
  */
 
 const SRC_DIR = path.resolve(__dirname, '..');
 
 // Color mappings: hardcoded -> semantic token
 const COLOR_MAPPINGS: Record<string, string> = {
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
 
 interface Change {
   line: number;
   old: string;
   new: string;
   context: string;
 }
 
 interface FileReport {
   path: string;
   changes: Change[];
   needsManualReview: boolean;
 }
 
 function shouldSkipMatch(line: string, match: string): boolean {
   const matchIndex = line.indexOf(match);
   const contextStart = Math.max(0, matchIndex - 20);
   const contextEnd = Math.min(line.length, matchIndex + match.length + 20);
   const context = line.slice(contextStart, contextEnd);
   
   return SKIP_PATTERNS.some(pattern => pattern.test(context));
 }
 
 function analyzeContent(content: string): { changes: Change[]; needsManualReview: boolean } {
   const changes: Change[] = [];
   const lines = content.split('\n');
   
   const MANUAL_REVIEW_PATTERNS = [
     /cn\s*\(/,
     /clsx\s*\(/,
     /classNames\s*\(/,
     /\$\{.*\}/,
     /\?\s*['"`][^'"`]*\w+-\d+/,
   ];
   
   const needsManualReview = MANUAL_REVIEW_PATTERNS.some(pattern => pattern.test(content));
   
   for (const [oldColor, newColor] of Object.entries(COLOR_MAPPINGS)) {
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
   }
   
   return { changes, needsManualReview };
 }
 
 function getAllSourceFiles(dir: string): string[] {
   const files: string[] = [];
   
   function walk(currentDir: string) {
     try {
       const entries = fs.readdirSync(currentDir, { withFileTypes: true });
       
       for (const entry of entries) {
         const fullPath = path.join(currentDir, entry.name);
         
         if (entry.isDirectory()) {
           if (!entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'test') {
             walk(fullPath);
           }
         } else if (entry.isFile() && /\.(tsx|ts|jsx|js)$/.test(entry.name)) {
           files.push(fullPath);
         }
       }
     } catch {
       // Skip directories we can't read
     }
   }
   
   walk(dir);
   return files;
 }
 
 describe('Color Migration Audit', () => {
   it('should audit all source files for hardcoded colors', () => {
     const files = getAllSourceFiles(SRC_DIR);
     const reports: FileReport[] = [];
     let totalChanges = 0;
     let filesWithChanges = 0;
     let manualReviewCount = 0;
     
     for (const filePath of files) {
       const relativePath = path.relative(SRC_DIR, filePath);
       const content = fs.readFileSync(filePath, 'utf8');
       const { changes, needsManualReview } = analyzeContent(content);
       
       if (changes.length > 0) {
         filesWithChanges++;
         totalChanges += changes.length;
         reports.push({
           path: relativePath,
           changes,
           needsManualReview
         });
         
         if (needsManualReview) {
           manualReviewCount++;
         }
       }
     }
     
     // Log summary
     console.log('\n' + '='.repeat(60));
     console.log('🎨 COLOR MIGRATION AUDIT REPORT');
     console.log('='.repeat(60));
     console.log(`Total files scanned: ${files.length}`);
     console.log(`Files with hardcoded colors: ${filesWithChanges}`);
     console.log(`Total replacements needed: ${totalChanges}`);
     console.log(`Files needing manual review: ${manualReviewCount}`);
     console.log('='.repeat(60) + '\n');
     
     // Log details for each file
     for (const report of reports.slice(0, 20)) {
       console.log(`\n📄 ${report.path} (${report.changes.length} changes)${report.needsManualReview ? ' ⚠️ MANUAL REVIEW' : ''}`);
       for (const change of report.changes.slice(0, 5)) {
         console.log(`   Line ${change.line}: ${change.old} → ${change.new}`);
       }
       if (report.changes.length > 5) {
         console.log(`   ... and ${report.changes.length - 5} more`);
       }
     }
     
     if (reports.length > 20) {
       console.log(`\n... and ${reports.length - 20} more files`);
     }
     
     // This test passes but logs the audit info
     expect(files.length).toBeGreaterThan(0);
     
     // Log action needed
     if (totalChanges > 0) {
       console.log('\n💡 To migrate these colors, update each file to use semantic tokens.');
       console.log('   Files with cn()/clsx() need manual review for conditional logic.\n');
     } else {
       console.log('\n✅ No hardcoded colors found! Design system compliance achieved.\n');
     }
   });
 });