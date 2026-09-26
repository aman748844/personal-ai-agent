/**
 * Connection Manager (Section 8 "24 hours live" ka actual architecture)
 * Manages persistent WebSocket connection, 10s heartbeat cycle,
 * automatic reconnect, re-authentication, and pending task recovery.
 */

const WebSocket = require('ws');
const { MessageTypes } = require('../../../packages/shared-types');
const { createSignedMessage } = require('../../../packages/protocol');
const logger = require('../../../packages/logging');

class ConnectionManager {
  constructor({ gatewayUrl, deviceId, deviceToken, onCommand }) {
    this.gatewayUrl = gatewayUrl || process.env.GATEWAY_WS_URL || 'ws://localhost:4000/agent';
    this.deviceId = deviceId || 'device_aman_pc';
    this.deviceToken = deviceToken || 'device_token_aman_pc';
    this.onCommand = onCommand;

    this.ws = null;
    this.heartbeatTimer = null;
    this.reconnectTimer = null;
    this.isConnected = false;
    this.shouldRun = true;
  }

  connect() {
    if (!this.shouldRun) return;

    logger.info('ConnectionManager', `Connecting to Cloud Gateway at ${this.gatewayUrl}...`);
    try {
      this.ws = new WebSocket(this.gatewayUrl);

      this.ws.on('open', () => {
        logger.info('ConnectionManager', '✓ Connected to Cloud Gateway.');
        this.isConnected = true;
        this._authenticate();
        this._startHeartbeat();
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this._handleMessage(message);
        } catch (err) {
          logger.error('ConnectionManager', 'Failed to parse incoming message:', err.message);
        }
      });

      this.ws.on('close', (code, reason) => {
        logger.warn('ConnectionManager', `Disconnected from Cloud Gateway (${code}: ${reason}). Reconnecting in 3s...`);
        this.isConnected = false;
        this._stopHeartbeat();
        this._scheduleReconnect();
      });

      this.ws.on('error', (err) => {
        logger.error('ConnectionManager', `WebSocket error: ${err.message}`);
        this.ws.close();
      });
    } catch (err) {
      logger.error('ConnectionManager', `Connection attempt failed: ${err.message}`);
      this._scheduleReconnect();
    }
  }

  _authenticate() {
    const authMessage = createSignedMessage(MessageTypes.REGISTER_DEVICE, {
      deviceId: this.deviceId,
      token: this.deviceToken,
      deviceInfo: {
        platform: process.platform,
        hostname: require('os').hostname(),
        nodeVersion: process.version
      }
    });
    this.send(authMessage);
  }

  _startHeartbeat() {
    this._stopHeartbeat();
    // 10-second heartbeat according to Section 8
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({
          type: MessageTypes.HEARTBEAT,
          deviceId: this.deviceId,
          timestamp: Date.now()
        });
      }
    }, 10000);
  }

  _stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  _scheduleReconnect() {
    if (!this.shouldRun || this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  _handleMessage(message) {
    if (message.type === MessageTypes.HEARTBEAT_ACK) {
      // Cloud -> alive
      return;
    }
    if (message.type === MessageTypes.REGISTER_DEVICE_ACK) {
      logger.info('ConnectionManager', `✓ Device successfully registered with Cloud: ${this.deviceId}`);
      return;
    }
    if (this.onCommand) {
      this.onCommand(message);
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    this.shouldRun = false;
    this._stopHeartbeat();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) this.ws.close();
  }
}

module.exports = ConnectionManager;
