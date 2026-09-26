/**
 * Local Agent Watchdog Supervisor (Section 21 of PDF)
 * Monitors the Local Agent process. If it crashes, immediately restarts it,
 * restores connection, and prevents orphaned RUNNING task states.
 */

const { spawn } = require('child_process');
const path = require('path');
const logger = require('../../../packages/logging');

class AgentWatchdog {
  constructor() {
    this.agentScript = path.resolve(__dirname, '../src/agent.js');
    this.child = null;
    this.restartCount = 0;
    this.isShuttingDown = false;
  }

  start() {
    logger.info('Watchdog', 'Starting Agent Watchdog Supervisor...');
    this.spawnAgent();

    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  spawnAgent() {
    if (this.isShuttingDown) return;

    logger.info('Watchdog', `Launching agent process: ${this.agentScript} (Restart #${this.restartCount})`);
    this.child = spawn(process.execPath, [this.agentScript], {
      stdio: 'inherit',
      env: process.env
    });

    this.child.on('exit', (code, signal) => {
      logger.warn('Watchdog', `Agent process exited with code ${code}, signal: ${signal}`);
      if (!this.isShuttingDown) {
        this.restartCount++;
        logger.info('Watchdog', 'Watchdog detected agent termination. Restarting in 2 seconds...');
        setTimeout(() => this.spawnAgent(), 2000);
      }
    });

    this.child.on('error', (err) => {
      logger.error('Watchdog', `Failed to start agent process: ${err.message}`);
    });
  }

  shutdown() {
    this.isShuttingDown = true;
    logger.info('Watchdog', 'Shutting down Watchdog and Agent...');
    if (this.child) {
      this.child.kill('SIGTERM');
    }
    process.exit(0);
  }
}

if (require.main === module) {
  const watchdog = new AgentWatchdog();
  watchdog.start();
}

module.exports = AgentWatchdog;
