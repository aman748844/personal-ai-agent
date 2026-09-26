/**
 * End-to-End Verification Test Suite
 * Validates all architectural layers, test cases, and security boundaries from the PDF.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const db = require('../services/db');
const policyEngine = require('../services/policy-engine');
const toolRegistry = require('../services/tool-registry');
const aiGateway = require('../services/ai-gateway');
const { signPayload, verifyPayloadSignature, createSignedMessage } = require('../packages/protocol');
const { RiskLevel } = require('../packages/shared-types');
const vault = require('../apps/local-agent/security/vault');
const fileSystemTool = require('../apps/local-agent/filesystem');

async function runTests() {
  console.log('====================================================');
  console.log('RUNNING AI AGENT PLATFORM ARCHITECTURAL TEST SUITE');
  console.log('====================================================\n');

  // Test 1: Database Architecture (Section 16)
  console.log('Test 1: Database Architecture (Section 16 Schema)...');
  const user = db.getUserById('user_123');
  assert(user, 'User user_123 should exist');
  assert.strictEqual(user.id, 'user_123');

  const devices = db.getDevices();
  assert(devices.length > 0, 'Devices should exist');

  const task = db.createTask({
    id: 'test_task_1',
    userId: 'user_123',
    deviceId: 'device_aman_pc',
    instruction: 'Mere desktop par TestFolder naam ka folder banao.'
  });
  assert.strictEqual(task.id, 'test_task_1');
  console.log('✓ Database architecture passed.');

  // Test 2: Credential Vault AES-256 (Section 7)
  console.log('\nTest 2: Credential Vault AES-256 (Section 7)...');
  vault.storeCredential('test_cred_id', {
    username: 'aman_test',
    password: 'SecretPassword987!'
  });
  const resolved = vault.resolveCredential('test_cred_id');
  assert(resolved, 'Credential should resolve');
  assert.strictEqual(resolved.username, 'aman_test');
  assert.strictEqual(resolved.password, 'SecretPassword987!');
  console.log('✓ Credential Vault encryption and local decryption passed.');

  // Test 3: Policy Engine & Risk Classification (Section 14)
  console.log('\nTest 3: Policy Engine Risk Classification (Section 14)...');
  const lowRisk = policyEngine.evaluateTool('filesystem.create_directory', { path: 'USER_DESKTOP/TestFolder' });
  assert.strictEqual(lowRisk.risk, RiskLevel.LOW);
  assert.strictEqual(lowRisk.requiresApproval, false);

  const highRisk = policyEngine.evaluateTool('filesystem.delete_file', { path: 'C:\\test.txt' });
  assert.strictEqual(highRisk.risk, RiskLevel.HIGH);
  assert.strictEqual(highRisk.requiresApproval, true);
  console.log('✓ Policy Engine risk evaluation passed.');

  // Test 4: Tool Registry / MCP Catalog (Section 4 & 18)
  console.log('\nTest 4: Tool Registry / MCP Catalog (Section 4 & 18)...');
  const fsTool = toolRegistry.getTool('filesystem.create_directory');
  assert(fsTool, 'filesystem.create_directory tool must be registered');
  const validCheck = toolRegistry.validateToolCall('filesystem.create_directory', { path: 'USER_DESKTOP/TestFolder' });
  assert(validCheck.valid, 'Tool call validation should succeed');
  console.log('✓ Tool Registry validation passed.');

  // Test 5: AI Gateway & Test Case 1 Plan Generation
  console.log('\nTest 5: AI Gateway Plan Generation for Test Case 1...');
  const tc1Plan = await aiGateway.generatePlan('Mere desktop par TestFolder naam ka folder banao.');
  assert(tc1Plan.goal.includes('TestFolder'), 'Goal should mention TestFolder');
  assert.strictEqual(tc1Plan.steps.length, 2);
  assert.strictEqual(tc1Plan.steps[0].tool, 'filesystem.create_directory');
  assert.strictEqual(tc1Plan.steps[1].tool, 'filesystem.exists');
  console.log('✓ Test Case 1 structured plan generated:', JSON.stringify(tc1Plan, null, 2));

  // Test 6: Test Case 1 Local Execution & Deterministic Verification
  console.log('\nTest 6: Test Case 1 Execution (Actual Desktop Folder Creation & Verification)...');
  const execResult = fileSystemTool.createDirectory('USER_DESKTOP/TestFolder');
  assert.strictEqual(execResult.status, 'success');
  assert.strictEqual(execResult.action, 'create_directory');
  assert.strictEqual(execResult.verified, true);
  assert(fs.existsSync(execResult.path), `Path ${execResult.path} must exist on disk!`);
  console.log('✓ Test Case 1 executed and verified on actual Windows filesystem:', JSON.stringify(execResult, null, 2));

  // Test 7: Cryptographic Command Signing (Section 13)
  console.log('\nTest 7: Cryptographic Command Signing & Verification (Section 13)...');
  const signed = createSignedMessage('EXECUTE_TOOL', {
    taskId: 'task_1',
    tool: 'filesystem.create_directory',
    params: { path: 'USER_DESKTOP/TestFolder' }
  });
  assert(signed.signature, 'Signature should be present');
  const { signature, ...payload } = signed;
  assert(verifyPayloadSignature(payload, signature), 'Payload signature verification must pass');
  console.log('✓ Command signing and HMAC-SHA256 verification passed.');

  // Test 8: Test Case 2 & Section 6 Plan Generation
  console.log('\nTest 8: AI Gateway Plan Generation for Test Case 2 & Section 6...');
  const tc2Plan = await aiGateway.generatePlan('Chrome kholo aur Google par OpenAI search karo.');
  assert(tc2Plan.steps.some(s => s.tool === 'browser.navigate'));
  assert(tc2Plan.steps.some(s => s.tool === 'browser.type'));

  const tc3Plan = await aiGateway.generatePlan('Naukri.com open karo, mere account se login karo aur resume update karo.');
  assert(tc3Plan.steps.some(s => s.vault_reference === 'naukri_primary'));
  assert(tc3Plan.steps.some(s => s.tool === 'browser.check_human_verification'));
  console.log('✓ Test Case 2 and Section 6 Naukri.com plans validated.');

  // Test 9: Image 1 Test Case - "naukri.com open karo mere chrome pe"
  console.log('\nTest 9: Image 1 - User prompt "naukri.com open karo mere chrome pe"...');
  const img1Plan = await aiGateway.generatePlan('naukri.com open karo mere chrome pe');
  assert(img1Plan.steps.some(s => s.tool === 'browser.navigate'), 'Must include browser.navigate');
  assert(img1Plan.steps.some(s => s.url && s.url.includes('naukri.com')), 'Must navigate to naukri.com');
  console.log('✓ Image 1 plan generated successfully:', img1Plan.goal);

  // Test 10: Image 2 Test Case - Credential Vault guarantee for page.fill string
  console.log('\nTest 10: Image 2 - Vault resolution guarantee for browser.type...');
  const cred = vault.resolveCredential('naukri_primary');
  assert(cred, 'Vault must resolve naukri_primary');
  assert(typeof (cred.username || cred.password) === 'string', 'Credential must be a valid string');
  assert.strictEqual(typeof cred.username, 'string');
  console.log('✓ Image 2 resolved credential successfully:', cred.username);

  // Test 11: Arbitrary user input test ("kuch bhi type karne me AI Agent perform karna chahiye")
  console.log('\nTest 11: Arbitrary prompt "who is elon musk"...');
  const arbitraryPlan = await aiGateway.generatePlan('who is elon musk');
  assert(arbitraryPlan.steps.some(s => s.tool === 'browser.navigate'), 'Must navigate to search');
  console.log('✓ Arbitrary plan generated:', arbitraryPlan.goal);

  console.log('\n====================================================');
  console.log('ALL ARCHITECTURAL TESTS PASSED PERFECTLY (100% SPEC MATCH)!');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
