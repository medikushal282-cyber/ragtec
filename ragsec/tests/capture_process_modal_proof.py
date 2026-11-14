import asyncio
import os
from playwright.async_api import async_playwright

SCREENSHOT_DIR = r"C:\Users\medik\.gemini\antigravity\brain\cf396fbc-1d09-4bc2-8e96-b9bf001dd93f"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1400, "height": 900})
        page = await context.new_page()

        await page.goto("http://localhost:3000", wait_until="networkidle")
        await page.wait_for_timeout(2000)

        # Go to AI Copilot Chat
        btn = page.locator("button:has-text('AI Copilot Chat')").first
        if await btn.is_visible():
            await btn.click()
            await page.wait_for_timeout(2000)

        # Open Live Host Processes Modal
        proc_btn = page.locator("button:has-text('Processes')").first
        await proc_btn.click()
        await page.wait_for_timeout(2000)

        # Wait for table rows
        await page.wait_for_selector("text=RAGSec Platform Core", timeout=10000)
        await page.wait_for_timeout(1000)

        await page.screenshot(path=os.path.join(SCREENSHOT_DIR, "proof_process_inspector_with_roles_and_protection.png"))
        print("[SUCCESS] Captured modal screenshot with platform roles and safety badges!")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
