#!/usr/bin/env python3.11
"""
Teste de aceite: Knowledge Upload + RAG Multi-tenant
"""
import os
import sys
import requests

API_BASE = "http://localhost:8001/api/v1"

def test_knowledge_rag():
    print("=== ORKIO Knowledge RAG Test ===\n")
    
    # 1. Login Admin
    print("1. Login Admin...")
    resp = requests.post(f"{API_BASE}/auth/login", json={
        "email": "admin@patro.ai",
        "password": "Passw0rd!"
    })
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("   ✓ Token obtained")
    
    # 2. Create test document
    print("\n2. Create test document...")
    test_content = """
    ORKIO Platform Documentation
    
    ORKIO is an AI orchestration platform that enables multi-agent workflows.
    
    Key Features:
    - Multi-agent orchestration
    - Knowledge base with RAG
    - OpenAI integration
    - Multi-tenant architecture
    
    The platform supports automated agent chaining based on configurable links.
    """
    
    with open("/tmp/test_doc.txt", "w") as f:
        f.write(test_content)
    
    print("   ✓ Test document created")
    
    # 3. Upload document
    print("\n3. Upload document to knowledge base...")
    with open("/tmp/test_doc.txt", "rb") as f:
        files = {"file": ("test_doc.txt", f, "text/plain")}
        data = {"tags": "documentation,test", "agent_ids": "1"}
        resp = requests.post(
            f"{API_BASE}/admin/knowledge/upload",
            headers=headers,
            files=files,
            data=data
        )
    
    if resp.status_code != 200:
        print(f"   ✗ Upload failed: {resp.text}")
        return False
    
    item_id = resp.json()["id"]
    status = resp.json()["status"]
    print(f"   ✓ Document uploaded (ID: {item_id}, Status: {status})")
    
    # 4. List knowledge items
    print("\n4. List knowledge items...")
    resp = requests.get(f"{API_BASE}/admin/knowledge/list", headers=headers)
    assert resp.status_code == 200
    items = resp.json()["items"]
    print(f"   ✓ Found {len(items)} item(s)")
    
    if items:
        item = items[0]
        print(f"     - Filename: {item['filename']}")
        print(f"     - Status: {item['status']}")
        print(f"     - Chunks: {item['chunks_count']}")
    
    # 5. Enable RAG on agent
    print("\n5. Enable RAG on Agent #1...")
    resp = requests.put(f"{API_BASE}/agents/1", headers=headers, json={
        "name": "CEO",
        "purpose": "Lead the company",
        "temperature": 0.4,
        "use_rag": True
    })
    
    if resp.status_code != 200:
        print(f"   ✗ Failed to update agent: {resp.text}")
        return False
    
    print("   ✓ RAG enabled on Agent #1")
    
    # 6. Create run with RAG
    print("\n6. Create orchestrator run with RAG...")
    resp = requests.post(f"{API_BASE}/orchestrator/runs", headers=headers, json={
        "root_agent_id": 1,
        "depth": 0
    })
    
    if resp.status_code != 200:
        print(f"   ✗ Run creation failed: {resp.text}")
        return False
    
    run = resp.json()
    print(f"   ✓ Run created (ID: {run['id']}, Status: {run['status']})")
    print(f"     Trace ID: {run['trace_id']}")
    
    if run.get("note"):
        print(f"     Note preview: {run['note'][:100]}...")
    
    # 7. Cleanup
    print("\n7. Cleanup...")
    resp = requests.delete(f"{API_BASE}/admin/knowledge/{item_id}", headers=headers)
    if resp.status_code == 200:
        print("   ✓ Test document deleted")
    
    print("\n=== ALL TESTS PASSED ✓ ===")
    return True

if __name__ == "__main__":
    try:
        success = test_knowledge_rag()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n✗ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

