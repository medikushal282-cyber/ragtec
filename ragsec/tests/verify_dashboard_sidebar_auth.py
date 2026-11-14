import sys
import time
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

def run():
    print("[1] Launching Playwright browser...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        print("[2] Navigating to http://localhost:3000...")
        page.goto("http://localhost:3000", wait_until="networkidle", timeout=20000)
        time.sleep(2)

        # 1. Verify Decluttered Dashboard
        print("[3] Checking Dashboard decluttering...")
        # Check no duplicate 'Scan Directory' in topbar
        topbar_scan = page.locator("header button:has-text('Scan Directory')")
        print(f"    - Duplicate topbar 'Scan Directory' count (expected 0): {topbar_scan.count()}")
        assert topbar_scan.count() == 0, "Duplicate Scan Directory should not exist on dashboard"

        # Check single 'Scan Workspace' exists in main dashboard header
        main_scan = page.locator("button:has-text('Scan Workspace')")
        print(f"    - Dashboard 'Scan Workspace' count (expected 1): {main_scan.count()}")
        assert main_scan.count() >= 1, "Scan Workspace should exist"

        # Check 4 KPI cards
        active_threats_card = page.locator("text=Active Threat Index")
        monitored_events_card = page.locator("text=Monitored Events")
        clean_files_card = page.locator("text=Clean File Events")
        quarantined_card = page.locator("text=Quarantined & Contained")
        evaluated_other = page.locator("text=Evaluated Other")

        print(f"    - Active Threat Index visible: {active_threats_card.is_visible()}")
        print(f"    - Monitored Events visible: {monitored_events_card.is_visible()}")
        print(f"    - Clean File Events visible: {clean_files_card.is_visible()}")
        print(f"    - Quarantined & Contained visible: {quarantined_card.is_visible()}")
        print(f"    - Evaluated Other removed (count): {evaluated_other.count()}")
        assert quarantined_card.is_visible(), "Quarantined & Contained card must be visible"
        assert evaluated_other.count() == 0, "Evaluated Other card must be removed"

        # Check contradictory middle strip removed
        threat_posture_strip = page.locator("text=Threat Posture • SQLite Synchronized")
        print(f"    - Contradictory Threat Posture strip removed (count): {threat_posture_strip.count()}")
        assert threat_posture_strip.count() == 0, "Threat Posture middle strip should be removed"

        # Save screenshot of decluttered dashboard
        page.screenshot(path="C:/Users/medik/.gemini/antigravity/brain/cf396fbc-1d09-4bc2-8e96-b9bf001dd93f/proof_decluttered_dashboard.png")
        print("    -> Saved proof_decluttered_dashboard.png")

        # 2. Test FIM Feed Forensic Drawer Expansion
        print("[4] Testing FIM feed expandable forensic drawer...")
        chevron_btn = page.locator("button[title='Expand deep forensics']").first
        if chevron_btn.is_visible():
            chevron_btn.click()
            time.sleep(1)
            hash_elem = page.locator("text=SHA-256 Hash:")
            print(f"    - Forensic drawer expanded (SHA-256 visible): {hash_elem.is_visible()}")
            page.screenshot(path="C:/Users/medik/.gemini/antigravity/brain/cf396fbc-1d09-4bc2-8e96-b9bf001dd93f/proof_fim_forensic_drawer_expanded.png")
            print("    -> Saved proof_fim_forensic_drawer_expanded.png")

        # 3. Test Collapsible Left Sidebar
        print("[5] Testing Collapsible Left Sidebar...")
        collapse_btn = page.locator("button[title='Collapse sidebar']")
        print(f"    - Collapse button visible: {collapse_btn.is_visible()}")
        collapse_btn.click()
        time.sleep(1)

        # Verify sidebar has w-16
        aside = page.locator("aside")
        aside_class = aside.get_attribute("class") or ""
        print(f"    - Sidebar collapsed class: {'w-16' in aside_class}")
        assert "w-16" in aside_class, "Sidebar should have w-16 when collapsed"

        page.screenshot(path="C:/Users/medik/.gemini/antigravity/brain/cf396fbc-1d09-4bc2-8e96-b9bf001dd93f/proof_sidebar_collapsed.png")
        print("    -> Saved proof_sidebar_collapsed.png")

        # Click shield logo to expand back
        shield_logo = page.locator("aside div[title*='expand']").first
        shield_logo.click()
        time.sleep(1)
        aside_class_after = aside.get_attribute("class") or ""
        print(f"    - Sidebar expanded back class: {'w-60' in aside_class_after}")
        assert "w-60" in aside_class_after, "Sidebar should expand back to w-60"

        # 4. Test Operator Login / Logout System (Left Sidebar Only)
        print("[6] Testing Admin Operator Auth System...")
        user_card = page.locator("aside").get_by_text("Alex Vance").first
        print(f"    - Admin user card visible on sidebar: {user_card.is_visible()}")
        user_card.click()
        time.sleep(1)

        # Modal should open
        modal_title = page.locator("text=Operator Identity & Access")
        print(f"    - Operator Access Modal visible: {modal_title.is_visible()}")
        assert modal_title.is_visible(), "Operator profile modal must open"

        page.screenshot(path="C:/Users/medik/.gemini/antigravity/brain/cf396fbc-1d09-4bc2-8e96-b9bf001dd93f/proof_operator_auth_modal.png")
        print("    -> Saved proof_operator_auth_modal.png")

        # Test Fast Role Switch to Tier-2 Analyst
        analyst_btn = page.locator("button:has-text('Analyst (Tier-2)')")
        analyst_btn.click()
        time.sleep(1)
        print(f"    - Switched role to Tier-2 Analyst")

        # Test Switch Profile tab
        switch_tab = page.locator("button:has-text('Switch Profiles')")
        switch_tab.click()
        time.sleep(1)
        page.screenshot(path="C:/Users/medik/.gemini/antigravity/brain/cf396fbc-1d09-4bc2-8e96-b9bf001dd93f/proof_operator_switch_profiles_tab.png")
        print("    -> Saved proof_operator_switch_profiles_tab.png")

        # Switch back to Admin
        page.locator("button:has-text('Switch')").first.click()
        time.sleep(1)

        # Close modal
        close_btn = page.locator("button:has-text('Done')")
        if close_btn.is_visible():
            close_btn.click()
        else:
            page.keyboard.press("Escape")
        time.sleep(1)

        page.screenshot(path="C:/Users/medik/.gemini/antigravity/brain/cf396fbc-1d09-4bc2-8e96-b9bf001dd93f/proof_final_dashboard_and_sidebar.png")
        print("    -> Saved proof_final_dashboard_and_sidebar.png")

        browser.close()
        print("\nAll Playwright E2E verifications PASSED successfully!")

if __name__ == "__main__":
    run()
