"""
MediaPipe Face Mesh Landmark Detector
Production wrapper for MediaPipe Face Mesh with 478 landmarks
Compatible with MediaPipe 0.10+
"""

import cv2
import time
import numpy as np
from typing import Optional, Tuple
from dataclasses import dataclass
import urllib.request
import os

import mediapipe as mp


@dataclass
class FaceLandmarks:
    """Container for face landmarks and metadata"""
    landmarks: np.ndarray  # Shape: (478, 3) - x, y, z coordinates
    frame_shape: Tuple[int, int]  # (height, width)
    bbox: Tuple[int, int, int, int]  # (x, y, w, h)
    confidence: float
    
    def get_pixel_coords(self) -> np.ndarray:
        h, w = self.frame_shape
        pixel_coords = self.landmarks.copy()
        pixel_coords[:, 0] = pixel_coords[:, 0] * w
        pixel_coords[:, 1] = pixel_coords[:, 1] * h
        return pixel_coords.astype(np.int32)


class LandmarkDetector:
    """
    Wrapper for MediaPipe Face Mesh
    Provides efficient face landmark detection with single-face enforcement
    """
    
    LEFT_EYE_INDICES = [362, 385, 387, 263, 373, 380]
    RIGHT_EYE_INDICES = [33, 160, 158, 133, 153, 144]
    
    MOUTH_INDICES = [61, 0, 291, 17, 13, 14]
    OUTER_LIPS_INDICES = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375]
    INNER_LIPS_INDICES = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324]
    
    FACE_OVAL_INDICES = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
                         397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
                         172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]
    
    MODEL_POINTS_3D = np.array([
        (0.0, 0.0, 0.0),            # Nose tip (index 1)
        (0.0, -330.0, -65.0),       # Chin (index 152)
        (-225.0, 170.0, -135.0),    # Left eye left corner (index 33)
        (225.0, 170.0, -135.0),     # Right eye right corner (index 263)
        (-150.0, -150.0, -125.0),   # Left mouth corner (index 61)
        (150.0, -150.0, -125.0)     # Right mouth corner (index 291)
    ], dtype=np.float64)
    
    IMAGE_POINTS_INDICES = [1, 152, 33, 263, 61, 291]
    
    def __init__(self, max_num_faces=1, min_detection_confidence=0.7,
                 min_tracking_confidence=0.7, refine_landmarks=True):
        self.max_num_faces = max_num_faces
        self.min_detection_confidence = min_detection_confidence
        self.min_tracking_confidence = min_tracking_confidence
        
        self.model_path = self._ensure_model_file()
        
        base_options = mp.tasks.BaseOptions(model_asset_path=self.model_path)
        # Use IMAGE mode — no timestamp dependency, works at any frame rate
        # (VIDEO mode requires strictly increasing timestamps matching real capture time,
        #  which breaks when frames arrive over HTTP at variable intervals)
        options = mp.tasks.vision.FaceLandmarkerOptions(
            base_options=base_options,
            running_mode=mp.tasks.vision.RunningMode.IMAGE,
            num_faces=max_num_faces,
            min_face_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence
        )
        
        self.landmarker = mp.tasks.vision.FaceLandmarker.create_from_options(options)
        self._last_detection = None
    
    def _ensure_model_file(self) -> str:
        # Look for model relative to this file's directory (../models/)
        model_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
        os.makedirs(model_dir, exist_ok=True)
        
        model_path = os.path.join(model_dir, 'face_landmarker.task')
        
        if not os.path.exists(model_path):
            print("Downloading MediaPipe Face Landmarker model...")
            model_url = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task"
            try:
                urllib.request.urlretrieve(model_url, model_path)
                print(f"Model downloaded to {model_path}")
            except Exception as e:
                print(f"Error downloading model: {e}")
                raise
        
        return model_path
        
    def detect(self, frame: np.ndarray) -> Optional[FaceLandmarks]:
        if frame is None or frame.size == 0:
            return None
        
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        h, w = frame.shape[:2]
        
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        
        # IMAGE mode: call detect() — no timestamp needed, works at any frame rate
        results = self.landmarker.detect(mp_image)
        
        if not results.face_landmarks or len(results.face_landmarks) != 1:
            self._last_detection = None
            return None
        
        face_landmarks_list = results.face_landmarks[0]
        
        landmarks = np.array([
            [lm.x, lm.y, lm.z] for lm in face_landmarks_list
        ])
        
        bbox = self._calculate_bbox(landmarks, (h, w))
        confidence = self._calculate_confidence(landmarks)
        
        face_lm = FaceLandmarks(
            landmarks=landmarks, frame_shape=(h, w),
            bbox=bbox, confidence=confidence
        )
        
        self._last_detection = face_lm
        return face_lm
    
    def _calculate_bbox(self, landmarks, frame_shape):
        h, w = frame_shape
        face_oval_lm = landmarks[self.FACE_OVAL_INDICES]
        
        x_min = np.min(face_oval_lm[:, 0]) * w
        x_max = np.max(face_oval_lm[:, 0]) * w
        y_min = np.min(face_oval_lm[:, 1]) * h
        y_max = np.max(face_oval_lm[:, 1]) * h
        
        return (int(x_min), int(y_min), int(x_max - x_min), int(y_max - y_min))
    
    def _calculate_confidence(self, landmarks):
        if self._last_detection is None:
            return 0.9
        z_coords = landmarks[:, 2]
        z_variance = np.var(z_coords)
        confidence = max(0.5, min(1.0, 1.0 - z_variance * 10))
        return confidence
    
    def get_eye_landmarks(self, face_landmarks):
        pixel_coords = face_landmarks.get_pixel_coords()
        left_eye = pixel_coords[self.LEFT_EYE_INDICES]
        right_eye = pixel_coords[self.RIGHT_EYE_INDICES]
        return left_eye, right_eye
    
    def get_mouth_landmarks(self, face_landmarks):
        pixel_coords = face_landmarks.get_pixel_coords()
        outer_lips = pixel_coords[self.OUTER_LIPS_INDICES]
        inner_lips = pixel_coords[self.INNER_LIPS_INDICES]
        return outer_lips, inner_lips
    
    def get_head_pose_points(self, face_landmarks):
        pixel_coords = face_landmarks.get_pixel_coords()
        image_points = pixel_coords[self.IMAGE_POINTS_INDICES][:, :2]
        return image_points.astype(np.float64)
    
    def release(self):
        if hasattr(self, 'landmarker') and self.landmarker:
            self.landmarker.close()
    
    def __del__(self):
        self.release()
