/**
 * Local Windows Agent Core Runtime (Section 2, 3, 4, 8 of PDF)
 * Executes local actions on the user's PC with deterministic verification and security checks.
 */

require('dotenv').config();

const ConnectionManager = require('../connection');
const fileSystemTool = require('../filesystem');
const browserAgent = require('../browser');
const applicationTool = require('../applications');
const shellTool = require('../shell');
const computerTool = require('../computer');
const observer = require('../observer');
const verifier = require('../verifier');
const { verifyCommand } = require('../security');
const logger = require('../../../packages/logging');
const { MessageTypes } = require('../../../packages/shared-types');

function parseCliArgs() {
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--gateway' || args[i] === '-g') && args[i + 1]) {
      options.gatewayUrl = args[++i];
    } else if ((args[i] === '--device' || args[i] === '-d') && args[i + 1]) {
      options.deviceId = args[++i];
    } else if (args[i] === '--token' && args[i + 1]) {
      options.deviceToken = args[++i];
    }
  }
  return options;
}

class LocalAgent {
  constructor(options = {}) {
    const cli = parseCliArgs();
    this.deviceId = options.deviceId || cli.deviceId || process.env.DEVICE_ID || 'device_aman_pc';
    this.deviceToken = options.deviceToken || cli.deviceToken || process.env.DEVICE_TOKEN || 'device_token_aman_pc';
    this.gatewayUrl = options.gatewayUrl || cli.gatewayUrl || process.env.GATEWAY_WS_URL || 'ws://localhost:4000/agent';

    this.connection = new ConnectionManager({
      gatewayUrl: this.gatewayUrl,
      deviceId: this.deviceId,
      deviceToken: this.deviceToken,
      onCommand: (msg) => this.handleCommand(msg)
    });
  }

  start() {
    logger.info('LocalAgent', `Starting Local Agent Runtime for device: ${this.deviceId}`);
    this.connection.connect();

    // Start background screen observation broadcast every 5s if active
    setInterval(async () => {
      if (this.connection.isConnected) {
        try {
          if (browserAgent.page && !browserAgent.page.isClosed()) {
            const screenshot = await browserAgent.screenshot(false);
            const obs = await browserAgent.observe();
            this.connection.send({
              type: MessageTypes.LIVE_OBSERVATION,
              screenshot: screenshot.base64,
              action: `Browser: ${obs.title || obs.url}`,
              url: obs.url
            });
          }
        } catch {}
      }
    }, 5000);
  }

  async handleCommand(message) {
    if (message.type !== MessageTypes.EXECUTE_TOOL) {
      return;
    }

    const { executionId, taskId, stepIndex, tool, params } = message;
    logger.info('LocalAgent', `[Step ${stepIndex}] Received tool command: ${tool}`, params);

    // 1. Signature check
    if (!verifyCommand(message)) {
      logger.error('LocalAgent', `Invalid HMAC command signature for tool: ${tool}`);
      this.sendToolResult(executionId, taskId, false, null, 'Signature verification failed');
      return;
    }

    logger.audit('TOOL_EXECUTION_START', { taskId, stepIndex, tool, params });

    try {
      let result = null;

      // 2. Dispatch to specific tool module
      switch (tool) {
        // Filesystem
        case 'filesystem.create_directory':
          result = fileSystemTool.createDirectory(params.path);
          break;
        case 'filesystem.create_file':
          result = fileSystemTool.createFile(params.path, params.content);
          break;
        case 'filesystem.exists':
          result = fileSystemTool.exists(params.path);
          break;
        case 'filesystem.read_file':
          result = fileSystemTool.readFile(params.path);
          break;
        case 'filesystem.delete_file':
          result = fileSystemTool.deleteFile(params.path);
          break;
        case 'filesystem.move_file':
          result = fileSystemTool.moveFile(params.source, params.destination);
          break;
        case 'filesystem.copy_file':
          result = fileSystemTool.copyFile(params.source, params.destination);
          break;
        case 'filesystem.search_files':
          result = fileSystemTool.searchFiles(params.directory, params.pattern);
          break;

        // Browser
        case 'browser.open':
          result = await browserAgent.open(params);
          break;
        case 'browser.navigate':
          result = await browserAgent.navigate(params.url);
          break;
        case 'browser.type':
          result = await browserAgent.type(params.selector, params.text, params.vault_reference, params.vault_field);
          break;
        case 'browser.click':
          result = await browserAgent.click(params.selector);
          break;
        case 'browser.upload_file':
          result = await browserAgent.uploadFile(params.selector, params.path || params.filePath);
          break;
        case 'browser.wait':
          result = await browserAgent.wait(params.seconds);
          break;
        case 'browser.screenshot':
          result = await browserAgent.screenshot(params.fullPage);
          break;
        case 'browser.observe':
          result = await browserAgent.observe();
          break;
        case 'browser.check_human_verification':
          result = await browserAgent.checkHumanVerification();
          break;

        // Applications & OS
        case 'os.open_application':
          result = applicationTool.openApplication(params.app, params.args);
          break;
        case 'os.process_list':
          result = applicationTool.processList();
          break;
        case 'os.close_application':
          result = applicationTool.closeApplication(params.processName);
          break;
        case 'os.execute_command':
          result = shellTool.executeCommand(params.command);
          break;

        // Computer
        case 'computer.screenshot':
          result = computerTool.screenshot();
          break;
        case 'computer.mouse_click':
          result = computerTool.mouseClick(params.x, params.y);
          break;
        case 'computer.keyboard_type':
          result = computerTool.keyboardType(params.text);
          break;

        default:
          throw new Error(`Unsupported tool: ${tool}`);
      }

      logger.audit('TOOL_EXECUTION_SUCCESS', { taskId, stepIndex, tool, result });

      // Check if human verification was required
      const humanVerificationRequired = result && result.humanVerificationRequired;

      this.sendToolResult(executionId, taskId, true, result, null, humanVerificationRequired);

      // Send live observation to cloud
      if (browserAgent.page && !browserAgent.page.isClosed()) {
        try {
          const snap = await browserAgent.screenshot(false);
          const obs = await browserAgent.observe();
          this.connection.send({
            type: MessageTypes.LIVE_OBSERVATION,
            screenshot: snap.base64,
            action: `Action: ${tool}`,
            url: obs.url
          });
        } catch {}
      }

    } catch (err) {
      logger.error('LocalAgent', `Execution error for ${tool}: ${err.message}`);
      logger.audit('TOOL_EXECUTION_FAILED', { taskId, stepIndex, tool, error: err.message });
      this.sendToolResult(executionId, taskId, false, null, err.message);
    }
  }

  sendToolResult(executionId, taskId, success, data, error = null, humanVerificationRequired = false) {
    this.connection.send({
      type: MessageTypes.TOOL_RESULT,
      executionId,
      taskId,
      success,
      data,
      error,
      humanVerificationRequired
    });
  }
}

if (require.main === module) {
  const agent = new LocalAgent();
  agent.start();
}

module.exports = LocalAgent;
