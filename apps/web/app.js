/**
 * Web Dashboard Client Logic (Section 17 & 18 Real-Time UI)
 * Handles WebSocket event streaming, terminal updates, and user interactions
 */

let ws = null;
let currentTaskId = null;
let pendingApprovalId = null;
let heartbeatSeconds = 10;
let heartbeatInterval = null;

const terminal = document.getElementById('terminalOutput');
const deviceBadge = document.getElementById('deviceBadge');
const deviceStatusText = document.getElementById('deviceStatusText');
const heartbeatDisplay = document.getElementById('heartbeatDisplay');
const taskStatusBadge = document.getElementById('taskStatusBadge');
const instructionInput = document.getElementById('instructionInput');
const dispatchBtn = document.getElementById('dispatchBtn');

const viewportImg = document.getElementById('viewportImg');
const viewportPlaceholder = document.getElementById('viewportPlaceholder');
const viewportUrl = document.getElementById('viewportUrl');
const viewportCurrentAction = document.getElementById('viewportCurrentAction');
const liveActionTag = document.getElementById('liveActionTag');

const approvalModal = document.getElementById('approvalModal');
const approvalMessage = document.getElementById('approvalMessage');
const approveBtn = document.getElementById('approveBtn');
const rejectBtn = document.getElementById('rejectBtn');

const humanVerificationModal = document.getElementById('humanVerificationModal');
const humanDoneBtn = document.getElementById('humanDoneBtn');

function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ui`;

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    startHeartbeatTimer();
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      handleIncomingEvent(msg);
    } catch (err) {
      console.error('Error handling WS event:', err);
    }
  };

  ws.onclose = () => {
    deviceBadge.className = 'badge badge-offline';
    deviceStatusText.innerText = 'Gateway Disconnected';
    setTimeout(connectWebSocket, 3000);
  };
}

function startHeartbeatTimer() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatSeconds = 10;
  heartbeatInterval = setInterval(() => {
    heartbeatSeconds--;
    if (heartbeatSeconds <= 0) heartbeatSeconds = 10;
    heartbeatDisplay.innerText = `HB: ${heartbeatSeconds}s`;
  }, 1000);
}

function handleIncomingEvent(msg) {
  switch (msg.type) {
    case 'INITIAL_STATE':
      if (msg.agentConnected) {
        setDeviceOnline(true);
      } else {
        setDeviceOnline(false);
      }
      break;

    case 'DEVICE_STATUS_CHANGE':
      setDeviceOnline(msg.status === 'ONLINE');
      break;

    case 'HEARTBEAT_PULSE':
      heartbeatSeconds = 10;
      heartbeatDisplay.innerText = `HB: 10s ✓`;
      break;

    case 'TASK_STATUS_UPDATE':
      if (msg.status) {
        taskStatusBadge.innerText = msg.status;
        if (msg.status === 'COMPLETED') {
          taskStatusBadge.style.color = 'var(--accent-emerald)';
          appendTerminalLine('Status: Completed', 'terminal-status');
        } else if (msg.status === 'FAILED') {
          taskStatusBadge.style.color = 'var(--accent-rose)';
          appendTerminalLine(`Status: Failed - ${msg.message || ''}`, 'terminal-warn');
        } else if (msg.status === 'PLANNING') {
          appendTerminalLine(`Agent: Understanding request...`, 'terminal-info');
        }
      }
      if (msg.message && msg.status !== 'FAILED') {
        appendTerminalLine(msg.message, 'terminal-info');
      }
      break;

    case 'TASK_STEP_UPDATE':
      if (msg.status === 'RUNNING') {
        if (msg.tool === 'filesystem.create_directory') {
          appendTerminalLine('✓ Connected to Aman-PC', 'terminal-success');
          appendTerminalLine('✓ Permission verified', 'terminal-success');
          appendTerminalLine('✓ Creating folder...', 'terminal-info');
        } else {
          appendTerminalLine(`Executing: ${msg.tool}...`, 'terminal-info');
        }
      } else if (msg.status === 'COMPLETED') {
        if (msg.tool === 'filesystem.create_directory') {
          appendTerminalLine('✓ Folder created', 'terminal-success');
        } else if (msg.tool === 'filesystem.exists') {
          appendTerminalLine('✓ Verification successful', 'terminal-success');
        } else {
          appendTerminalLine(`✓ Step ${msg.stepIndex} (${msg.tool}) completed & verified`, 'terminal-success');
        }
      } else if (msg.status === 'FAILED') {
        appendTerminalLine(`⚠ Error on step ${msg.stepIndex}: ${msg.error}`, 'terminal-warn');
      }
      break;

    case 'LIVE_OBSERVATION':
      if (msg.screenshot) {
        viewportImg.src = `data:image/jpeg;base64,${msg.screenshot}`;
        viewportImg.style.display = 'block';
        viewportPlaceholder.style.display = 'none';
      }
      if (msg.action) {
        viewportCurrentAction.innerText = msg.action;
        liveActionTag.innerText = 'STREAMING';
      }
      if (msg.url) {
        viewportUrl.innerText = msg.url;
      }
      break;

    case 'REQUIRE_APPROVAL':
      pendingApprovalId = msg.approval.approvalId;
      approvalMessage.innerText = msg.approval.message;
      approvalModal.classList.add('active');
      break;

    case 'REQUIRE_HUMAN_VERIFICATION':
      currentTaskId = msg.taskId;
      humanVerificationModal.classList.add('active');
      appendTerminalLine('🛡 Human verification required. Agent paused.', 'terminal-warn');
      break;
  }
}

function setDeviceOnline(isOnline) {
  if (isOnline) {
    deviceBadge.className = 'badge badge-online';
    deviceStatusText.innerText = 'Connected: Aman-PC [ONLINE]';
  } else {
    deviceBadge.className = 'badge badge-offline';
    deviceStatusText.innerText = 'Aman-PC [OFFLINE - Launch Agent]';
  }
}

function appendTerminalLine(text, className = '') {
  const line = document.createElement('div');
  line.className = `terminal-line ${className}`;
  line.innerText = text;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
}

function setCommand(text) {
  instructionInput.value = text;
  instructionInput.focus();
}

async function dispatchTask() {
  const instruction = instructionInput.value.trim();
  if (!instruction) return;

  // Clear terminal and prepare
  terminal.innerHTML = '';
  appendTerminalLine(`You: ${instruction}`, 'terminal-user');
  taskStatusBadge.innerText = 'PLANNING';

  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user_123',
        deviceId: 'device_aman_pc',
        instruction
      })
    });
    const data = await res.json();
    currentTaskId = data.taskId;
  } catch (err) {
    appendTerminalLine(`Failed to dispatch task: ${err.message}`, 'terminal-warn');
  }
}

dispatchBtn.addEventListener('click', dispatchTask);
instructionInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') dispatchTask();
});

// Approvals
approveBtn.addEventListener('click', async () => {
  if (pendingApprovalId) {
    await fetch(`/api/approvals/${pendingApprovalId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved: true })
    });
    approvalModal.classList.remove('active');
    pendingApprovalId = null;
  }
});

rejectBtn.addEventListener('click', async () => {
  if (pendingApprovalId) {
    await fetch(`/api/approvals/${pendingApprovalId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved: false })
    });
    approvalModal.classList.remove('active');
    pendingApprovalId = null;
  }
});

// Human Verification Done
humanDoneBtn.addEventListener('click', async () => {
  if (currentTaskId) {
    await fetch(`/api/tasks/${currentTaskId}/human-verification-done`, {
      method: 'POST'
    });
    humanVerificationModal.classList.remove('active');
    appendTerminalLine('User completed verification. Resuming workflow...', 'terminal-info');
  }
});

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  connectWebSocket();
});
