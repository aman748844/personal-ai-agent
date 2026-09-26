/**
 * Protocol Layer for Secure Cloud <-> Local Agent Communication
 * Includes HMAC-SHA256 Command Signing and Verification
 */

const crypto = require('crypto');

const DEFAULT_SECRET = process.env.AGENT_SECRET || 'ai-agent-platform-secure-key-2026';

function signPayload(payload, secret = DEFAULT_SECRET) {
  const content = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', secret).update(content).digest('hex');
  return signature;
}

function verifyPayloadSignature(payload, signature, secret = DEFAULT_SECRET) {
  if (!signature) return false;
  const expected = signPayload(payload, secret);
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

function createSignedMessage(type, data, secret = DEFAULT_SECRET) {
  const timestamp = Date.now();
  const messageData = {
    type,
    timestamp,
    ...data
  };
  const signature = signPayload(messageData, secret);
  return {
    ...messageData,
    signature
  };
}

module.exports = {
  signPayload,
  verifyPayloadSignature,
  createSignedMessage,
  DEFAULT_SECRET
};
