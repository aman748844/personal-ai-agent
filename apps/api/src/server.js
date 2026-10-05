/**
 * API Gateway Server (Section 1 & 15 Node.js API / Gateway)
 * Manages REST API endpoints and dual WebSocket channels:
 *  1) /agent: Secure channel for Local Agent communication with 10s heartbeat
 *  2) /ui: Real-time broadcast channel for Web Dashboard
 */

require('dotenv').config();

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const cors = require('cors');

const db = require('../../../services/db');
const agentOrchestrator = require('../../../services/agent-orchestrator');
const notification = require('../../../services/notification');
const toolRegistry = require('../../../services/tool-registry');
const logger = require('../../../packages/logging');
const { MessageTypes } = require('../../../packages/shared-types');
const auth = require('../../../packages/auth');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Serve static frontend dashboard
app.use(express.static(path.resolve(__dirname, '../../web')));

// REST Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    agentConnected: agentOrchestrator.isLocalAgentConnected()
  });
});

app.get('/api/devices', (req, res) => {
  const devices = db.getDevices();
  res.json(devices);
});

app.get('/api/tasks', (req, res) => {
  const tasks = db.getTasks();
  res.json(tasks);
});

app.get('/api/tasks/:id', (req, res) => {
  const task = db.getTaskById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const steps = db.getTaskSteps(task.id);
  const logs = db.getAgentLogs(task.id);
  const approvals = db.getApprovalByTask(task.id);
  res.json({ ...task, steps, logs, approvals });
});

app.post('/api/tasks', async (req, res) => {
  const { userId = 'user_123', deviceId = 'device_aman_pc', instruction } = req.body;
  if (!instruction) {
    return res.status(400).json({ error: 'Instruction is required' });
  }

  try {
    const result = await agentOrchestrator.handleUserRequest({ userId, deviceId, instruction });
    res.json({ status: 'dispatched', ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/approvals/:id', (req, res) => {
  const { id } = req.params;
  const { approved } = req.body;
  agentOrchestrator.handleApprovalDecision(id, !!approved);
  res.json({ status: 'recorded', approvalId: id, approved });
});

app.post('/api/tasks/:id/human-verification-done', (req, res) => {
  const { id } = req.params;
  agentOrchestrator.handleHumanVerificationResolved(id);
  res.json({ status: 'resumed', taskId: id });
});

app.get('/api/tools', (req, res) => {
  res.json(toolRegistry.listTools());
});

app.get('/api/credentials', (req, res) => {
  res.json(db.getCredentials('user_123'));
});

// WebSocket Server
const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

  if (pathname === '/agent' || pathname === '/ui') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, pathname);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws, request, pathname) => {
  if (pathname === '/agent') {
    logger.info('APIGateway', 'Local Agent WebSocket connection initiated.');
    agentOrchestrator.setLocalAgentConnection(ws);

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());

        if (msg.type === MessageTypes.REGISTER_DEVICE) {
          const deviceId = msg.deviceId || 'device_pc';
          const hostname = msg.deviceInfo?.hostname || deviceId || 'Local-PC';
          ws.deviceId = deviceId;
          ws.hostname = hostname;
          logger.info('APIGateway', `Registered device: ${deviceId} (${hostname})`);
          db.updateDeviceStatus(deviceId, 'ONLINE', hostname);
          ws.send(JSON.stringify({ type: MessageTypes.REGISTER_DEVICE_ACK, deviceId }));
          notification.broadcast({
            type: 'DEVICE_STATUS_CHANGE',
            deviceId,
            hostname,
            status: 'ONLINE'
          });
        } else if (msg.type === MessageTypes.HEARTBEAT) {
          const deviceId = ws.deviceId || msg.deviceId || 'device_pc';
          db.updateDeviceStatus(deviceId, 'ONLINE');
          ws.send(JSON.stringify({ type: MessageTypes.HEARTBEAT_ACK, timestamp: Date.now() }));
          notification.broadcast({ type: 'HEARTBEAT_PULSE', deviceId, timestamp: Date.now() });
        } else if (msg.type === MessageTypes.TOOL_RESULT) {
          agentOrchestrator.handleToolResult(msg);
        } else if (msg.type === MessageTypes.LIVE_OBSERVATION) {
          notification.notifyLiveView(msg.taskId, msg.screenshot, msg.action, msg.url);
        }
      } catch (err) {
        logger.error('APIGateway', 'Error processing agent message:', err.message);
      }
    });

    ws.on('close', () => {
      const deviceId = ws.deviceId || 'device_pc';
      const hostname = ws.hostname || 'Local Agent';
      logger.warn('APIGateway', `Local Agent disconnected: ${deviceId}`);
      db.updateDeviceStatus(deviceId, 'OFFLINE');
      notification.broadcast({
        type: 'DEVICE_STATUS_CHANGE',
        deviceId,
        hostname,
        status: 'OFFLINE'
      });
    });

  } else if (pathname === '/ui') {
    notification.addUiClient(ws);
    // Send initial snapshot
    ws.send(JSON.stringify({
      type: 'INITIAL_STATE',
      devices: db.getDevices(),
      tasks: db.getTasks(),
      agentConnected: agentOrchestrator.isLocalAgentConnected()
    }));
  }
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  logger.info('APIGateway', `API Gateway running at http://localhost:${PORT}`);
  logger.info('APIGateway', `WebSocket endpoints: ws://localhost:${PORT}/agent and ws://localhost:${PORT}/ui`);
});

module.exports = { app, server };
