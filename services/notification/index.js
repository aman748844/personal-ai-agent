/**
 * Notification Service: Real-time UI Event Broadcaster
 * Manages WebSocket client connections and broadcasts live logs, screenshots, and statuses.
 */

const { EventEmitter } = require('events');

class NotificationService extends EventEmitter {
  constructor() {
    super();
    this.uiClients = new Set();
  }

  addUiClient(ws) {
    this.uiClients.add(ws);
    ws.on('close', () => this.uiClients.delete(ws));
  }

  broadcast(message) {
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    for (const client of this.uiClients) {
      if (client.readyState === 1 /* OPEN */) {
        try {
          client.send(payload);
        } catch {
          // ignore dead socket
        }
      }
    }
  }

  notifyStepUpdate(taskId, stepData) {
    this.broadcast({
      type: 'TASK_STEP_UPDATE',
      taskId,
      ...stepData
    });
  }

  notifyTaskStatus(taskId, status, details = {}) {
    this.broadcast({
      type: 'TASK_STATUS_UPDATE',
      taskId,
      status,
      ...details
    });
  }

  notifyLiveView(taskId, screenshotBase64, currentAction, url = '') {
    this.broadcast({
      type: 'LIVE_OBSERVATION',
      taskId,
      screenshot: screenshotBase64,
      action: currentAction,
      url,
      timestamp: Date.now()
    });
  }

  notifyApprovalRequired(approval) {
    this.broadcast({
      type: 'REQUIRE_APPROVAL',
      approval
    });
  }

  notifyHumanVerificationRequired(taskId, message) {
    this.broadcast({
      type: 'REQUIRE_HUMAN_VERIFICATION',
      taskId,
      message
    });
  }
}

module.exports = new NotificationService();
