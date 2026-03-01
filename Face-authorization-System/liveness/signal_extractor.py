"""
Signal Extraction for Liveness Detection
Computes EAR (Eye Aspect Ratio), MAR (Mouth Aspect Ratio), and Head Pose
"""

import cv2
import numpy as np
from typing import Tuple, Dict, Optional
from dataclasses import dataclass

from .landmark_detector import FaceLandmarks, LandmarkDetector


@dataclass
class LivenessSignals:
    """Container for extracted liveness signals"""
    ear_left: float
    ear_right: float
    ear_avg: float
    mar: float
    head_yaw: float
    head_pitch: float
    head_roll: float
    timestamp: float
    
    def to_dict(self) -> Dict:
        return {
            'ear_left': self.ear_left, 'ear_right': self.ear_right,
            'ear_avg': self.ear_avg, 'mar': self.mar,
            'head_yaw': self.head_yaw, 'head_pitch': self.head_pitch,
            'head_roll': self.head_roll, 'timestamp': self.timestamp
        }


class SignalExtractor:
    """Extracts liveness signals from facial landmarks"""
    
    def __init__(self, landmark_detector: LandmarkDetector):
        self.detector = landmark_detector
        self.focal_length = 1.0
        self.camera_matrix = None
        self.dist_coeffs = np.zeros((4, 1))
        
    def extract(self, frame, face_landmarks, timestamp):
        if face_landmarks is None:
            return None
        
        if self.camera_matrix is None:
            h, w = frame.shape[:2]
            self._initialize_camera_matrix(w, h)
        
        ear_left, ear_right, ear_avg = self._compute_ear(face_landmarks)
        mar = self._compute_mar(face_landmarks)
        
        ear_left = np.clip(ear_left, 0.0, 1.0)
        ear_right = np.clip(ear_right, 0.0, 1.0)
        ear_avg = np.clip(ear_avg, 0.0, 1.0)
        mar = np.clip(mar, 0.0, 1.5)
        
        yaw, pitch, roll = self._compute_head_pose(frame, face_landmarks)
        
        return LivenessSignals(
            ear_left=ear_left, ear_right=ear_right, ear_avg=ear_avg,
            mar=mar, head_yaw=yaw, head_pitch=pitch, head_roll=roll,
            timestamp=timestamp
        )
    
    def _compute_ear(self, face_landmarks):
        left_eye, right_eye = self.detector.get_eye_landmarks(face_landmarks)
        ear_left = self._eye_aspect_ratio(left_eye)
        ear_right = self._eye_aspect_ratio(right_eye)
        ear_avg = (ear_left + ear_right) / 2.0
        return ear_left, ear_right, ear_avg
    
    def _eye_aspect_ratio(self, eye_landmarks):
        vertical_1 = np.linalg.norm(eye_landmarks[1] - eye_landmarks[5])
        vertical_2 = np.linalg.norm(eye_landmarks[2] - eye_landmarks[4])
        horizontal = np.linalg.norm(eye_landmarks[0] - eye_landmarks[3])
        if horizontal < 1e-6:
            return 0.0
        ear = (vertical_1 + vertical_2) / (2.0 * horizontal)
        return ear
    
    def _compute_mar(self, face_landmarks):
        pixel_coords = face_landmarks.get_pixel_coords()
        
        left_corner = pixel_coords[61][:2]
        right_corner = pixel_coords[291][:2]
        top_lip = pixel_coords[13][:2]
        bottom_lip = pixel_coords[14][:2]
        
        vertical = np.linalg.norm(top_lip - bottom_lip)
        horizontal = np.linalg.norm(left_corner - right_corner)
        
        if horizontal < 1e-6:
            return 0.0
        
        mar = vertical / horizontal
        return mar
    
    def _compute_head_pose(self, frame, face_landmarks):
        image_points = self.detector.get_head_pose_points(face_landmarks)
        model_points = self.detector.MODEL_POINTS_3D
        
        success, rotation_vec, translation_vec = cv2.solvePnP(
            model_points, image_points,
            self.camera_matrix, self.dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE
        )
        
        if not success:
            return 0.0, 0.0, 0.0
        
        rotation_mat, _ = cv2.Rodrigues(rotation_vec)
        yaw, pitch, roll = self._rotation_matrix_to_euler_angles(rotation_mat)
        
        yaw = np.clip(yaw, -90, 90)
        pitch = np.clip(pitch, -90, 90)
        roll = np.clip(roll, -90, 90)
        
        return yaw, pitch, roll
    
    def _rotation_matrix_to_euler_angles(self, R):
        sy = np.sqrt(R[0, 0] ** 2 + R[1, 0] ** 2)
        singular = sy < 1e-6
        
        if not singular:
            x = np.arctan2(R[2, 1], R[2, 2])  # roll
            y = np.arctan2(-R[2, 0], sy)       # pitch
            z = np.arctan2(R[1, 0], R[0, 0])   # yaw
        else:
            x = np.arctan2(-R[1, 2], R[1, 1])
            y = np.arctan2(-R[2, 0], sy)
            z = 0
        
        yaw = np.degrees(z)
        pitch = np.degrees(y)
        roll = np.degrees(x)
        
        return yaw, pitch, roll
    
    def _initialize_camera_matrix(self, width, height):
        focal_length = width
        center = (width / 2, height / 2)
        self.camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1]
        ], dtype=np.float64)
