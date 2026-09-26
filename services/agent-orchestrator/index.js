/**
 * Agent Orchestrator: Section 1, 10, & 24 Autonomous Execution Engine
 * Executes the complete loop:
 * USER REQUEST -> UNDERSTAND -> PLAN -> CHECK PERMISSIONS -> EXECUTE -> OBSERVE -> VERIFY -> SUCCESS?
 *  - YES: DONE
 *  - NO: DIAGNOSE -> REPLAN -> RETRY -> OBSERVE
 */

const aiGateway = require('../ai-gateway');
const policyEngine = require('../policy-engine');
const durableWorkflow = require('../workflow');
const toolRegistry = require('../tool-registry');
const notification = require('../notification');
const db = require('../db');
const { TaskStatus, StepStatus, RiskLevel } = require('../../packages/shared-types');
const { createSignedMessage } = require('../../packages/protocol');

class AgentOrchestrator {
  constructor() {
    this.localAgentConnection = null;
    this.pendingResolvers = new Map();
  }

  setLocalAgentConnection(ws) {
    this.localAgentConnection = ws;
  }

  isLocalAgentConnected() {
    return this.localAgentConnection && this.localAgentConnection.readyState === 1;
  }

  async handleUserRequest({ userId, deviceId, instruction }) {
    const taskId = 'task_' + Date.now();
    db.createTask({
      id: taskId,
      userId,
      deviceId,
      instruction,
      status: TaskStatus.PLANNING
    });

    notification.notifyTaskStatus(taskId, TaskStatus.PLANNING, {
      message: 'Agent: Understanding request and formulating plan...'
    });

    // 1. UNDERSTAND & PLAN
    const plan = await aiGateway.generatePlan(instruction);
    db.addAgentLog(taskId, `Generated plan with goal: "${plan.goal}"`);

    // 2. INITIALIZE DURABLE WORKFLOW (Temporal pattern)
    await durableWorkflow.initWorkflow(taskId, plan);

    // 3. EXECUTE LOOP
    this.runExecutionLoop(taskId);

    return { taskId, goal: plan.goal };
  }

  async runExecutionLoop(taskId) {
    const state = durableWorkflow.getWorkflowState(taskId);
    if (!state) return;

    if (!this.isLocalAgentConnected()) {
      db.updateTaskStatus(taskId, TaskStatus.FAILED);
      notification.notifyTaskStatus(taskId, TaskStatus.FAILED, {
        message: 'Local Agent is offline. Please launch the local agent on the target machine.'
      });
      return;
    }

    db.updateTaskStatus(taskId, TaskStatus.RUNNING);

    while (true) {
      const nextStep = durableWorkflow.getNextPendingStep(taskId);
      if (!nextStep) {
        // Either completed or paused
        if (state.isPaused) {
          notification.notifyTaskStatus(taskId, TaskStatus.WAITING_APPROVAL, {
            message: state.pauseReason
          });
        }
        break;
      }

      // CHECK PERMISSIONS (Policy Engine)
      const policyCheck = policyEngine.evaluateTool(nextStep.tool, nextStep.params);
      if (!policyCheck.allowed) {
        durableWorkflow.recordStepFailure(taskId, nextStep.stepId, new Error(policyCheck.reason));
        continue;
      }

      // HIGH RISK APPROVAL REQUIRED (Section 14)
      if (policyCheck.requiresApproval) {
        const approval = db.createApproval({
          id: 'appr_' + Date.now(),
          taskId,
          action: nextStep.tool
        });
        durableWorkflow.pauseWorkflow(taskId, `Waiting for user approval for high-risk action: ${nextStep.tool}`);
        notification.notifyApprovalRequired({
          approvalId: approval.id,
          taskId,
          action: nextStep.tool,
          message: policyCheck.prompt
        });
        break; // Pause execution until user approves
      }

      // EXECUTE TOOL via Local Agent (Secure Channel)
      notification.notifyStepUpdate(taskId, {
        stepId: nextStep.stepId,
        stepIndex: nextStep.stepIndex,
        tool: nextStep.tool,
        status: StepStatus.RUNNING,
        message: `Executing tool ${nextStep.tool}...`
      });

      try {
        const executionResult = await this.dispatchToolToLocalAgent(taskId, nextStep);

        // OBSERVE & VERIFY
        if (executionResult && executionResult.humanVerificationRequired) {
          // CAPTCHA / 2FA pause (Section 6)
          durableWorkflow.pauseWorkflow(taskId, 'Human verification (CAPTCHA/MFA) required.');
          notification.notifyHumanVerificationRequired(taskId, 'Human verification required on page. Please complete it in the browser window.');
          break;
        }

        if (executionResult && executionResult.success) {
          durableWorkflow.recordStepSuccess(taskId, nextStep.stepId, executionResult);
          notification.notifyStepUpdate(taskId, {
            stepId: nextStep.stepId,
            stepIndex: nextStep.stepIndex,
            tool: nextStep.tool,
            status: StepStatus.COMPLETED,
            output: executionResult,
            message: `✓ Completed and verified: ${nextStep.tool}`
          });
        } else {
          // DIAGNOSE & RETRY / REPLAN
          const errorMsg = (executionResult && executionResult.error) || 'Action failed during verification';
          durableWorkflow.recordStepFailure(taskId, nextStep.stepId, new Error(errorMsg));
          notification.notifyStepUpdate(taskId, {
            stepId: nextStep.stepId,
            stepIndex: nextStep.stepIndex,
            tool: nextStep.tool,
            status: StepStatus.FAILED,
            error: errorMsg
          });
        }
      } catch (err) {
        durableWorkflow.recordStepFailure(taskId, nextStep.stepId, err);
        notification.notifyStepUpdate(taskId, {
          stepId: nextStep.stepId,
          stepIndex: nextStep.stepIndex,
          tool: nextStep.tool,
          status: StepStatus.FAILED,
          error: err.message
        });
      }
    }
  }

  dispatchToolToLocalAgent(taskId, step) {
    return new Promise((resolve, reject) => {
      if (!this.isLocalAgentConnected()) {
        return reject(new Error('Local Agent disconnected during dispatch'));
      }

      const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      this.pendingResolvers.set(executionId, { resolve, reject });

      const signedCommand = createSignedMessage('EXECUTE_TOOL', {
        executionId,
        taskId,
        stepIndex: step.stepIndex,
        tool: step.tool,
        params: step.params
      });

      this.localAgentConnection.send(JSON.stringify(signedCommand));

      // Timeout safety (60 seconds)
      setTimeout(() => {
        if (this.pendingResolvers.has(executionId)) {
          this.pendingResolvers.delete(executionId);
          reject(new Error(`Tool execution timed out after 60s: ${step.tool}`));
        }
      }, 60000);
    });
  }

  handleToolResult(resultMessage) {
    const { executionId, success, data, error, humanVerificationRequired } = resultMessage;
    if (this.pendingResolvers.has(executionId)) {
      const { resolve } = this.pendingResolvers.get(executionId);
      this.pendingResolvers.delete(executionId);
      resolve({ success, data, error, humanVerificationRequired });
    }
  }

  handleApprovalDecision(approvalId, approved) {
    const appr = db.updateApproval(approvalId, approved ? 'APPROVED' : 'REJECTED');
    if (appr) {
      if (approved) {
        durableWorkflow.resumeWorkflow(appr.task_id);
        this.runExecutionLoop(appr.task_id);
      } else {
        db.updateTaskStatus(appr.task_id, TaskStatus.FAILED);
        db.addAgentLog(appr.task_id, 'Action cancelled by user.');
        notification.notifyTaskStatus(appr.task_id, TaskStatus.FAILED, {
          message: 'Task halted: High-risk action was rejected by the user.'
        });
      }
    }
  }

  handleHumanVerificationResolved(taskId) {
    durableWorkflow.resumeWorkflow(taskId);
    db.addAgentLog(taskId, 'Human verification marked as completed by user.');
    this.runExecutionLoop(taskId);
  }
}

module.exports = new AgentOrchestrator();
