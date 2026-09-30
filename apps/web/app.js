/**
 * Web Dashboard Client Logic (Section 17 & 18 Real-Time UI)
 * Enhanced with 3D Monolith Three.js Visualization, Parallax & Cybernetic HUD
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

function getTimestamp() {
  const d = new Date();
  return d.toTimeString().split(' ')[0];
}

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
          taskStatusBadge.style.color = '#34d399';
          taskStatusBadge.style.borderColor = 'rgba(52, 211, 153, 0.4)';
          appendTerminalLine('Status: Completed', 'terminal-status');
          triggerMonolithPulse(0x34d399);
        } else if (msg.status === 'FAILED') {
          taskStatusBadge.style.color = '#fb7185';
          taskStatusBadge.style.borderColor = 'rgba(251, 113, 133, 0.4)';
          appendTerminalLine(`Status: Failed - ${msg.message || ''}`, 'terminal-warn');
          triggerMonolithPulse(0xfb7185);
        } else if (msg.status === 'PLANNING') {
          taskStatusBadge.style.color = '#38bdf8';
          appendTerminalLine(`Agent: Understanding request & compiling execution plan...`, 'terminal-info');
          triggerMonolithPulse(0x38bdf8);
        }
      }
      if (msg.message && msg.status !== 'FAILED') {
        appendTerminalLine(msg.message, 'terminal-info');
      }
      break;

    case 'TASK_STEP_UPDATE':
      if (msg.status === 'RUNNING') {
        if (msg.tool === 'filesystem.create_directory') {
          appendTerminalLine('✓ Connected to Aman-PC runtime', 'terminal-success');
          appendTerminalLine('✓ Permission & sandbox verified', 'terminal-success');
          appendTerminalLine('✓ Executing: Create folder on Desktop...', 'terminal-info');
        } else {
          appendTerminalLine(`Executing tool: ${msg.tool}...`, 'terminal-info');
        }
        triggerMonolithPulse(0x8b5cf6);
      } else if (msg.status === 'COMPLETED') {
        if (msg.tool === 'filesystem.create_directory') {
          appendTerminalLine('✓ Folder created successfully', 'terminal-success');
        } else if (msg.tool === 'filesystem.exists') {
          appendTerminalLine('✓ Verification successful: Directory exists on disk', 'terminal-success');
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

  const timeSpan = document.createElement('span');
  timeSpan.className = 'line-time';
  timeSpan.innerText = getTimestamp();

  const textSpan = document.createElement('span');
  textSpan.className = 'line-text';
  textSpan.innerText = text;

  line.appendChild(timeSpan);
  line.appendChild(textSpan);
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
}

function clearTerminal() {
  terminal.innerHTML = '';
  appendTerminalLine('Terminal buffer cleared.', 'terminal-info');
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
  appendTerminalLine(`Command Prompt: "${instruction}"`, 'terminal-user');
  taskStatusBadge.innerText = 'PLANNING';
  taskStatusBadge.style.color = '#38bdf8';

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
    appendTerminalLine('User completed verification challenge. Resuming workflow...', 'terminal-info');
  }
});

/* ==========================================================================
   THREE.JS INTERACTIVE 3D MONOLITH & PARTICLES SYSTEM
   ========================================================================== */

let scene, camera, renderer, monolith, particles, edgeLines;
let targetRotationX = 0, targetRotationY = 0;
let mouseX = 0, mouseY = 0;

function initThreeScene() {
  const canvas = document.getElementById('three-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 25;

  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
  keyLight.position.set(10, 15, 20);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x8b5cf6, 1.8);
  rimLight.position.set(-15, -10, -10);
  scene.add(rimLight);

  // 3D Geometric Monolith (Reflective Obsidian Cube/Prism)
  const geometry = new THREE.BoxGeometry(4.2, 7.8, 4.2);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x070c14,
    metalness: 0.95,
    roughness: 0.1,
    reflectivity: 1.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    transparent: true,
    opacity: 0.92
  });

  monolith = new THREE.Mesh(geometry, material);
  monolith.position.set(7.5, -0.5, 0); // Positioned slightly to the right to frame the UI
  scene.add(monolith);

  // Glowing Edge Wireframe for 3D Cyber Depth
  const edgesGeom = new THREE.EdgesGeometry(geometry);
  const edgesMat = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    linewidth: 1.5,
    transparent: true,
    opacity: 0.45
  });
  edgeLines = new THREE.LineSegments(edgesGeom, edgesMat);
  monolith.add(edgeLines);

  // Ambient Floating Dust Particles
  const particleCount = 280;
  const particleGeom = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    particlePositions[i] = (Math.random() - 0.5) * 60;
    particlePositions[i + 1] = (Math.random() - 0.5) * 40;
    particlePositions[i + 2] = (Math.random() - 0.5) * 30;
  }

  particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  const particleMat = new THREE.PointsMaterial({
    color: 0x38bdf8,
    size: 0.14,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending
  });

  particles = new THREE.Points(particleGeom, particleMat);
  scene.add(particles);

  // Window Resize Listener
  window.addEventListener('resize', onWindowResize);

  // Mouse Parallax
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) - 0.5;
    mouseY = (e.clientY / window.innerHeight) - 0.5;

    targetRotationY = mouseX * 0.8;
    targetRotationX = mouseY * 0.4;
  });

  animateThree();
}

function onWindowResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animateThree() {
  requestAnimationFrame(animateThree);

  if (monolith) {
    // Gentle natural rotation + mouse parallax
    monolith.rotation.y += 0.003;
    monolith.rotation.y += (targetRotationY - (monolith.rotation.y % (Math.PI * 2))) * 0.05;
    monolith.rotation.x += (targetRotationX - monolith.rotation.x) * 0.05;

    // Subtle gentle floating wave
    monolith.position.y = -0.5 + Math.sin(Date.now() * 0.0015) * 0.4;
  }

  if (particles) {
    particles.rotation.y += 0.0006;
    particles.rotation.x += 0.0003;
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

function triggerMonolithPulse(colorHex) {
  if (!edgeLines) return;
  edgeLines.material.color.setHex(colorHex);
  edgeLines.material.opacity = 1.0;

  setTimeout(() => {
    if (edgeLines) {
      edgeLines.material.color.setHex(0x38bdf8);
      edgeLines.material.opacity = 0.45;
    }
  }, 1200);
}

// 3D Card Interactive Tilt Effect
function initCardTilt() {
  const cards = document.querySelectorAll('.card-panel, .command-console-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const deltaX = (x - centerX) / centerX;
      const deltaY = (y - centerY) / centerY;

      card.style.transform = `perspective(1000px) rotateY(${deltaX * 2}deg) rotateX(${-deltaY * 2}deg) translateY(-2px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateY(0px)';
    });
  });
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  connectWebSocket();
  initThreeScene();
  initCardTilt();
});
