#!/usr/bin/env node

/**
 * Duplicate File Manager
 * 
 * Features:
 * - Scan repository for duplicate files
 * - Compare content for identical files
 * - Ignore specific file types or patterns
 * - Interactive deletion/merge prompts
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

// Configuration
const config = {
  ignorePatterns: [
    'node_modules',
    '.git',
    '.env',
    'dist',
    'build',
    '.DS_Store',
    '*.log',
    '.idea',
    '.vscode'
  ],
  ignoreExtensions: [
    '.lock',
    '.cache'
  ],
  rootDir: process.cwd()
};

// Utility: Create hash of file content
function getFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return crypto.createHash('md5').update(content).digest('hex');
  } catch (err) {
    return null;
  }
}

// Utility: Check if file should be ignored
function shouldIgnore(filePath) {
  const relativePath = path.relative(config.rootDir, filePath);
  
  // Check ignore patterns
  for (const pattern of config.ignorePatterns) {
    if (relativePath.includes(pattern)) return true;
  }
  
  // Check ignore extensions
  const ext = path.extname(filePath);
  if (config.ignoreExtensions.includes(ext)) return true;
  
  return false;
}

// Scan directory recursively
function scanDirectory(dir, fileMap = {}) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!shouldIgnore(filePath)) {
        scanDirectory(filePath, fileMap);
      }
    } else if (stat.isFile()) {
      if (!shouldIgnore(filePath)) {
        const hash = getFileHash(filePath);
        if (hash) {
          if (!fileMap[hash]) {
            fileMap[hash] = [];
          }
          fileMap[hash].push(filePath);
        }
      }
    }
  }
  
  return fileMap;
}

// Find duplicates
function findDuplicates(fileMap) {
  const duplicates = [];
  
  for (const [hash, files] of Object.entries(fileMap)) {
    if (files.length > 1) {
      duplicates.push({
        hash,
        files,
        size: fs.statSync(files[0]).size
      });
    }
  }
  
  return duplicates.sort((a, b) => b.size - a.size);
}

// Display duplicate comparison
function displayDuplicates(duplicates) {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  DUPLICATE FILES FOUND');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  if (duplicates.length === 0) {
    console.log('✓ No duplicate files found!');
    return;
  }
  
  duplicates.forEach((group, index) => {
    console.log(`\n[Group ${index + 1}] Hash: ${group.hash}`);
    console.log(`Size: ${(group.size / 1024).toFixed(2)} KB`);
    console.log('Files:');
    group.files.forEach((file, i) => {
      const relativePath = path.relative(config.rootDir, file);
      console.log(`  ${i + 1}. ${relativePath}`);
    });
  });
}

// Preview file content
function previewFile(filePath, lines = 10) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const contentLines = content.split('\n');
    const preview = contentLines.slice(0, lines).join('\n');
    return preview + (contentLines.length > lines ? '\n... (truncated)' : '');
  } catch (err) {
    return `[Error reading file: ${err.message}]`;
  }
}

// Interactive CLI
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function interactiveMode(duplicates) {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  INTERACTIVE DUPLICATE MANAGEMENT');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  for (let i = 0; i < duplicates.length; i++) {
    const group = duplicates[i];
    const relativePaths = group.files.map(f => path.relative(config.rootDir, f));
    
    console.log(`\n[Group ${i + 1}/${duplicates.length}]`);
    console.log(`Hash: ${group.hash}`);
    console.log(`Size: ${(group.size / 1024).toFixed(2)} KB`);
    console.log('\nFiles:');
    relativePaths.forEach((p, idx) => {
      console.log(`  ${idx + 1}. ${p}`);
    });
    
    while (true) {
      const action = await question('\nAction: [v]iew, [k]eep, [d]elete, [s]kip, [q]uit? ');
      
      if (action.toLowerCase() === 'q') {
        console.log('\nExiting...');
        rl.close();
        process.exit(0);
      }
      
      if (action.toLowerCase() === 's') {
        console.log('Skipped.');
        break;
      }
      
      if (action.toLowerCase() === 'v') {
        const fileNum = await question(`View file (1-${group.files.length}): `);
        const idx = parseInt(fileNum) - 1;
        if (idx >= 0 && idx < group.files.length) {
          console.log(`\n--- ${relativePaths[idx]} ---`);
          console.log(previewFile(group.files[idx]));
          console.log('---\n');
        }
        continue;
      }
      
      if (action.toLowerCase() === 'k') {
        const keepNum = await question(`Keep file number (1-${group.files.length}): `);
        const keepIdx = parseInt(keepNum) - 1;
        if (keepIdx >= 0 && keepIdx < group.files.length) {
          const filesToDelete = group.files.filter((_, idx) => idx !== keepIdx);
          await handleDeletion(filesToDelete, relativePaths, keepIdx);
          break;
        }
      }
      
      if (action.toLowerCase() === 'd') {
        const fileNum = await question(`Delete file (1-${group.files.length}): `);
        const idx = parseInt(fileNum) - 1;
        if (idx >= 0 && idx < group.files.length) {
          const confirm = await question(`Really delete "${relativePaths[idx]}"? (yes/no): `);
          if (confirm.toLowerCase() === 'yes') {
            deleteFile(group.files[idx]);
            break;
          }
        }
      }
    }
  }
  
  console.log('\n✓ Processing complete!');
  rl.close();
}

async function handleDeletion(filesToDelete, relativePaths, keepIdx) {
  console.log(`\nKeeping: ${relativePaths[keepIdx]}`);
  console.log('Deleting:');
  filesToDelete.forEach(file => {
    console.log(`  - ${path.relative(config.rootDir, file)}`);
  });
  
  const confirm = await question('Confirm deletion? (yes/no): ');
  if (confirm.toLowerCase() === 'yes') {
    filesToDelete.forEach(file => deleteFile(file));
    console.log('Deleted successfully.');
  } else {
    console.log('Cancelled.');
  }
}

function deleteFile(filePath) {
  try {
    fs.unlinkSync(filePath);
    console.log(`✓ Deleted: ${path.relative(config.rootDir, filePath)}`);
  } catch (err) {
    console.error(`✗ Error deleting ${filePath}: ${err.message}`);
  }
}

// Custom ignore configuration
async function configureIgnore() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  CONFIGURE IGNORE PATTERNS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('Current ignore patterns:');
  config.ignorePatterns.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p}`);
  });
  
  const add = await question('\nAdd custom ignore pattern? (pattern or press Enter to skip): ');
  if (add.trim()) {
    config.ignorePatterns.push(add.trim());
    console.log(`✓ Added: ${add.trim()}`);
  }
}

// Main entry point
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   DiskSyncer - Duplicate File Manager                 ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\nScanning: ${config.rootDir}\n`);
  
  // Show menu
  console.log('Options:');
  console.log('  1. Scan for duplicates');
  console.log('  2. Configure ignore patterns');
  console.log('  3. Exit\n');
  
  const choice = await question('Select option (1-3): ');
  
  if (choice === '2') {
    await configureIgnore();
    rl.close();
    return main();
  }
  
  if (choice === '3') {
    console.log('Goodbye!');
    rl.close();
    process.exit(0);
  }
  
  if (choice === '1') {
    console.log('\nScanning for duplicates...');
    const fileMap = scanDirectory(config.rootDir);
    const duplicates = findDuplicates(fileMap);
    
    displayDuplicates(duplicates);
    
    if (duplicates.length > 0) {
      const interact = await question('\nManage duplicates interactively? (yes/no): ');
      if (interact.toLowerCase() === 'yes') {
        await interactiveMode(duplicates);
      } else {
        rl.close();
      }
    } else {
      rl.close();
    }
  }
}

main().catch(err => {
  console.error('Error:', err);
  rl.close();
  process.exit(1);
});
