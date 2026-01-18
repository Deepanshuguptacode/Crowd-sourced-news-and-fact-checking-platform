const axios = require('axios');

/**
 * HTTP-based Face Authentication Service
 * Makes requests to the standalone Face-authorization-System Flask app
 * 
 * This approach avoids Python import issues by using the working Flask API
 */
class HttpFaceAuthService {
    constructor() {
        this.faceAuthUrl = 'http://127.0.0.1:5000'; // Face-authorization-System Flask app
        this.timeout = 30000; // 30 second timeout
    }

    /**
     * Check if Face-authorization-System is running
     */
    async isServiceRunning() {
        try {
            const response = await axios.get(`${this.faceAuthUrl}/`, { timeout: 5000 });
            return response.status === 200;
        } catch (error) {
            console.log('Face-authorization-System is not running on port 5000');
            return false;
        }
    }

    /**
     * Detect face in image and get preview
     */
    async detectFace(imageBase64) {
        try {
            const response = await axios.post(
                `${this.faceAuthUrl}/api/detect_face`,
                { image: imageBase64 },
                {
                    timeout: this.timeout,
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            if (response.data.success) {
                return {
                    success: true,
                    bbox: response.data.bbox,
                    faceCrop: response.data.face_crop,
                    message: response.data.message
                };
            } else {
                return {
                    success: false,
                    message: response.data.message || 'Face detection failed'
                };
            }
        } catch (error) {
            console.error('Face detection error:', error.message);
            return {
                success: false,
                message: `Face detection service error: ${error.message}`
            };
        }
    }

    /**
     * Get face embedding directly from image without registering
     */
    async extractFaceEmbedding(imageBase64) {
        try {
            const response = await axios.post(
                `${this.faceAuthUrl}/api/detect_face`,
                { image: imageBase64 },
                {
                    timeout: this.timeout,
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            if (response.data.success) {
                // Now get the actual embedding by processing the image
                const embeddingResponse = await axios.post(
                    `${this.faceAuthUrl}/api/extract_embedding`,
                    { image: imageBase64 },
                    {
                        timeout: this.timeout,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );

                if (embeddingResponse.data.success) {
                    return {
                        success: true,
                        embedding: embeddingResponse.data.embedding,
                        bbox: response.data.bbox,
                        faceCrop: response.data.face_crop
                    };
                }
            }

            return {
                success: false,
                message: response.data.message || 'No face detected'
            };
        } catch (error) {
            console.error('Face embedding extraction error:', error.message);
            return {
                success: false,
                message: `Face embedding extraction error: ${error.message}`
            };
        }
    }

    /**
     * Register face and get embedding
     * Uses the Flask app's register endpoint but extracts just the embedding
     */
    async registerFace(username, imageBase64) {
        try {
            // First extract the embedding directly
            const embeddingResult = await this.extractFaceEmbedding(imageBase64);
            
            if (!embeddingResult.success) {
                return embeddingResult;
            }

            // Use a unique username for our face auth system to avoid conflicts
            const faceUsername = `face_${username}_${Date.now()}`;

            const response = await axios.post(
                `${this.faceAuthUrl}/api/register_face`,
                { 
                    username: faceUsername,
                    image: imageBase64 
                },
                {
                    timeout: this.timeout,
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            if (response.data.success) {
                return {
                    success: true,
                    message: 'Face registered successfully',
                    embedding: embeddingResult.embedding, // Return actual embedding
                    faceUsername: faceUsername, // Keep reference for verification
                    bbox: response.data.bbox,
                    faceCrop: response.data.face_crop
                };
            } else {
                return {
                    success: false,
                    message: response.data.message || 'Face registration failed'
                };
            }
        } catch (error) {
            console.error('Face registration error:', error.message);
            return {
                success: false,
                message: `Face registration service error: ${error.message}`
            };
        }
    }

    /**
     * Verify face using the Flask app's verification endpoint
     */
    async verifyFace(imageBase64) {
        try {
            const response = await axios.post(
                `${this.faceAuthUrl}/api/verify_face`,
                { image: imageBase64 },
                {
                    timeout: this.timeout,
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            if (response.data.success) {
                return {
                    success: true,
                    message: response.data.message,
                    username: response.data.username,
                    confidence: response.data.similarity,
                    bbox: response.data.bbox,
                    faceCrop: response.data.face_crop
                };
            } else {
                return {
                    success: false,
                    message: response.data.message || 'Face verification failed'
                };
            }
        } catch (error) {
            console.error('Face verification error:', error.message);
            return {
                success: false,
                message: `Face verification service error: ${error.message}`
            };
        }
    }

    /**
     * Verify face match using cosine similarity
     */
    verifyFaceMatch(testEmbedding, storedEmbedding, threshold = 0.3) {
        try {
            // Calculate cosine similarity
            const dotProduct = testEmbedding.reduce((sum, a, i) => sum + a * storedEmbedding[i], 0);
            const magnitudeA = Math.sqrt(testEmbedding.reduce((sum, a) => sum + a * a, 0));
            const magnitudeB = Math.sqrt(storedEmbedding.reduce((sum, b) => sum + b * b, 0));
            
            const similarity = dotProduct / (magnitudeA * magnitudeB);
            
            return {
                success: true,
                similarity: similarity,
                matched: similarity >= threshold,
                threshold: threshold
            };
        } catch (error) {
            return {
                success: false,
                message: `Face matching error: ${error.message}`
            };
        }
    }

    /**
     * Start the Face-authorization-System service if not running
     * This method attempts to start the Flask app
     */
    async startFaceAuthService() {
        const { spawn } = require('child_process');
        const path = require('path');
        
        return new Promise((resolve, reject) => {
            const faceAuthPath = path.join(__dirname, '..', '..', 'Face-authorization-System');
            
            console.log('Starting Face-authorization-System...');
            
            const pythonProcess = spawn('python', ['deferred-app.py'], {
                cwd: faceAuthPath,
                stdio: 'pipe'
            });

            let started = false;
            
            pythonProcess.stdout.on('data', (data) => {
                const output = data.toString();
                console.log('Face-auth output:', output);
                
                if (output.includes('Running on http://127.0.0.1:5000') && !started) {
                    started = true;
                    console.log('Face-authorization-System started successfully');
                    resolve(pythonProcess);
                }
            });

            pythonProcess.stderr.on('data', (data) => {
                const error = data.toString();
                console.error('Face-auth error:', error);
                
                // Don't reject on warnings, only on actual startup failures
                if (error.includes('Error') && !started) {
                    reject(new Error(`Failed to start Face-authorization-System: ${error}`));
                }
            });

            pythonProcess.on('close', (code) => {
                if (code !== 0 && !started) {
                    reject(new Error(`Face-authorization-System exited with code ${code}`));
                }
            });

            // Timeout after 30 seconds
            setTimeout(() => {
                if (!started) {
                    pythonProcess.kill();
                    reject(new Error('Face-authorization-System startup timeout'));
                }
            }, 30000);
        });
    }
}

module.exports = HttpFaceAuthService;