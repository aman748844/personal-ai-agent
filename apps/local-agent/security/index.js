/**
 * Local Agent Security Module: Signature Verification and Local Path Resolvers
 */

const os = require('os');
const path = require('path');
const { verifyPayloadSignature } = require('../../../packages/protocol');
const vault = require('./vault');

function resolveSafePath(inputPath) {
  if (!inputPath) return '';
  const homeDir = os.homedir();
  const desktopDir = path.join(homeDir, 'Desktop');
  const documentsDir = path.join(homeDir, 'Documents');
  const downloadsDir = path.join(homeDir, 'Downloads');

  let resolved = inputPath
    .replace(/^USER_DESKTOP[\\/]?/i, desktopDir + path.sep)
    .replace(/^USER_DOCUMENTS[\\/]?/i, documentsDir + path.sep)
    .replace(/^USER_DOWNLOADS[\\/]?/i, downloadsDir + path.sep)
    .replace(/^~[\\/]/, homeDir + path.sep);

  return path.normalize(resolved);
}

function verifyCommand(message) {
  const { signature, ...payload } = message;
  return verifyPayloadSignature(payload, signature);
}

module.exports = {
  resolveSafePath,
  verifyCommand,
  vault
};
