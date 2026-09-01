const puppeteer = require('puppeteer');

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1400, height: 900 });

  console.log("Navigating to Threat Query...");
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  
  const tabs = await page.$$('nav button');
  for (let t of tabs) {
    const text = await page.evaluate(el => el.textContent, t);
    if (text && text.includes('Threat Query')) {
      await t.click();
      break;
    }
  }
  
  await new Promise(r => setTimeout(r, 1000));

  const input = await page.$('textarea');
  if (input) {
    await input.click({ clickCount: 3 });
    await input.type("What vulnerability was exploited on WS-CORP-DESKTOP1?");
    
    const btns = await page.$$('.query-compose button');
    for(let b of btns) {
      const text = await page.evaluate(el => el.textContent, b);
      if(text.includes('Retrieve')) {
        await b.click();
        await new Promise(r => setTimeout(r, 6000)); // wait for cross-encoder
      }
    }
  }

  const outPath = 'C:/Users/medik/.gemini/antigravity/brain/cf396fbc-1d09-4bc2-8e96-b9bf001dd93f/Phase_3_Threat_Query.png';
  await page.screenshot({ path: outPath });
  console.log("Saved screenshot to " + outPath);
  
  await browser.close();
})();
