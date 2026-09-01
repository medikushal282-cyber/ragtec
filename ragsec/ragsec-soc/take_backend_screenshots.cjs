const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log("Navigating to Backend Swagger UI...");
  await page.goto('http://localhost:8000/docs', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'C:\\Projects\\RAGTEC\\Phase_1_Verification_Proofs\\01_backend_swagger_api_proof.png' });

  console.log("Navigating to Backend FIM Events JSON API...");
  await page.goto('http://localhost:8000/api/fim/events', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'C:\\Projects\\RAGTEC\\Phase_1_Verification_Proofs\\02_backend_json_telemetry_proof.png' });

  await browser.close();
  console.log("Backend Screenshots captured!");
})();
