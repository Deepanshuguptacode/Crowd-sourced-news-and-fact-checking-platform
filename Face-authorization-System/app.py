from flask import Flask, render_template, request, jsonify, Response
from flask_cors import CORS
import cv2
import numpy as np
import base64
from pymongo import MongoClient
from datetime import datetime
import json
import io
import os
import uuid
import threading
import time
from PIL import Image
import matplotlib
matplotlib.use('Agg')  # Set backend before importing pyplot
from insightface.app import FaceAnalysis
from dotenv import load_dotenv

# Liveness detection imports
from liveness.active_liveness import create_detector, ActiveLivenessDetector
from liveness.config import RuleBasedConfig
from liveness.state_machine import VerificationState

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# MongoDB connection with Atlas support
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
client = MongoClient(MONGODB_URI)
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

@app.route('/api/extract_embedding', methods=['POST', 'OPTIONS'])
def extract_embedding_endpoint():
    """Extract face embedding from image without registration"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({
                'success': False,
                'message': 'No image provided'
            }), 400
        
        # Get embedding using existing function
        embedding, bbox, face_crop = get_embedding_from_image_data(image_data)
        
        if embedding is None:
            return jsonify({
                'success': False,
                'message': 'No face detected in image'
            }), 400
        
        return jsonify({
            'success': True,
            'embedding': embedding.tolist(),
            'bbox': bbox.tolist() if bbox is not None else None,
            'face_crop': face_crop,
            'message': 'Embedding extracted successfully'
        }), 200
        
    except Exception as e:
        print(f"Extract embedding error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

@app.route('/api/register_face', methods=['POST', 'OPTIONS'])
def register_face():
    if request.method == 'OPTIONS':
        return '', 204
    
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

@app.route('/api/verify_face', methods=['POST', 'OPTIONS'])
def verify_face():
    if request.method == 'OPTIONS':
        return '', 204
    
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

@app.route('/api/check_duplicate_face', methods=['POST', 'OPTIONS'])
def check_duplicate_face():
    if request.method == 'OPTIONS':
        return '', 204
    
    """Check if a face already exists in the database"""
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'message': 'No image data provided'
            }), 400
        
        # Extract embedding from the uploaded image
        embedding = get_embedding_from_image_data(data['image'])
        
        if embedding is None:
            return jsonify({
                'success': False,
                'message': 'No face detected in image'
            }), 400
        
        # Check against all existing users
        existing_users = list(users_collection.find())
        
        for user in existing_users:
            if 'face_embedding' in user:
                stored_embedding = np.array(user['face_embedding'])
                # Calculate cosine similarity
                similarity = np.dot(embedding, stored_embedding) / (
                    np.linalg.norm(embedding) * np.linalg.norm(stored_embedding)
                )
                
                # If similarity > 0.7, it's likely the same person
                if similarity > 0.7:
                    return jsonify({
                        'success': False,
                        'isDuplicate': True,
                        'message': f'This face is already registered for user: {user.get("username", "Unknown")}',
                        'similarity': float(similarity)
                    }), 200
        
        # No duplicate found
        return jsonify({
            'success': True,
            'isDuplicate': False,
            'message': 'No duplicate face found'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error checking duplicate: {str(e)}'
        }), 500

@app.route('/api/get_users')
def get_users():
    try:
        users = list(users_collection.find({}, {'username': 1, 'registered_at': 1, '_id': 0}))
        return jsonify({'success': True, 'users': users})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})

# ============================================================
# LIVENESS DETECTION ENDPOINTS
# ============================================================

# In-memory session store: session_id -> { detector, created_at, last_active }
liveness_sessions = {}
SESSION_TIMEOUT = 120  # seconds before session auto-expires
MAX_SESSIONS = 100

def cleanup_expired_sessions():
    """Remove expired liveness sessions"""
    now = time.time()
    expired = [sid for sid, s in liveness_sessions.items() 
               if now - s['last_active'] > SESSION_TIMEOUT]
    for sid in expired:
        try:
            del liveness_sessions[sid]
        except KeyError:
            pass

def decode_base64_to_cv2(image_data):
    """Convert base64 image data URL to OpenCV BGR numpy array"""
    try:
        # Remove data URL prefix if present
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        print(f"Error decoding base64 image: {e}")
        return None


@app.route('/api/liveness/start', methods=['POST', 'OPTIONS'])
def liveness_start():
    """Start a new liveness verification session.
    Returns session_id, challenges list, and first challenge instruction.
    """
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        # Cleanup old sessions
        cleanup_expired_sessions()
        
        if len(liveness_sessions) >= MAX_SESSIONS:
            return jsonify({
                'success': False,
                'message': 'Too many active sessions. Please try again later.'
            }), 429
        
        # Create new session
        session_id = str(uuid.uuid4())
        config = RuleBasedConfig()
        detector = create_detector(config)
        
        # Start verification - this generates challenges
        first_challenge = detector.start_verification()
        
        liveness_sessions[session_id] = {
            'detector': detector,
            'created_at': time.time(),
            'last_active': time.time(),
        }
        
        # Build challenges info for frontend
        challenges_info = []
        for c in detector.get_all_challenges():
            challenges_info.append(c.to_dict())
        
        print(f"🔐 [LIVENESS] Session {session_id[:8]}... started with {len(challenges_info)} challenges")
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'challenges': challenges_info,
            'current_challenge': {
                'index': 0,
                'instruction': first_challenge.instruction,
                'type': first_challenge.challenge_type.value,
                'timeout': first_challenge.timeout,
            },
            'total_timeout': config.total_timeout,
        })
        
    except Exception as e:
        print(f"💥 [LIVENESS] Start error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Error starting liveness: {str(e)}'}), 500


@app.route('/api/liveness/frame', methods=['POST', 'OPTIONS'])
def liveness_frame():
    """Process a single video frame for liveness detection.
    Expects: { session_id, image (base64) }
    Returns: current state, signals, challenge progress, instructions
    """
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        image_data = data.get('image')
        
        if not session_id or not image_data:
            return jsonify({'success': False, 'message': 'session_id and image required'}), 400
        
        session = liveness_sessions.get(session_id)
        if not session:
            return jsonify({'success': False, 'message': 'Session not found or expired', 'expired': True}), 404
        
        session['last_active'] = time.time()
        detector = session['detector']
        
        # Decode base64 image to OpenCV format
        frame = decode_base64_to_cv2(image_data)
        if frame is None:
            return jsonify({'success': False, 'message': 'Invalid image data'}), 400
        
        h, w = frame.shape[:2]
        if w < 64 or h < 64:
            return jsonify({'success': False, 'message': f'Image too small: {w}x{h}'}), 400
        
        # Process the frame through liveness detection
        signals, state = detector.process_frame(frame)
        
        # Build response
        response = {
            'success': True,
            'state': state.value,
            'session_active': detector.is_session_active(),
        }
        
        # Add signals if available
        if signals:
            response['signals'] = {
                'ear': round(signals.ear_avg, 3),
                'mar': round(signals.mar, 3),
                'yaw': round(signals.head_yaw, 1),
                'pitch': round(signals.head_pitch, 1),
            }
        else:
            response['signals'] = None
            response['face_detected'] = False
        
        # Add current challenge info
        if detector.current_challenge:
            c_type = detector.current_challenge.challenge_type.value
            challenge_info = {
                'instruction': detector.current_challenge.instruction,
                'type': c_type,
                'remaining_time': round(detector.get_remaining_time(), 1),
            }
            # For head-turn challenges include hold progress (0.0 → 1.0)
            if c_type in ('turn_left', 'turn_right', 'turn_up'):
                sm = detector.state_machine
                elapsed = sm.head_hold_elapsed
                challenge_info['hold_progress'] = round(elapsed / sm.HEAD_HOLD_DURATION, 3)
            response['current_challenge'] = challenge_info
        else:
            response['current_challenge'] = None
        
        # Add progress
        progress = detector.get_progress()
        response['progress'] = {
            'completed': progress['successful_challenges'],
            'total': progress['total_challenges'],
            'current_index': progress['current_challenge_idx'],
            'remaining_time': round(progress['remaining_time'], 1),
        }
        
        # Add challenges status
        challenges_status = []
        for c in detector.get_all_challenges():
            challenges_status.append(c.to_dict())
        response['challenges'] = challenges_status
        
        # Check if session just completed
        if not detector.is_session_active():
            result = detector.get_result()
            response['result'] = result.to_dict()
            
            # Clean up session
            if session_id in liveness_sessions:
                del liveness_sessions[session_id]
        
        return jsonify(response)
        
    except Exception as e:
        print(f"💥 [LIVENESS] Frame error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Error processing frame: {str(e)}'}), 500


@app.route('/api/liveness/status/<session_id>', methods=['GET'])
def liveness_status(session_id):
    """Get current status of a liveness session"""
    session = liveness_sessions.get(session_id)
    if not session:
        return jsonify({'success': False, 'message': 'Session not found or expired', 'expired': True}), 404
    
    detector = session['detector']
    progress = detector.get_progress()
    
    response = {
        'success': True,
        'session_active': detector.is_session_active(),
        'state': detector.get_state().value,
        'progress': {
            'completed': progress['successful_challenges'],
            'total': progress['total_challenges'],
            'current_index': progress['current_challenge_idx'],
            'remaining_time': round(progress['remaining_time'], 1),
        }
    }
    
    if not detector.is_session_active():
        result = detector.get_result()
        response['result'] = result.to_dict()
    
    return jsonify(response)


@app.route('/api/liveness/abort/<session_id>', methods=['POST', 'OPTIONS'])
def liveness_abort(session_id):
    """Abort a liveness session"""
    if request.method == 'OPTIONS':
        return '', 204
    
    session = liveness_sessions.get(session_id)
    if session:
        session['detector'].abort_session()
        del liveness_sessions[session_id]
    
    return jsonify({'success': True, 'message': 'Session aborted'})


if __name__ == '__main__':
    print("Starting Face Authorization System with Liveness Detection...")
    print("Make sure MongoDB is running on localhost:27017")
    print("Liveness detection endpoints available at /api/liveness/*")
    app.run(debug=True, host='0.0.0.0', port=5000)
