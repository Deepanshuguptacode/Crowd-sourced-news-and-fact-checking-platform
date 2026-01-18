#!/usr/bin/env python3
"""
Quick test script for Face Authentication Integration
Tests the core functionality without requiring full backend setup
"""
import sys
import os
import json
import base64
import io
from PIL import Image
import numpy as np

# Add the face auth system path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def create_test_image():
    """Create a simple test image"""
    # Create a simple face-like test image
    image = Image.new('RGB', (640, 480), color='lightblue')
    return image

def image_to_base64(image):
    """Convert PIL image to base64 data URL"""
    buffer = io.BytesIO()
    image.save(buffer, format='JPEG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/jpeg;base64,{img_str}"

def test_imports():
    """Test if all required packages can be imported"""
    print("Testing package imports...")
    
    try:
        import cv2
        print("✓ OpenCV imported successfully")
    except ImportError as e:
        print(f"✗ OpenCV import failed: {e}")
        return False
    
    try:
        from insightface.app import FaceAnalysis
        print("✓ InsightFace imported successfully") 
    except ImportError as e:
        print(f"✗ InsightFace import failed: {e}")
        return False
        
    try:
        import numpy as np
        print("✓ NumPy imported successfully")
    except ImportError as e:
        print(f"✗ NumPy import failed: {e}")
        return False
        
    try:
        from PIL import Image
        print("✓ Pillow imported successfully")
    except ImportError as e:
        print(f"✗ Pillow import failed: {e}")
        return False
        
    return True

def test_face_service():
    """Test the face authentication service"""
    print("\\nTesting Face Authentication Service...")
    
    try:
        # Import face service components
        from insightface.app import FaceAnalysis
        import cv2
        import numpy as np
        
        # Initialize face analysis
        print("Initializing ArcFace model...")
        face_app = FaceAnalysis(providers=['CPUExecutionProvider'])
        face_app.prepare(ctx_id=0, det_size=(640, 640))
        print("✓ ArcFace model initialized")
        
        # Test with a random image (no faces expected)
        test_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        faces = face_app.get(test_image)
        print(f"✓ Face detection test completed (found {len(faces)} faces in random image)")
        
        return True
        
    except Exception as e:
        print(f"✗ Face service test failed: {e}")
        return False

def test_integration():
    """Test the integration components"""
    print("\\nTesting integration components...")
    
    # Check if face service Python script exists
    face_service_path = os.path.join('..', 'backend', 'services', 'faceAuthService.js')
    if os.path.exists(face_service_path):
        print("✓ Face authentication service integration file found")
    else:
        print("⚠ Face authentication service integration file not found")
        
    # Check if user model has been updated (this is a simplified check)
    user_model_path = os.path.join('..', 'backend', 'models', 'CommunityUser.js')
    if os.path.exists(user_model_path):
        try:
            with open(user_model_path, 'r') as f:
                content = f.read()
                if 'faceEmbedding' in content and 'hasFaceAuth' in content:
                    print("✓ User models updated with face authentication fields")
                else:
                    print("⚠ User models may not have face authentication fields")
        except Exception as e:
            print(f"⚠ Could not verify user model updates: {e}")
    else:
        print("⚠ User model file not found")

def main():
    print("🔍 Face Authentication Integration Test")
    print("=" * 50)
    
    # Test 1: Package imports
    if not test_imports():
        print("\\n❌ Package import test failed!")
        print("Please run: pip install -r requirements.txt")
        return False
        
    # Test 2: Face service functionality
    if not test_face_service():
        print("\\n❌ Face service test failed!")
        return False
        
    # Test 3: Integration components
    test_integration()
    
    print("\\n🎉 Face Authentication Integration Test Complete!")
    print("\\nNext steps:")
    print("1. Start MongoDB service")
    print("2. Start backend server: cd ../backend && npm start")
    print("3. Start frontend server: cd ../frontend && npm run dev")
    print("4. Test signup with face authentication enabled")
    
    return True

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)