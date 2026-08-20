const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log("Navigating to Dashboard...");
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'C:\\Users\\medik\\.gemini\\antigravity\\scratch\\AI-BRIDGE-SANDBOX\\screenshots\\soc_dashboard_verified.png' });

  console.log("Navigating to Incidents...");
  await page.goto('http://localhost:3000/incidents', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'C:\\Users\\medik\\.gemini\\antigravity\\scratch\\AI-BRIDGE-SANDBOX\\screenshots\\soc_incidents_verified.png' });

  await browser.close();
  console.log("Screenshots captured!");
})();
