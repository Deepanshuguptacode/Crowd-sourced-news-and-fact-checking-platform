"""
Configuration for rule-based liveness detection
Simplified from the original src/config/config.py for integration
"""

from dataclasses import dataclass
from typing import Tuple


@dataclass
class RuleBasedConfig:
    """Configuration for rule-based active liveness detection"""
    
    # MediaPipe Face Mesh settings
    max_num_faces: int = 1
    min_detection_confidence: float = 0.5   # Lowered from 0.7 for web JPEG frames
    min_tracking_confidence: float = 0.5    # Lowered from 0.7 for web JPEG frames
    refine_landmarks: bool = True
    
    # EAR (Eye Aspect Ratio) thresholds
    ear_blink_threshold: float = 0.25
    ear_consec_frames: int = 2
    ear_min_blinks: int = 1
    ear_max_blinks: int = 3
    
    # MAR (Mouth Aspect Ratio) thresholds
    mar_smile_threshold: float = 0.25
    mar_consec_frames: int = 3
    
    # Head pose thresholds (degrees)
    head_yaw_threshold: float = 15.0
    head_pitch_threshold: float = 12.0
    head_roll_threshold: float = 15.0
    head_consec_frames: int = 5
    
    # Challenge settings
    challenge_timeout: float = 10.0
    total_timeout: float = 40.0
    min_challenges: int = 3
    max_challenges: int = 3
    
    # Video settings
    camera_index: int = 0
    frame_width: int = 640
    frame_height: int = 480
    fps: int = 30
    
    # Detection settings
    face_size_min: Tuple[int, int] = (100, 100)
    face_crop_margin: float = 0.2
    
    # Confidence scoring
    confidence_weights: dict = None
    
    def __post_init__(self):
        if self.confidence_weights is None:
            self.confidence_weights = {
                'blink': 0.35,
                'smile': 0.25,
                'head_turn': 0.40
            }
