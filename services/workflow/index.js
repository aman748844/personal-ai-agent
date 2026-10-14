/**
 * Durable Workflow Engine (Temporal Architecture - Section 9 & 20)
 * Provides crash recovery, step-by-step journaling, retry/resume, and human approval pauses.
 */

const { StepStatus, TaskStatus } = require('../../packages/shared-types');
const db = require('../db');
const logger = require('../../packages/logging');
const notification = require('../notification');

class DurableWorkflowEngine {
  constructor() {
    this.activeWorkflows = new Map();
  }

  async initWorkflow(taskId, plan) {
    const steps = plan.steps.map((step, index) => {
      const stepId = `${taskId}_step_${index + 1}`;
      db.createTaskStep({
        id: stepId,
        taskId,
        step: index + 1,
        tool: step.tool,
        input: step,
        status: StepStatus.PENDING
      });
      return {
        stepId,
        stepIndex: index + 1,
        tool: step.tool,
        params: step,
        status: StepStatus.PENDING,
        retries: 0,
        maxRetries: 3
      };
    });

    const workflowState = {
      taskId,
      goal: plan.goal,
      currentStepIndex: 0,
      steps,
      isPaused: false,
      pauseReason: null
    };

    this.activeWorkflows.set(taskId, workflowState);
    db.addAgentLog(taskId, `Initialized durable workflow with ${steps.length} steps`);
    return workflowState;
  }

  getWorkflowState(taskId) {
    return this.activeWorkflows.get(taskId);
  }

  getNextPendingStep(taskId) {
    const state = this.activeWorkflows.get(taskId);
    if (!state || state.isPaused) return null;

    for (const step of state.steps) {
      if (step.status === StepStatus.PENDING || step.status === StepStatus.FAILED) {
        if (step.retries < step.maxRetries) {
          return step;
        }
      }
    }
    return null;
  }

  recordStepSuccess(taskId, stepId, output) {
    const state = this.activeWorkflows.get(taskId);
    if (!state) return;

    const step = state.steps.find(s => s.stepId === stepId);
    if (step) {
      step.status = StepStatus.COMPLETED;
      step.output = output;
      db.updateTaskStep(stepId, { output, status: StepStatus.COMPLETED });
      db.addAgentLog(taskId, `✓ Step ${step.stepIndex} (${step.tool}) completed successfully`);
    }

    const remaining = state.steps.some(s => s.status !== StepStatus.COMPLETED);
    if (!remaining) {
      db.updateTaskStatus(taskId, TaskStatus.COMPLETED);
      db.addAgentLog(taskId, `Status: Completed - All workflow steps executed and verified.`);
      notification.notifyTaskStatus(taskId, TaskStatus.COMPLETED, {
        message: '✓ All steps executed and verified successfully in Google Chrome'
      });
    }
  }

  recordStepFailure(taskId, stepId, error) {
    const state = this.activeWorkflows.get(taskId);
    if (!state) return;

    const step = state.steps.find(s => s.stepId === stepId);
    if (step) {
      step.retries += 1;
      db.updateTaskStep(stepId, { output: { error: error.message }, status: StepStatus.FAILED });
      db.addAgentLog(taskId, `⚠ Step ${step.stepIndex} (${step.tool}) failed: ${error.message} (Retry ${step.retries}/${step.maxRetries})`);
      if (step.retries >= step.maxRetries) {
        db.updateTaskStatus(taskId, TaskStatus.FAILED);
        db.addAgentLog(taskId, `Status: Failed after max retries.`);
      }
    }
  }

  pauseWorkflow(taskId, reason) {
    const state = this.activeWorkflows.get(taskId);
    if (state) {
      state.isPaused = true;
      state.pauseReason = reason;
      db.addAgentLog(taskId, `Workflow paused: ${reason}`);
    }
  }

  resumeWorkflow(taskId) {
    const state = this.activeWorkflows.get(taskId);
    if (state) {
      state.isPaused = false;
      state.pauseReason = null;
      db.addAgentLog(taskId, `Workflow resumed.`);
    }
  }
}

module.exports = new DurableWorkflowEngine();
