import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

const FaceCapture = ({ 
  onCapture, 
  onError, 
  disabled = false, 
  className = "", 
  mode = "capture", // "capture" | "upload" | "both"
  showPreview = true,
  captureButtonText = "Capture Face",
  uploadButtonText = "Upload Image"
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [faceDetectionResult, setFaceDetectionResult] = useState(null);
  const [faceCropPreview, setFaceCropPreview] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Get available camera devices
  const getDevices = useCallback(async () => {
    try {
      // Request camera permission first to get proper device labels
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      tempStream.getTracks().forEach(track => track.stop()); // Stop immediately
      
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      
      if (videoDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Error getting devices:', error);
      setError('Could not access camera devices. Please ensure camera permissions are granted.');
    }
  }, [selectedDevice]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      // Stop existing stream if any
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Use constraints similar to working Face-authorization-System
      const constraints = {
        video: {
          deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 15, max: 30 }
        },
        audio: false
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Set both stream and isCapturing together
      setStream(newStream);
      setIsCapturing(true);
    } catch (error) {
      console.error('Error starting camera:', error);
      let errorMessage = 'Could not access camera';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please allow camera permissions and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please connect a camera and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Selected camera does not support required settings. Try a different camera.';
      }
      
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [stream, selectedDevice, onError]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  }, [stream]);

  // Test face detection and show preview
  const testFaceDetection = useCallback(async (imageDataUrl) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/detect_face', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageDataUrl }),
      });

      const result = await response.json();
      
      if (result.success) {
        setFaceDetectionResult({
          success: true,
          message: result.message,
          bbox: result.bbox
        });
        
        // Set the face crop preview if available
        if (result.face_crop) {
          setFaceCropPreview(result.face_crop);
        }
      } else {
        setFaceDetectionResult({
          success: false,
          message: result.message
        });
        setFaceCropPreview(null);
      }
    } catch (error) {
      console.error('Face detection error:', error);
      setFaceDetectionResult({
        success: false,
        message: `Face detection service error: ${error.message}`
      });
      setFaceCropPreview(null);
    }
  }, []);

  // Capture photo
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      setProcessing(true);
      setError(null);

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Ensure video is playing and has dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        throw new Error('Video not ready. Please wait for the camera to fully load.');
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas with higher quality for final capture
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to base64 with high quality (same as Face-authorization-System)
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(imageDataUrl);
      
      // Test face detection and show preview
      await testFaceDetection(imageDataUrl);
      
      // Call parent callback
      await onCapture(imageDataUrl);
      
    } catch (error) {
      console.error('Error capturing photo:', error);
      setError('Failed to capture photo: ' + error.message);
      onError?.('Failed to capture photo: ' + error.message);
    } finally {
      setProcessing(false);
    }
  }, [onCapture, onError]);

  // Handle file upload
  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image file is too large. Please select a file smaller than 10MB.');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const imageDataUrl = e.target.result;
          setCapturedImage(imageDataUrl);
          
          // Test face detection and show preview
          await testFaceDetection(imageDataUrl);
          
          await onCapture(imageDataUrl);
        } catch (error) {
          console.error('Error processing uploaded image:', error);
          setError('Failed to process uploaded image: ' + error.message);
          onError?.('Failed to process uploaded image: ' + error.message);
        } finally {
          setProcessing(false);
        }
      };
      
      reader.onerror = () => {
        setError('Failed to read image file');
        onError?.('Failed to read image file');
        setProcessing(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
      setError('Failed to read image file: ' + error.message);
      onError?.('Failed to read image file: ' + error.message);
      setProcessing(false);
    }
  }, [onCapture, onError]);

  // Reset capture
  const resetCapture = useCallback(() => {
    setCapturedImage(null);
    setError(null);
  }, []);

  // Initialize devices on mount
  useEffect(() => {
    getDevices();
  }, [getDevices]);

  // Set up video element when stream is available
  useEffect(() => {
    if (stream && videoRef.current) {
      // Directly set srcObject
      videoRef.current.srcObject = stream;
      
      // Force set isCapturing to true if we have a stream
      if (!isCapturing) {
        setIsCapturing(true);
      }
      
      // Wait for video metadata to load
      videoRef.current.onloadedmetadata = async () => {
        try {
          // Explicitly play the video
          await videoRef.current.play();
          
          // Set canvas dimensions
          if (canvasRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
          }
        } catch (playError) {
          console.error('Video play error:', playError);
          setError('Camera started but video display failed. Try clicking on the video area.');
        }
      };
      
      // Also try to play immediately in case metadata is already loaded
      if (videoRef.current.readyState >= 2) {
        videoRef.current.play().catch(e => console.warn('Immediate play failed:', e));
      }
    }
  }, [stream, isCapturing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className={`face-capture-container ${className}`}>
      <div className="space-y-4">
        
        {/* Device Selection */}
        {devices.length > 1 && (mode === 'capture' || mode === 'both') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Camera Selection
            </label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              disabled={disabled || isCapturing}
            >
              {devices.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${index + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Camera Controls */}
        {(mode === 'capture' || mode === 'both') && (
          <div className="flex space-x-2">
            {!stream ? (
              <button
                type="button"
                onClick={startCamera}
                disabled={disabled || processing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                <Camera className="w-4 h-4" />
                <span>Start Camera</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={disabled || processing}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  {processing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  <span>{processing ? 'Processing...' : captureButtonText}</span>
                </button>
                
                <button
                  type="button"
                  onClick={stopCamera}
                  disabled={disabled || processing}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Stop Camera
                </button>
              </>
            )}
          </div>
        )}

        {/* File Upload */}
        {(mode === 'upload' || mode === 'both') && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={disabled || processing}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || processing}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>{uploadButtonText}</span>
            </button>
          </div>
        )}

        {/* Debug Info - Remove after fixing */}
        <div className="text-xs bg-yellow-100 dark:bg-yellow-900 p-2 rounded mb-2">
          <div><strong>Debug Info:</strong></div>
          <div>isCapturing: {isCapturing ? '✅ TRUE' : '❌ FALSE'}</div>
          <div>stream: {stream ? '✅ Active' : '❌ None'}</div>
          <div>videoRef: {videoRef.current ? '✅ Exists' : '❌ NULL'}</div>
          <div>Error: {error || 'None'}</div>
        </div>

        {/* Video Preview */}
        {stream && (
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full max-w-md mx-auto rounded-lg border-2 border-blue-500 dark:border-blue-600 block"
              autoPlay
              playsInline
              muted
              style={{
                display: 'block',
                minHeight: '300px',
                maxHeight: '480px',
                width: '100%',
                objectFit: 'cover',
                backgroundColor: '#000'
              }}
            />
            <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
              📹 Live Camera
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative">
            <AlertCircle className="w-4 h-4 inline mr-2" />
            <span>{error}</span>
          </div>
        )}

        {/* Captured Image Preview */}
        {showPreview && capturedImage && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Captured Image:</span>
              <button
                type="button"
                onClick={resetCapture}
                disabled={disabled || processing}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Retake
              </button>
            </div>
            
            {/* Original Image */}
            <div className="relative">
              <img
                src={capturedImage}
                alt="Captured face"
                className="w-full max-w-xs mx-auto rounded-lg border-2 border-green-300 dark:border-green-600"
              />
            </div>

            {/* Face Detection Results */}
            {faceDetectionResult && (
              <div className="mt-4 space-y-2">
                <div className={`flex items-center space-x-2 p-3 rounded-lg border ${
                  faceDetectionResult.success 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  {faceDetectionResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  )}
                  <div className="text-sm">
                    <div className={`font-medium ${
                      faceDetectionResult.success 
                        ? 'text-green-700 dark:text-green-300' 
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      Face Detection: {faceDetectionResult.success ? 'SUCCESS' : 'FAILED'}
                    </div>
                    <div className={`text-xs ${
                      faceDetectionResult.success 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {faceDetectionResult.message}
                    </div>
                    {faceDetectionResult.bbox && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Bounding Box: [{faceDetectionResult.bbox.join(', ')}]
                      </div>
                    )}
                  </div>
                </div>

                {/* Face Crop Preview */}
                {faceCropPreview && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 dark:text-slate-300">
                      Detected Face (This will be used for embedding):
                    </div>
                    <div className="flex justify-center">
                      <img
                        src={faceCropPreview}
                        alt="Detected face crop"
                        className="max-w-32 max-h-32 rounded-lg border-2 border-blue-300 dark:border-blue-600 shadow-lg"
                      />
                    </div>
                    <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                      Face detection confidence threshold: 60%
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Error Display */}
        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}

        {/* Success Indicator */}
        {capturedImage && !error && (
          <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span className="text-sm text-green-700 dark:text-green-300">Face image captured successfully</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceCapture;