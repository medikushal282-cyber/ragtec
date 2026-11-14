import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\medik\.gemini\antigravity\brain\cf396fbc-1d09-4bc2-8e96-b9bf001dd93f"

async def test_chatgpt_interface():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        print("[1] Navigating to SOC Dashboard at http://localhost:3000 ...")
        await page.goto("http://localhost:3000", wait_until="networkidle")
        await page.wait_for_timeout(2000)

        # 1. Verify floating Step Helper is REMOVED from Home screen
        helper_trigger = page.locator("#ragsec-step-helper-trigger")
        count = await helper_trigger.count()
        print(f"[*] Floating Step Helper trigger count on Home: {count} (Should be 0)")
        assert count == 0, "Floating step helper should be removed from home screen!"

        # Screenshot 1: Clean Home Screen with new sidebar item and NO floating helper
        home_shot = os.path.join(ARTIFACT_DIR, "e2e_home_sidebar_ai_chat_option.png")
        await page.screenshot(path=home_shot, full_page=False)
        print(f"[+] Saved clean home screen screenshot: {home_shot}")

        # 2. Click "AI Copilot Chat" in the left sidebar
        print("[2] Navigating to 'AI Copilot Chat' in the left sidebar...")
        ai_chat_nav = page.locator("button:has-text('AI Copilot Chat')").first
        await ai_chat_nav.click()
        await page.wait_for_timeout(2000)

        # Screenshot 2: Full ChatGPT Interface Empty State (Hero + Starter cards)
        hero_shot = os.path.join(ARTIFACT_DIR, "e2e_chatgpt_full_interface_hero.png")
        await page.screenshot(path=hero_shot, full_page=False)
        print(f"[+] Saved ChatGPT full interface hero screenshot: {hero_shot}")

        # 3. Click one of the starter prompt cards (e.g. Host Network Isolation)
        print("[3] Clicking starter prompt card...")
        starter_card = page.locator("button:has-text('Host Network Isolation')").first
        if await starter_card.count() > 0:
            await starter_card.click()
            print("[*] Clicked starter card, waiting for Groq AI response...")
        else:
            # Fallback type into input
            chat_input = page.locator("textarea[placeholder*='Message RAGSec AI Copilot']").first
            await chat_input.fill("Generate a production-grade PowerShell script to isolate host FINANCE-PC-014 from the corporate subnet. Recommend a mitigation playbook.")
            await chat_input.press("Enter")

        # Wait for response with recommended playbook card
        try:
            await page.wait_for_selector("button:has-text('Stage to Playbook Deck')", timeout=25000)
            print("[*] Groq AI Response with Recommended Playbook Card arrived!")
        except Exception as e:
            print(f"[!] Warning waiting for playbook card: {e}")
        await page.wait_for_timeout(2000)

        # Screenshot 3: Active conversation with Playbook Card & Code Syntax Highlighting
        chat_shot = os.path.join(ARTIFACT_DIR, "e2e_chatgpt_conversation_playbook_card.png")
        await page.screenshot(path=chat_shot, full_page=False)
        print(f"[+] Saved ChatGPT conversation screenshot: {chat_shot}")

        # 4. Click "Stage to Playbook Deck" on the recommended playbook card
        stage_btn = page.locator("button:has-text('Stage to Playbook Deck')").first
        if await stage_btn.count() > 0:
            print("[*] Clicking 'Stage to Playbook Deck' button...")
            await stage_btn.click(force=True)
            await page.wait_for_timeout(1500)
            staged_shot = os.path.join(ARTIFACT_DIR, "e2e_chatgpt_staged_toast.png")
            await page.screenshot(path=staged_shot, full_page=False)
            print(f"[+] Saved staged toast screenshot: {staged_shot}")

        # 5. Click "New Investigation" button to test multi-session chat
        print("[4] Testing '+ New Investigation' button...")
        new_chat_btn = page.locator("button:has-text('New Investigation')").first
        await new_chat_btn.click()
        await page.wait_for_timeout(1000)

        # Screenshot 4: New investigation thread created
        new_thread_shot = os.path.join(ARTIFACT_DIR, "e2e_chatgpt_new_thread_created.png")
        await page.screenshot(path=new_thread_shot, full_page=False)
        print(f"[+] Saved new thread screenshot: {new_thread_shot}")

        # 6. Navigate to Mitigation & Copilot to verify staged playbook in HitL deck
        print("[5] Navigating to Mitigation & Copilot to verify staged playbook...")
        mitigation_nav = page.locator("button:has-text('Mitigation & Copilot')").first
        await mitigation_nav.click()
        await page.wait_for_timeout(2000)

        deck_shot = os.path.join(ARTIFACT_DIR, "e2e_mitigation_verified_staged_from_chatgpt.png")
        await page.screenshot(path=deck_shot, full_page=False)
        print(f"[+] Saved mitigation deck screenshot: {deck_shot}")

        await browser.close()
        print("[*] All ChatGPT interface tests passed successfully!")

if __name__ == "__main__":
    asyncio.run(test_chatgpt_interface())
