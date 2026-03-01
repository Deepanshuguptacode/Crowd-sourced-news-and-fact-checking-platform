import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle, AlertCircle, Shield, Eye, Smile, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import config from '../config';

/**
 * LivenessFaceCapture — Real liveness detection component
 *
 * Communicates with Flask /api/liveness/* endpoints to run
 * challenge-response liveness verification (blink, smile, head turn)
 * before capturing the final face image.
 *
 * Props:
 *   onSuccess(imageDataUrl) — called when liveness passes + face captured
 *   onError(message)        — called on any error or liveness failure
 */

const CHALLENGE_ICONS = {
  blink: Eye,
  smile: Smile,
  turn_left: ArrowLeft,
  turn_right: ArrowRight,
  turn_up: ArrowUp,
};

const FRAME_SEND_INTERVAL = 250; // ms between frames sent to server (~4 FPS)

const LivenessFaceCapture = ({ onSuccess, onError, ...rest }) => {
  // Session state
  const [sessionId, setSessionId] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [progress, setProgress] = useState(null);
  const [signals, setSignals] = useState(null);
  const [livenessResult, setLivenessResult] = useState(null);

  // Camera state
  const [stream, setStream] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');

  // UI state
  const [phase, setPhase] = useState('idle'); // idle | starting | verifying | success | failed | capturing
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const sessionIdRef = useRef(null);
  const cameraReadyRef = useRef(false);  // ref so async closures always read latest value

  // Keep refs in sync with state
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    cameraReadyRef.current = cameraReady;
  }, [cameraReady]);

  // --- Camera Management ---

  const getDevices = useCallback(async () => {
    try {
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      tempStream.getTracks().forEach(track => track.stop());
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceList.filter(d => d.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Device enumeration error:', err);
    }
  }, [selectedDevice]);

  const stopCamera = useCallback(() => {
    // Use srcObject directly to avoid stale stream closure
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    if (stream) stream.getTracks().forEach(t => t.stop());
    setStream(null);
    cameraReadyRef.current = false;
    setCameraReady(false);
  }, [stream]);

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 15, max: 30 },
        },
        audio: false,
      });
      setStream(newStream);
      setCameraReady(false);
    } catch (err) {
      const msg = err.name === 'NotAllowedError' ? 'Camera access denied. Please allow camera permissions.' :
                  err.name === 'NotFoundError' ? 'No camera found.' :
                  err.name === 'NotReadableError' ? 'Camera already in use by another app.' :
                  `Camera error: ${err.message}`;
      setError(msg);
      onError?.(msg);
    }
  }, [stream, selectedDevice, onError]);

  // Set up video element — re-run whenever stream OR phase changes
  // so the srcObject is reassigned when the video element becomes visible
  useEffect(() => {
    if (stream && videoRef.current) {
      // Always (re-)assign srcObject to handle element visibility changes
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
      videoRef.current.onloadedmetadata = async () => {
        try {
          if (videoRef.current) {
            await videoRef.current.play();
            cameraReadyRef.current = true;
            setCameraReady(true);
          }
        } catch (e) {
          console.error('Video play error:', e);
        }
      };
      // If already loaded, play immediately
      if (videoRef.current.readyState >= 2) {
        videoRef.current.play().catch(() => {});
        cameraReadyRef.current = true;
        setCameraReady(true);
      }
    }
  }, [stream, phase]);

  // Init devices
  useEffect(() => {
    getDevices();
  }, [getDevices]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
      if (sessionIdRef.current) {
        fetch(`${config.FACE_AUTH_URL}/api/liveness/abort/${sessionIdRef.current}`, { method: 'POST' }).catch(() => {});
      }
    };
  }, []);

  // --- Frame Sending ---

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !cameraReadyRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.6);
  }, []); // no deps — reads refs at call time, always stable

  const stopFrameSending = useCallback(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
  }, []);

  // Keep a ref to the latest sendFrame so the setInterval callback is never stale
  const sendFrameRef = useRef(null);

  const sendFrame = useCallback(async () => {
    const sid = sessionIdRef.current;
    if (!sid) return;

    const frameData = captureFrame();
    if (!frameData) return;

    try {
      const res = await fetch(`${config.FACE_AUTH_URL}/api/liveness/frame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sid, image: frameData }),
      });

      const data = await res.json();

      if (!data.success) {
        if (data.expired) {
          setPhase('failed');
          setError('Session expired. Please try again.');
          stopFrameSending();
          return;
        }
        return; // transient error, keep trying
      }

      // Update UI state from response
      if (data.signals) setSignals(data.signals);
      if (data.current_challenge) setCurrentChallenge(data.current_challenge);
      if (data.progress) setProgress(data.progress);
      if (data.challenges) setChallenges(data.challenges);

      // Check for session completion
      if (!data.session_active && data.result) {
        stopFrameSending();
        setLivenessResult(data.result);
        if (data.result.success) {
          setPhase('success');
          setStatusMessage('Liveness verified! Capturing face...');
          // Capture final high-quality frame after short delay
          setTimeout(() => {
            captureAndDeliver();
          }, 500);
        } else {
          setPhase('failed');
          setError(data.result.message || 'Liveness verification failed');
          onError?.(data.result.message || 'Liveness verification failed');
        }
      }
    } catch (err) {
      console.error('Frame send error:', err);
      // Don't stop; network blip, keep trying
    }
  }, [captureFrame, stopFrameSending, onError]);

  // Keep sendFrameRef up-to-date whenever sendFrame changes
  useEffect(() => {
    sendFrameRef.current = sendFrame;
  }, [sendFrame]);

  const startFrameSending = useCallback(() => {
    stopFrameSending();
    // Always call via ref so the interval never captures a stale closure
    frameIntervalRef.current = setInterval(() => {
      sendFrameRef.current?.();
    }, FRAME_SEND_INTERVAL);
  }, [stopFrameSending]);

  // --- Liveness Session ---

  const captureAndDeliver = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setPhase('capturing');
      // Stop camera using srcObject directly (avoids stale stream closure)
      const liveStream = video.srcObject;
      if (liveStream) liveStream.getTracks().forEach(t => t.stop());
      setStream(null);
      cameraReadyRef.current = false;
      setCameraReady(false);
      onSuccess?.(imageDataUrl);
    } catch (err) {
      setError('Failed to capture final image');
      onError?.('Failed to capture final image');
    }
  }, [onSuccess, onError]);

  const startLivenessSession = useCallback(async () => {
    try {
      setError(null);
      setPhase('starting');
      setStatusMessage('Starting liveness verification...');
      setLivenessResult(null);
      setChallenges([]);
      setCurrentChallenge(null);
      setProgress(null);
      setSignals(null);

      // Start camera first
      await startCamera();

      // Wait for camera to actually be ready (poll cameraReadyRef, max 8s)
      await new Promise((resolve, reject) => {
        const start = Date.now();
        const check = () => {
          if (cameraReadyRef.current) return resolve();
          if (Date.now() - start > 8000) return reject(new Error('Camera timed out'));
          setTimeout(check, 100);
        };
        check();
      });

      // Call Flask to create liveness session
      const res = await fetch(`${config.FACE_AUTH_URL}/api/liveness/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!data.success) {
        setPhase('failed');
        setError(data.message || 'Failed to start liveness session');
        return;
      }

      setSessionId(data.session_id);
      setChallenges(data.challenges);
      setCurrentChallenge(data.current_challenge);
      setPhase('verifying');
      setStatusMessage('Follow the instructions below');

      // Start sending frames after a small delay so ref is set
      setTimeout(() => {
        startFrameSending();
      }, 300);
    } catch (err) {
      setPhase('failed');
      setError(`Failed to start liveness: ${err.message}`);
    }
  }, [startCamera, startFrameSending]);

  const retryLiveness = useCallback(() => {
    stopFrameSending();
    stopCamera();
    setPhase('idle');
    setError(null);
    setSessionId(null);
    setLivenessResult(null);
    setChallenges([]);
    setCurrentChallenge(null);
    setProgress(null);
    setSignals(null);
  }, [stopFrameSending, stopCamera]);

  // --- Render Helpers ---

  const getChallengeIcon = (type) => {
    const Icon = CHALLENGE_ICONS[type] || Shield;
    return <Icon className="w-5 h-5" />;
  };

  const getProgressPercent = () => {
    if (!progress) return 0;
    return Math.round((progress.completed / progress.total) * 100);
  };

  return (
    <div className="liveness-face-capture space-y-4">
      {/* Phase: Idle — Start button */}
      {phase === 'idle' && (
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-slate-400">
            <Shield className="w-5 h-5" />
            <span className="text-sm">Liveness verification ensures you are a real person</span>
          </div>
          {devices.length > 1 && (
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white"
            >
              {devices.map((d, i) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={startLivenessSession}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/20"
          >
            <Camera className="w-5 h-5" />
            <span>Start Liveness Verification</span>
          </button>
        </div>
      )}

      {/* Phase: Starting */}
      {phase === 'starting' && (
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          <p className="text-sm text-gray-600 dark:text-slate-400">{statusMessage}</p>
        </div>
      )}

      {/* Single stable video element — always mounted, visibility controlled by CSS */}
      <div
        className={`relative bg-black rounded-xl overflow-hidden ${
          phase === 'verifying' ? '' : 'hidden'
        }`}
      >
        <video
          ref={videoRef}
          className="w-full rounded-xl border-2 border-blue-500 block"
          autoPlay playsInline muted
          style={{ minHeight: '240px', maxHeight: '360px', width: '100%', objectFit: 'cover', backgroundColor: '#000' }}
        />
        {/* Live overlay badge */}
        {phase === 'verifying' && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold animate-pulse">
            ● LIVE
          </div>
        )}
        {/* Signals overlay */}
        {signals && phase === 'verifying' && (
          <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs font-mono space-x-3">
            <span>EAR:{signals.ear}</span>
            <span>MAR:{signals.mar}</span>
            <span>Yaw:{signals.yaw}°</span>
            <span>Pitch:{signals.pitch}°</span>
          </div>
        )}
      </div>

      {/* Phase: Verifying — Challenges UI */}
      {phase === 'verifying' && (
        <div className="space-y-3">

          {/* Current Challenge Instruction */}
          {currentChallenge && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                {getChallengeIcon(currentChallenge.type)}
                <span className="text-lg font-bold text-blue-800 dark:text-blue-200">
                  {currentChallenge.instruction}
                </span>
              </div>
              {currentChallenge.remaining_time != null && (
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  Time remaining: {currentChallenge.remaining_time}s
                </div>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-slate-400">
                <span>Challenge {progress.current_index + 1} of {progress.total}</span>
                <span>{getProgressPercent()}% complete</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${getProgressPercent()}%` }}
                />
              </div>
            </div>
          )}

          {/* Challenge Status Pills */}
          {challenges.length > 0 && (
            <div className="flex justify-center space-x-2">
              {challenges.map((c, i) => (
                <div
                  key={i}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${
                    c.success
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700'
                      : c.completed
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700'
                      : progress && i === progress.current_index
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 animate-pulse'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 border-gray-300 dark:border-slate-600'
                  }`}
                >
                  {getChallengeIcon(c.type)}
                  <span>{c.success ? '✓' : c.completed ? '✗' : '...'}</span>
                </div>
              ))}
            </div>
          )}

          {/* No face warning */}
          {signals === null && (
            <div className="flex items-center space-x-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
              <span className="text-xs text-yellow-700 dark:text-yellow-300">No face detected — position your face in the frame</span>
            </div>
          )}
        </div>
      )}

      {/* Phase: Success */}
      {phase === 'success' && (
        <div className="text-center space-y-3 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
          <div>
            <p className="text-lg font-bold text-green-700 dark:text-green-300">Liveness Verified!</p>
            {livenessResult && (
              <p className="text-sm text-green-600 dark:text-green-400">
                Confidence: {(livenessResult.confidence * 100).toFixed(0)}% — {livenessResult.details?.successful_challenges}/{livenessResult.details?.total_challenges} challenges passed
              </p>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-slate-400">Capturing face image...</p>
        </div>
      )}

      {/* Phase: Capturing — delivered to parent */}
      {phase === 'capturing' && (
        <div className="text-center space-y-2 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl">
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
          <p className="text-sm font-medium text-green-700 dark:text-green-300">
            ✓ Liveness verified & face captured!
          </p>
        </div>
      )}

      {/* Phase: Failed */}
      {phase === 'failed' && (
        <div className="text-center space-y-3 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <div>
            <p className="text-lg font-bold text-red-700 dark:text-red-300">Verification Failed</p>
            <p className="text-sm text-red-600 dark:text-red-400">{error || 'Please try again'}</p>
          </div>
          <button
            type="button"
            onClick={retryLiveness}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4 inline mr-1" />
            Try Again
          </button>
        </div>
      )}

      {/* Error display (non-phase) */}
      {error && phase !== 'failed' && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default LivenessFaceCapture;
