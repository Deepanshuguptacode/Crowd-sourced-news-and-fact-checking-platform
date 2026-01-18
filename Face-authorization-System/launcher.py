#!/usr/bin/env python3
"""
Launcher for Face Authorization System
This script changes directory and starts the Flask app
"""

import os
import sys

# Change to the Face-authorization-System directory
face_auth_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(face_auth_dir)

print(f"Changed directory to: {os.getcwd()}")
print("Starting Face Authorization System...")

# Import and run the app
try:
    import app
except Exception as e:
    print(f"Error starting Face Authorization System: {e}")
    sys.exit(1)