/**
 * Auth Package: Handles Device Tokens and Session Authentication
 */

const crypto = require('crypto');

class AuthService {
  constructor() {
    this.validTokens = new Map();
    // Default system device token for testing
    this.validTokens.set('device_token_aman_pc', {
      deviceId: 'device_aman_pc',
      userId: 'user_123',
      name: 'Aman-PC',
      registeredAt: Date.now()
    });
  }

  generateDeviceToken(deviceId, userId) {
    const token = 'dev_' + crypto.randomBytes(24).toString('hex');
    this.validTokens.set(token, {
      deviceId,
      userId,
      registeredAt: Date.now()
    });
    return token;
  }

  validateDeviceToken(token) {
    if (!token) return null;
    return this.validTokens.get(token) || null;
  }

  createSession(userId) {
    return {
      sessionId: 'sess_' + crypto.randomBytes(16).toString('hex'),
      userId,
      createdAt: Date.now()
    };
  }
}

module.exports = new AuthService();
