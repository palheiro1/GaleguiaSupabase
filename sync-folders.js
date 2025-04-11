// Script to sync content between web-admin, docs, and public folders

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Main source folder - all changes should be made here
const SOURCE_FOLDER = 'web-admin';
// Target folders to be kept in sync
const TARGET_FOLDERS = ['docs', 'public'];

console.log('Syncing folders to maintain consistency...');

// Ensure all target directories exist
TARGET_FOLDERS.forEach(folder => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
    console.log(`Created directory: ${folder}`);
  }
});

// Sync source folder to all target folders
TARGET_FOLDERS.forEach(target => {
  console.log(`Syncing ${SOURCE_FOLDER} to ${target}...`);
  
  try {
    // Use rsync for efficient copying (works on Unix-like systems)
    // Add or remove options as needed
    const command = `rsync -av --delete ${SOURCE_FOLDER}/ ${target}/`;
    execSync(command, { stdio: 'inherit' });
    console.log(`Successfully synced to ${target}`);
  } catch (error) {
    console.error(`Error syncing to ${target}:`, error.message);
  }
});

console.log('Sync complete. All target folders are now updated.');
console.log('Remember to use the SOURCE_FOLDER for all future edits.');
