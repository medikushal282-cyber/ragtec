import asyncio
import os
import sys
from playwright.async_api import async_playwright

SCREENSHOT_DIR = r"C:\Users\medik\.gemini\antigravity\brain\cf396fbc-1d09-4bc2-8e96-b9bf001dd93f"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1400, "height": 900})
        page = await context.new_page()

        print("[Test] Navigating to SOC Dashboard...")
        await page.goto("http://localhost:3000", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)

        # 1. Clear any old localStorage keys containing FINANCE-PC
        await page.evaluate("""() => {
            if (localStorage.getItem('ragsec_current_target_host')?.includes('FINANCE-PC')) {
                localStorage.removeItem('ragsec_current_target_host');
            }
            if (localStorage.getItem('ragsec_custom_targets')?.includes('FINANCE-PC')) {
                localStorage.removeItem('ragsec_custom_targets');
            }
        }""")
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(1500)

        # 2. Click AI Copilot Chat in sidebar
        print("[Test] Opening AI Copilot Chat...")
        chat_btn = page.locator("button:has-text('AI Copilot Chat')").first
        if await chat_btn.is_visible():
            await chat_btn.click()
            await page.wait_for_timeout(2000)

        # 3. Verify top bar: clean, no overlap, and default target is Local Endpoint
        header = page.locator("header").nth(1) # The chat view header
        header_text = await header.inner_text()
        print(f"[Test] Chat Header content: {header_text.replace(chr(10), ' | ')}")
        assert "FINANCE-PC-014" not in header_text, "FINANCE-PC-014 must not appear in header!"
        assert "Target:" in header_text, "Target selector must be present in header!"

        # Screenshot top bar
        await page.screenshot(path=os.path.join(SCREENSHOT_DIR, "final_ai_copilot_clean_header.png"))
        print("[Test] Saved clean header screenshot.")

        # 4. Open Target Popover
        target_btn = page.locator("button:has-text('Target:')").first
        await target_btn.click()
        await page.wait_for_timeout(1000)

        # Verify Popover content
        popover = page.locator("div.w-80").first
        assert await popover.is_visible(), "Target Popover must open!"
        
        # Wait for live processes to populate in the popover
        print("[Test] Waiting for live processes in Target Popover...")
        await page.wait_for_selector("div.w-80 button:has-text('PID')", timeout=10000)
        popover_text = await popover.inner_text()
        print(f"[Test] Popover content preview:\n{popover_text}")
        assert "RUNNING PROCESS" in popover_text.upper(), "Live running processes must be listed in target popover!"

        await page.screenshot(path=os.path.join(SCREENSHOT_DIR, "final_target_popover_with_processes.png"))
        print("[Test] Saved target popover screenshot.")

        # 5. Click on the first running process in the popover to switch target to that process
        first_proc_btn = page.locator("button:has-text('PID')").first
        if await first_proc_btn.is_visible():
            proc_btn_text = await first_proc_btn.inner_text()
            print(f"[Test] Selecting process target: {proc_btn_text.replace(chr(10), ' ')}")
            await first_proc_btn.click()
            await page.wait_for_timeout(1000)

            # Header target should now show PID
            updated_header_text = await header.inner_text()
            print(f"[Test] Updated Header text: {updated_header_text.replace(chr(10), ' | ')}")
            assert "PID" in updated_header_text, "Header target must now display selected process PID!"

            await page.screenshot(path=os.path.join(SCREENSHOT_DIR, "final_target_switched_to_process.png"))
            print("[Test] Saved dynamic process target screenshot.")

        # 6. Test Live Process Inspector Modal
        proc_modal_btn = page.locator("button:has-text('Processes')").first
        await proc_modal_btn.click()
        await page.wait_for_timeout(1500)

        modal = page.locator("text=Live Host Processes & Activity Telemetry")
        assert await modal.is_visible(), "Processes modal must be visible!"
        await page.screenshot(path=os.path.join(SCREENSHOT_DIR, "final_process_inspector_modal.png"))
        print("[Test] Saved process inspector modal screenshot.")

        # Close modal
        close_btn = page.locator("button[title='Close modal']").first
        await close_btn.click()
        await page.wait_for_timeout(500)

        # 7. Test Mitigation View default target
        mitigation_nav = page.locator("button:has-text('Mitigation & Copilot')").first
        if await mitigation_nav.is_visible():
            await mitigation_nav.click()
            await page.wait_for_timeout(2000)

            mitigation_text = await page.locator("body").inner_text()
            assert "FINANCE-PC-014" not in mitigation_text, "FINANCE-PC-014 must not appear in Mitigation view!"
            print("[Test] Verified Mitigation view has no FINANCE-PC-014!")

            await page.screenshot(path=os.path.join(SCREENSHOT_DIR, "final_mitigation_view_clean.png"))
            print("[Test] Saved clean mitigation view screenshot.")

        await browser.close()
        print("[Test] All verification assertions PASSED successfully!")

if __name__ == "__main__":
    asyncio.run(main())
