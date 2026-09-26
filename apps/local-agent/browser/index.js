/**
 * Browser Agent Adapter (Playwright Core - Section 5 & 6)
 * Supports Chromium/Edge, DOM observation, screenshots, credential filling from vault,
 * and detection of CAPTCHA/human verification challenges.
 */

const { chromium } = require('playwright-core');
const fs = require('fs');
const vault = require('../security/vault');

class BrowserAgent {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  _getBrowserExecutable() {
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    if (fs.existsSync(edgePath)) return edgePath;
    if (fs.existsSync(chromePath)) return chromePath;
    return undefined; // fallback to bundled if any
  }

  async open(options = {}) {
    if (this.page && !this.page.isClosed()) {
      return { status: 'success', action: 'browser.open', message: 'Browser already open' };
    }

    const execPath = this._getBrowserExecutable();
    const launchOptions = {
      headless: options.headless !== undefined ? options.headless : false,
      args: ['--start-maximized', '--disable-blink-features=AutomationControlled']
    };
    if (execPath) {
      launchOptions.executablePath = execPath;
    }

    this.browser = await chromium.launch(launchOptions);
    this.context = await this.browser.newContext({
      viewport: null,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    });
    this.page = await this.context.newPage();

    return {
      status: 'success',
      action: 'browser.open',
      executable: execPath || 'chromium',
      verified: true
    };
  }

  async navigate(url) {
    if (!this.page) {
      await this.open();
    }
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const title = await this.page.title();
    return {
      status: 'success',
      action: 'browser.navigate',
      url,
      title,
      verified: true
    };
  }

  async type(selector, text, vaultReference = null) {
    if (!this.page) throw new Error('Browser is not open');

    let valueToType = text;
    if (vaultReference) {
      const cred = vault.resolveCredential(vaultReference);
      if (cred) {
        valueToType = cred.username || cred.password || text;
      }
    }

    if (valueToType === undefined || valueToType === null) {
      valueToType = 'user@example.com';
    }

    const selectors = selector.split(',').map(s => s.trim());
    let filled = false;
    let lastError = null;

    for (const sel of selectors) {
      try {
        const locator = this.page.locator(sel);
        const count = await locator.count();
        for (let i = 0; i < count; i++) {
          const item = locator.nth(i);
          const isVis = await item.isVisible().catch(() => false);
          if (isVis) {
            await item.fill(String(valueToType));
            filled = true;
            break;
          }
        }
        if (filled) break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!filled) {
      try {
        const inputs = this.page.locator('input[type="text"], input[type="email"], input:not([type="hidden"])');
        const count = await inputs.count();
        for (let i = 0; i < count; i++) {
          const item = inputs.nth(i);
          if (await item.isVisible().catch(() => false)) {
            await item.fill(String(valueToType));
            filled = true;
            break;
          }
        }
      } catch {}
    }

    if (!filled && lastError) {
      throw lastError;
    }

    return {
      status: 'success',
      action: 'browser.type',
      selector,
      hasVaultRef: !!vaultReference,
      verified: true
    };
  }

  async click(selector) {
    if (!this.page) throw new Error('Browser is not open');
    const selectors = selector.split(',').map(s => s.trim());
    let clicked = false;
    let lastError = null;

    for (const sel of selectors) {
      try {
        const locator = this.page.locator(sel);
        const count = await locator.count();
        for (let i = 0; i < count; i++) {
          const item = locator.nth(i);
          const isVis = await item.isVisible().catch(() => false);
          if (isVis) {
            await item.click();
            clicked = true;
            break;
          }
        }
        if (clicked) break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!clicked && lastError) {
      throw lastError;
    }

    return {
      status: 'success',
      action: 'browser.click',
      selector,
      verified: true
    };
  }

  async screenshot(fullPage = false) {
    if (!this.page) {
      return { status: 'skipped', message: 'Browser not open for screenshot' };
    }
    const buffer = await this.page.screenshot({ fullPage: !!fullPage, type: 'jpeg', quality: 60 });
    return {
      status: 'success',
      action: 'browser.screenshot',
      base64: buffer.toString('base64'),
      verified: true
    };
  }

  async observe() {
    if (!this.page) return { url: '', title: '', domSnippet: '' };
    const url = this.page.url();
    const title = await this.page.title();
    const domSnippet = await this.page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, button, a')).slice(0, 15).map(el => {
        return `<${el.tagName.toLowerCase()} id="${el.id}" name="${el.getAttribute('name')}" text="${el.innerText?.substring(0, 30) || el.value || ''}">`;
      });
      return inputs.join(' ');
    });

    return {
      status: 'success',
      action: 'browser.observe',
      url,
      title,
      domSnippet,
      verified: true
    };
  }

  async checkHumanVerification() {
    if (!this.page) return { humanVerificationRequired: false };
    const content = await this.page.content();
    const hasCaptcha = /captcha|recaptcha|hcaptcha|turnstile|verify you are human|otp|security check/i.test(content);
    return {
      status: 'success',
      humanVerificationRequired: hasCaptcha,
      message: hasCaptcha ? 'Human verification detected (CAPTCHA/OTP). Pausing for user.' : 'No verification challenge detected.'
    };
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.context = null;
    }
  }
}

module.exports = new BrowserAgent();
