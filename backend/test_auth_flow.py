import urllib.request
import urllib.error
import json
import time

BASE_URL = "http://localhost:10000/api"

def make_request(path, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    url = f"{BASE_URL}{path}"
    
    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
        
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            err_body = json.loads(e.read().decode("utf-8"))
        except Exception:
            err_body = e.reason
        return e.code, err_body
    except Exception as e:
        return 0, str(e)

def run_tests():
    print("Starting backend authentication flow tests...")
    
    # Generate unique test username
    username = f"testuser_{int(time.time())}"
    password = "secretpassword123"
    
    # 1. Test registration
    print("\n1. Testing User Registration...")
    status, body = make_request("/auth/register", "POST", {"username": username, "password": password})
    print(f"Status: {status}")
    print(f"Body: {body}")
    assert status == 201, "Registration failed"
    assert body["username"] == username, "Username mismatch"
    
    # 2. Test registration duplicate
    print("\n2. Testing Duplicate User Registration...")
    status, body = make_request("/auth/register", "POST", {"username": username, "password": password})
    print(f"Status: {status} (Expected: 400)")
    print(f"Body: {body}")
    assert status == 400, "Duplicate registration should fail"
    
    # 3. Test login
    print("\n3. Testing User Login...")
    status, body = make_request("/auth/login", "POST", {"username": username, "password": password})
    print(f"Status: {status}")
    print(f"Body: {body}")
    assert status == 200, "Login failed"
    assert "access_token" in body, "Access token missing"
    assert "refresh_token" in body, "Refresh token missing"
    
    access_token = body["access_token"]
    refresh_token = body["refresh_token"]
    
    # 4. Test accessing protected endpoint without token
    print("\n4. Testing Protected Endpoint without Token...")
    status, body = make_request("/expenses", "GET")
    print(f"Status: {status} (Expected: 403 or 401)")
    print(f"Body: {body}")
    assert status in (401, 403), "Accessing protected endpoint without token should fail"
    
    # 5. Test accessing protected endpoint with valid token
    print("\n5. Testing Protected Endpoint with Token...")
    status, body = make_request("/expenses", "GET", headers={"Authorization": f"Bearer {access_token}"})
    print(f"Status: {status}")
    print(f"Number of expenses returned: {len(body)}")
    assert status == 200, "Accessing protected endpoint failed"
    
    # 6. Test token refresh
    print("\n6. Testing Token Refresh...")
    status, body = make_request("/auth/refresh", "POST", {"refresh_token": refresh_token})
    print(f"Status: {status}")
    print(f"Body: {body}")
    assert status == 200, "Token refresh failed"
    assert "access_token" in body, "New access token missing"
    
    new_access_token = body["access_token"]
    
    # 7. Verify new access token works
    print("\n7. Testing Protected Endpoint with Refreshed Token...")
    status, body = make_request("/expenses", "GET", headers={"Authorization": f"Bearer {new_access_token}"})
    print(f"Status: {status}")
    assert status == 200, "Accessing protected endpoint with refreshed token failed"
    
    # 8. Test user profile /auth/me
    print("\n8. Testing User Profile Profile Info (/auth/me)...")
    status, body = make_request("/auth/me", "GET", headers={"Authorization": f"Bearer {new_access_token}"})
    print(f"Status: {status}")
    print(f"Body: {body}")
    assert status == 200, "Failed to get user profile"
    assert body["username"] == username, "Username mismatch in profile"
    
    # 9. Test logout
    print("\n9. Testing Logout...")
    status, body = make_request("/auth/logout", "POST", headers={"Authorization": f"Bearer {new_access_token}"})
    print(f"Status: {status}")
    print(f"Body: {body}")
    assert status == 200, "Logout failed"
    
    # 10. Test that refresh token is now invalidated
    print("\n10. Testing Refresh Token Invalidation after Logout...")
    status, body = make_request("/auth/refresh", "POST", {"refresh_token": refresh_token})
    print(f"Status: {status} (Expected: 401)")
    print(f"Body: {body}")
    assert status == 401, "Refresh token should be invalid after logout"
    
    print("\nAll authentication flow tests completed successfully!")

if __name__ == "__main__":
    try:
        run_tests()
    except AssertionError as e:
        print(f"\nTest Assertion Failed: {e}")
    except Exception as e:
        print(f"\nTest Run Error: {e}")
