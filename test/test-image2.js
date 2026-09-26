// Test dispatching Image 2 test case: Naukri resume workflow
(async () => {
  try {
    const res = await fetch('http://localhost:4000/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user_123',
        deviceId: 'device_aman_pc',
        instruction: 'Naukri.com open karo, mere account se login karo aur resume update karo.'
      })
    });
    const data = await res.json();
    console.log('Dispatch Image 2 Response:', JSON.stringify(data, null, 2));

    // Poll task status for up to 8 seconds
    for (let i = 0; i < 4; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const taskRes = await fetch(`http://localhost:4000/api/tasks/${data.taskId}`);
      const taskDetails = await taskRes.json();
      console.log(`Poll ${i + 1} Status:`, taskDetails.status);
      const step4 = taskDetails.steps.find(s => s.step === 4);
      if (step4) {
        console.log('Step 4 (browser.type) Status:', step4.status, 'Output:', JSON.stringify(step4.output));
        if (step4.status === 'COMPLETED' || step4.status === 'FAILED') break;
      }
    }
  } catch (err) {
    console.error('Error in test:', err);
  }
})();
