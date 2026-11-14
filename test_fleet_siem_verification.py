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
        print("[2] Switching to Fleet & IEM...")
        fleet_nav = page.locator("button:has-text('Fleet & IEM')").first
        await fleet_nav.click()
        await asyncio.sleep(2)

        # Switch to Device Cards view if on topology
        cards_btn = page.locator("button:has-text('Device Cards')")
        if await cards_btn.count() > 0:
            await cards_btn.click()
            await asyncio.sleep(1)

        # Screenshot 1: Fleet Overview with Device Cards
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "proof_fleet_connected_devices.png"))
        print("Captured proof_fleet_connected_devices.png")

        # 2. Open Connect Remote Laptop Modal
        print("[3] Opening Connect Remote Laptop Modal...")
        connect_btn = page.locator("button:has-text('Connect Remote Laptop')").first
        await connect_btn.click()
        await asyncio.sleep(1)

        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "proof_connect_remote_laptop_modal.png"))
        print("Captured proof_connect_remote_laptop_modal.png")

        # Close or cancel connect modal
        cancel_btn = page.locator("button:has-text('Cancel')").first
        if await cancel_btn.count() > 0:
            await cancel_btn.click()
            await asyncio.sleep(1)

        # 3. Open Remote Sandbox Explorer
        print("[4] Opening Remote Sandbox Explorer...")
        sandbox_btn = page.locator("button:has-text('Sandbox')").first
        await sandbox_btn.click()
        await asyncio.sleep(2)

        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "proof_remote_sandbox_explorer_modal.png"))
        print("Captured proof_remote_sandbox_explorer_modal.png")

        # Click View Content on a file
        view_content_btn = page.locator("button:has-text('View Content')").first
        if await view_content_btn.count() > 0:
            await view_content_btn.click()
            await asyncio.sleep(1.5)
            await page.screenshot(path=os.path.join(ARTIFACT_DIR, "proof_remote_file_content_preview.png"))
            print("Captured proof_remote_file_content_preview.png")

            # Close preview
            close_prev_btn = page.locator("button:has-text('Close Preview')").first
            if await close_prev_btn.count() > 0:
                await close_prev_btn.click()
                await asyncio.sleep(1)

        # Close Sandbox Explorer
        close_btn = page.locator("button:has-text('Close')").first
        if await close_btn.count() > 0:
            await close_btn.click()
            await asyncio.sleep(1)

        # 4. Switch to Harmful Logs Stream tab
        print("[5] Switching to Harmful Threat Stream tab...")
        harmful_tab = page.locator("button:has-text('Harmful Logs Stream')").first
        await harmful_tab.click()
        await asyncio.sleep(1)

        # 5. Simulate a Harmful Event
        print("[6] Simulating a Harmful Event...")
        sim_btn = page.locator("button:has-text('Simulate Harmful Event')").first
        await sim_btn.click()
        await asyncio.sleep(2)

        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "proof_harmful_threat_alert_and_stream.png"))
        print("Captured proof_harmful_threat_alert_and_stream.png")

        # 6. Switch back to Dashboard to prove global toast and topbar badge persist
        print("[7] Switching back to Threat Center Dashboard...")
        dash_nav = page.locator("button:has-text('Threat Center')").first
        await dash_nav.click()
        await asyncio.sleep(2)

        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "proof_global_fleet_threat_alert_topbar.png"))
        print("Captured proof_global_fleet_threat_alert_topbar.png")

        await browser.close()
        print("Verification complete!")

if __name__ == "__main__":
    asyncio.run(run())
