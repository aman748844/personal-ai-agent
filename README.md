# Autonomous Computer-Use AI Agent Platform

A production-grade, 7-layer Autonomous AI Agent platform capable of understanding user commands in natural language (Hindi / English), generating structured tool plans, and directly executing deterministic actions on the user's local Windows computer and browser.

> **Core Principle:** *"AI cloud mein ho sakta hai, lekin actual computer control Local Agent karega. Hands and eyes user ke local computer par hone chahiye."*

---

## 🏗️ 7 Architectural Layers

1. **AI Brain** (`services/ai-gateway`): Multi-model abstraction (OpenAI, Claude, Gemini, Local Model fallback) that compiles natural language into structured tool plans.
2. **Agent Orchestrator** (`services/agent-orchestrator`): Executes the closed-loop execution lifecycle:  
   `UNDERSTAND -> PLAN -> CHECK PERMISSIONS -> EXECUTE -> OBSERVE -> VERIFY -> (DIAGNOSE -> REPLAN -> RETRY)`
3. **Tool System / MCP** (`services/tool-registry`): Standardized MCP tool catalog across `filesystem`, `browser`, `os`, `computer`, and `applications`.
4. **Durable Workflow Engine** (`services/workflow`): Temporal-inspired state journaling, crash recovery, retries, and human-in-the-loop pauses.
5. **Secure Cloud Gateway** (`apps/api`): Node.js REST API with dual WebSocket channels (`/agent` and `/ui`) with HMAC-SHA256 command signing.
6. **Local Windows Agent Runtime** (`apps/local-agent`): Windows client executing actions via Playwright browser control, native Windows `.NET` screen observation, and controlled OS commands.
7. **Verification & Watchdog** (`verifier`, `observer`, `watchdog`): Deterministic filesystem and DOM verification, paired with a supervisor that auto-restarts the agent on crashes.

---

## 🚀 Quick Start

### 1. Installation
```bash
git clone https://github.com/<your-username>/ai-agent-platform.git
cd ai-agent-platform
npm install
```

### 2. Start Cloud Gateway & Web Dashboard
```bash
npm start
```
*Access the Web Dashboard at: `http://localhost:4000`*

### 3. Start Local Windows Agent Runtime
In a second terminal:
```bash
npm run agent
```
*(Optional) To run with the Watchdog supervisor:*
```bash
npm run watchdog
```

### 4. Run Automated End-to-End Tests
```bash
npm test
```

---

## 🔒 Security Boundary & Credential Vault

- **No Arbitrary Shell**: Arbitrary remote shell execution is strictly blocked. Only typed MCP tools passing through the Policy Engine are executed.
- **Cryptographic Command Signing**: Every tool execution is signed with HMAC-SHA256 by the API Gateway and validated locally.
- **AES-256 Local Credential Vault**: Passwords never touch the LLM prompt. The LLM only receives a `vault_reference` (e.g., `naukri_primary`).
- **Human-In-The-Loop Verification**: If CAPTCHA, 2FA, or OTP is encountered, the agent pauses: *"Human verification required. Please complete it."*, allowing the user to solve it in the browser and resume.
- **Dangerous Action Approvals**: High-risk actions (`delete_file`, `close_application`, `financial.transaction`) require explicit user confirmation (*"Are you sure?"*).

---

## 📂 Project Structure

```
ai-agent-platform/
├── apps/
│   ├── api/src/server.js       # Node.js API Gateway & WebSockets (/agent, /ui)
│   ├── local-agent/            # Local Windows Agent Runtime
│   └── web/                    # Real-time Web Dashboard (index.html, style.css, app.js)
├── services/                   # Orchestrator, AI Gateway, Workflow, Tool Registry, Policy Engine, DB
├── packages/                   # Shared Types, Protocol (HMAC signing), Auth, Logging
├── workflows/                  # Computer Workflow, Browser Workflow, Resume Workflow
├── infrastructure/             # Docker, Kubernetes, Terraform manifests
├── docs/                       # Architecture, Security, and Tool documentation
├── data/database.json          # Section 16 Database
├── vault/vault.enc             # AES-256 encrypted credential store
└── test/test-end-to-end.js     # Automated test suite
```
