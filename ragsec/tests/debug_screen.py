from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    page = b.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://localhost:3000", wait_until="networkidle")
    time.sleep(2)
    
    # Click on sidebar button
    page.get_by_text("AI Threat Scanner").click()
    time.sleep(2)
    page.screenshot(path=r"C:\Users\medik\.gemini\antigravity\brain\cf396fbc-1d09-4bc2-8e96-b9bf001dd93f\debug_scanner.png")
    print("AI Threat Scanner screenshot taken")

    # See all buttons on the page
    buttons = page.locator("button").all_inner_texts()
    print("Buttons found:", buttons[:20])

    # Try clicking File Explorer
    for btn in page.locator("button").all():
        txt = btn.inner_text().strip()
        if "Explorer" in txt:
            print("Found explorer button:", txt)
            btn.click()
            time.sleep(2)
            page.screenshot(path=r"C:\Users\medik\.gemini\antigravity\brain\cf396fbc-1d09-4bc2-8e96-b9bf001dd93f\debug_explorer.png")
            print("debug_explorer.png taken")
            break

    b.close()
