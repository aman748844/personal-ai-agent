const gateway = require('../services/ai-gateway');

async function testAll() {
  const testCases = [
    // 1. User screenshot exact query (English)
    'Jarvis, Youtube open karo aur ek song play karo.',
    // 2. Hindi Devanagari (what Chrome mic returned in user screenshot!)
    'सीरी यूट्यूब ओपन करो',
    'यूट्यूब ओपन करो और एक गाना बजाओ',
    'अरिजीत सिंह का गाना लगाओ',
    // 3. Turn 2 (contextual)
    'ye song lagao',
    // 4. Media control (English & Hindi)
    'Jarvis, pause karo',
    'पॉज करो',
    'fullscreen karo',
    // 5. Google Search
    'Chrome kholo aur Google par OpenAI search karo',
    'गूगल पर सर्च करो भारत',
    // 6. Any other context
    'Delhi ka weather kaisa hai',
    'दिल्ली का मौसम कैसा है'
  ];

  for (const tc of testCases) {
    console.log(`\n>>> INPUT: "${tc}"`);
    const plan = await gateway.generatePlan(tc);
    console.log(`GOAL: ${plan.goal}`);
    console.log(`VOICE: ${plan.voiceFeedback}`);
    console.log(`STEPS: ${plan.steps.map(s => s.tool + (s.query ? `("${s.query}")` : s.url ? `("${s.url}")` : s.action ? `("${s.action}")` : '')).join(' -> ')}`);
  }
}

testAll().catch(console.error);
