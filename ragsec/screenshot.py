import asyncio
import subprocess
import time
import os
from playwright.async_api import async_playwright

async def main():
    # Start the backend server correctly
    print("Starting backend server...")
    backend_process = subprocess.Popen(["python", "app.py"], cwd=os.path.abspath("backend"))
    
    print("Starting frontend server...")
    frontend_process = subprocess.Popen(["python", "-m", "http.server", "8080"], cwd=os.path.abspath("frontend"))
    
    # Give it a few seconds to start up
    time.sleep(5)
    
    frontend_path = "http://localhost:8080/"
    
    print(f"Opening {frontend_path}")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True
        )
        page = await browser.new_page(viewport={"width": 1280, "height": 800})
        page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))
        
        await page.goto(frontend_path)
        
        # Wait for API to return data and render
        try:
            await page.wait_for_selector("text=API ONLINE", timeout=5000)
            await page.wait_for_selector("#events-tbody tr", timeout=5000)
        except Exception as e:
            print("Warning: API might not be online or events didn't load.")
            print(e)
            
        # Take screenshot of the main screen (events view)
        screenshot1_path = "C:/Users/medik/.gemini/antigravity/scratch/AI-BRIDGE-SANDBOX/screenshots/soc_dashboard.png"
        await page.screenshot(path=screenshot1_path)
        print(f"Saved {screenshot1_path}")
        
        # Click "Active Incidents"
        await page.click("text=Active Incidents")
        await asyncio.sleep(2)
        
        # Take screenshot of incidents view
        screenshot2_path = "C:/Users/medik/.gemini/antigravity/scratch/AI-BRIDGE-SANDBOX/screenshots/soc_incidents.png"
        await page.screenshot(path=screenshot2_path)
        print(f"Saved {screenshot2_path}")
        
        # Click the first incident to open the workbench
        await page.click("#incidents-tbody tr:first-child")
        await asyncio.sleep(2)
        
        # Wait for the workbench to slide in
        await page.wait_for_selector("#inc-details")
        
        # Click "Run RAG Investigation"
        await page.click("text=Run RAG Investigation")
        
        # Wait for AI response
        try:
            await page.wait_for_selector("#ai-answer", state="visible", timeout=20000)
        except:
            print("Investigation took too long or failed.")
            
        await asyncio.sleep(2) # wait for render
        
        screenshot3_path = "C:/Users/medik/.gemini/antigravity/scratch/AI-BRIDGE-SANDBOX/screenshots/soc_investigation.png"
        await page.screenshot(path=screenshot3_path)
        print(f"Saved {screenshot3_path}")
        
        # Click "Approve Action"
        try:
            await page.click("text=Approve Action", timeout=3000)
            await asyncio.sleep(2)
        except:
            print("No Approve Action button.")
            
        # Click "Simulate Approved Execution"
        try:
            await page.click("text=Simulate Approved Execution", timeout=3000)
            await asyncio.sleep(2)
        except:
            print("No Execute button.")
            
        screenshot4_path = "C:/Users/medik/.gemini/antigravity/scratch/AI-BRIDGE-SANDBOX/screenshots/soc_mitigation.png"
        await page.screenshot(path=screenshot4_path)
        print(f"Saved {screenshot4_path}")
        
        await browser.close()
        
    print("Terminating servers...")
    backend_process.terminate()
    backend_process.wait()
    frontend_process.terminate()
    frontend_process.wait()

if __name__ == "__main__":
    asyncio.run(main())
