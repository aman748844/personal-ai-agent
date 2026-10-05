/**
 * AI Gateway: Section 11 & 15 Multi-Model Abstraction Layer
 * Supports OpenAI, Claude, Gemini API, and Intelligent Multilingual Local NLP Planner.
 * Handles ANY user input (voice or text: Naukri resume update, YouTube music, desktop apps, files, web queries).
 */

const https = require('https');
const http = require('http');

class AIGateway {
  constructor() {
    this.currentProvider = process.env.AI_PROVIDER || 'gemini';
  }

  setProvider(provider) {
    this.currentProvider = provider;
  }

  async generatePlan(instruction, context = {}) {
    const raw = (instruction || '').trim();
    const lower = raw.toLowerCase();

    // 0. Try LLM API if key is provided in environment
    try {
      const llmPlan = await this.tryLLMGeneration(raw);
      if (llmPlan && llmPlan.steps && llmPlan.steps.length > 0) {
        return llmPlan;
      }
    } catch (err) {
      console.warn('LLM API generation skipped or failed, falling back to Intelligent Rule Planner:', err.message);
    }

    // 1. Naukri.com Workflow: Login & Resume / Profile Update
    // Handles instructions like:
    // - "Naukri.com open karo, mere account se login karo aur resume update karo."
    // - "naukri pe jake login karo aur profile update karo"
    // - "naukri.com resume update karo"
    if (
      lower.includes('naukri') || 
      ((lower.includes('resume') || lower.includes('cv')) && (lower.includes('update') || lower.includes('upload') || lower.includes('login')))
    ) {
      return {
        goal: 'Open Naukri.com, login securely via credential vault, handle human verification if required, and upload latest resume to profile',
        steps: [
          {
            tool: 'browser.open',
            headless: false
          },
          {
            tool: 'browser.navigate',
            url: 'https://www.naukri.com/nlogin/login'
          },
          {
            tool: 'browser.wait',
            seconds: 2
          },
          {
            tool: 'browser.observe'
          },
          {
            // Fills credential username safely via local vault without exposing secrets (PDF Section 7)
            tool: 'browser.type',
            selector: 'input[placeholder*="Username" i], input[placeholder*="Email" i], #usernameField, input[name="email"], input[type="text"]',
            vault_reference: 'naukri_primary',
            vault_field: 'username'
          },
          {
            // Fills credential password safely via local vault
            tool: 'browser.type',
            selector: 'input[placeholder*="password" i], input[type="password"], #passwordField',
            vault_reference: 'naukri_primary',
            vault_field: 'password'
          },
          {
            // Clicks Login button
            tool: 'browser.click',
            selector: 'button[type="submit"], button.btn-primary, button:has-text("Login"), .loginButton, button.blueBtn'
          },
          {
            // Human verification check point (CAPTCHA / OTP if prompted)
            tool: 'browser.check_human_verification',
            prompt: 'Please check for CAPTCHA/OTP or 2FA on Naukri.com'
          },
          {
            tool: 'browser.wait',
            seconds: 3
          },
          {
            // Navigate directly to profile page
            tool: 'browser.navigate',
            url: 'https://www.naukri.com/mnjuser/profile'
          },
          {
            tool: 'browser.wait',
            seconds: 2
          },
          {
            // Upload latest resume file
            tool: 'browser.upload_file',
            selector: 'input[type="file"], input[name="attachCV"], .attachCV, input[id*="attachCV"]',
            path: 'data/Aman_Resume.pdf'
          },
          {
            tool: 'browser.screenshot',
            fullPage: false
          }
        ]
      };
    }

    // 2. YouTube Music / Songs / Video Playback
    // Handles: "YouTube par gaana chalao", "play lo-fi on youtube", "Arijit singh ke gaane chalao", "youtube open karo"
    const isYouTube = lower.includes('youtube') || lower.includes('gaana') || lower.includes('song') || lower.includes('music') || lower.includes('chalao') || lower.includes('video play');
    if (isYouTube && !lower.includes('desktop')) {
      let songQuery = raw
        .replace(/(?:youtube|par|pe|me|kholo|aur|open|karo|chalao|suno|bajaao|play|song|gaana|gaane|video)/gi, '')
        .trim();
      songQuery = songQuery || 'lo-fi chill beats';

      return {
        goal: `Open YouTube and play "${songQuery}"`,
        steps: [
          {
            tool: 'browser.open',
            headless: false
          },
          {
            tool: 'browser.navigate',
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(songQuery)}`
          },
          {
            tool: 'browser.wait',
            seconds: 2
          },
          {
            tool: 'browser.click',
            selector: '#video-title, ytd-video-renderer a#video-title, #contents ytd-video-renderer a'
          },
          {
            tool: 'browser.observe'
          },
          {
            tool: 'browser.screenshot',
            fullPage: false
          }
        ]
      };
    }

    // 3. Desktop Folder Creation
    // Handles: "Mere desktop par TestFolder naam ka folder banao.", "create folder MyDocs on desktop", "Desktop par folder create karo"
    if (lower.includes('desktop') && (lower.includes('folder banao') || lower.includes('create folder') || lower.includes('create directory') || lower.includes('folder create') || lower.includes('folder'))) {
      const match = raw.match(/([a-zA-Z0-9_-]+)\s+naam ka/i) || 
                    raw.match(/(?:named|folder)\s+([a-zA-Z0-9_-]+)/i) ||
                    raw.match(/folder\s+([a-zA-Z0-9_-]+)/i);
      const folderName = match ? match[1] : 'TestFolder';
      return {
        goal: `Create a folder named ${folderName} on Desktop and verify existence`,
        steps: [
          {
            tool: 'filesystem.create_directory',
            path: `USER_DESKTOP/${folderName}`
          },
          {
            tool: 'filesystem.exists',
            path: `USER_DESKTOP/${folderName}`
          }
        ]
      };
    }

    // 4. Desktop File Creation
    // Handles: "Desktop par notes.txt banao", "create file info.txt on desktop with hello world"
    if (lower.includes('file banao') || lower.includes('create file') || (lower.includes('desktop') && lower.includes('.txt'))) {
      const nameMatch = raw.match(/([a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)/i);
      const fileName = nameMatch ? nameMatch[1] : 'Notes.txt';
      const content = `Created by Autonomous AI Agent on ${new Date().toLocaleString()}\nInstruction: ${raw}`;
      return {
        goal: `Create file "${fileName}" on Desktop`,
        steps: [
          {
            tool: 'filesystem.create_file',
            path: `USER_DESKTOP/${fileName}`,
            content
          },
          {
            tool: 'filesystem.exists',
            path: `USER_DESKTOP/${fileName}`
          }
        ]
      };
    }

    // 5. Desktop Application Launch
    // Handles: "Notepad kholo", "Calculator open karo", "VS Code open karo", "Chrome launch karo", "Paint open karo"
    const knownApps = [
      { name: 'notepad', exec: 'notepad' },
      { name: 'calculator', exec: 'calc.exe' },
      { name: 'calc', exec: 'calc.exe' },
      { name: 'vscode', exec: 'code' },
      { name: 'code', exec: 'code' },
      { name: 'explorer', exec: 'explorer' },
      { name: 'paint', exec: 'mspaint' },
      { name: 'cmd', exec: 'cmd.exe' },
      { name: 'terminal', exec: 'wt.exe' },
      { name: 'word', exec: 'winword' },
      { name: 'excel', exec: 'excel' }
    ];

    for (const app of knownApps) {
      if (lower.includes(app.name) && (lower.includes('kholo') || lower.includes('open') || lower.includes('launch') || lower.includes('chalao') || lower.length < 20)) {
        return {
          goal: `Open ${app.name} desktop application on Windows PC`,
          steps: [
            {
              tool: 'os.open_application',
              app: app.name
            },
            {
              tool: 'os.process_list'
            }
          ]
        };
      }
    }

    // 6. E-Commerce / Shopping (Amazon, Flipkart)
    // Handles: "Amazon par iPhone 16 search karo", "Flipkart par laptop dhoondo"
    if (lower.includes('amazon') || lower.includes('flipkart')) {
      const isAmazon = lower.includes('amazon');
      let query = raw.replace(/(?:amazon|flipkart|par|pe|me|kholo|open|search|khojo|dhoondo|karo)/gi, '').trim() || 'iPhone';
      const url = isAmazon 
        ? `https://www.amazon.in/s?k=${encodeURIComponent(query)}`
        : `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;

      return {
        goal: `Open ${isAmazon ? 'Amazon' : 'Flipkart'} and search for "${query}"`,
        steps: [
          { tool: 'browser.open', headless: false },
          { tool: 'browser.navigate', url },
          { tool: 'browser.wait', seconds: 2 },
          { tool: 'browser.observe' },
          { tool: 'browser.screenshot', fullPage: false }
        ]
      };
    }

    // 7. System Check / Process List
    // Handles: "process list check karo", "kaunse apps chal rahe hain", "system status dekho"
    if (lower.includes('process') || lower.includes('running apps') || lower.includes('task manager') || lower.includes('system status')) {
      return {
        goal: 'Retrieve active running processes and system status on Aman-PC',
        steps: [
          { tool: 'os.process_list' }
        ]
      };
    }

    // 8. Desktop Screen Capture / Screenshot
    // Handles: "Desktop ka screenshot lo", "screen capture karo"
    if (lower.includes('screenshot lo') || lower.includes('screen capture') || (lower.includes('desktop') && lower.includes('screenshot'))) {
      return {
        goal: 'Capture full screen desktop screenshot',
        steps: [
          { tool: 'computer.screenshot' }
        ]
      };
    }

    // 9. Specific Domain / Website Navigation
    // e.g. "github.com open karo", "linkedin.com kholo", "twitter.com visit karo", "reddit.com chalao"
    const domainMatch = raw.match(/([a-zA-Z0-9-]+\.(?:com|in|org|net|io|co|ai|dev|app|edu|gov))/i);
    if (domainMatch) {
      const domain = domainMatch[1].toLowerCase();
      const targetUrl = domain.startsWith('http') ? domain : `https://www.${domain}`;
      return {
        goal: `Navigate to ${domain} in Chrome browser and observe page`,
        steps: [
          { tool: 'browser.open', headless: false },
          { tool: 'browser.navigate', url: targetUrl },
          { tool: 'browser.wait', seconds: 2 },
          { tool: 'browser.observe' },
          { tool: 'browser.screenshot', fullPage: false }
        ]
      };
    }

    // 10. General Search Query (Google / Wikipedia / Web Research)
    // Handles: "Chrome kholo aur Google par OpenAI search karo.", "search X on google", "X ke baare me batao", "khojo X"
    let cleanQuery = raw
      .replace(/(?:chrome|browser|google|par|pe|me|kholo|aur|open|karo|search|khojo|dhoondo|ke baare me batao|find)/gi, '')
      .trim();
    cleanQuery = cleanQuery || raw;

    return {
      goal: `Search Google for "${cleanQuery}" and capture visual results`,
      steps: [
        {
          tool: 'browser.open',
          headless: false
        },
        {
          tool: 'browser.navigate',
          url: `https://www.google.com/search?q=${encodeURIComponent(cleanQuery)}`
        },
        {
          tool: 'browser.wait',
          seconds: 2
        },
        {
          tool: 'browser.observe'
        },
        {
          tool: 'browser.screenshot',
          fullPage: false
        }
      ]
    };
  }

  /**
   * Optional LLM Integration:
   * Uses Gemini or OpenAI API if API key is configured in process.env
   */
  async tryLLMGeneration(instruction) {
    const geminiKey = process.env.GEMINI_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;

    if (!geminiKey && !openAiKey) {
      return null;
    }

    const systemPrompt = `You are an Autonomous AI Agent Planner for a Windows 11 PC.
Given a user instruction in English, Hindi, or Hinglish, formulate a JSON execution plan using only these available tools:
- browser.open { headless: boolean }
- browser.navigate { url: string }
- browser.type { selector: string, text?: string, vault_reference?: string, vault_field?: 'username' | 'password' }
- browser.click { selector: string }
- browser.upload_file { selector: string, path: string }
- browser.wait { seconds: number }
- browser.screenshot { fullPage: boolean }
- browser.observe {}
- browser.check_human_verification { prompt: string }
- filesystem.create_directory { path: string }
- filesystem.create_file { path: string, content: string }
- filesystem.exists { path: string }
- os.open_application { app: string }
- os.process_list {}
- computer.screenshot {}

Return ONLY a JSON object in this format:
{
  "goal": "string description",
  "steps": [
    { "tool": "tool_name", ...params }
  ]
}`;

    if (geminiKey) {
      return await this.callGeminiAPI(geminiKey, systemPrompt, instruction);
    } else if (openAiKey) {
      return await this.callOpenAIAPI(openAiKey, systemPrompt, instruction);
    }

    return null;
  }

  callGeminiAPI(apiKey, systemPrompt, instruction) {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemPrompt}\n\nUser Instruction: "${instruction}"\n\nGenerate JSON:` }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const plan = JSON.parse(text);
              if (plan.steps && plan.steps.length > 0) {
                return resolve(plan);
              }
            }
            resolve(null);
          } catch (e) {
            resolve(null);
          }
        });
      });

      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
      req.write(payload);
      req.end();
    });
  }

  callOpenAIAPI(apiKey, systemPrompt, instruction) {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: instruction }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      });

      const options = {
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const content = parsed?.choices?.[0]?.message?.content;
            if (content) {
              const plan = JSON.parse(content);
              if (plan.steps && plan.steps.length > 0) {
                return resolve(plan);
              }
            }
            resolve(null);
          } catch (e) {
            resolve(null);
          }
        });
      });

      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
      req.write(payload);
      req.end();
    });
  }
}

module.exports = new AIGateway();
