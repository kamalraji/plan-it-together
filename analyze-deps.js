const fs = require('fs');
const path = require('path');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const dependencies = Object.keys(packageJson.dependencies || {});
const devDependencies = Object.keys(packageJson.devDependencies || {});

// Function to recursively read all TypeScript/JavaScript files
function getAllFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Get all source files
const sourceFiles = getAllFiles('./src');
const configFiles = ['vite.config.ts', 'tailwind.config.js', 'eslint.config.js'];

// Read all file contents
let allContent = '';
for (const file of [...sourceFiles, ...configFiles.filter(f => fs.existsSync(f))]) {
  try {
    allContent += fs.readFileSync(file, 'utf8') + '\n';
  } catch (err) {
    console.log(`Could not read ${file}: ${err.message}`);
  }
}

// Check which dependencies are used
const usedDeps = [];
const unusedDeps = [];

for (const dep of dependencies) {
  // Check for import statements
  const importRegex = new RegExp(`import.*['"]${dep}['"]|from\\s+['"]${dep}['"]`, 'g');
  const requireRegex = new RegExp(`require\\(['"]${dep}['"]\\)`, 'g');
  
  if (importRegex.test(allContent) || requireRegex.test(allContent)) {
    usedDeps.push(dep);
  } else {
    unusedDeps.push(dep);
  }
}

// Check dev dependencies
const usedDevDeps = [];
const unusedDevDeps = [];

for (const dep of devDependencies) {
  const importRegex = new RegExp(`import.*['"]${dep}['"]|from\\s+['"]${dep}['"]`, 'g');
  const requireRegex = new RegExp(`require\\(['"]${dep}['"]\\)`, 'g');
  
  if (importRegex.test(allContent) || requireRegex.test(allContent)) {
    usedDevDeps.push(dep);
  } else {
    unusedDevDeps.push(dep);
  }
}

console.log('=== DEPENDENCY ANALYSIS ===\n');

console.log('USED DEPENDENCIES:');
usedDeps.forEach(dep => console.log(`  ✓ ${dep}`));

console.log('\nUNUSED DEPENDENCIES:');
unusedDeps.forEach(dep => console.log(`  ✗ ${dep}`));

console.log('\nUSED DEV DEPENDENCIES:');
usedDevDeps.forEach(dep => console.log(`  ✓ ${dep}`));

console.log('\nUNUSED DEV DEPENDENCIES:');
unusedDevDeps.forEach(dep => console.log(`  ✗ ${dep}`));

console.log('\n=== SUMMARY ===');
console.log(`Total dependencies: ${dependencies.length}`);
console.log(`Used dependencies: ${usedDeps.length}`);
console.log(`Unused dependencies: ${unusedDeps.length}`);
console.log(`Total dev dependencies: ${devDependencies.length}`);
console.log(`Used dev dependencies: ${usedDevDeps.length}`);
console.log(`Unused dev dependencies: ${unusedDevDeps.length}`);