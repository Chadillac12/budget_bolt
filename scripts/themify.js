/**
 * Themify Script
 * This script helps convert hardcoded color values to theme references
 * in React Native components.
 * 
 * Usage:
 * node scripts/themify.js <component_path>
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Color mapping from hardcoded values to theme properties
const COLOR_MAP = {
  // Light mode colors and their theme equivalents
  '#007AFF': 'theme.colors.primary',
  '#0066cc': 'theme.colors.primary',
  '#5856D6': 'theme.colors.secondary',
  '#34C759': 'theme.colors.success',
  '#FF3B30': 'theme.colors.error',
  '#FF9500': 'theme.colors.warning',
  '#F2F2F7': 'theme.colors.surface',
  '#E5E5EA': 'theme.colors.border',
  '#E5F1FF': 'theme.colors.primaryContainer',
  '#F2F9FF': 'theme.colors.primaryContainer',
  '#F9F9F9': 'theme.colors.surface',
  '#8E8E93': 'theme.colors.textSecondary',
  '#000000': 'theme.colors.text',
  '#FFFFFF': 'theme.colors.card',
  '#fff': 'theme.colors.card',
  '#white': 'theme.colors.card',
  '#000': 'theme.colors.text',
  '#black': 'theme.colors.text',
  
  // Common patterns
  'white': 'theme.colors.card',
  'black': 'theme.colors.text',
};

// Import statements to add
const IMPORTS_TO_ADD = [
  "import { useAppTheme } from '@/hooks/useAppTheme';",
  "import { useThemedStyles } from '@/hooks/useThemedStyles';",
  "import { Theme } from '@/context/theme';",
];

/**
 * Processes a component file to convert hardcoded colors to theme values
 * @param {string} filePath - Path to the component file
 */
async function processFile(filePath) {
  try {
    // Read file content
    const content = await readFile(filePath, 'utf8');
    
    // Check if file already uses theming
    if (content.includes('useAppTheme') && content.includes('useThemedStyles')) {
      console.log(`File ${filePath} already uses theming. Skipping.`);
      return;
    }
    
    let modifiedContent = content;
    
    // Add imports if not present
    if (!modifiedContent.includes('useAppTheme')) {
      // Find the end of imports
      const importEndIndex = modifiedContent.lastIndexOf('import ');
      if (importEndIndex !== -1) {
        const importEndLineIndex = modifiedContent.indexOf('\n', importEndIndex);
        if (importEndLineIndex !== -1) {
          modifiedContent = 
            modifiedContent.slice(0, importEndLineIndex + 1) + 
            IMPORTS_TO_ADD.join('\n') + 
            '\n' + 
            modifiedContent.slice(importEndLineIndex + 1);
        }
      }
    }
    
    // Add theme hook to component
    const componentStartRegex = /export\s+default\s+function\s+([A-Za-z0-9_]+)\s*\(/;
    const componentMatch = modifiedContent.match(componentStartRegex);
    if (componentMatch) {
      const openingBraceIndex = modifiedContent.indexOf('{', modifiedContent.indexOf(componentMatch[0]));
      if (openingBraceIndex !== -1) {
        modifiedContent = 
          modifiedContent.slice(0, openingBraceIndex + 1) + 
          '\n  const theme = useAppTheme();' +
          '\n  const styles = useThemedStyles(createStyles);' +
          modifiedContent.slice(openingBraceIndex + 1);
      }
    }
    
    // Replace hardcoded colors with theme references
    for (const [hexColor, themeValue] of Object.entries(COLOR_MAP)) {
      const colorRegex = new RegExp(`['"]${hexColor}['"]`, 'gi');
      modifiedContent = modifiedContent.replace(colorRegex, themeValue);
      
      // Also capture color in backgroundColor, color props
      const styleRegex = new RegExp(`(backgroundColor|color):\\s*['"]${hexColor}['"]`, 'gi');
      modifiedContent = modifiedContent.replace(styleRegex, `$1: ${themeValue}`);
    }
    
    // Convert StyleSheet.create to themed styles function
    const styleSheetRegex = /const\s+styles\s*=\s*StyleSheet\.create\s*\(\s*{/;
    if (styleSheetRegex.test(modifiedContent)) {
      modifiedContent = modifiedContent.replace(
        styleSheetRegex,
        'const createStyles = (theme: Theme) => StyleSheet.create({'
      );
      
      // Remove original styles declaration
      if (componentMatch && modifiedContent.includes('const styles = useThemedStyles(createStyles);')) {
        const stylesDeclarationRegex = /const\s+styles\s*=\s*StyleSheet\.create\s*\(\s*{[\s\S]*?\}\s*\)\s*;/;
        modifiedContent = modifiedContent.replace(stylesDeclarationRegex, '');
      }
    }
    
    // Write back the modified content
    await writeFile(filePath, modifiedContent, 'utf8');
    console.log(`Successfully modified ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

/**
 * Processes all files in a directory recursively
 * @param {string} dirPath - Path to the directory
 * @param {string[]} extensions - File extensions to process
 */
async function processDirectory(dirPath, extensions = ['.tsx', '.ts']) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules and .git
        if (entry.name !== 'node_modules' && entry.name !== '.git') {
          await processDirectory(fullPath, extensions);
        }
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        await processFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error);
  }
}

// Main function
async function main() {
  const targetPath = process.argv[2];
  
  if (!targetPath) {
    console.error('Please provide a file or directory path.');
    process.exit(1);
  }
  
  const fullPath = path.resolve(process.cwd(), targetPath);
  
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    
    if (stats.isFile()) {
      await processFile(fullPath);
    } else if (stats.isDirectory()) {
      await processDirectory(fullPath);
    }
  } else {
    console.error('The provided path does not exist.');
    process.exit(1);
  }
}

main(); 