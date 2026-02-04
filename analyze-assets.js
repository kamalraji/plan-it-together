/**
 * Asset Analysis and Optimization Script
 * Analyzes assets, finds duplicates, and provides optimization recommendations
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const ASSET_DIRECTORIES = [
  'public',
  'src/assets',
  'src/components/doodles',
];

const SUPPORTED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg',
  '.ico', '.woff', '.woff2', '.ttf', '.otf',
  '.mp4', '.webm', '.mp3', '.wav', '.ogg'
];

/**
 * Get file hash for duplicate detection
 */
function getFileHash(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('md5');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  } catch (error) {
    console.warn(`Could not hash file ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Get file size in bytes
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    console.warn(`Could not get size for ${filePath}:`, error.message);
    return 0;
  }
}

/**
 * Recursively find all asset files
 */
function findAssetFiles(directory, basePath = '') {
  const assets = [];
  
  try {
    const items = fs.readdirSync(directory);
    
    for (const item of items) {
      const fullPath = path.join(directory, item);
      const relativePath = path.join(basePath, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        // Skip node_modules and other build directories
        if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
          assets.push(...findAssetFiles(fullPath, relativePath));
        }
      } else if (stats.isFile()) {
        const ext = path.extname(item).toLowerCase();
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          assets.push({
            name: item,
            path: fullPath,
            relativePath: relativePath.replace(/\\/g, '/'),
            extension: ext,
            size: getFileSize(fullPath),
            hash: getFileHash(fullPath),
          });
        }
      }
    }
  } catch (error) {
    console.warn(`Could not read directory ${directory}:`, error.message);
  }
  
  return assets;
}

/**
 * Find duplicate assets by hash
 */
function findDuplicates(assets) {
  const hashMap = new Map();
  const duplicates = [];
  
  for (const asset of assets) {
    if (!asset.hash) continue;
    
    if (hashMap.has(asset.hash)) {
      const existing = hashMap.get(asset.hash);
      duplicates.push({
        hash: asset.hash,
        files: [existing, asset],
        totalSize: existing.size + asset.size,
        potentialSavings: Math.min(existing.size, asset.size),
      });
    } else {
      hashMap.set(asset.hash, asset);
    }
  }
  
  return duplicates;
}

/**
 * Analyze asset sizes and provide recommendations
 */
function analyzeSizes(assets) {
  const sizeThresholds = {
    image: 500 * 1024, // 500KB
    icon: 50 * 1024,   // 50KB
    font: 200 * 1024,  // 200KB
    video: 5 * 1024 * 1024, // 5MB
    audio: 1 * 1024 * 1024, // 1MB
  };
  
  const recommendations = [];
  
  for (const asset of assets) {
    const type = getAssetType(asset.extension);
    const threshold = sizeThresholds[type];
    
    if (threshold && asset.size > threshold) {
      recommendations.push({
        type: 'size',
        severity: asset.size > threshold * 2 ? 'high' : 'medium',
        file: asset.relativePath,
        message: `${type} file is ${formatBytes(asset.size)}, consider optimization`,
        currentSize: asset.size,
        recommendedSize: threshold,
      });
    }
  }
  
  return recommendations;
}

/**
 * Get asset type from extension
 */
function getAssetType(extension) {
  const typeMap = {
    '.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.gif': 'image',
    '.webp': 'image', '.avif': 'image', '.svg': 'image',
    '.ico': 'icon',
    '.woff': 'font', '.woff2': 'font', '.ttf': 'font', '.otf': 'font',
    '.mp4': 'video', '.webm': 'video',
    '.mp3': 'audio', '.wav': 'audio', '.ogg': 'audio',
  };
  
  return typeMap[extension] || 'other';
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check for missing modern formats
 */
function checkModernFormats(assets) {
  const recommendations = [];
  const imageAssets = assets.filter(asset => 
    ['.jpg', '.jpeg', '.png'].includes(asset.extension)
  );
  
  for (const asset of imageAssets) {
    const baseName = path.basename(asset.name, asset.extension);
    const directory = path.dirname(asset.path);
    
    // Check if WebP version exists
    const webpPath = path.join(directory, baseName + '.webp');
    const hasWebP = fs.existsSync(webpPath);
    
    // Check if AVIF version exists
    const avifPath = path.join(directory, baseName + '.avif');
    const hasAVIF = fs.existsSync(avifPath);
    
    if (!hasWebP) {
      recommendations.push({
        type: 'format',
        severity: 'low',
        file: asset.relativePath,
        message: 'Consider creating WebP version for better compression',
        suggestion: `Create ${baseName}.webp`,
      });
    }
    
    if (!hasAVIF && asset.size > 100 * 1024) { // Only suggest AVIF for larger images
      recommendations.push({
        type: 'format',
        severity: 'low',
        file: asset.relativePath,
        message: 'Consider creating AVIF version for even better compression',
        suggestion: `Create ${baseName}.avif`,
      });
    }
  }
  
  return recommendations;
}

/**
 * Generate optimization report
 */
function generateReport(assets, duplicates, sizeRecommendations, formatRecommendations) {
  const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0);
  const totalDuplicateSize = duplicates.reduce((sum, dup) => sum + dup.potentialSavings, 0);
  
  const report = {
    summary: {
      totalAssets: assets.length,
      totalSize: formatBytes(totalSize),
      duplicates: duplicates.length,
      potentialSavings: formatBytes(totalDuplicateSize),
      recommendations: sizeRecommendations.length + formatRecommendations.length,
    },
    assets: {
      byType: {},
      bySize: assets.sort((a, b) => b.size - a.size).slice(0, 10),
    },
    duplicates: duplicates.map(dup => ({
      files: dup.files.map(f => f.relativePath),
      size: formatBytes(dup.files[0].size),
      savings: formatBytes(dup.potentialSavings),
    })),
    recommendations: [
      ...sizeRecommendations,
      ...formatRecommendations,
    ].sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    }),
  };
  
  // Group assets by type
  for (const asset of assets) {
    const type = getAssetType(asset.extension);
    if (!report.assets.byType[type]) {
      report.assets.byType[type] = {
        count: 0,
        totalSize: 0,
        files: [],
      };
    }
    
    report.assets.byType[type].count++;
    report.assets.byType[type].totalSize += asset.size;
    report.assets.byType[type].files.push(asset.relativePath);
  }
  
  // Format sizes in byType
  for (const type in report.assets.byType) {
    report.assets.byType[type].totalSize = formatBytes(report.assets.byType[type].totalSize);
  }
  
  return report;
}

/**
 * Main analysis function
 */
function analyzeAssets() {
  console.log('🔍 Analyzing assets...\n');
  
  let allAssets = [];
  
  // Find assets in all configured directories
  for (const directory of ASSET_DIRECTORIES) {
    if (fs.existsSync(directory)) {
      console.log(`Scanning ${directory}...`);
      const assets = findAssetFiles(directory);
      allAssets.push(...assets);
    } else {
      console.log(`Directory ${directory} does not exist, skipping...`);
    }
  }
  
  console.log(`Found ${allAssets.length} asset files\n`);
  
  // Find duplicates
  console.log('🔍 Finding duplicates...');
  const duplicates = findDuplicates(allAssets);
  
  // Analyze sizes
  console.log('📏 Analyzing file sizes...');
  const sizeRecommendations = analyzeSizes(allAssets);
  
  // Check for modern formats
  console.log('🖼️  Checking image formats...');
  const formatRecommendations = checkModernFormats(allAssets);
  
  // Generate report
  const report = generateReport(allAssets, duplicates, sizeRecommendations, formatRecommendations);
  
  // Output report
  console.log('\n📊 Asset Analysis Report');
  console.log('========================\n');
  
  console.log('Summary:');
  console.log(`  Total Assets: ${report.summary.totalAssets}`);
  console.log(`  Total Size: ${report.summary.totalSize}`);
  console.log(`  Duplicates Found: ${report.summary.duplicates}`);
  console.log(`  Potential Savings: ${report.summary.potentialSavings}`);
  console.log(`  Recommendations: ${report.summary.recommendations}\n`);
  
  if (duplicates.length > 0) {
    console.log('🔄 Duplicate Files:');
    for (const duplicate of report.duplicates) {
      console.log(`  Files: ${duplicate.files.join(', ')}`);
      console.log(`  Size: ${duplicate.size} each`);
      console.log(`  Potential Savings: ${duplicate.savings}\n`);
    }
  }
  
  if (report.recommendations.length > 0) {
    console.log('💡 Recommendations:');
    for (const rec of report.recommendations.slice(0, 10)) { // Show top 10
      const icon = rec.severity === 'high' ? '🔴' : rec.severity === 'medium' ? '🟡' : '🟢';
      console.log(`  ${icon} ${rec.file}: ${rec.message}`);
    }
    
    if (report.recommendations.length > 10) {
      console.log(`  ... and ${report.recommendations.length - 10} more recommendations`);
    }
  }
  
  console.log('\n📁 Assets by Type:');
  for (const [type, info] of Object.entries(report.assets.byType)) {
    console.log(`  ${type}: ${info.count} files (${info.totalSize})`);
  }
  
  // Save detailed report to file
  const reportPath = 'asset-analysis-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved to ${reportPath}`);
  
  return report;
}

// Run analysis if called directly
if (require.main === module) {
  try {
    analyzeAssets();
  } catch (error) {
    console.error('❌ Asset analysis failed:', error.message);
    process.exit(1);
  }
}

module.exports = { analyzeAssets, findAssetFiles, findDuplicates, analyzeSizes };