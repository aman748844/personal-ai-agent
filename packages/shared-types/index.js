/**
 * Shared Types and Constants for AI Agent Platform
 * Conforming to PDF Architecture specifications
 */

const RiskLevel = {
  LOW: 'LOW',       // Auto-approved (create folder, read file, open browser, search web)
  MEDIUM: 'MEDIUM', // Notify / standard check (modify file, upload file, submit form)
  HIGH: 'HIGH'      // Explicit User Approval required (delete files, password changes, irreversible actions)
};

const TaskStatus = {
  PENDING: 'PENDING',
  PLANNING: 'PLANNING',
  RUNNING: 'RUNNING',
  WAITING_APPROVAL: 'WAITING_APPROVAL',
  WAITING_HUMAN_VERIFICATION: 'WAITING_HUMAN_VERIFICATION',
  VERIFYING: 'VERIFYING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  RETRYING: 'RETRYING'
};

const StepStatus = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED'
};

const DeviceStatus = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  BUSY: 'BUSY'
};

const MessageTypes = {
  // Connection & Heartbeat (10s interval)
  REGISTER_DEVICE: 'REGISTER_DEVICE',
  REGISTER_DEVICE_ACK: 'REGISTER_DEVICE_ACK',
  HEARTBEAT: 'HEARTBEAT',
  HEARTBEAT_ACK: 'HEARTBEAT_ACK',

  // Task & Planning
  DISPATCH_TASK: 'DISPATCH_TASK',
  TASK_STATUS_UPDATE: 'TASK_STATUS_UPDATE',
  TASK_STEP_UPDATE: 'TASK_STEP_UPDATE',

  // Tool Execution (MCP style)
  EXECUTE_TOOL: 'EXECUTE_TOOL',
  TOOL_RESULT: 'TOOL_RESULT',

  // Security & Human-In-The-Loop
  REQUIRE_APPROVAL: 'REQUIRE_APPROVAL',
  APPROVAL_RESPONSE: 'APPROVAL_RESPONSE',
  REQUIRE_HUMAN_VERIFICATION: 'REQUIRE_HUMAN_VERIFICATION',
  HUMAN_VERIFICATION_RESOLVED: 'HUMAN_VERIFICATION_RESOLVED',

  // Live Agent Observation
  LIVE_OBSERVATION: 'LIVE_OBSERVATION',
  LIVE_SCREENSHOT: 'LIVE_SCREENSHOT',

  // Verification & Audit
  VERIFICATION_RESULT: 'VERIFICATION_RESULT',
  AUDIT_LOG: 'AUDIT_LOG'
};

module.exports = {
  RiskLevel,
  TaskStatus,
  StepStatus,
  DeviceStatus,
  MessageTypes
};
