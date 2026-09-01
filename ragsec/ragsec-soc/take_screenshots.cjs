const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log("Navigating to Dashboard...");
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'C:\\Users\\medik\\.gemini\\antigravity\\brain\\cf396fbc-1d09-4bc2-8e96-b9bf001dd93f\\soc_dashboard_phase1.png' });

  console.log("Clicking FIM Monitor...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const fimBtn = buttons.find(b => b.textContent && b.textContent.includes('FIM Monitor'));
    if (fimBtn) fimBtn.click();
  });
  // Wait for React to update
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'C:\\Users\\medik\\.gemini\\antigravity\\brain\\cf396fbc-1d09-4bc2-8e96-b9bf001dd93f\\soc_fim_phase1.png' });


  await browser.close();
  console.log("Screenshots captured!");
})();
