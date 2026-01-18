#!/usr/bin/env python3
"""
Simple test script to verify Python environment and dependencies
"""

def test_basic_imports():
    """Test basic Python imports"""
    print("Testing basic imports...")
    
    try:
        import cv2
        print(f"✅ OpenCV version: {cv2.__version__}")
    except ImportError as e:
        print(f"❌ OpenCV import failed: {e}")
        return False
    
    try:
        import numpy as np
        print(f"✅ NumPy version: {np.__version__}")
    except ImportError as e:
        print(f"❌ NumPy import failed: {e}")
        return False
    
    try:
        import PIL
        print(f"✅ PIL/Pillow version: {PIL.__version__}")
    except ImportError as e:
        print(f"❌ PIL import failed: {e}")
        return False
    
    return True

def test_problematic_imports():
    """Test the problematic imports"""
    print("\nTesting problematic imports...")
    
    try:
        import torch
        print(f"✅ PyTorch version: {torch.__version__}")
        print(f"✅ CUDA available: {torch.cuda.is_available()}")
    except ImportError as e:
        print(f"❌ PyTorch import failed: {e}")
        return False
    except Exception as e:
        print(f"❌ PyTorch error: {e}")
        return False
    
    try:
        import albumentations
        print(f"✅ Albumentations version: {albumentations.__version__}")
    except ImportError as e:
        print(f"❌ Albumentations import failed: {e}")
        return False
    
    try:
        from insightface.app import FaceAnalysis
        print("✅ InsightFace import successful")
        return True
    except ImportError as e:
        print(f"❌ InsightFace import failed: {e}")
        return False
    except Exception as e:
        print(f"❌ InsightFace error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Python Environment for Face Recognition")
    print("=" * 50)
    
    basic_ok = test_basic_imports()
    if not basic_ok:
        print("\n❌ Basic imports failed. Please install missing packages.")
        exit(1)
    
    advanced_ok = test_problematic_imports()
    if not advanced_ok:
        print("\n❌ Advanced imports failed. There may be compatibility issues.")
        exit(1)
    
    print("\n✅ All imports successful! Environment is ready.")