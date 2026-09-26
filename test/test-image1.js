// Test dispatching Image 1 test case: "naukri.com open karo mere chrome pe"
(async () => {
  try {
    const res = await fetch('http://localhost:4000/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user_123',
        deviceId: 'device_aman_pc',
        instruction: 'naukri.com open karo mere chrome pe'
      })
    });
    const data = await res.json();
    console.log('Dispatch Image 1 Response:', JSON.stringify(data, null, 2));

    await new Promise(r => setTimeout(r, 4000));

    const taskRes = await fetch(`http://localhost:4000/api/tasks/${data.taskId}`);
    const taskDetails = await taskRes.json();
    console.log('\nTask Status:', taskDetails.status);
    console.log('Steps:', JSON.stringify(taskDetails.steps.map(s => ({ step: s.step, tool: s.tool, status: s.status, output: s.output })), null, 2));
  } catch (err) {
    console.error('Error in test:', err);
  }
})();
