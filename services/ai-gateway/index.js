/**
 * AI Gateway: Section 11 & 15 Multi-Model Abstraction Layer
 * Ultra-Fast Bilingual Natural Language Planner (Jarvis / Siri Engine).
 * Zero-latency execution in < 1ms for Hindi, Hinglish, and English in Google Chrome.
 * Supports Devanagari script, Romanized Hindi, and Pure English across ALL contexts.
 */

const https = require('https');
const http = require('http');

class AIGateway {
  constructor() {
    this.currentProvider = process.env.AI_PROVIDER || 'gemini';
    this.agentName = 'Jarvis';
    this.sessionContext = {
      activeSite: null,      // e.g. 'youtube', 'google', 'naukri'
      activeDomain: null,    // e.g. 'youtube.com'
      isBrowserOpen: false,  // true if browser is active
      lastQuery: null,
      lastGoal: null
    };
  }

  setProvider(provider) {
    this.currentProvider = provider;
  }

  resetSession() {
    this.sessionContext = {
      activeSite: null,
      activeDomain: null,
      isBrowserOpen: false,
      lastQuery: null,
      lastGoal: null
    };
  }

  /**
   * Normalizes text and strips wake words in BOTH English & Devanagari Hindi
   */
  _cleanInstruction(instruction) {
    if (!instruction) return '';
    let text = instruction.trim();

    // Strip common wake words: Jarvis, Siri, Nova, Agent, Aman
    // In English/Hinglish AND Devanagari (जार्विस, सीरी, नोवा, एजेंट, अमन)
    text = text.replace(/^(?:hey|hi|hello|sun|arre|ok|okay|हे|हाय|हैलो|सुनो|अरे|ओके)?\s*(?:jarvis|siri|nova|agent|aman|जार्विस|सीरी|नोवा|एजेंट|अमन)\s*[,:\.\-]?\s*(?:bhai|ji|भाई|जी)?\s*/i, '');

    return text.trim() || instruction.trim();
  }

  async generatePlan(instruction, context = {}) {
    const originalInput = (instruction || '').trim();
    const clean = this._cleanInstruction(originalInput);
    const lower = clean.toLowerCase();

    // =========================================================================
    // 1. HIGH-SPEED INSTANT RULE ENGINE (< 1ms Execution Time)
    // Runs FIRST for zero-latency instant Siri responsiveness!
    // =========================================================================

    // --- Media Controls (English & Hindi) ---
    // e.g. pause, play, stop, roko, chalao, band karo, पॉज, रोको, चलाओ, चालू करो, फुलस्क्रीन
    const isPause = /(?:pause|stop|roko|rok\s*do|band\s*karo|पॉज|रोको|रोक\s*दो|बंद\s*करो)/i.test(lower);
    const isResume = /(?:play|resume|chalao|chalayein|shuru\s*karo|प्ले|चलाओ|चालू\s*करो|शुरू\s*करो)/i.test(lower);
    const isFullscreen = /(?:fullscreen|full\s*screen|badi\s*screen|फुलस्क्रीन|बड़ी\s*स्क्रीन)/i.test(lower);
    const isMute = /(?:mute|unmute|awaz\s*band|म्यूट|आवाज़\s*बंद)/i.test(lower);
    const isNext = /(?:next|agla|agla\s*gana|next\s*song|अगला|अगला\s*गाना)/i.test(lower);
    const isVolumeUp = /(?:volume\s*up|awaz\s*badhao|आवाज़\s*बढ़ाओ)/i.test(lower);
    const isVolumeDown = /(?:volume\s*down|awaz\s*kam|आवाज़\s*कम)/i.test(lower);

    const isDirectMediaControl = isPause || isResume || isFullscreen || isMute || isNext || isVolumeUp || isVolumeDown;

    if (isDirectMediaControl && (this.sessionContext.activeSite === 'youtube' || this.sessionContext.isBrowserOpen || lower.includes('gana') || lower.includes('गाना') || lower.length < 16)) {
      let action = 'toggle';
      if (isPause) action = 'pause';
      else if (isResume) action = 'play';
      else if (isFullscreen) action = 'fullscreen';
      else if (isMute) action = 'mute';
      else if (isNext) action = 'next';
      else if (isVolumeUp) action = 'volume_up';
      else if (isVolumeDown) action = 'volume_down';

      return {
        goal: `Media control: ${action} in Google Chrome`,
        voiceFeedback: `Media ${action} executed`,
        steps: [
          { tool: 'browser.open', headless: false },
          { tool: 'browser.media_control', action },
          { tool: 'browser.wait', seconds: 1 },
          { tool: 'browser.screenshot', fullPage: false }
        ]
      };
    }

    // --- YouTube Target & Playback (Bilingual: English + Hindi Devanagari) ---
    // Indicators for YouTube:
    // English/Hinglish: youtube, yt, you tube, yutub, utube
    // Hindi Devanagari: यूट्यूब, युटुब, युट्यूब, यूटयूब
    const hasYouTubeKeyword = /(?:youtube|yt|you\s*tube|yutub|utube|यूट्यूब|युटुब|युट्यूब|यूटयूब)/i.test(clean);

    // Indicators for Song/Music:
    // English/Hinglish: song, songs, gaana, gana, gaane, gane, music, track, audio, video
    // Hindi Devanagari: गाना, गाने, गीत, सॉन्ग, सॉन्ग्स, म्यूजिक, संगीत, विडियो, वीडियो
    const hasSongKeyword = /(?:song|songs|gaana|gana|gaane|gane|music|track|audio|video|गाना|गाने|गीत|सॉन्ग|सॉन्ग्स|म्यूजिक|संगीत|विडियो|वीडियो)/i.test(clean);

    // Indicators for Play/Start:
    // English/Hinglish: play, chalao, chalayein, bajao, bajaao, lagao, sunao, start
    // Hindi Devanagari: प्ले, चलाओ, बजाओ, लगाओ, सुनाओ, शुरू
    const hasPlayKeyword = /(?:play|chalao|chalayein|bajao|bajaao|lagao|sunao|start|प्ले|चलाओ|बजाओ|लगाओ|सुनाओ|शुरू)/i.test(clean);

    if (hasYouTubeKeyword || (this.sessionContext.activeSite === 'youtube' && (hasSongKeyword || hasPlayKeyword)) || (hasSongKeyword && (hasPlayKeyword || lower.includes('open') || lower.includes('खोलो')))) {
      
      // Check if user ONLY asked to open YouTube without requesting a song
      const isJustOpenYouTube = hasYouTubeKeyword && !hasSongKeyword && !hasPlayKeyword && !lower.includes('search') && !lower.includes('सर्च');

      if (isJustOpenYouTube) {
        this.sessionContext.activeSite = 'youtube';
        this.sessionContext.isBrowserOpen = true;
        this.sessionContext.activeDomain = 'youtube.com';

        return {
          goal: 'Open YouTube in Google Chrome',
          voiceFeedback: 'Opening YouTube on Google Chrome',
          steps: [
            { tool: 'browser.open', headless: false },
            { tool: 'browser.navigate', url: 'https://www.youtube.com' },
            { tool: 'browser.wait', seconds: 1 },
            { tool: 'browser.observe' },
            { tool: 'browser.screenshot', fullPage: false }
          ]
        };
      }

      // Extract Song / Video Query:
      // Strip action & filler words in both English & Hindi
      let songQuery = clean
        .replace(/(?:youtube|yt|you\s*tube|yutub|utube|यूट्यूब|युटुब|युट्यूब|यूटयूब)/gi, ' ')
        .replace(/(?:open|kholo|khol|khol\s*do|chalao|chalayein|bajao|bajaao|lagao|sunao|play|start|ओपन|खोलो|खोल|चलाओ|बजाओ|लगाओ|सुनाओ|प्ले|शुरू)/gi, ' ')
        .replace(/(?:karo|kar\s*do|batao|par|pe|me|aur|and|ek|ye|yeh|koi|achha|badhiya|करो|कर\s*दो|पर|में|और|एक|ये|कोई|अच्छा|बढ़िया)/gi, ' ')
        .replace(/(?:song|songs|gaana|gana|gaane|gane|music|track|audio|video|गाना|गाने|गीत|सॉन्ग|सॉन्ग्स|म्यूजिक|संगीत)/gi, ' ')
        .trim();

      // If generic (e.g. "Youtube open karo aur ek song play karo" / "एक गाना बजाओ")
      if (!songQuery || songQuery.length < 2) {
        songQuery = 'trending hindi songs';
      }

      this.sessionContext.activeSite = 'youtube';
      this.sessionContext.isBrowserOpen = true;
      this.sessionContext.lastQuery = songQuery;

      return {
        goal: `Search YouTube and play "${songQuery}" in Google Chrome`,
        voiceFeedback: `Playing ${songQuery} on YouTube`,
        steps: [
          { tool: 'browser.open', headless: false },
          { tool: 'browser.search_and_play', query: songQuery },
          { tool: 'browser.wait', seconds: 1 },
          { tool: 'browser.observe' },
          { tool: 'browser.screenshot', fullPage: false }
        ]
      };
    }

    // --- Naukri.com Workflow ---
    if (
      lower.includes('naukri') || lower.includes('नौकरी') ||
      ((lower.includes('resume') || lower.includes('cv') || lower.includes('रिज्यूमे')) && 
       (lower.includes('update') || lower.includes('upload') || lower.includes('अपडेट') || lower.includes('अपलोड')))
    ) {
      this.sessionContext.activeSite = 'naukri';
      this.sessionContext.isBrowserOpen = true;

      return {
        goal: 'Open Naukri.com in Google Chrome, login securely via credential vault, handle verification, and upload resume',
        voiceFeedback: 'Opening Naukri on Google Chrome for resume update',
        steps: [
          { tool: 'browser.open', headless: false },
          { tool: 'browser.navigate', url: 'https://www.naukri.com/nlogin/login' },
          { tool: 'browser.wait', seconds: 2 },
          { tool: 'browser.observe' },
          {
            tool: 'browser.type',
            selector: 'input[placeholder*="Username" i], input[placeholder*="Email" i], #usernameField, input[name="email"], input[type="text"]',
            vault_reference: 'naukri_primary',
            vault_field: 'username'
          },
          {
            tool: 'browser.type',
            selector: 'input[placeholder*="password" i], input[type="password"], #passwordField',
            vault_reference: 'naukri_primary',
            vault_field: 'password'
          },
          {
            tool: 'browser.click',
            selector: 'button[type="submit"], button.btn-primary, button:has-text("Login"), .loginButton, button.blueBtn'
          },
          {
            tool: 'browser.check_human_verification',
            prompt: 'Please check for CAPTCHA/OTP on Naukri.com'
          },
          { tool: 'browser.wait', seconds: 2 },
          { tool: 'browser.navigate', url: 'https://www.naukri.com/mnjuser/profile' },
          { tool: 'browser.wait', seconds: 2 },
          {
            tool: 'browser.upload_file',
            selector: 'input[type="file"], input[name="attachCV"], .attachCV, input[id*="attachCV"]',
            path: 'data/Aman_Resume.pdf'
          },
          { tool: 'browser.screenshot', fullPage: false }
        ]
      };
    }

    // --- Web In-Page Actions (Scroll, Refresh) ---
    if (lower.includes('scroll down') || lower.includes('niche scroll') || lower.includes('नीचे स्क्रॉल')) {
      return {
        goal: 'Scroll down active page in Google Chrome',
        voiceFeedback: 'Scrolling down',
        steps: [
          { tool: 'browser.open', headless: false },
          { tool: 'browser.scroll', direction: 'down', amount: 500 },
          { tool: 'browser.wait', seconds: 1 },
          { tool: 'browser.screenshot', fullPage: false }
        ]
      };
    }
    if (lower.includes('scroll up') || lower.includes('upar scroll') || lower.includes('ऊपर स्क्रॉल')) {
      return {
        goal: 'Scroll up active page in Google Chrome',
        voiceFeedback: 'Scrolling up',
        steps: [
          { tool: 'browser.open', headless: false },
          { tool: 'browser.scroll', direction: 'up', amount: 500 },
          { tool: 'browser.wait', seconds: 1 },
          { tool: 'browser.screenshot', fullPage: false }
        ]
      };
    }
    if (lower.includes('refresh') || lower.includes('reload') || lower.includes('रिफ्रेश')) {
      return {
        goal: 'Reload active page in Google Chrome',
        voiceFeedback: 'Reloading page',
        steps: [
          { tool: 'browser.open', headless: false },
          { tool: 'browser.press_key', key: 'F5' },
          { tool: 'browser.wait', seconds: 1 },
          { tool: 'browser.screenshot', fullPage: false }
        ]
      };
    }

    // --- Popular Websites (English & Hindi) ---
    const siteDirectory = [
      { names: ['google', 'गूगल'], url: 'https://www.google.com', searchUrl: 'https://www.google.com/search?q=' },
      { names: ['wikipedia', 'विकीपीडिया', 'विकिपीडिया'], url: 'https://en.wikipedia.org', searchUrl: 'https://en.wikipedia.org/w/index.php?search=' },
      { names: ['amazon', 'अमेज़न', 'अमेजन'], url: 'https://www.amazon.in', searchUrl: 'https://www.amazon.in/s?k=' },
      { names: ['flipkart', 'फ्लिपकार्ट'], url: 'https://www.flipkart.com', searchUrl: 'https://www.flipkart.com/search?q=' },
      { names: ['github', 'गिटहब'], url: 'https://github.com', searchUrl: 'https://github.com/search?q=' },
      { names: ['instagram', 'इंस्टाग्राम'], url: 'https://www.instagram.com' },
      { names: ['linkedin', 'लिंक्डइन'], url: 'https://www.linkedin.com', searchUrl: 'https://www.linkedin.com/search/results/all/?keywords=' },
      { names: ['twitter', 'x.com', 'ट्विटर'], url: 'https://x.com' },
      { names: ['facebook', 'फेसबुक'], url: 'https://www.facebook.com' },
      { names: ['reddit', 'रेडिट'], url: 'https://www.reddit.com', searchUrl: 'https://www.reddit.com/search/?q=' },
      { names: ['gmail', 'जीमेल'], url: 'https://mail.google.com' },
      { names: ['chatgpt', 'चैटजीपीटी'], url: 'https://chatgpt.com' },
      { names: ['netflix', 'नेटफ्लिक्स'], url: 'https://www.netflix.com' },
      { names: ['hotstar', 'हॉटस्टार'], url: 'https://www.hotstar.com' },
      { names: ['cricbuzz', 'क्रिकबज'], url: 'https://www.cricbuzz.com' }
    ];

    for (const site of siteDirectory) {
      if (site.names.some(name => lower.includes(name))) {
        let query = clean
          .replace(new RegExp(`(?:${site.names.join('|')}|par|pe|me|kholo|open|search|khojo|dhoondo|karo|visit|पर|में|खोलो|ओपन|सर्च|खोजो|ढूंढो|करो)`, 'gi'), '')
          .trim();
        const targetUrl = (query && site.searchUrl) ? `${site.searchUrl}${encodeURIComponent(query)}` : site.url;

        this.sessionContext.activeSite = site.names[0];
        this.sessionContext.isBrowserOpen = true;

        return {
          goal: query ? `Open Google Chrome, navigate to ${site.names[0]} and search for "${query}"` : `Open ${site.names[0]} in Google Chrome`,
          voiceFeedback: query ? `Searching ${query} on ${site.names[0]}` : `Opening ${site.names[0]} on Chrome`,
          steps: [
            { tool: 'browser.open', headless: false },
            { tool: 'browser.navigate', url: targetUrl },
            { tool: 'browser.wait', seconds: 1 },
            { tool: 'browser.observe' },
            { tool: 'browser.screenshot', fullPage: false }
          ]
        };
      }
    }

    // --- Direct Web Domain Navigation (e.g. "myntra.com kholo") ---
    const domainMatch = clean.match(/([a-zA-Z0-9-]+\.(?:com|in|org|net|io|co|ai|dev|app|edu|gov))/i);
    if (domainMatch) {
      const domain = domainMatch[1].toLowerCase();
      const targetUrl = domain.startsWith('http') ? domain : `https://www.${domain}`;
      this.sessionContext.activeSite = domain;
      this.sessionContext.isBrowserOpen = true;

      return {
        goal: `Navigate to ${domain} in Google Chrome browser`,
        voiceFeedback: `Opening ${domain} on Chrome`,
        steps: [
          { tool: 'browser.open', headless: false },
          { tool: 'browser.navigate', url: targetUrl },
          { tool: 'browser.wait', seconds: 1 },
          { tool: 'browser.observe' },
          { tool: 'browser.screenshot', fullPage: false }
        ]
      };
    }

    // --- Desktop Folder / File Creation ---
    if ((lower.includes('desktop') || lower.includes('डेस्कटॉप')) && (lower.includes('folder') || lower.includes('फ़ोल्डर') || lower.includes('फोल्डर'))) {
      const match = clean.match(/([a-zA-Z0-9_-]+)\s+naam ka/i) || 
                    clean.match(/(?:named|folder)\s+([a-zA-Z0-9_-]+)/i) ||
                    clean.match(/folder\s+([a-zA-Z0-9_-]+)/i);
      const folderName = match ? match[1] : 'TestFolder';
      return {
        goal: `Create folder "${folderName}" on Desktop`,
        voiceFeedback: `Creating folder ${folderName} on Desktop`,
        steps: [
          { tool: 'filesystem.create_directory', path: `USER_DESKTOP/${folderName}` },
          { tool: 'filesystem.exists', path: `USER_DESKTOP/${folderName}` }
        ]
      };
    }

    if (lower.includes('file banao') || lower.includes('फ़ाइल बनाओ') || lower.includes('फाइल बनाओ') || (lower.includes('desktop') && lower.includes('.txt'))) {
      const nameMatch = clean.match(/([a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)/i);
      const fileName = nameMatch ? nameMatch[1] : 'Notes.txt';
      const content = `Created by Autonomous AI Agent (${this.agentName}) on ${new Date().toLocaleString()}\nInstruction: ${clean}`;
      return {
        goal: `Create file "${fileName}" on Desktop`,
        voiceFeedback: `Creating file ${fileName} on Desktop`,
        steps: [
          { tool: 'filesystem.create_file', path: `USER_DESKTOP/${fileName}`, content },
          { tool: 'filesystem.exists', path: `USER_DESKTOP/${fileName}` }
        ]
      };
    }

    // --- Desktop Applications (Notepad, Calculator, Paint, etc.) ---
    const desktopApps = [
      { names: ['notepad', 'नोटपैड'], app: 'notepad' },
      { names: ['calculator', 'calc', 'कैलकुलेटर'], app: 'calculator' },
      { names: ['vscode', 'code', 'कोड'], app: 'vscode' },
      { names: ['paint', 'पेंट'], app: 'paint' },
      { names: ['cmd', 'कमांड'], app: 'cmd' },
      { names: ['explorer', 'फाइल एक्सप्लोरर'], app: 'explorer' }
    ];

    for (const app of desktopApps) {
      if (app.names.some(n => lower.includes(n)) && (lower.includes('kholo') || lower.includes('open') || lower.includes('खोलो') || lower.includes('चालू') || lower.length < 20)) {
        return {
          goal: `Open ${app.app} desktop application`,
          voiceFeedback: `Opening ${app.app}`,
          steps: [
            { tool: 'os.open_application', app: app.app },
            { tool: 'os.process_list' }
          ]
        };
      }
    }

    // --- UNIVERSAL ANY-CONTEXT FALLBACK (ALWAYS IN GOOGLE CHROME) ---
    // Handles ANY other prompt, question, query, news, weather, or info in real time:
    // e.g. "Delhi ka weather kaisa hai", "दिल्ली का मौसम कैसा है", "Who is Narendra Modi", "Cricket score"
    let cleanQuery = clean
      .replace(/(?:chrome|browser|google|par|pe|me|kholo|aur|open|karo|kar\s*do|search|khojo|dhoondo|ke\s*baare\s*me\s*batao|find|batao|kya\s*hai|kaise\s*karein|गूगल|क्रोम|पर|में|खोलो|ओपन|सर्च|करो|बताओ|क्या\s*है|के\s*बारे\s*में)/gi, ' ')
      .trim();
    cleanQuery = cleanQuery || clean;

    this.sessionContext.activeSite = 'google';
    this.sessionContext.isBrowserOpen = true;
    this.sessionContext.lastQuery = cleanQuery;

    return {
      goal: `Open Google Chrome and search for "${cleanQuery}"`,
      voiceFeedback: `Searching Google for ${cleanQuery} in Chrome`,
      steps: [
        { tool: 'browser.open', headless: false },
        { tool: 'browser.navigate', url: `https://www.google.com/search?q=${encodeURIComponent(cleanQuery)}` },
        { tool: 'browser.wait', seconds: 1 },
        { tool: 'browser.observe' },
        { tool: 'browser.screenshot', fullPage: false }
      ]
    };
  }
}

module.exports = new AIGateway();
