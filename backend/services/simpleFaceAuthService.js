const { spawn } = require('child_process');
const path = require('path');

class SimpleFaceAuthService {
  constructor() {
    this.faceAuthPath = path.join(__dirname, '../../Face-authorization-System');
  }

  async extractFaceEmbedding(base64Image) {
    return new Promise((resolve, reject) => {
      // Create a simple Python script that uses the existing app.py logic
      const pythonScript = `
import sys
import json
import os
sys.path.insert(0, r'${this.faceAuthPath.replace(/\\/g, '\\\\')}')

# Import from the working app.py
try:
    from app import get_embedding_from_image_data
    
    # Get the image data from stdin
    input_data = json.loads(sys.stdin.read())
    image_data = input_data.get('image')
    
    # Process using existing function
    embedding, bbox, face_crop = get_embedding_from_image_data(image_data)
    
    if embedding is not None:
        result = {
            'success': True,
            'embedding': embedding.tolist()
        }
    else:
        result = {
            'success': False,
            'error': 'No face detected in image'
        }
    
    print(json.dumps(result))
    
except Exception as e:
    result = {
        'success': False,
        'error': f'Error: {str(e)}'
    }
    print(json.dumps(result))
`;

      const pythonProcess = spawn('python', ['-c', pythonScript], {
        cwd: this.faceAuthPath
      });

      const inputData = {
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

  async verifyFaceMatch(testEmbedding, storedEmbeddings, threshold = 0.6) {
    return new Promise((resolve, reject) => {
      const pythonScript = `
import sys
import json
import numpy as np

def cosine_similarity(a, b):
    a = np.array(a)
    b = np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

try:
    input_data = json.loads(sys.stdin.read())
    test_embedding = input_data.get('test_embedding')
    stored_embeddings = input_data.get('stored_embeddings', {})
    threshold = input_data.get('threshold', 0.6)
    
    best_similarity = 0
    best_match_id = None
    
    for user_id, stored_embedding in stored_embeddings.items():
        similarity = cosine_similarity(test_embedding, stored_embedding)
        
        if similarity > best_similarity and similarity > threshold:
            best_similarity = similarity
            best_match_id = user_id
    
    result = {
        'success': True,
        'matched_user_id': best_match_id,
        'similarity': float(best_similarity),
        'threshold': threshold
    }
    
    print(json.dumps(result))
    
except Exception as e:
    result = {
        'success': False,
        'error': f'Error: {str(e)}'
    }
    print(json.dumps(result))
`;

      const pythonProcess = spawn('python', ['-c', pythonScript], {
        cwd: this.faceAuthPath
      });

      const inputData = {
        test_embedding: testEmbedding,
        stored_embeddings: storedEmbeddings,
        threshold: threshold
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
}

module.exports = new SimpleFaceAuthService();