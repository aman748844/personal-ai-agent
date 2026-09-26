/**
 * Local Agent Filesystem Tool (Section 2, 3, 4 of PDF)
 * Implements create_directory, create_file, exists, delete_file, move_file, copy_file, search_files
 */

const fs = require('fs');
const path = require('path');
const { resolveSafePath } = require('../security');

class FileSystemTool {
  createDirectory(rawPath) {
    const fullPath = resolveSafePath(rawPath);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    const verified = fs.existsSync(fullPath);
    return {
      status: 'success',
      action: 'create_directory',
      path: fullPath,
      verified
    };
  }

  createFile(rawPath, content = '') {
    const fullPath = resolveSafePath(rawPath);
    const parentDir = path.dirname(fullPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(fullPath, content, 'utf-8');
    const verified = fs.existsSync(fullPath);
    return {
      status: 'success',
      action: 'create_file',
      path: fullPath,
      size: fs.statSync(fullPath).size,
      verified
    };
  }

  exists(rawPath) {
    const fullPath = resolveSafePath(rawPath);
    const exists = fs.existsSync(fullPath);
    return {
      status: 'success',
      action: 'exists',
      path: fullPath,
      exists,
      verified: exists
    };
  }

  readFile(rawPath) {
    const fullPath = resolveSafePath(rawPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`);
    }
    const content = fs.readFileSync(fullPath, 'utf-8');
    return {
      status: 'success',
      action: 'read_file',
      path: fullPath,
      content,
      verified: true
    };
  }

  deleteFile(rawPath) {
    const fullPath = resolveSafePath(rawPath);
    if (fs.existsSync(fullPath)) {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(fullPath);
      }
    }
    const verified = !fs.existsSync(fullPath);
    return {
      status: 'success',
      action: 'delete_file',
      path: fullPath,
      verified
    };
  }

  moveFile(rawSrc, rawDest) {
    const src = resolveSafePath(rawSrc);
    const dest = resolveSafePath(rawDest);
    if (!fs.existsSync(src)) {
      throw new Error(`Source not found: ${src}`);
    }
    fs.renameSync(src, dest);
    return {
      status: 'success',
      action: 'move_file',
      source: src,
      destination: dest,
      verified: fs.existsSync(dest)
    };
  }

  copyFile(rawSrc, rawDest) {
    const src = resolveSafePath(rawSrc);
    const dest = resolveSafePath(rawDest);
    if (!fs.existsSync(src)) {
      throw new Error(`Source not found: ${src}`);
    }
    fs.copyFileSync(src, dest);
    return {
      status: 'success',
      action: 'copy_file',
      source: src,
      destination: dest,
      verified: fs.existsSync(dest)
    };
  }

  searchFiles(rawDir, pattern = '') {
    const targetDir = resolveSafePath(rawDir);
    if (!fs.existsSync(targetDir)) {
      return { status: 'success', action: 'search_files', matches: [], verified: true };
    }
    const files = fs.readdirSync(targetDir);
    const filtered = pattern ? files.filter(f => f.toLowerCase().includes(pattern.toLowerCase())) : files;
    return {
      status: 'success',
      action: 'search_files',
      directory: targetDir,
      matches: filtered,
      verified: true
    };
  }
}

module.exports = new FileSystemTool();
