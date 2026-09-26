/**
 * Audit Logging and Tracing Package
 * Records deterministic, immutable execution records conforming to PDF specifications
 */

const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.resolve(__dirname, '../../logs');
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const AUDIT_FILE = path.join(LOGS_DIR, 'audit.log');

class Logger {
  info(component, message, meta = {}) {
    this._log('INFO', component, message, meta);
  }

  warn(component, message, meta = {}) {
    this._log('WARN', component, message, meta);
  }

  error(component, message, meta = {}) {
    this._log('ERROR', component, message, meta);
  }

  audit(event, details = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      type: 'AUDIT',
      event,
      ...details
    };
    const line = JSON.stringify(entry) + '\n';
    try {
      fs.appendFileSync(AUDIT_FILE, line);
    } catch (err) {
      console.error('Failed to append to audit log:', err.message);
    }
    console.log(`[AUDIT] [${entry.timestamp}] ${event}:`, JSON.stringify(details));
    return entry;
  }

  _log(level, component, message, meta) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : '';
    console.log(`[${timestamp}] [${level}] [${component}] ${message}${metaStr}`);
  }
}

module.exports = new Logger();
