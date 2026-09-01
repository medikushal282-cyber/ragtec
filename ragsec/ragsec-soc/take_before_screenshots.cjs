const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log("Navigating to Dashboard...");
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  console.log("Clicking Knowledge Base...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const kbBtn = buttons.find(b => b.textContent && b.textContent.includes('Knowledge Base'));
    if (kbBtn) kbBtn.click();
  });
  
  // Wait for React to update
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'C:\\Projects\\RAGTEC\\Phase_2_Before_Knowledge_Base.png' });

  await browser.close();
  console.log("BEFORE screenshots captured!");
})();
