# AI Agent Platform Architecture

## Core Architectural Principle
> **"AI cloud mein ho sakta hai, lekin actual computer control Local Agent karega."**

## 7 Core Layers
1. **AI Brain**: OpenAI / Claude / Gemini / Local Model abstraction for intent and multi-step plan generation.
2. **Planner**: Structured plan validation and task decomposition into deterministic tools.
3. **Tool System / MCP**: Standardized tools across `filesystem`, `browser`, `os`, `computer`, and `applications`.
4. **Durable Workflow Engine**: Temporal-inspired resilient step runner with state journaling, retries, and resume capability.
5. **Secure Cloud Gateway**: Node.js / Express REST API and dual WebSocket channels with HMAC-SHA256 command signing.
6. **Local Computer Agent**: Windows runtime executing actions with deterministic post-action verification.
7. **Verification & Failure Recovery**: Closed-loop verification (DOM + Screenshots + OS checks) and Watchdog supervisor.
