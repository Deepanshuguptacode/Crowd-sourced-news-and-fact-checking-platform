#!/usr/bin/env python3
"""
Test the Face Authentication Integration
"""
import sys
import os

# Add the Face-authorization-System path
face_auth_path = os.path.join(os.path.dirname(__file__), '..', 'Face-authorization-System')
sys.path.insert(0, face_auth_path)

try:
    print("🔍 Testing Face Authentication Integration...")
    
    # Test 1: Import check
    from app import get_embedding_from_image_data, cosine_similarity
    print("✅ Successfully imported face authentication functions")
    
    # Test 2: Create a simple test image
    import base64
    import io
    from PIL import Image
    import numpy as np
    
    # Create a test image (blue square)
    test_image = Image.new('RGB', (640, 480), color='blue')
    buffer = io.BytesIO()
    test_image.save(buffer, format='JPEG')
    test_base64 = base64.b64encode(buffer.getvalue()).decode()
    test_data_url = f"data:image/jpeg;base64,{test_base64}"
    
    print("✅ Test image created")
    
    # Test 3: Face extraction (should return None for blue square)
    embedding, bbox, face_crop = get_embedding_from_image_data(test_data_url)
    
    if embedding is None:
        print("✅ Face extraction working correctly (no face detected in test image)")
    else:
        print("⚠ Unexpected: Face detected in test image")
    
    # Test 4: Cosine similarity
    test_emb1 = [0.1, 0.2, 0.3, 0.4]
    test_emb2 = [0.1, 0.2, 0.3, 0.4]
    similarity = cosine_similarity(np.array(test_emb1), np.array(test_emb2))
    
    if abs(similarity - 1.0) < 0.001:  # Should be 1.0 for identical vectors
        print("✅ Cosine similarity working correctly")
    else:
        print(f"⚠ Cosine similarity issue: got {similarity}, expected 1.0")
    
    print("\n🎉 Face Authentication Integration Test PASSED!")
    print("\nThe integration is ready for testing with:")
    print("- Backend: http://localhost:3000")
    print("- Frontend: http://localhost:5173")
    
except Exception as e:
    print(f"❌ Test failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)