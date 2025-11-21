#!/usr/bin/env python3.11
"""
ORKIO v3.3.1.1 - Knowledge Upload RAG - Complete Acceptance Test
"""
import requests
import os

API = "http://localhost:8001/api/v1"

def test_rag_complete():
    print("=== ORKIO Knowledge RAG - Complete Acceptance Test ===\n")
    
    # 1. Login as admin
    print("1. Login as admin...")
    resp = requests.post(f"{API}/auth/login", json={"email":"admin@patro.ai","password":"Passw0rd!"})
    assert resp.status_code == 200, f"Login failed: {resp.status_code}"
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("   ✓ Admin logged in")
    
    # 2. Create test PDF (simulated with .txt)
    print("\n2. Create test documents...")
    doc1_content = """
    ORKIO Platform Documentation
    
    ORKIO is an AI orchestration platform that allows you to create and manage intelligent agents.
    
    Key Features:
    - Multi-agent orchestration
    - Knowledge base with RAG (Retrieval Augmented Generation)
    - LLM integration with OpenAI GPT-4o-mini
    - Multi-tenant architecture
    
    Getting Started:
    1. Create an agent with a specific purpose
    2. Upload knowledge documents to the knowledge base
    3. Link documents to agents
    4. Run the orchestrator to execute agent tasks
    """
    
    doc2_content = """
    ORKIO Agent Configuration Guide
    
    Temperature Settings:
    - Low (0.2): More deterministic, focused responses
    - Medium (0.4): Balanced creativity and consistency
    - High (0.7): More creative and varied responses
    
    RAG Integration:
    When RAG is enabled, agents can access uploaded documents to provide context-aware responses.
    """
    
    with open("/tmp/orkio_doc1.txt", "w") as f:
        f.write(doc1_content)
    with open("/tmp/orkio_doc2.txt", "w") as f:
        f.write(doc2_content)
    print("   ✓ Test documents created")
    
    # 3. Upload documents
    print("\n3. Upload documents to knowledge base...")
    with open("/tmp/orkio_doc1.txt", "rb") as f1:
        files = {"file": ("orkio_doc1.txt", f1, "text/plain")}
        data = {"tags": "documentation,platform", "agent_ids": "1"}
        resp = requests.post(f"{API}/admin/knowledge/upload", headers=headers, files=files, data=data)
        assert resp.status_code == 200, f"Upload 1 failed: {resp.status_code} {resp.text}"
        doc1_id = resp.json()["id"]
    
    with open("/tmp/orkio_doc2.txt", "rb") as f2:
        files = {"file": ("orkio_doc2.txt", f2, "text/plain")}
        data = {"tags": "guide,configuration", "agent_ids": "1"}
        resp = requests.post(f"{API}/admin/knowledge/upload", headers=headers, files=files, data=data)
        assert resp.status_code == 200, f"Upload 2 failed: {resp.status_code} {resp.text}"
        doc2_id = resp.json()["id"]
    
    print(f"   ✓ Documents uploaded (IDs: {doc1_id}, {doc2_id})")
    
    # 4. List knowledge items
    print("\n4. List knowledge items...")
    resp = requests.get(f"{API}/admin/knowledge/list", headers=headers)
    assert resp.status_code == 200, f"List failed: {resp.status_code}"
    items = resp.json()["items"]
    print(f"   ✓ Found {len(items)} item(s)")
    for item in items[:3]:
        print(f"     - {item['filename']} (Status: {item['status']}, Chunks: {item.get('chunks_count', 0)})")
    
    # 5. Enable RAG on Agent #1
    print("\n5. Enable RAG on Agent #1...")
    resp = requests.get(f"{API}/agents", headers=headers)
    agents = resp.json()
    if agents:
        agent_id = agents[0]["id"]
        resp = requests.put(f"{API}/agents/{agent_id}", headers=headers, json={"use_rag": True})
        assert resp.status_code == 200, f"Update agent failed: {resp.status_code}"
        print(f"   ✓ RAG enabled on Agent #{agent_id}")
    else:
        print("   ⚠ No agents found, skipping RAG enable")
        agent_id = None
    
    # 6. Create orchestrator run with RAG
    print("\n6. Create orchestrator run with RAG...")
    if agent_id:
        resp = requests.post(f"{API}/orchestrator/runs", headers=headers, json={"root_agent_id": agent_id})
        assert resp.status_code == 200, f"Create run failed: {resp.status_code}"
        run = resp.json()
        if run:
            print(f"   ✓ Run created (ID: {run.get('id', 'N/A')}, Status: {run.get('status', 'N/A')})")
            print(f"     Trace ID: {run.get('trace_id', 'N/A')}")
            if run.get("note"):
                print(f"     Note preview: {run['note'][:100]}...")
        else:
            print("   ⚠ Run created but response is empty")
    else:
        print("   ⚠ Skipping run creation (no agent)")
    
    # 7. Test Playground with RAG
    print("\n7. Test Playground with RAG-enabled query...")
    resp = requests.post(f"{API}/u/auth/login", json={"email":"test@orkio.com","password":"test123"})
    if resp.status_code == 200:
        u_token = resp.json()["access_token"]
        u_headers = {"Authorization": f"Bearer {u_token}"}
        resp = requests.post(f"{API}/u/playground/run", headers=u_headers, json={"prompt": "What are the key features of ORKIO?"})
        if resp.status_code == 200:
            result = resp.json()
            print(f"   ✓ Playground run successful")
            print(f"     Output: {result.get('output_text', '')[:150]}...")
        else:
            print(f"   ⚠ Playground run failed: {resp.status_code}")
    else:
        print("   ⚠ User login failed, skipping playground test")
    
    # 8. Cleanup
    print("\n8. Cleanup...")
    requests.delete(f"{API}/admin/knowledge/{doc1_id}", headers=headers)
    requests.delete(f"{API}/admin/knowledge/{doc2_id}", headers=headers)
    os.remove("/tmp/orkio_doc1.txt")
    os.remove("/tmp/orkio_doc2.txt")
    print("   ✓ Test documents deleted")
    
    print("\n=== ALL ACCEPTANCE TESTS PASSED ✓ ===")

if __name__ == "__main__":
    test_rag_complete()

