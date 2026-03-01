"""
Liveness detection module for Face-authorization-System
Adapted from rule-based-liveness-detection
"""

from .active_liveness import ActiveLivenessDetector, LivenessResult, create_detector
from .challenge_engine import ChallengeEngine, Challenge, ChallengeType
from .state_machine import LivenessStateMachine, VerificationState
from .landmark_detector import LandmarkDetector, FaceLandmarks
from .signal_extractor import SignalExtractor, LivenessSignals
from .config import RuleBasedConfig

__all__ = [
    'ActiveLivenessDetector', 'LivenessResult', 'create_detector',
    'ChallengeEngine', 'Challenge', 'ChallengeType',
    'LivenessStateMachine', 'VerificationState',
    'LandmarkDetector', 'FaceLandmarks',
    'SignalExtractor', 'LivenessSignals',
    'RuleBasedConfig',
]
