/**
 * Multi-Modal Observer (Section 11 AI ko "eyes" bhi chahiye)
 * Combines Screenshot + DOM + Accessibility Tree + OS State into unified perception
 */

const os = require('os');
const browserAgent = require('../browser');
const computerTool = require('../computer');
const applicationTool = require('../applications');

class AgentObserver {
  async observeEnvironment() {
    const osState = {
      platform: process.platform,
      hostname: os.hostname(),
      uptime: os.uptime(),
      freeMem: Math.round(os.freemem() / (1024 * 1024)) + ' MB',
      totalMem: Math.round(os.totalmem() / (1024 * 1024)) + ' MB'
    };

    let browserState = { active: false };
    if (browserAgent.page && !browserAgent.page.isClosed()) {
      try {
        const obs = await browserAgent.observe();
        const screenshot = await browserAgent.screenshot(false);
        browserState = {
          active: true,
          url: obs.url,
          title: obs.title,
          domSnippet: obs.domSnippet,
          screenshot: screenshot.base64
        };
      } catch (err) {
        browserState = { active: true, error: err.message };
      }
    }

    return {
      timestamp: new Date().toISOString(),
      osState,
      browserState
    };
  }
}

module.exports = new AgentObserver();
