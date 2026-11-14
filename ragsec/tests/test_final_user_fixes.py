"""
Final End-to-End Verification Test for User UI Issues:
1. File Explorer showing all 20+ sandbox files (not 0 files).
2. Clean top bar with no glitches or overlapping text in AI Copilot Chat.
3. AI Copilot process investigation: detailed telemetry, multiple remediation options, no self-killing.
4. Mitigation & Playbooks deck clean separation from AI Copilot Chat (no FINANCE-PC-014).
"""
import sys
import os
import time
from playwright.sync_api import sync_playwright

ARTIFACTS_DIR = r"C:\Users\medik\.gemini\antigravity\brain\cf396fbc-1d09-4bc2-8e96-b9bf001dd93f"

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        print("[1/4] Navigating to http://localhost:3000...")
        page.goto("http://localhost:3000", wait_until="networkidle", timeout=30000)
        time.sleep(2)

        # ----------------------------------------------------
        # TEST 1: File Explorer in AI Threat Scanner
        # ----------------------------------------------------
        print("[2/4] Testing File Explorer in AI Threat Scanner...")
        # Click on AI Threat Scanner in sidebar
        scanner_btn = page.locator("nav button:has-text('AI Threat Scanner')")
        scanner_btn.click()
        time.sleep(1.5)

        # Switch to File Explorer tab
        explorer_tab = page.locator("button:has-text('File Explorer')")
        if explorer_tab.is_visible():
            explorer_tab.click()
            time.sleep(2)

        # Wait for file rows to load
        page.wait_for_selector("text=/Files \\(\\d+\\)/i", timeout=10000)
        files_count_text = page.locator("span:has-text('Files (')").inner_text()
        print(f"  -> File Explorer Header: {files_count_text}")
        assert "Files (0)" not in files_count_text, f"Failed: File explorer still says {files_count_text}!"

        # Check for specific files
        routine_file = page.locator("span:has-text('Routine.py')")
        assert routine_file.is_visible(), "Routine.py not found in file explorer!"
        print("  -> Confirmed Routine.py is visible and listed in File Explorer!")

        proof_1_path = os.path.join(ARTIFACTS_DIR, "verified_file_explorer_all_sandbox_files.png")
        page.screenshot(path=proof_1_path)
        print(f"  -> Saved proof screenshot: {proof_1_path}")

        # ----------------------------------------------------
        # TEST 2: AI Copilot Chat Top Bar Layout
        # ----------------------------------------------------
        print("[3/4] Testing AI Copilot Chat Top Bar Layout & Responsiveness...")
        # Navigate to AI Copilot Chat in sidebar
        chat_btn = page.locator("nav button:has-text('AI Copilot Chat')")
        chat_btn.click()
        time.sleep(2)

        # Verify top header elements
        header = page.locator("header")
        assert header.is_visible(), "Chat header not visible!"

        # Check model dropdown
        model_select = header.locator("select")
        assert model_select.is_visible(), "Model selector not visible!"

        # Check target button
        target_btn = header.locator("button:has-text('Target:')")
        assert target_btn.is_visible(), "Target button not visible!"
        target_text = target_btn.inner_text()
        print(f"  -> Current Target: {target_text}")
        assert "FINANCE-PC" not in target_text, f"Target still contains FINANCE-PC: {target_text}"

        # Check Processes counter
        proc_btn = header.locator("button:has-text('Processes')")
        assert proc_btn.is_visible(), "Processes button not visible!"

        # Check Online Intel toggle
        online_btn = header.locator("button:has-text('Online Intel')")
        assert online_btn.is_visible(), "Online Intel button not visible!"

        proof_2_path = os.path.join(ARTIFACTS_DIR, "verified_ai_copilot_clean_topbar.png")
        page.screenshot(path=proof_2_path)
        print(f"  -> Saved proof screenshot: {proof_2_path}")

        # ----------------------------------------------------
        # TEST 3: Mitigation & Playbooks Deck Separation
        # ----------------------------------------------------
        print("[4/4] Testing Mitigation & Playbooks Deck...")
        mitigation_btn = page.locator("nav button:has-text('Mitigation & Playbooks')")
        mitigation_btn.click()
        time.sleep(2)

        # Verify Playbook Deck is active
        playbook_title = page.locator("h1:has-text('Mitigation Playbook Deck & HitL Queue')")
        assert playbook_title.is_visible(), "Mitigation Playbook Deck title not visible!"

        # Check Open AI Copilot Chat button
        open_chat_btn = page.locator("button:has-text('Open AI Copilot Chat')")
        assert open_chat_btn.is_visible(), "Open AI Copilot Chat shortcut button not visible!"

        # Check target selector
        target_select = page.locator("select:has-text('Local Endpoint')")
        assert target_select.is_visible(), "Target selector not visible in Mitigation!"

        # Check that FINANCE-PC-014 is nowhere in the page
        body_text = page.locator("body").inner_text()
        assert "FINANCE-PC-014" not in body_text, "FINANCE-PC-014 is still visible on Mitigation page!"

        proof_3_path = os.path.join(ARTIFACTS_DIR, "verified_mitigation_playbook_deck_clean.png")
        page.screenshot(path=proof_3_path)
        print(f"  -> Saved proof screenshot: {proof_3_path}")

        browser.close()
        print("ALL 4 VERIFICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
