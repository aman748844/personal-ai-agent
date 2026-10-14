/**
 * Tool Registry Service (MCP Architecture)
 * Defines standardized tool catalog matching Section 4, 18 of the PDF
 */

const { RiskLevel } = require('../../packages/shared-types');

const TOOL_DEFINITIONS = [
  // Filesystem Tools
  {
    name: 'filesystem.create_directory',
    category: 'filesystem',
    description: 'Creates a directory at the specified path (e.g., USER_DESKTOP/TestFolder)',
    risk: RiskLevel.LOW,
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Target directory path' }
      },
      required: ['path']
    }
  },
  {
    name: 'filesystem.create_file',
    category: 'filesystem',
    description: 'Creates a file with given text content',
    risk: RiskLevel.LOW,
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Target file path' },
        content: { type: 'string', description: 'File content' }
      },
      required: ['path']
    }
  },
  {
    name: 'filesystem.exists',
    category: 'filesystem',
    description: 'Checks whether a file or directory exists at the path',
    risk: RiskLevel.LOW,
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to check' }
      },
      required: ['path']
    }
  },
  {
    name: 'filesystem.read_file',
    category: 'filesystem',
    description: 'Reads content of a file',
    risk: RiskLevel.LOW,
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string' }
      },
      required: ['path']
    }
  },
  {
    name: 'filesystem.delete_file',
    category: 'filesystem',
    description: 'Deletes a file (High Risk)',
    risk: RiskLevel.HIGH,
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string' }
      },
      required: ['path']
    }
  },
  {
    name: 'filesystem.move_file',
    category: 'filesystem',
    description: 'Moves or renames a file or directory',
    risk: RiskLevel.MEDIUM,
    parameters: {
      type: 'object',
      properties: {
        source: { type: 'string' },
        destination: { type: 'string' }
      },
      required: ['source', 'destination']
    }
  },
  {
    name: 'filesystem.copy_file',
    category: 'filesystem',
    description: 'Copies a file to a new location',
    risk: RiskLevel.LOW,
    parameters: {
      type: 'object',
      properties: {
        source: { type: 'string' },
        destination: { type: 'string' }
      },
      required: ['source', 'destination']
    }
  },
  {
    name: 'filesystem.search_files',
    category: 'filesystem',
    description: 'Searches for files matching a pattern',
    risk: RiskLevel.LOW,
    parameters: {
      type: 'object',
      properties: {
        directory: { type: 'string' },
        pattern: { type: 'string' }
      },
      required: ['directory']
    }
  },

  // Browser Tools (Playwright)
  {
    name: 'browser.open',
    category: 'browser',
    description: 'Opens a browser window (Chromium/Edge)',
    risk: RiskLevel.LOW,
    parameters: {
      type: 'object',
      properties: {
        headless: { type: 'boolean' }
      }
    }
  },
  {
    name: 'browser.navigate',
    category: 'browser',
    description: 'Navigates the browser to a URL',
    risk: RiskLevel.LOW,
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string' }
      },
      required: ['url']
    }
  },
  {
    name: 'browser.click',
    category: 'browser',
    description: 'Clicks an element matching the selector',
    risk: RiskLevel.MEDIUM,
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string' }
      },
      required: ['selector']
    }
  },
  {
    name: 'browser.type',
    category: 'browser',
    description: 'Types text into an input field or fills credentials via vault_reference',
    risk: RiskLevel.MEDIUM,
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string' },
        text: { type: 'string' },
        vault_reference: { type: 'string', description: 'Credential vault reference (e.g. naukri_primary) - password not in prompt!' }
      },
      required: ['selector']
    }
  },
  {
    name: 'browser.screenshot',
    category: 'browser',
    description: 'Captures a screenshot of the active browser page',
    risk: RiskLevel.LOW,
    parameters: {
      type: 'object',
      properties: {
        fullPage: { type: 'boolean' }
      }
    }
  },
  {
    name: 'browser.observe',
    category: 'browser',
    description: 'Extracts DOM, Accessibility Tree, and current URL state',
    risk: RiskLevel.LOW,
    parameters: { type: 'object' }
  },
  {
    name: 'browser.upload_file',
    category: 'browser',
    description: 'Uploads a local file to a web input (e.g. resume upload)',
    risk: RiskLevel.MEDIUM,
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string' },
        path: { type: 'string' }
      }
    }
  },
  {
    name: 'browser.wait',
    category: 'browser',
    description: 'Waits for specified seconds for page/dom stabilization',
    risk: RiskLevel.LOW,
    parameters: {
      type: 'object',
      properties: {
        seconds: { type: 'number' }
      }
    }
  },
  {
    name: 'browser.search_and_play',
    category: 'browser',
    description: 'Searches YouTube and starts media playback immediately in Google Chrome',
    risk: RiskLevel.LOW,
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' }
      }
    }
  },
  {
    name: 'browser.media_control',
    category: 'browser',
    description: 'Controls active media in browser (play, pause, fullscreen, mute, next, volume)',
    risk: RiskLevel.LOW,
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string' }
      }
    }
  },
  {
    name: 'browser.press_key',
    category: 'browser',
    description: 'Simulates a keyboard key press on the active browser page',
    risk: RiskLevel.LOW,
    parameters: {
      type: 'object',
      properties: {
        key: { type: 'string' }
      }
    }
  },
  {
    name: 'browser.scroll',
    category: 'browser',
    description: 'Scrolls the active browser page up or down',
    risk: RiskLevel.LOW,
    parameters: {
      type: 'object',
      properties: {
        direction: { type: 'string' },
        amount: { type: 'number' }
      }
    }
  },

  // OS & Application Tools
  {
    name: 'os.open_application',
    category: 'os',
    description: 'Launches a desktop application (notepad, chrome, edge, vscode, etc.)',
    risk: RiskLevel.MEDIUM,
    parameters: {
      type: 'object',
      properties: {
        app: { type: 'string', enum: ['notepad', 'chrome', 'edge', 'vscode', 'explorer'] },
        args: { type: 'array', items: { type: 'string' } }
      },
      required: ['app']
    }
  },
  {
    name: 'os.process_list',
    category: 'os',
    description: 'Retrieves active running processes',
    risk: RiskLevel.LOW,
    parameters: { type: 'object' }
  },
  {
    name: 'os.close_application',
    category: 'os',
    description: 'Closes an application by process name',
    risk: RiskLevel.HIGH,
    parameters: {
      type: 'object',
      properties: {
        processName: { type: 'string' }
      },
      required: ['processName']
    }
  },
  {
    name: 'os.execute_command',
    category: 'os',
    description: 'Executes a controlled command within policy constraints',
    risk: RiskLevel.HIGH,
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string' }
      },
      required: ['command']
    }
  },

  // Computer Tools
  {
    name: 'computer.screenshot',
    category: 'computer',
    description: 'Captures full screen desktop screenshot',
    risk: RiskLevel.LOW,
    parameters: { type: 'object' }
  },
  {
    name: 'computer.mouse_click',
    category: 'computer',
    description: 'Simulates mouse click at coordinates or element',
    risk: RiskLevel.MEDIUM,
    parameters: {
      type: 'object',
      properties: {
        x: { type: 'number' },
        y: { type: 'number' }
      }
    }
  },
  {
    name: 'computer.keyboard_type',
    category: 'computer',
    description: 'Simulates keyboard keystrokes',
    risk: RiskLevel.MEDIUM,
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string' }
      },
      required: ['text']
    }
  }
];

class ToolRegistry {
  constructor() {
    this.tools = new Map();
    TOOL_DEFINITIONS.forEach(tool => this.tools.set(tool.name, tool));
  }

  getTool(name) {
    return this.tools.get(name);
  }

  listTools() {
    return Array.from(this.tools.values());
  }

  getToolsByCategory(category) {
    return Array.from(this.tools.values()).filter(t => t.category === category);
  }

  validateToolCall(name, params) {
    const tool = this.getTool(name);
    if (!tool) {
      return { valid: false, error: `Tool '${name}' is not registered in Tool Registry` };
    }
    if (tool.parameters && tool.parameters.required) {
      for (const req of tool.parameters.required) {
        if (params[req] === undefined || params[req] === null) {
          // Special exception for browser.type if vault_reference is provided instead of text
          if (name === 'browser.type' && req === 'text' && params.vault_reference) {
            continue;
          }
          return { valid: false, error: `Missing required parameter '${req}' for tool '${name}'` };
        }
      }
    }
    return { valid: true, tool };
  }
}

module.exports = new ToolRegistry();
