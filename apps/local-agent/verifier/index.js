/**
 * Deterministic Verification Engine (Section 2, 3, 10)
 * Validates actual OS or browser side-effects after action execution
 */

const fs = require('fs');
const { resolveSafePath } = require('../security');

class VerificationEngine {
  verifyDirectoryCreated(rawPath) {
    const fullPath = resolveSafePath(rawPath);
    return {
      verified: fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory(),
      path: fullPath
    };
  }

  verifyFileCreated(rawPath) {
    const fullPath = resolveSafePath(rawPath);
    return {
      verified: fs.existsSync(fullPath) && fs.statSync(fullPath).isFile(),
      path: fullPath
    };
  }

  verifyFileDeleted(rawPath) {
    const fullPath = resolveSafePath(rawPath);
    return {
      verified: !fs.existsSync(fullPath),
      path: fullPath
    };
  }
}

module.exports = new VerificationEngine();
