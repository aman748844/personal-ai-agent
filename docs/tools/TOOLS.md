# Tool Registry & MCP Specifications

## Supported Tools
| Tool Name | Category | Risk Level | Description |
|---|---|---|---|
| `filesystem.create_directory` | Filesystem | LOW | Creates a directory (e.g., USER_DESKTOP/TestFolder) |
| `filesystem.create_file` | Filesystem | LOW | Creates a file with contents |
| `filesystem.exists` | Filesystem | LOW | Deterministically verifies existence |
| `filesystem.read_file` | Filesystem | LOW | Reads file content |
| `filesystem.delete_file` | Filesystem | HIGH | Deletes a file (requires user approval) |
| `filesystem.move_file` | Filesystem | MEDIUM | Moves or renames files |
| `browser.open` | Browser | LOW | Launches Playwright browser (Chromium/Edge) |
| `browser.navigate` | Browser | LOW | Navigates to target URL |
| `browser.click` | Browser | MEDIUM | Clicks DOM elements matching selector |
| `browser.type` | Browser | MEDIUM | Types text or resolves local AES vault reference |
| `browser.screenshot` | Browser | LOW | Captures live viewport screenshot (base64) |
| `browser.observe` | Browser | LOW | Extracts DOM tree, title, and inputs |
| `os.open_application` | OS | MEDIUM | Launches desktop apps (notepad, chrome, edge, vscode) |
| `os.process_list` | OS | LOW | Queries running processes |
| `os.close_application` | OS | HIGH | Terminates process (requires user approval) |
| `computer.screenshot` | Computer | LOW | Native desktop full-screen capture |
| `computer.keyboard_type` | Computer | MEDIUM | Simulates keystrokes |
| `computer.mouse_click` | Computer | MEDIUM | Simulates mouse clicks |
