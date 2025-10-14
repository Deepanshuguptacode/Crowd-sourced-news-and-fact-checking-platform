# Test Face Authentication Fix
# Simple test to verify the embedding extraction works

import requests
import json

# Test image (minimal base64)
test_image = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/wAALCAABAAEBAREA/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="

print("🧪 Testing Face Authentication Fix...")
print("="*50)

# Test 1: Check if Face-authorization-System is running
try:
    response = requests.get("http://127.0.0.1:5000/api/status", timeout=5)
    print("✅ Face-authorization-System: Running")
    print(f"   Response: {response.json()}")
except Exception as e:
    print(f"❌ Face-authorization-System: {e}")
    exit(1)

# Test 2: Check if backend is running  
try:
    response = requests.get("http://localhost:3001/health", timeout=5)
    print("✅ Backend API: Running")
except Exception as e:
    print(f"❌ Backend API: {e}")
    exit(1)

# Test 3: Test face embedding extraction
print("\n🔍 Testing face embedding extraction...")
try:
    response = requests.post("http://127.0.0.1:5000/api/extract_embedding", 
                           json={"image": test_image}, 
                           timeout=30)
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            embedding = data.get('embedding', [])
            print(f"✅ Face embedding extraction: Success")
            print(f"   Embedding length: {len(embedding)}")
            print(f"   First 5 values: {embedding[:5]}")
            print(f"   Data type: {type(embedding[0]) if embedding else 'N/A'}")
        else:
            print(f"❌ Face embedding extraction: {data.get('message')}")
    else:
        print(f"❌ Face embedding extraction: HTTP {response.status_code}")
        
except Exception as e:
    print(f"❌ Face embedding extraction: {e}")

print("\n✨ Test complete! If embedding extraction works, the fix is successful.")
print("Now you can test signup in the frontend at http://localhost:5173")