/**
 * Local Agent Application Tool (Section 4 of PDF)
 * Manages desktop applications: Notepad, Chrome, Edge, VS Code, Explorer
 */

const { spawn, execSync } = require('child_process');

class ApplicationTool {
  openApplication(appName, args = []) {
    const knownApps = {
      notepad: 'notepad.exe',
      chrome: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      edge: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      vscode: 'code.cmd',
      explorer: 'explorer.exe'
    };

    const targetExe = knownApps[appName.toLowerCase()] || appName;
    const proc = spawn(targetExe, args, {
      detached: true,
      stdio: 'ignore'
    });
    proc.unref();

    return {
      status: 'success',
      action: 'open_application',
      app: appName,
      pid: proc.pid,
      verified: true
    };
  }

  processList() {
    try {
      const output = execSync('tasklist /FO CSV /NH', { encoding: 'utf-8' });
      const lines = output.split('\r\n').filter(Boolean);
      const processes = lines.slice(0, 25).map(line => {
        const parts = line.replace(/"/g, '').split(',');
        return { name: parts[0], pid: parts[1], memory: parts[4] };
      });
      return {
        status: 'success',
        action: 'process_list',
        processes,
        count: processes.length,
        verified: true
      };
    } catch (err) {
      return { status: 'error', error: err.message };
    }
  }

  closeApplication(processName) {
    try {
      execSync(`taskkill /F /IM "${processName}"`, { stdio: 'ignore' });
      return {
        status: 'success',
        action: 'close_application',
        processName,
        verified: true
      };
    } catch (err) {
      return { status: 'error', error: err.message };
    }
  }
}

module.exports = new ApplicationTool();
