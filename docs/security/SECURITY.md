# Security Boundary & Risk Classification

## Security Boundaries
- **No Arbitrary Execution**: Local Agent strictly rejects arbitrary shell code from the internet (`run("anything")`). Only typed, validated, and signed MCP tool objects are accepted.
- **Cryptographic Command Signing**: Every tool execution is signed with HMAC-SHA256 by the Cloud API Gateway and verified by the Local Agent before execution.
- **Credential Vault (Section 7)**: Passwords are NEVER sent to the LLM or Cloud. Stored locally with AES-256 encryption. The LLM only receives a `vault_reference` (e.g., `naukri_primary`).

## Risk Classification (Section 14)
- **LOW RISK (Auto-approved)**:
  - `filesystem.create_directory`, `filesystem.read_file`, `browser.open`, `browser.navigate`, `browser.screenshot`.
- **MEDIUM RISK (Audited / Notified)**:
  - `filesystem.move_file`, `browser.type`, `browser.click`, `os.open_application`.
- **HIGH RISK (Requires Explicit User Approval)**:
  - `filesystem.delete_file`, `os.close_application`, `os.execute_command`, `financial.transaction`.
  - Workflow halts and presents an interactive "Are you sure?" modal in the UI.
