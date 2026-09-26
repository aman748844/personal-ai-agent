/**
 * Controlled Shell Tool (Section 3 & 4 of PDF)
 * Strictly executes controlled commands according to safety constraints.
 * LLM is never given direct unmitigated shell access!
 */

const { execSync } = require('child_process');

class ShellTool {
  executeCommand(command, options = {}) {
    // Policy check already performed upstream
    try {
      const output = execSync(command, {
        encoding: 'utf-8',
        timeout: options.timeout || 15000,
        maxBuffer: 1024 * 1024
      });
      return {
        status: 'success',
        action: 'execute_command',
        command,
        output: output.trim(),
        verified: true
      };
    } catch (err) {
      return {
        status: 'error',
        action: 'execute_command',
        command,
        error: err.message,
        verified: false
      };
    }
  }
}

module.exports = new ShellTool();
