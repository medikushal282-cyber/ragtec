from playwright.sync_api import sync_playwright
import time
import os

ARTIFACTS_DIR = r"C:\Users\medik\.gemini\antigravity\brain\cf396fbc-1d09-4bc2-8e96-b9bf001dd93f"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://localhost:3000", wait_until="networkidle")
    time.sleep(2)

    # Open AI Copilot Chat
    page.get_by_text("AI Copilot Chat").click()
    time.sleep(2)

    # Send a message to investigate uvicorn backend
    input_box = page.locator("textarea[placeholder*='Message RAGSec AI Copilot']")
    input_box.fill("Analyze running process PID 13672")
    page.keyboard.press("Enter")
    
    # Wait for assistant reply
    time.sleep(10)

    proof = os.path.join(ARTIFACTS_DIR, "verified_ai_balanced_remediation_response.png")
    page.screenshot(path=proof)
    print(f"Chat response proof saved to {proof}")

    # Check text
    body_text = page.locator("body").inner_text()
    print("Chat response snippet:\n", body_text[-800:])
    
    browser.close()
