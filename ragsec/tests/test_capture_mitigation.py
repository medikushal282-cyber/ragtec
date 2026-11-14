import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\medik\.gemini\antigravity\brain\cf396fbc-1d09-4bc2-8e96-b9bf001dd93f"

async def capture_clean_mitigation():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        await page.goto("http://localhost:3000", wait_until="networkidle")
        await page.wait_for_timeout(2000)

        # Set model
        await page.evaluate("""() => {
            localStorage.setItem('ragsec_active_brain', 'openai/gpt-oss-120b');
            localStorage.setItem('ragsec_model_name', 'openai/gpt-oss-120b');
            window.dispatchEvent(new Event('storage'));
        }""")
        await page.wait_for_timeout(1000)

        # Navigate to Mitigation Copilot
        await page.click("button:has-text('Mitigation & Copilot')")
        await page.wait_for_timeout(2000)

        # Click "Side-by-Side" mode so both copilot and playbooks deck are visible side-by-side!
        dual_btn = page.locator("button:has-text('Side-by-Side')").first
        if await dual_btn.count() > 0:
            await dual_btn.click()
            await page.wait_for_timeout(1500)

        shot = os.path.join(ARTIFACT_DIR, "e2e_mitigation_copilot_deck_view.png")
        await page.screenshot(path=shot, full_page=False)
        print(f"[+] Saved clean mitigation dual deck screenshot: {shot}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(capture_clean_mitigation())
