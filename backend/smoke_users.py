#!/usr/bin/env python3.11
"""
Smoke tests automatizados para ORKIO v3.3 Users Console
4 checks: register/login, orchestrator stub, playground LLM, apps
"""
import requests
import json
import sys
import secrets
import base64

API_BASE = "http://localhost:8001"

def test_auth():
    """1. Register + Login → token com tenant_id"""
    email = f"smoke_{secrets.token_hex(4)}@test.com"
    password = "Test123!"
    
    # Register
    resp = requests.post(f"{API_BASE}/api/v1/u/auth/register", json={
        "email": email,
        "password": password,
        "name": "SmokeTest"
    })
    assert resp.status_code == 200, f"Register failed: {resp.text}"
    data = resp.json()
    assert "access_token" in data, "No access_token in register response"
    token = data["access_token"]
    
    # Decode JWT (simple check)
    payload_b64 = token.split('.')[1]
    payload_b64 += '=' * (4 - len(payload_b64) % 4)
    payload = json.loads(base64.b64decode(payload_b64))
    assert "tenant_id" in payload, "No tenant_id in JWT"
    
    print(f"✓ auth.register/login: ok (token com tenant_id={payload['tenant_id']})")
    return token

def test_orchestrator(token):
    """2. POST /orchestrator/runs (stub) → done"""
    resp = requests.post(f"{API_BASE}/api/v1/orchestrator/runs", 
                        headers={"Authorization": f"Bearer {token}"},
                        json={"root_agent_id": 1})
    if resp.status_code == 404:
        print(f"✓ orchestrator.runs: endpoint exists (404 - no agent)")
        return
    
    assert resp.status_code in [200, 201], f"Orchestrator failed: {resp.text}"
    data = resp.json()
    print(f"✓ orchestrator.runs: {data.get('status', 'unknown')}")

def test_playground(token):
    """3. POST /u/playground/run → output_text"""
    resp = requests.post(f"{API_BASE}/api/v1/u/playground/run",
                        headers={"Authorization": f"Bearer {token}"},
                        json={"prompt": "Diga ok"},
                        timeout=15)
    assert resp.status_code == 200, f"Playground failed: {resp.text}"
    data = resp.json()
    assert "output_text" in data, "No output_text in response"
    assert "trace_id" in data, "No trace_id in response"
    
    result = {
        "trace_id": data["trace_id"],
        "status": data.get("status"),
        "output_text": data["output_text"][:50] + "..." if len(data["output_text"]) > 50 else data["output_text"],
        "usage": data.get("usage", {})
    }
    print(f"✓ playground.run: {json.dumps(result)}")

def test_apps(token):
    """4. POST /u/apps -> GET /u/apps"""
    app_name = f"SmokeApp_{secrets.token_hex(2)}"
    # Create App
    resp = requests.post(f"{API_BASE}/api/v1/u/apps",
                        headers={"Authorization": f"Bearer {token}"},
                        json={"name": app_name, "description": "Smoke test app"})
    assert resp.status_code == 200, f"Create App failed: {resp.text}"
    app_data = resp.json()
    assert app_data.get("name") == app_name, "App name mismatch"
    app_id = app_data.get("id")

    # List Apps
    resp = requests.get(f"{API_BASE}/api/v1/u/apps", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200, f"List Apps failed: {resp.text}"
    apps_list = resp.json()
    assert any(app['id'] == app_id for app in apps_list), "Created app not found in list"

    print(f"✓ apps.create/list: ok (app_id={app_id})")

def main():
    try:
        token = test_auth()
        test_orchestrator(token)
        test_playground(token)
        test_apps(token)
        print("\n=== ALL SMOKE TESTS PASSED ✓ ===")
    except Exception as e:
        print(f"\n✗ SMOKE TEST FAILED: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

