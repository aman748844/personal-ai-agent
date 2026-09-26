/**
 * Browser Workflow (Section 4 & 5 Test Case 2 of PDF)
 * Search and web automation workflows.
 */

function buildBrowserSearchWorkflow(query = 'OpenAI') {
  return {
    goal: `Open Chrome and search for ${query} on Google`,
    steps: [
      {
        tool: 'browser.open',
        headless: false
      },
      {
        tool: 'browser.navigate',
        url: 'https://www.google.com'
      },
      {
        tool: 'browser.type',
        selector: 'textarea[name="q"], input[name="q"]',
        text: query
      },
      {
        tool: 'browser.click',
        selector: 'input[name="btnK"], form[action*="search"]'
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

module.exports = {
  buildBrowserSearchWorkflow
};
