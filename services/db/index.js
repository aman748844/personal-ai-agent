/**
 * Database Service: Implements Section 16 Database Architecture
 * Manages users, devices, tasks, task_steps, credentials, agent_logs, approvals
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../../data/database.json');

class DatabaseService {
  constructor() {
    this._ensureDb();
  }

  _ensureDb() {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
      const initial = {
        users: [
          { id: 'user_123', email: 'aman@example.com', created_at: new Date().toISOString() }
        ],
        devices: [
          {
            id: 'device_aman_pc',
            user_id: 'user_123',
            name: 'Aman-PC',
            os: 'Windows 11 x64',
            status: 'ONLINE',
            last_seen: new Date().toISOString()
          }
        ],
        tasks: [],
        task_steps: [],
        credentials: [
          {
            id: 'cred_naukri',
            user_id: 'user_123',
            provider: 'naukri.com',
            vault_reference: 'naukri_primary'
          }
        ],
        agent_logs: [],
        approvals: []
      };
      fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    }
  }

  _read() {
    this._ensureDb();
    try {
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(content);
    } catch {
      return { users: [], devices: [], tasks: [], task_steps: [], credentials: [], agent_logs: [], approvals: [] };
    }
  }

  _write(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  }

  // Users
  getUsers() { return this._read().users; }
  getUserById(id) { return this._read().users.find(u => u.id === id); }

  // Devices
  getDevices() { return this._read().devices; }
  getDeviceById(id) { return this._read().devices.find(d => d.id === id); }
  updateDeviceStatus(deviceId, status, name = null) {
    const data = this._read();
    let dev = data.devices.find(d => d.id === deviceId);
    if (!dev) {
      dev = {
        id: deviceId,
        user_id: 'user_123',
        name: name || 'Local-PC',
        os: process.platform === 'win32' ? 'Windows 10/11' : process.platform,
        status,
        last_seen: new Date().toISOString()
      };
      data.devices.push(dev);
    } else {
      dev.status = status;
      dev.last_seen = new Date().toISOString();
      if (name) dev.name = name;
    }
    this._write(data);
    return dev;
  }

  // Tasks
  getTasks() { return this._read().tasks; }
  getTaskById(id) { return this._read().tasks.find(t => t.id === id); }
  createTask({ id, userId, deviceId, instruction, status = 'PENDING' }) {
    const data = this._read();
    const task = {
      id,
      user_id: userId,
      device_id: deviceId,
      instruction,
      status,
      created_at: new Date().toISOString()
    };
    data.tasks.unshift(task);
    this._write(data);
    return task;
  }
  updateTaskStatus(taskId, status) {
    const data = this._read();
    const t = data.tasks.find(item => item.id === taskId);
    if (t) {
      t.status = status;
      this._write(data);
    }
    return t;
  }

  // Task Steps
  getTaskSteps(taskId) {
    return this._read().task_steps.filter(s => s.task_id === taskId);
  }
  createTaskStep({ id, taskId, step, tool, input, output = null, status = 'PENDING' }) {
    const data = this._read();
    const taskStep = {
      id,
      task_id: taskId,
      step,
      tool,
      input,
      output,
      status
    };
    data.task_steps.push(taskStep);
    this._write(data);
    return taskStep;
  }
  updateTaskStep(stepId, { output, status }) {
    const data = this._read();
    const s = data.task_steps.find(item => item.id === stepId);
    if (s) {
      if (output !== undefined) s.output = output;
      if (status !== undefined) s.status = status;
      this._write(data);
    }
    return s;
  }

  // Credentials
  getCredentials(userId) {
    return this._read().credentials.filter(c => !userId || c.user_id === userId);
  }
  getCredentialByProvider(userId, provider) {
    return this._read().credentials.find(c => c.user_id === userId && c.provider.toLowerCase() === provider.toLowerCase());
  }

  // Agent Logs
  addAgentLog(taskId, event) {
    const data = this._read();
    const log = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      task_id: taskId,
      event,
      timestamp: new Date().toISOString()
    };
    data.agent_logs.push(log);
    this._write(data);
    return log;
  }
  getAgentLogs(taskId) {
    return this._read().agent_logs.filter(l => l.task_id === taskId);
  }

  // Approvals
  createApproval({ id, taskId, action, status = 'PENDING', approved_by = null }) {
    const data = this._read();
    const approval = {
      id,
      task_id: taskId,
      action,
      status,
      approved_by
    };
    data.approvals.push(approval);
    this._write(data);
    return approval;
  }
  updateApproval(id, status, approved_by = 'user') {
    const data = this._read();
    const a = data.approvals.find(item => item.id === id);
    if (a) {
      a.status = status;
      a.approved_by = approved_by;
      this._write(data);
    }
    return a;
  }
  getApprovalByTask(taskId) {
    return this._read().approvals.filter(a => a.task_id === taskId);
  }
}

module.exports = new DatabaseService();
