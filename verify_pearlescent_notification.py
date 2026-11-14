import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\medik\.gemini\antigravity\brain\cf396fbc-1d09-4bc2-8e96-b9bf001dd93f"

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        print("[1] Navigating to http://localhost:3000...")
        await page.goto("http://localhost:3000", wait_until="networkidle")
        await asyncio.sleep(2)

        # 1. Switch to Fleet & IEM
        print("[2] Navigating to Fleet & IEM...")
        fleet_nav = page.locator("button:has-text('Fleet & IEM')").first
        await fleet_nav.click()
        await asyncio.sleep(1.5)

        # 2. Switch to Harmful Logs Stream tab
        print("[3] Switching to Harmful Logs Stream tab...")
        harmful_tab = page.locator("button:has-text('Harmful Logs Stream')").first
        await harmful_tab.click()
        await asyncio.sleep(1)

        # 3. Trigger simulation
        print("[4] Triggering Harmful Event Simulation...")
        sim_btn = page.locator("button:has-text('Simulate Harmful Event')").first
        await sim_btn.click()
        await asyncio.sleep(1.5)

        # Screenshot 1: Floating Pearlescent Notification Top-Right
        print("[5] Capturing Floating Pearlescent Notification...")
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "proof_floating_pearlescent_notification_top_right.png"))
        print("Captured proof_floating_pearlescent_notification_top_right.png")

        # 4. Switch to Threat Center Dashboard to prove it floats across views
        print("[6] Switching to Threat Center Dashboard with active pearlescent notification...")
        dash_nav = page.locator("button:has-text('Threat Center')").first
        await dash_nav.click()
        await asyncio.sleep(1)

        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "proof_pearlescent_notification_on_dashboard.png"))
        print("Captured proof_pearlescent_notification_on_dashboard.png")

        # 5. Click Dismiss (X) button on the notification
        print("[7] Dismissing notification via (X) button...")
        dismiss_btn = page.locator("button[aria-label='Dismiss']").first
        if await dismiss_btn.count() > 0:
            await dismiss_btn.click()
            await asyncio.sleep(1)

        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "proof_pearlescent_notification_dismissed.png"))
        print("Captured proof_pearlescent_notification_dismissed.png")

        await browser.close()
        print("Verification complete!")

if __name__ == "__main__":
    asyncio.run(run())
