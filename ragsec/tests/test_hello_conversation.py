import requests

def test_chat():
    # 1. Test step-helper with Hello
    res1 = requests.post("http://127.0.0.1:8000/api/chat/step-helper", json={
        "message": "Hello",
        "search_online": False,
        "model": "openai/gpt-oss-120b"
    })
    print("STEP HELPER STATUS:", res1.status_code)
    data1 = res1.json()
    reply1 = data1.get("reply", "")
    print("STEP HELPER REPLY PREVIEW:\n", reply1[:250].encode('ascii', 'ignore').decode())
    assert len(reply1) < 600, "Greeting response should be concise, not an essay!"

    # 2. Test chat-mitigation with Hello
    res2 = requests.post("http://127.0.0.1:8000/api/analysis/chat-mitigation", json={
        "message": "Hello",
        "model": "openai/gpt-oss-120b"
    })
    print("MITIGATION CHAT STATUS:", res2.status_code)
    data2 = res2.json()
    reply2 = data2.get("reply", "")
    print("MITIGATION CHAT REPLY PREVIEW:\n", reply2[:250].encode('ascii', 'ignore').decode())
    assert "Immediate \"Isolate-First\" Actions" not in reply2, "Must not dump canned ransomware table on Hello!"

    print("[SUCCESS] Both chat endpoints respond conversationally without dumping giant tables!")

if __name__ == "__main__":
    test_chat()
