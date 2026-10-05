/**
 * Policy Engine Service: Section 14 Risk Classifier & Permission Validator
 * Implements Security Boundary (Section 13) and Dangerous Action Approval (Section 14)
 */

const { RiskLevel } = require('../../packages/shared-types');

class PolicyEngine {
  constructor() {
    this.riskRules = {
      // LOW RISK
      'filesystem.create_directory': RiskLevel.LOW,
      'filesystem.create_file': RiskLevel.LOW,
      'filesystem.read_file': RiskLevel.LOW,
      'filesystem.exists': RiskLevel.LOW,
      'filesystem.search_files': RiskLevel.LOW,
      'filesystem.copy_file': RiskLevel.LOW,
      'browser.open': RiskLevel.LOW,
      'browser.navigate': RiskLevel.LOW,
      'browser.screenshot': RiskLevel.LOW,
      'browser.observe': RiskLevel.LOW,
      'browser.check_human_verification': RiskLevel.LOW,
      'browser.wait': RiskLevel.LOW,
      'os.process_list': RiskLevel.LOW,
      'computer.screenshot': RiskLevel.LOW,

      // MEDIUM RISK
      'filesystem.move_file': RiskLevel.MEDIUM,
      'filesystem.write_file': RiskLevel.MEDIUM,
      'browser.type': RiskLevel.MEDIUM,
      'browser.click': RiskLevel.MEDIUM,
      'browser.select': RiskLevel.MEDIUM,
      'browser.upload': RiskLevel.MEDIUM,
      'browser.upload_file': RiskLevel.MEDIUM,
      'browser.download': RiskLevel.MEDIUM,
      'os.open_application': RiskLevel.MEDIUM,
      'computer.keyboard_type': RiskLevel.MEDIUM,
      'computer.mouse_click': RiskLevel.MEDIUM,

      // HIGH RISK - Requires Explicit User Approval ("Are you sure?")
      'filesystem.delete_file': RiskLevel.HIGH,
      'filesystem.delete_directory': RiskLevel.HIGH,
      'os.close_application': RiskLevel.HIGH,
      'os.execute_command': RiskLevel.HIGH,
      'account.change_password': RiskLevel.HIGH,
      'finance.transaction': RiskLevel.HIGH
    };
  }

  evaluateTool(toolName, params = {}) {
    const risk = this.riskRules[toolName] || RiskLevel.HIGH;

    // Additional dynamic checks
    if (toolName === 'os.execute_command') {
      const cmd = (params.command || '').toLowerCase();
      // Block catastrophic commands
      if (cmd.includes('format') || cmd.includes('rmdir /s') || cmd.includes('del /f /s /q c:\\')) {
        return {
          allowed: false,
          risk: RiskLevel.HIGH,
          reason: 'Command strictly forbidden by policy engine'
        };
      }
    }

    if (risk === RiskLevel.HIGH) {
      return {
        allowed: true,
        risk: RiskLevel.HIGH,
        requiresApproval: true,
        prompt: `Tool '${toolName}' is classified as HIGH RISK. Do you want to proceed?`
      };
    }

    return {
      allowed: true,
      risk,
      requiresApproval: false
    };
  }
}

module.exports = new PolicyEngine();
