#!/usr/bin/env node

/**
 * Face Authentication Integration Setup Script
 * 
 * This script sets up the face authentication system integration by:
 * 1. Installing Python dependencies for the face authentication service
 * 2. Testing the face authentication service
 * 3. Verifying the integration
 */

const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class FaceAuthSetup {
  constructor() {
    this.rootDir = path.join(__dirname, '..');
    this.faceAuthDir = path.join(this.rootDir, 'Face-authorization-System');
    this.backendDir = path.join(this.rootDir, 'backend');
    this.requirementsFile = path.join(this.faceAuthDir, 'requirements.txt');
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '✓',
      'warn': '⚠',
      'error': '✗',
      'progress': '⚡'
    }[type] || '•';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async checkPython() {
    return new Promise((resolve) => {
      exec('python --version', (error, stdout, stderr) => {
        if (error) {
          // Try python3
          exec('python3 --version', (error3, stdout3, stderr3) => {
            resolve({
              hasPhython: !error3,
              command: error3 ? null : 'python3',
              version: stdout3 || stderr3
            });
          });
        } else {
          resolve({
            hasPhython: true,
            command: 'python',
            version: stdout || stderr
          });
        }
      });
    });
  }

  async checkPip() {
    return new Promise((resolve) => {
      exec('pip --version', (error, stdout, stderr) => {
        if (error) {
          // Try pip3
          exec('pip3 --version', (error3, stdout3, stderr3) => {
            resolve({
              hasPip: !error3,
              command: error3 ? null : 'pip3',
              version: stdout3 || stderr3
            });
          });
        } else {
          resolve({
            hasPip: true,
            command: 'pip',
            version: stdout || stderr
          });
        }
      });
    });
  }

  async installPythonDependencies() {
    const { hasPhython, command: pythonCmd } = await this.checkPython();
    const { hasPip, command: pipCmd } = await this.checkPip();

    if (!hasPhython || !hasPip) {
      throw new Error('Python and pip are required. Please install Python 3.9+ with pip.');
    }

    await this.log(`Found Python: ${pythonCmd}`, 'info');
    await this.log(`Found pip: ${pipCmd}`, 'info');

    // Check if requirements.txt exists
    try {
      await fs.access(this.requirementsFile);
      await this.log('Found requirements.txt', 'info');
    } catch (error) {
      throw new Error('requirements.txt not found in Face-authorization-System directory');
    }

    // Install dependencies
    return new Promise((resolve, reject) => {
      const installProcess = spawn(pipCmd, ['install', '-r', this.requirementsFile], {
        cwd: this.faceAuthDir,
        stdio: 'inherit'
      });

      installProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Failed to install Python dependencies (exit code: ${code})`));
        }
      });

      installProcess.on('error', (error) => {
        reject(new Error(`Failed to run pip: ${error.message}`));
      });
    });
  }

  async createTestScript() {
    const testScript = `#!/usr/bin/env python3
"""
Test script for Face Authentication Service
"""
import sys
import json
import os

# Add the face auth system path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from insightface.app import FaceAnalysis
    import cv2
    import numpy as np
    
    print("✓ All required packages imported successfully")
    
    # Test ArcFace model initialization
    face_app = FaceAnalysis(providers=['CPUExecutionProvider'])
    face_app.prepare(ctx_id=0, det_size=(640, 640))
    
    print("✓ ArcFace model initialized successfully")
    
    # Test basic functionality
    test_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
    faces = face_app.get(test_image)
    
    print(f"✓ Face detection test completed (found {len(faces)} faces in test image)")
    
    print("\\n🎉 Face Authentication Service is ready!")
    
except ImportError as e:
    print(f"✗ Import error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"✗ Error: {e}")
    sys.exit(1)
`;

    const testScriptPath = path.join(this.faceAuthDir, 'test_setup.py');
    await fs.writeFile(testScriptPath, testScript);
    return testScriptPath;
  }

  async testFaceAuthService() {
    const testScriptPath = await this.createTestScript();
    const { command: pythonCmd } = await this.checkPython();

    return new Promise((resolve, reject) => {
      const testProcess = spawn(pythonCmd, [testScriptPath], {
        cwd: this.faceAuthDir,
        stdio: 'inherit'
      });

      testProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Face authentication service test failed (exit code: ${code})`));
        }
      });

      testProcess.on('error', (error) => {
        reject(new Error(`Failed to run test: ${error.message}`));
      });
    });
  }

  async verifyNodeJsIntegration() {
    // Check if the face auth service file exists
    const faceServicePath = path.join(this.backendDir, 'services', 'faceAuthService.js');
    
    try {
      await fs.access(faceServicePath);
      await this.log('Face authentication service integration file found', 'info');
    } catch (error) {
      throw new Error('Face authentication service integration file not found');
    }

    // Check if user models have been updated
    const communityUserPath = path.join(this.backendDir, 'models', 'CommunityUser.js');
    
    try {
      const content = await fs.readFile(communityUserPath, 'utf8');
      if (content.includes('faceEmbedding') && content.includes('hasFaceAuth')) {
        await this.log('User models have been updated with face authentication fields', 'info');
      } else {
        throw new Error('User models are missing face authentication fields');
      }
    } catch (error) {
      throw new Error(`Failed to verify user model updates: ${error.message}`);
    }
  }

  async run() {
    try {
      await this.log('Starting Face Authentication Integration Setup...', 'progress');
      
      // Step 1: Install Python dependencies
      await this.log('Step 1: Installing Python dependencies...', 'progress');
      await this.installPythonDependencies();
      await this.log('Python dependencies installed successfully', 'info');
      
      // Step 2: Test face authentication service
      await this.log('Step 2: Testing face authentication service...', 'progress');
      await this.testFaceAuthService();
      await this.log('Face authentication service test passed', 'info');
      
      // Step 3: Verify Node.js integration
      await this.log('Step 3: Verifying Node.js integration...', 'progress');
      await this.verifyNodeJsIntegration();
      await this.log('Node.js integration verified', 'info');
      
      await this.log('🎉 Face Authentication Integration Setup Complete!', 'info');
      await this.log('', 'info');
      await this.log('Next steps:', 'info');
      await this.log('1. Start your Node.js backend server: npm start', 'info');
      await this.log('2. Start your React frontend: npm run dev', 'info');
      await this.log('3. Try signing up with face authentication enabled', 'info');
      
    } catch (error) {
      await this.log(`Setup failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  const setup = new FaceAuthSetup();
  setup.run().catch(console.error);
}

module.exports = FaceAuthSetup;