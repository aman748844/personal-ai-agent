// Test dispatching task to API Gateway
(async () => {
  try {
    const res = await fetch('http://localhost:4000/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user_123',
        deviceId: 'device_aman_pc',
        instruction: 'Mere desktop par TestFolder naam ka folder banao.'
      })
    });
    const data = await res.json();
    console.log('Dispatch Response:', JSON.stringify(data, null, 2));

    // Wait 2 seconds for execution loop to complete
    await new Promise(r => setTimeout(r, 2000));

    const taskRes = await fetch(`http://localhost:4000/api/tasks/${data.taskId}`);
    const taskDetails = await taskRes.json();
    console.log('\nTask Execution Status:', taskDetails.status);
    console.log('Steps:', JSON.stringify(taskDetails.steps, null, 2));
    console.log('Logs:', JSON.stringify(taskDetails.logs, null, 2));
  } catch (err) {
    console.error('Error during dispatch test:', err);
  }
})();
