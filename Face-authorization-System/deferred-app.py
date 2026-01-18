#!/usr/bin/env python3
"""
Deferred Loading Face Authorization System API
Imports InsightFace only when needed to avoid startup issues
"""

from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
from pymongo import MongoClient
from datetime import datetime
import json
import io
from PIL import Image

app = Flask(__name__)
CORS(app)

# MongoDB connection
client = MongoClient('mongodb://localhost:27017/')
db = client['face_auth_db']
users_collection = db['users']

# Global variables for face analysis
face_app = None
INSIGHTFACE_AVAILABLE = None

def initialize_face_analysis():
    """Initialize face analysis model on first use"""
    global face_app, INSIGHTFACE_AVAILABLE
    
    if INSIGHTFACE_AVAILABLE is None:
        try:
            print("🔄 Initializing face analysis model...")
            from insightface.app import FaceAnalysis
            face_app = FaceAnalysis(providers=['CPUExecutionProvider'])
            face_app.prepare(ctx_id=0, det_size=(640,640))
            INSIGHTFACE_AVAILABLE = True
            print("✅ Face analysis model initialized successfully")
        except Exception as e:
            print(f"❌ Face analysis initialization failed: {e}")
            INSIGHTFACE_AVAILABLE = False
            face_app = None
    
    return INSIGHTFACE_AVAILABLE

def get_embedding_from_image_data(image_data):
    """Extract face embedding from image data"""
    if not initialize_face_analysis() or face_app is None:
        return None, None, None
        
    try:
        # Convert base64 to image
        image_bytes = base64.b64decode(image_data.split(',')[1])
        image = Image.open(io.BytesIO(image_bytes))
        
        # Resize image for processing
        max_size = 800
        if max(image.size) > max_size:
            ratio = max_size / max(image.size)
            new_size = tuple(int(dim * ratio) for dim in image.size)
            image = image.resize(new_size, Image.Resampling.LANCZOS)
        
        img_array = np.array(image)
        
        # Convert RGB to BGR for OpenCV
        if len(img_array.shape) == 3:
            img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        else:
            img_bgr = img_array
        
        # Detect faces with ArcFace
        faces = face_app.get(img_bgr)
        
        if not faces:
            return None, None, None
        
        # Take first face
        face = faces[0]
        embedding = face.normed_embedding
        
        # Get bounding box
        bbox = face.bbox.astype(int)
        
        # Extract face crop
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        x1, y1, x2, y2 = bbox
        face_crop = img_rgb[y1:y2, x1:x2]
        
        # Convert face crop to base64
        face_crop_pil = Image.fromarray(face_crop)
        buffer = io.BytesIO()
        face_crop_pil.save(buffer, format='JPEG', quality=90)
        face_crop_b64 = base64.b64encode(buffer.getvalue()).decode()
        face_crop_data_url = f"data:image/jpeg;base64,{face_crop_b64}"
        
        return embedding, bbox, face_crop_data_url
        
    except Exception as e:
        print(f"Error in get_embedding_from_image_data: {e}")
        return None, None, None

def cosine_similarity(a, b):
    """Calculate cosine similarity"""
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

@app.route('/')
def index():
    return jsonify({
        'status': 'Face Authorization System Running',
        'version': '1.0.0-deferred',
        'message': 'Face analysis will be initialized on first use'
    })

@app.route('/api/detect_face', methods=['POST'])
def detect_face():
    """Detect face and return preview"""
    if not initialize_face_analysis():
        return jsonify({'success': False, 'message': 'Face recognition not available'})
    
    try:
        data = request.json
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({'success': False, 'message': 'Image required'})
        
        embedding, bbox, face_crop_data_url = get_embedding_from_image_data(image_data)
        
        if embedding is None:
            return jsonify({'success': False, 'message': 'No face detected in image'})
        
        return jsonify({
            'success': True,
            'message': 'Face detected successfully',
            'bbox': bbox.tolist() if bbox is not None else None,
            'face_crop': face_crop_data_url
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})

@app.route('/api/extract_embedding', methods=['POST'])
def extract_embedding():
    """Extract face embedding from image and return as array"""
    if not initialize_face_analysis():
        return jsonify({'success': False, 'message': 'Face recognition not available'})
    
    try:
        data = request.json
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({'success': False, 'message': 'Image required'})
        
        embedding, bbox, face_crop_data_url = get_embedding_from_image_data(image_data)
        
        if embedding is None:
            return jsonify({'success': False, 'message': 'No face detected in image'})
        
        return jsonify({
            'success': True,
            'message': 'Embedding extracted successfully',
            'embedding': embedding.tolist(),  # Convert numpy array to list
            'bbox': bbox.tolist() if bbox is not None else None,
            'face_crop': face_crop_data_url
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})

@app.route('/api/check_duplicate_face', methods=['POST'])
def check_duplicate_face():
    """Check if face already exists in database (for duplicate detection during signup)"""
    if not initialize_face_analysis():
        return jsonify({'success': False, 'message': 'Face recognition not available'})
    
    try:
        data = request.json
        image_data = data.get('image')
        threshold = 0.30  # 30% threshold
        
        if not image_data:
            return jsonify({'success': False, 'message': 'Image required'})
        
        print("🔍 [DUPLICATE_CHECK] Checking for duplicate face...")
        
        # Get face embedding from test image
        test_embedding, bbox, face_crop_data_url = get_embedding_from_image_data(image_data)
        
        if test_embedding is None:
            return jsonify({'success': False, 'message': 'No face detected in image'})
        
        # Get all registered users
        users = list(users_collection.find())
        if not users:
            print("✅ [DUPLICATE_CHECK] No existing users, face is unique")
            return jsonify({
                'success': True,
                'isDuplicate': False,
                'message': 'No duplicate found',
                'similarity': 0.0
            })
        
        best_match = None
        best_similarity = 0.0
        
        for user in users:
            stored_embedding = np.array(user['embedding'])
            similarity = cosine_similarity(test_embedding, stored_embedding)
            
            if similarity > best_similarity:
                best_similarity = similarity
                best_match = user
        
        if best_match and best_similarity >= threshold:
            print(f"❌ [DUPLICATE_CHECK] Duplicate found: {best_match['username']} (similarity: {best_similarity:.3f})")
            return jsonify({
                'success': True,
                'isDuplicate': True,
                'message': f'User already exists with this face',
                'existingUsername': best_match['username'],
                'similarity': float(best_similarity)
            })
        else:
            print(f"✅ [DUPLICATE_CHECK] No duplicate found (best similarity: {best_similarity:.3f})")
            return jsonify({
                'success': True,
                'isDuplicate': False,
                'message': 'No duplicate found',
                'similarity': float(best_similarity)
            })
        
    except Exception as e:
        print(f"💥 [DUPLICATE_CHECK] ERROR: {str(e)}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})

@app.route('/api/register_face', methods=['POST'])
def register_face():
    """Register face with username"""
    if not initialize_face_analysis():
        return jsonify({'success': False, 'message': 'Face recognition not available'})
    
    try:
        data = request.json
        username = data.get('username')
        image_data = data.get('image')
        
        if not username or not image_data:
            return jsonify({'success': False, 'message': 'Username and image required'})
        
        print(f"👤 [REGISTRATION] Starting face registration for user: {username}")
        
        # Check if user exists
        existing_user = users_collection.find_one({'username': username})
        if existing_user:
            print(f"❌ [REGISTRATION] User '{username}' already exists")
            return jsonify({'success': False, 'message': 'Username already exists'})
        
        # Get face embedding
        embedding, bbox, face_crop_data_url = get_embedding_from_image_data(image_data)
        
        if embedding is None:
            print(f"❌ [REGISTRATION] No face detected for user '{username}'")
            return jsonify({'success': False, 'message': 'No face detected in image'})
        
        # Store user data
        user_data = {
            'username': username,
            'embedding': embedding.tolist(),
            'registered_at': datetime.now(),
            'bbox': bbox.tolist() if bbox is not None else None
        }
        
        result = users_collection.insert_one(user_data)
        
        print(f"✅ [REGISTRATION] User '{username}' registered successfully!")
        print(f"📊 [REGISTRATION] Database ID: {result.inserted_id}")
        
        return jsonify({
            'success': True, 
            'message': 'Face registered successfully',
            'bbox': bbox.tolist() if bbox is not None else None,
            'face_crop': face_crop_data_url
        })
        
    except Exception as e:
        print(f"💥 [REGISTRATION] ERROR: {str(e)}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})

@app.route('/api/verify_face', methods=['POST'])
def verify_face():
    """Verify face against registered users"""
    if not initialize_face_analysis():
        return jsonify({'success': False, 'message': 'Face recognition not available'})
    
    try:
        data = request.json
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({'success': False, 'message': 'Image required'})
        
        print("🔍 [VERIFICATION] Starting face verification...")
        
        # Get face embedding from test image
        test_embedding, bbox, face_crop_data_url = get_embedding_from_image_data(image_data)
        
        if test_embedding is None:
            return jsonify({'success': False, 'message': 'No face detected in image'})
        
        # Get all registered users
        users = list(users_collection.find())
        if not users:
            return jsonify({'success': False, 'message': 'No registered users found'})
        
        best_match = None
        best_similarity = 0.0
        threshold = 0.3
        
        for user in users:
            stored_embedding = np.array(user['embedding'])
            similarity = cosine_similarity(test_embedding, stored_embedding)
            
            if similarity > best_similarity:
                best_similarity = similarity
                best_match = user
        
        if best_match and best_similarity >= threshold:
            print(f"✅ [VERIFICATION] Match found: {best_match['username']} (similarity: {best_similarity:.3f})")
            return jsonify({
                'success': True,
                'message': 'Face verified successfully',
                'username': best_match['username'],
                'similarity': float(best_similarity),
                'bbox': bbox.tolist() if bbox is not None else None,
                'face_crop': face_crop_data_url
            })
        else:
            print(f"❌ [VERIFICATION] No match found (best similarity: {best_similarity:.3f})")
            return jsonify({
                'success': False,
                'message': 'Face not recognized',
                'similarity': float(best_similarity),
                'bbox': bbox.tolist() if bbox is not None else None,
                'face_crop': face_crop_data_url
            })
        
    except Exception as e:
        print(f"💥 [VERIFICATION] ERROR: {str(e)}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})

@app.route('/api/status', methods=['GET'])
def status():
    """Get system status"""
    return jsonify({
        'success': True,
        'message': 'Face Authorization System is running',
        'face_analysis_initialized': INSIGHTFACE_AVAILABLE,
        'face_model_loaded': face_app is not None
    })

if __name__ == '__main__':
    print("🚀 Starting Face Authorization System (Deferred Loading)...")
    print("🔄 Face analysis will be initialized on first API call")
    print("🌐 Make sure MongoDB is running on localhost:27017")
    
    app.run(host='0.0.0.0', port=5000, debug=True)