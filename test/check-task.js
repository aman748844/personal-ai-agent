(async () => {
  const taskId = process.argv[2] || 'task_1790447984709';
  const res = await fetch(`http://localhost:4000/api/tasks/${taskId}`);
  const data = await res.json();
  console.log('Task Status:', data.status);
  console.log('Steps:');
  for (const s of data.steps) {
    console.log(`Step ${s.step} (${s.tool}) [${s.status}]:`, s.output ? JSON.stringify(s.output) : 'none');
  }
})();
