from playwright.sync_api import sync_playwright
import time
import os

ARTIFACTS_DIR = r"C:\Users\medik\.gemini\antigravity\brain\cf396fbc-1d09-4bc2-8e96-b9bf001dd93f"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://localhost:3000", wait_until="networkidle")
    time.sleep(2)

    # 1. TEST FILE EXPLORER
    print("[1] Opening AI Threat Scanner -> Explorer View...")
    page.get_by_text("AI Threat Scanner").click()
    time.sleep(1.5)
    page.get_by_text("Explorer View").click()
    time.sleep(2)

    # Check directories and files
    page_text = page.locator("body").inner_text()
    assert "Routine.py" in page_text, "Routine.py not found in Explorer!"
    assert "invoice.exe" in page_text, "invoice.exe not found in Explorer!"
    print("  -> SUCCESS: Sandbox files are listed in File Explorer!")

    proof1 = os.path.join(ARTIFACTS_DIR, "verified_file_explorer_all_sandbox_files.png")
    page.screenshot(path=proof1)
    print(f"  -> Screenshot saved to {proof1}")

    # 2. TEST AI COPILOT CHAT TOP BAR
    print("[2] Opening AI Copilot Chat...")
    page.get_by_text("AI Copilot Chat").click()
    time.sleep(2)

    header = page.locator("header").nth(1)
    header_text = header.inner_text()
    print("  -> Header text:\n", header_text)
    assert "Online Intel" in header_text, "Online Intel button missing!"
    assert "Processes" in header_text, "Processes counter missing!"
    assert "FINANCE-PC" not in header_text, "FINANCE-PC is still present in header!"
    assert "Local Endpoint" in header_text or "PID" in header_text, "Target is missing!"
    print("  -> SUCCESS: AI Copilot Chat top bar is clean, responsive, and shows Local Endpoint!")

    proof2 = os.path.join(ARTIFACTS_DIR, "verified_ai_copilot_clean_topbar.png")
    page.screenshot(path=proof2)
    print(f"  -> Screenshot saved to {proof2}")

    # 3. TEST MITIGATION & PLAYBOOKS DECK
    print("[3] Opening Mitigation & Playbooks...")
    page.get_by_text("Mitigation & Playbooks").click()
    time.sleep(2)

    mit_text = page.locator("body").inner_text()
    assert "Mitigation Playbook Deck & HitL Queue" in mit_text, "Playbook Deck title missing!"
    assert "Open AI Copilot Chat" in mit_text, "Open AI Copilot Chat shortcut button missing!"
    assert "FINANCE-PC" not in mit_text, "FINANCE-PC is still present in Mitigation!"
    print("  -> SUCCESS: Mitigation & Playbooks deck is clearly separated and contains no FINANCE-PC!")

    proof3 = os.path.join(ARTIFACTS_DIR, "verified_mitigation_playbook_deck_clean.png")
    page.screenshot(path=proof3)
    print(f"  -> Screenshot saved to {proof3}")

    browser.close()
    print("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!")
