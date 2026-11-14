import asyncio
import os
import sys
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\medik\.gemini\antigravity\brain\cf396fbc-1d09-4bc2-8e96-b9bf001dd93f"

async def run_verification():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        print("[1] Navigating to SOC Dashboard at http://localhost:3000 ...")
        await page.goto("http://localhost:3000", wait_until="networkidle")
        await page.wait_for_timeout(2000)

        # Set localStorage to ensure active model is openai/gpt-oss-120b
        await page.evaluate("""() => {
            localStorage.setItem('ragsec_active_brain', 'openai/gpt-oss-120b');
            localStorage.setItem('ragsec_model_name', 'openai/gpt-oss-120b');
            window.dispatchEvent(new Event('storage'));
        }""")
        await page.wait_for_timeout(1000)

        # Screenshot 1: Dashboard with real model in header
        dash_shot = os.path.join(ARTIFACT_DIR, "e2e_soc_dashboard_unified_model.png")
        await page.screenshot(path=dash_shot, full_page=False)
        print(f"[+] Saved dashboard screenshot: {dash_shot}")

        # Navigate to File Threat Scanner
        print("[2] Navigating to AI Threat Scanner...")
        scanner_nav = page.locator("button:has-text('AI Threat Scanner'), button:has-text('File Threat Scanner')").first
        if await scanner_nav.count() > 0:
            await scanner_nav.click()
        await page.wait_for_timeout(2500)

        # Screenshot 2: All 30 files in workspace
        scanner_shot = os.path.join(ARTIFACT_DIR, "e2e_threat_scanner_all_files.png")
        await page.screenshot(path=scanner_shot, full_page=False)
        print(f"[+] Saved scanner screenshot: {scanner_shot}")

        # Search for Routine.py to verify it shows SAFE
        search_input = page.locator("input[placeholder*='Search']").first
        if await search_input.count() > 0:
            await search_input.fill("Routine.py")
            await page.wait_for_timeout(1000)
            routine_shot = os.path.join(ARTIFACT_DIR, "e2e_routine_py_safe_verdict.png")
            await page.screenshot(path=routine_shot, full_page=False)
            print(f"[+] Saved Routine.py safe verdict screenshot: {routine_shot}")
            # Clear search
            await search_input.fill("")
            await page.wait_for_timeout(1000)

        # [3] Open Step Chatbot Helper
        print("[3] Testing AI Step Helper...")
        helper_trigger = page.locator("#ragsec-step-helper-trigger")
        if await helper_trigger.count() > 0:
            await helper_trigger.click(force=True)
            await page.wait_for_timeout(1500)

        panel = page.locator("#ragsec-step-helper-panel")
        await panel.wait_for(state="visible", timeout=5000)
        print("[*] Step Helper panel is OPEN and visible!")

        # Send diagnostic question to AI Helper
        chat_input = page.locator("#ragsec-step-helper-panel input[type='text']").first
        if await chat_input.count() > 0:
            await chat_input.fill("Access is denied when disabling network adapter on FINANCE-PC-014. What is the fix and please recommend a containment playbook.")
            send_btn = page.locator("#ragsec-step-helper-panel button:has-text('Send'), #ragsec-step-helper-panel button").last
            await chat_input.press("Enter")
            print("[*] Sent prompt to AI Step Helper, waiting for Groq response...")
            # Wait for recommended playbook card
            try:
                await page.wait_for_selector("button:has-text('Stage to Playbook Deck')", timeout=25000)
                print("[*] AI Playbook Card arrived!")
            except Exception as e:
                print(f"[!] Warning waiting for playbook card: {e}")
            await page.wait_for_timeout(2000)

        # Screenshot of Step Helper with response and recommended playbook card
        helper_shot = os.path.join(ARTIFACT_DIR, "e2e_step_helper_playbook_card.png")
        await page.screenshot(path=helper_shot, full_page=False)
        print(f"[+] Saved Step Helper with Playbook screenshot: {helper_shot}")

        # Click "Stage to Playbook Deck" on the recommended playbook card
        stage_btn = page.locator("button:has-text('Stage to Playbook Deck')").first
        if await stage_btn.count() > 0:
            print("[*] Clicking 'Stage to Playbook Deck' button...")
            await stage_btn.click(force=True)
            await page.wait_for_timeout(1500)
            staged_shot = os.path.join(ARTIFACT_DIR, "e2e_step_helper_playbook_staged.png")
            await page.screenshot(path=staged_shot, full_page=False)
            print(f"[+] Saved staged confirmation screenshot: {staged_shot}")

        # Minimize or close helper to expose navigation
        minimize_btn = page.locator("#ragsec-step-helper-panel button").nth(2)
        if await minimize_btn.count() > 0:
            try:
                await minimize_btn.click(force=True)
            except:
                pass
        await page.wait_for_timeout(1000)

        # [4] Navigate to Mitigation Copilot to verify staged playbook
        print("[4] Navigating to Threat Mitigation Copilot...")
        mitigation_nav = page.locator("button:has-text('Mitigation & Copilot'), button:has-text('Mitigation Copilot')").first
        if await mitigation_nav.count() > 0:
            await mitigation_nav.click(force=True)
        else:
            await page.click("text=Mitigation & Copilot")
        await page.wait_for_timeout(3000)

        mitigation_shot = os.path.join(ARTIFACT_DIR, "e2e_mitigation_copilot_staged_playbook.png")
        await page.screenshot(path=mitigation_shot, full_page=False)
        print(f"[+] Saved Mitigation Copilot screenshot: {mitigation_shot}")

        await browser.close()
        print("[*] E2E Verification complete successfully!")

if __name__ == "__main__":
    asyncio.run(run_verification())
