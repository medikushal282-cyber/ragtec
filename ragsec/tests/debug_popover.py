import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto('http://localhost:3000')
        await page.wait_for_timeout(2000)
        btn = page.locator("button:has-text('AI Copilot Chat')").first
        await btn.click()
        await page.wait_for_timeout(2000)
        
        # Check processes button text
        proc_btn = page.locator("button:has-text('Processes')").first
        print("PROC BTN TEXT:", await proc_btn.inner_text())

        target_btn = page.locator("button:has-text('Target:')").first
        await target_btn.click()
        await page.wait_for_timeout(2000)
        
        # Find all matching elements
        els = await page.locator("header div").all()
        for idx, el in enumerate(els):
            t = await el.inner_text()
            if "Target" in t and len(t) < 500:
                print(f"--- EL {idx} ---:\n{t}\n")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
