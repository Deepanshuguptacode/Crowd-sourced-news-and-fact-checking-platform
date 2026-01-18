from flask import Flask, render_template, request, jsonify, Response
from flask_cors import CORS
import cv2
import numpy as np
import base64
from pymongo import MongoClient
from datetime import datetime
import json
import io
from PIL import Image
import matplotlib
matplotlib.use('Agg')  # Set backend before importing pyplot
from insightface.app import FaceAnalysis

app = Flask(__name__)
CORS(app)

# MongoDB connection
client = MongoClient('mongodb://localhost:27017/')
db = client['face_auth_db']
users_collection = db['users']

# Load ArcFace model (using your working.py logic)
face_app = FaceAnalysis(providers=['CPUExecutionProvider'])
face_app.prepare(ctx_id=0, det_size=(640,640))

def get_embedding_from_image_data(image_data):
    """
    Extract face embedding from image data using your working.py logic
    Optimized for faster processing with better quality handling
    """
    try:
        # Convert base64 to image
        image_bytes = base64.b64decode(image_data.split(',')[1])
        image = Image.open(io.BytesIO(image_bytes))
        
        # Optimize image size based on source
        # For webcam captures, use smaller size for speed
        # For file uploads, use higher quality
        max_size = 1200 if len(image_bytes) > 500000 else 800  # Larger images get higher quality
        
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
        
        # Detect faces with ArcFace (same as your working.py)
        faces = face_app.get(img_bgr)
        
        if not faces:
            return None, None, None
        
        # Take first face (same as your working.py)
        face = faces[0]
        embedding = face.normed_embedding
        
        # Get bounding box for face detection display
        bbox = face.bbox.astype(int)
        
        # Extract face crop (same as your working.py logic)
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)  # Convert back to RGB for display
        x1, y1, x2, y2 = bbox
        face_crop = img_rgb[y1:y2, x1:x2]
        
        # Convert face crop to base64 for sending to frontend
        face_crop_pil = Image.fromarray(face_crop)
        buffer = io.BytesIO()
        face_crop_pil.save(buffer, format='JPEG', quality=90)  # Higher quality for preview
        face_crop_b64 = base64.b64encode(buffer.getvalue()).decode()
        face_crop_data_url = f"data:image/jpeg;base64,{face_crop_b64}"
        
        return embedding, bbox, face_crop_data_url
        
    except Exception as e:
        print(f"Error in get_embedding_from_image_data: {e}")
        return None, None, None

def cosine_similarity(a, b):
    """
    Calculate cosine similarity (same as your working.py)
    """
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register')
def register():
    return render_template('register_clean.html')

@app.route('/login')
def login():
    return render_template('login_clean.html')

@app.route('/api/detect_face', methods=['POST'])
def detect_face():
    """
    Detect face and return the face crop for preview before registration/verification
    """
    try:
        data = request.json
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({'success': False, 'message': 'Image required'})
        
        # Get face detection results
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

@app.route('/api/register_face', methods=['POST'])
def register_face():
    try:
        data = request.json
        username = data.get('username')
        image_data = data.get('image')
        
        if not username or not image_data:
            return jsonify({'success': False, 'message': 'Username and image required'})
        
        print(f"\n👤 [REGISTRATION] Starting face registration for user: {username}")
        start_time = datetime.now()
        
        # Check if user already exists
        existing_user = users_collection.find_one({'username': username})
        if existing_user:
            print(f"❌ [REGISTRATION] User '{username}' already exists")
            return jsonify({'success': False, 'message': 'Username already exists'})
        
        # Get face embedding using your working.py logic
        embedding, bbox, face_crop_data_url = get_embedding_from_image_data(image_data)
        
        if embedding is None:
            print(f"❌ [REGISTRATION] No face detected for user '{username}'")
            return jsonify({'success': False, 'message': 'No face detected in image'})
        
        embedding_time = datetime.now()
        print(f"⚡ [REGISTRATION] Face embedding extracted in {(embedding_time - start_time).total_seconds():.2f}s")
        
        # Store user data in MongoDB
        user_data = {
            'username': username,
            'embedding': embedding.tolist(),  # Convert numpy array to list for storage
            'registered_at': datetime.now(),
            'bbox': bbox.tolist() if bbox is not None else None
        }
        
        result = users_collection.insert_one(user_data)
        
        total_time = (datetime.now() - start_time).total_seconds()
        print(f"✅ [REGISTRATION] User '{username}' registered successfully!")
        print(f"🏁 [REGISTRATION] Total registration time: {total_time:.2f}s")
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
    try:
        data = request.json
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({'success': False, 'message': 'Image required'})
        
        print("\n🔍 [VERIFICATION] Starting face verification...")
        start_time = datetime.now()
        
        # Get face embedding from captured image using your working.py logic
        test_embedding, bbox, face_crop_data_url = get_embedding_from_image_data(image_data)
        
        if test_embedding is None:
            print("❌ [VERIFICATION] No face detected in verification image")
            return jsonify({'success': False, 'message': 'No face detected in image'})
        
        embedding_time = datetime.now()
        print(f"⚡ [VERIFICATION] Face embedding extracted in {(embedding_time - start_time).total_seconds():.2f}s")
        
        # Compare with all registered users
        best_match = None
        best_similarity = 0
        similarity_threshold = 0.3  # Adjust this threshold as needed
        
        print("🔍 [VERIFICATION] Comparing with registered users...")
        user_count = 0
        for user in users_collection.find():
            user_count += 1
            stored_embedding = np.array(user['embedding'])
            # Use your working.py cosine similarity function
            similarity = cosine_similarity(test_embedding, stored_embedding)
            
            print(f"📊 [VERIFICATION] User '{user['username']}': Similarity = {similarity:.4f}")
            
            if similarity > best_similarity and similarity > similarity_threshold:
                best_similarity = similarity
                best_match = user
        
        comparison_time = datetime.now()
        total_time = (comparison_time - start_time).total_seconds()
        print(f"⚡ [VERIFICATION] Compared with {user_count} users in {(comparison_time - embedding_time).total_seconds():.2f}s")
        print(f"🏁 [VERIFICATION] Total verification time: {total_time:.2f}s")
        
        if best_match:
            print(f"✅ [VERIFICATION] SUCCESSFUL! User '{best_match['username']}' verified with {best_similarity:.4f} similarity")
            return jsonify({
                'success': True,
                'message': f'Welcome back, {best_match["username"]}!',
                'username': best_match['username'],
                'similarity': float(best_similarity),
                'bbox': bbox.tolist() if bbox is not None else None,
                'face_crop': face_crop_data_url
            })
        else:
            print(f"❌ [VERIFICATION] FAILED! Best similarity: {best_similarity:.4f} (threshold: {similarity_threshold})")
            return jsonify({
                'success': False,
                'message': 'Face not recognized',
                'similarity': float(best_similarity) if best_similarity > 0 else 0,
                'bbox': bbox.tolist() if bbox is not None else None,
                'face_crop': face_crop_data_url
            })
        
    except Exception as e:
        print(f"💥 [VERIFICATION] ERROR: {str(e)}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})

@app.route('/api/get_users')
def get_users():
    try:
        users = list(users_collection.find({}, {'username': 1, 'registered_at': 1, '_id': 0}))
        return jsonify({'success': True, 'users': users})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})

if __name__ == '__main__':
    print("Starting Face Authorization System...")
    print("Make sure MongoDB is running on localhost:27017")
    app.run(debug=True, host='0.0.0.0', port=5000)
