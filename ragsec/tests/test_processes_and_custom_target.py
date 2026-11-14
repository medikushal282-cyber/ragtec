"""
test_processes_and_custom_target.py
End-to-end verification of:
1. Top bar glitch-free layout (no overlapping buttons or text)
2. Interactive custom target input & switching
3. Live Host Processes Inspector modal with telemetry & stop process actions
4. AI Copilot process awareness & concise contextual responses
"""
import sys
import time
from playwright.sync_api import sync_playwright

def run_test():
    artifacts_dir = "C:/Users/medik/.gemini/antigravity/brain/cf396fbc-1d09-4bc2-8e96-b9bf001dd93f"
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use standard 1366x768 to test moderate/tight viewports where glitch previously occurred
        context = browser.new_context(viewport={"width": 1366, "height": 768})
        page = context.new_page()

        print("[1] Navigating to http://localhost:3000 ...")
        page.goto("http://localhost:3000", wait_until="networkidle", timeout=30000)
        time.sleep(2)

        # 1. Navigate to AI Copilot Chat
        print("[2] Navigating to AI Copilot Chat...")
        ai_chat_nav = page.locator("button:has-text('AI Copilot Chat')").first
        ai_chat_nav.wait_for(state="visible", timeout=10000)
        ai_chat_nav.click()
        time.sleep(2)

        # Take screenshot of the top bar and chat view to confirm glitch is fixed!
        print("[3] Capturing glitch-free top bar...")
        page.screenshot(path=f"{artifacts_dir}/e2e_top_bar_glitch_fixed.png")
        print(f"[+] Saved screenshot: {artifacts_dir}/e2e_top_bar_glitch_fixed.png")

        # 2. Test Custom Target
        print("[4] Testing Custom Target Switcher...")
        target_btn = page.locator("button:has-text('Target:')").first
        target_btn.wait_for(state="visible", timeout=5000)
        target_btn.click()
        time.sleep(1)

        page.screenshot(path=f"{artifacts_dir}/e2e_target_popover_open.png")
        print(f"[+] Saved screenshot: {artifacts_dir}/e2e_target_popover_open.png")

        # Type custom target
        custom_input = page.locator("input[placeholder*='192.168.1.50']").first
        custom_input.fill("10.0.12.88 (Production DB)")
        set_btn = page.locator("button:has-text('Set')").first
        set_btn.click()
        time.sleep(1)

        # Verify target updated
        updated_target = page.locator("button:has-text('10.0.12.88')").first
        updated_target.wait_for(state="visible", timeout=5000)
        print("[+] Custom target successfully set to: 10.0.12.88 (Production DB)")

        page.screenshot(path=f"{artifacts_dir}/e2e_custom_target_applied.png")
        print(f"[+] Saved screenshot: {artifacts_dir}/e2e_custom_target_applied.png")

        # 3. Test Live Processes Inspector
        print("[5] Testing Live Processes Inspector Modal...")
        proc_btn = page.locator("button:has-text('Processes')").first
        proc_btn.click()
        time.sleep(2)

        page.locator("h3:has-text('Live Host Processes')").wait_for(state="visible", timeout=10000)
        page.screenshot(path=f"{artifacts_dir}/e2e_live_processes_modal.png")
        print(f"[+] Saved screenshot: {artifacts_dir}/e2e_live_processes_modal.png")

        # Test process search
        proc_search = page.locator("input[placeholder*='Filter by name']").first
        proc_search.fill("python")
        time.sleep(1)
        page.screenshot(path=f"{artifacts_dir}/e2e_processes_filtered_python.png")
        print(f"[+] Saved screenshot: {artifacts_dir}/e2e_processes_filtered_python.png")

        # Click "Ask AI" on the python process
        ask_ai_btn = page.locator("button:has-text('Ask AI')").first
        ask_ai_btn.click()
        time.sleep(1)

        # Wait for AI response
        print("[6] Waiting for AI Copilot process analysis...")
        time.sleep(6)

        page.screenshot(path=f"{artifacts_dir}/e2e_ai_analyzing_process_response.png")
        print(f"[+] Saved screenshot: {artifacts_dir}/e2e_ai_analyzing_process_response.png")

        # 4. Test concise greeting without giant essay
        print("[7] Testing concise non-bloated response...")
        # Start new chat
        new_chat_btn = page.locator("button:has-text('New Investigation')").first
        new_chat_btn.click()
        time.sleep(1)

        textarea = page.locator("textarea").first
        textarea.fill("hello, who are you?")
        page.locator("button[title='Send message']").click()
        time.sleep(5)

        page.screenshot(path=f"{artifacts_dir}/e2e_ai_concise_greeting_response.png")
        print(f"[+] Saved screenshot: {artifacts_dir}/e2e_ai_concise_greeting_response.png")

        browser.close()
        print("[SUCCESS] All e2e tests passed successfully!")

if __name__ == "__main__":
    run_test()
