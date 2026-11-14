import requests
import json

def test():
    print("[1] Querying /api/processes...")
    res = requests.get("http://127.0.0.1:8000/api/processes")
    assert res.status_code == 200
    data = res.json()
    processes = data.get("processes", [])
    print(f"Total processes returned: {len(processes)}, Suspicious count: {data.get('suspicious_count')}")

    # Find the python uvicorn process
    backend_proc = None
    for p in processes:
        if "uvicorn" in p.get("cmdline", "").lower() or p.get("category") == "RAGSEC_PLATFORM":
            backend_proc = p
            break

    assert backend_proc is not None, "RAGSec Backend process must be discovered!"
    print(f"Found Backend Process: PID {backend_proc['pid']} | Name: {backend_proc['name']}")
    print(f"  Category: {backend_proc.get('category')}")
    print(f"  Role: {backend_proc.get('functional_role')}")
    print(f"  Is Suspicious: {backend_proc.get('is_suspicious')}")
    print(f"  Can Terminate: {backend_proc.get('can_terminate')}")

    assert backend_proc.get("category") == "RAGSEC_PLATFORM", "Must be categorized as RAGSEC_PLATFORM!"
    assert backend_proc.get("is_suspicious") is False, "Platform core must NOT be flagged as suspicious!"
    assert backend_proc.get("can_terminate") is False, "Platform core must NOT be terminable!"

    # 2. Test deep analysis endpoint
    print(f"\n[2] Testing /api/processes/{backend_proc['pid']}/deep-analysis...")
    res_deep = requests.get(f"http://127.0.0.1:8000/api/processes/{backend_proc['pid']}/deep-analysis")
    assert res_deep.status_code == 200
    deep_data = res_deep.json()
    print("Deep Analysis Verdict:", deep_data.get("verdict"))
    print("Verdict Text:", deep_data.get("verdict_text"))
    print("Remediation Options count:", len(deep_data.get("remediation_options", [])))
    for opt in deep_data.get("remediation_options", []):
        print(f"  Option {opt['option']}: {opt['title']} - {opt['action']} (Disabled: {opt.get('disabled', False)})")

    assert deep_data.get("verdict") == "VERIFIED_PLATFORM_CORE"
    assert len(deep_data.get("remediation_options", [])) >= 4

    # 3. Test safety guard on terminate
    print(f"\n[3] Testing safety guard when attempting to terminate RAGSec platform PID {backend_proc['pid']}...")
    res_term = requests.post("http://127.0.0.1:8000/api/processes/terminate", json={
        "pid": backend_proc['pid'],
        "reason": "Test attack"
    })
    print(f"Termination attempt HTTP Status: {res_term.status_code}")
    print(f"Detail: {res_term.json().get('detail')}")
    assert res_term.status_code == 403, "Must reject termination with HTTP 403!"

    # 4. Test AI Copilot response to process investigation query
    print("\n[4] Testing AI Copilot Process Investigation Response...")
    prompt = (
        f"Investigate running process PID {backend_proc['pid']} ({backend_proc['name']}): "
        f"Role: \"{backend_proc.get('functional_role')}\". "
        f"Command line: \"{backend_proc['cmdline']}\". "
        f"Resource usage: {backend_proc['cpu_percent']}% CPU, {backend_proc['memory_mb']}MB RAM. "
        f"Analyze its true functional purpose, evaluate whether it is legitimate software, developer workload, or harmful, "
        f"and provide proportional remediation and management options rather than just asking to terminate it."
    )
    res_ai = requests.post("http://127.0.0.1:8000/api/chat/step-helper", json={
        "message": prompt,
        "search_online": False,
        "model": "openai/gpt-oss-120b"
    })
    assert res_ai.status_code == 200
    ai_data = res_ai.json()
    reply = ai_data.get("reply", "")
    playbook = ai_data.get("recommended_playbook")

    print("\n--- AI COPILOT INVESTIGATION RESPONSE PREVIEW ---")
    print(reply[:800].encode('ascii', 'ignore').decode())
    print("\nAttached Playbook:", playbook)

    # Assertions
    reply_lower = reply.lower()
    assert "ragsec" in reply_lower or "core" in reply_lower or "api" in reply_lower, "AI must recognize RAGSec backend!"
    assert "not be terminated" in reply_lower or "do not terminate" in reply_lower or "legitimate" in reply_lower or "safe" in reply_lower or "platform" in reply_lower
    # Must NOT have attached a PROCESS_TERMINATION playbook
    if playbook:
        assert playbook.get("action_type") != "PROCESS_TERMINATION", "Must NOT synthesize PROCESS_TERMINATION for RAGSec backend!"

    print("\n[SUCCESS] Deep Process Investigation & Platform Safety Guard PASSED flawlessly!")

if __name__ == "__main__":
    test()
