const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

class FaceAuthService {
  constructor() {
    this.faceAuthPath = path.join(__dirname, '../../Face-authorization-System');
    this.pythonScript = path.join(this.faceAuthPath, 'face_service.py');
    this.tempDir = path.join(__dirname, '../temp');
    this.similarityThreshold = 0.6;
    this.initialized = false;
  }

  async initialize() {
    try {
      // Ensure temp directory exists
      await fs.mkdir(this.tempDir, { recursive: true });
      
      // Check if Python script exists
      try {
        await fs.access(this.pythonScript);
      } catch (error) {
        console.log('Creating face service Python script...');
        await this.createPythonScript();
      }
      
      this.initialized = true;
      console.log('✓ Face Authentication Service initialized');
    } catch (error) {
      console.error('✗ Failed to initialize Face Authentication Service:', error.message);
      throw error;
    }
  }

  async createPythonScript() {
    const scriptContent = `#!/usr/bin/env python3
"""
Face Authentication Service for Node.js Integration
Uses the exact logic from the working Face-authorization-System
"""
import sys
import json
import numpy as np
import cv2
import base64
import io
from PIL import Image
from insightface.app import FaceAnalysis
import traceback

class FaceAuthenticator:
    def __init__(self):
        # Initialize ArcFace model (same as working.py)
        self.face_app = FaceAnalysis(providers=['CPUExecutionProvider'])
        self.face_app.prepare(ctx_id=0, det_size=(640, 640))
        
    def get_embedding_from_base64(self, base64_data):
        """
        Extract face embedding from base64 image data
        Uses EXACT logic from the working Face-authorization-System app.py
        """
        try:
            # Remove data URL prefix if present (same as app.py)
            if ',' in base64_data:
                base64_data = base64_data.split(',')[1]
            
            # Convert base64 to image (same as app.py)
            image_bytes = base64.b64decode(base64_data)
            image = Image.open(io.BytesIO(image_bytes))
            
            # Optimize image size based on source (same as app.py)
            max_size = 1200 if len(image_bytes) > 500000 else 800
            if max(image.size) > max_size:
                ratio = max_size / max(image.size)
                new_size = tuple(int(dim * ratio) for dim in image.size)
                image = image.resize(new_size, Image.Resampling.LANCZOS)
            
            img_array = np.array(image)
            
            # Convert RGB to BGR for OpenCV (same as app.py)
            if len(img_array.shape) == 3:
                img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
            else:
                img_bgr = img_array
            
            # Detect faces with ArcFace (same as app.py)
            faces = self.face_app.get(img_bgr)
            
            if not faces:
                return None, "No face detected in image"
            
            # Take first face (same as app.py)
            face = faces[0]
            embedding = face.normed_embedding
            
            return embedding.tolist(), None
            
        except Exception as e:
            return None, f"Error processing image: {str(e)}"
    
    def cosine_similarity(self, a, b):
        """
        Calculate cosine similarity (same as working.py)
        """
        a = np.array(a)
        b = np.array(b)
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
    
    def verify_face(self, test_embedding, stored_embeddings, threshold=0.6):
        """
        Verify face against stored embeddings
        """
        try:
            test_embedding = np.array(test_embedding)
            best_similarity = 0
            best_match_id = None
            
            for user_id, stored_embedding in stored_embeddings.items():
                stored_embedding = np.array(stored_embedding)
                similarity = self.cosine_similarity(test_embedding, stored_embedding)
                
                if similarity > best_similarity and similarity > threshold:
                    best_similarity = similarity
                    best_match_id = user_id
            
            return best_match_id, float(best_similarity)
            
        except Exception as e:
            return None, 0.0

def main():
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        operation = input_data.get('operation')
        
        authenticator = FaceAuthenticator()
        
        if operation == 'extract_embedding':
            base64_image = input_data.get('image')
            embedding, error = authenticator.get_embedding_from_base64(base64_image)
            
            if error:
                print(json.dumps({
                    'success': False,
                    'error': error
                }))
            else:
                print(json.dumps({
                    'success': True,
                    'embedding': embedding
                }))
        
        elif operation == 'verify_face':
            test_embedding = input_data.get('test_embedding')
            stored_embeddings = input_data.get('stored_embeddings', {})
            threshold = input_data.get('threshold', 0.6)
            
            user_id, similarity = authenticator.verify_face(test_embedding, stored_embeddings, threshold)
            
            print(json.dumps({
                'success': True,
                'matched_user_id': user_id,
                'similarity': similarity,
                'threshold': threshold
            }))
        
        else:
            print(json.dumps({
                'success': False,
                'error': 'Invalid operation'
            }))
    
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': f"Service error: {str(e)}",
            'traceback': traceback.format_exc()
        }))

if __name__ == '__main__':
    main()
`;

    await fs.writeFile(this.pythonScript, scriptContent);
    console.log('✓ Created face service Python script');
  }

  async extractFaceEmbedding(base64Image) {
    if (!this.initialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [this.pythonScript], {
        cwd: this.faceAuthPath
      });

      const inputData = {
        operation: 'extract_embedding',
        image: base64Image
      };

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Python process error:', errorOutput);
          reject(new Error(`Face extraction failed: ${errorOutput}`));
          return;
        }

        try {
          const result = JSON.parse(output.trim());
          resolve(result);
        } catch (parseError) {
          console.error('Failed to parse Python output:', output);
          reject(new Error(`Failed to parse face extraction result: ${parseError.message}`));
        }
      });

      pythonProcess.stdin.write(JSON.stringify(inputData));
      pythonProcess.stdin.end();
    });
  }

  async verifyFaceMatch(testEmbedding, storedEmbeddings, threshold = null) {
    if (!this.initialized) {
      await this.initialize();
    }

    const actualThreshold = threshold || this.similarityThreshold;

    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [this.pythonScript], {
        cwd: this.faceAuthPath
      });

      const inputData = {
        operation: 'verify_face',
        test_embedding: testEmbedding,
        stored_embeddings: storedEmbeddings,
        threshold: actualThreshold
      };

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Python process error:', errorOutput);
          reject(new Error(`Face verification failed: ${errorOutput}`));
          return;
        }

        try {
          const result = JSON.parse(output.trim());
          resolve(result);
        } catch (parseError) {
          console.error('Failed to parse Python output:', output);
          reject(new Error(`Failed to parse face verification result: ${parseError.message}`));
        }
      });

      pythonProcess.stdin.write(JSON.stringify(inputData));
      pythonProcess.stdin.end();
    });
  }

  // Utility method to validate base64 image
  isValidBase64Image(base64String) {
    try {
      // Remove data URL prefix if present
      const base64Data = base64String.includes(',') ? base64String.split(',')[1] : base64String;
      
      // Check if it's valid base64
      const buffer = Buffer.from(base64Data, 'base64');
      return buffer.length > 0;
    } catch (error) {
      return false;
    }
  }

  // Generate a unique temporary file name
  generateTempFilename(extension = '.jpg') {
    return crypto.randomBytes(16).toString('hex') + extension;
  }
}

module.exports = new FaceAuthService();
