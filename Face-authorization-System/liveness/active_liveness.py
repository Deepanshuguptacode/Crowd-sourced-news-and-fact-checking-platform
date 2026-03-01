"""
Active Liveness Detection - Main Orchestrator
Coordinates all rule-based liveness detection components
"""

import cv2
import time
import numpy as np
from typing import Optional, Dict, Tuple
from dataclasses import dataclass

from .landmark_detector import LandmarkDetector, FaceLandmarks
from .signal_extractor import SignalExtractor, LivenessSignals
from .challenge_engine import ChallengeEngine, Challenge
from .state_machine import LivenessStateMachine, VerificationState
from .config import RuleBasedConfig


@dataclass
class LivenessResult:
    """Result of liveness detection"""
    success: bool
    confidence: float
    message: str
    details: Dict
    
    @property
    def is_live(self) -> bool:
        return self.success and self.confidence > 0.0
    
    def to_dict(self) -> Dict:
        return {
            'success': self.success,
            'confidence': self.confidence,
            'message': self.message,
            'is_live': self.is_live,
            'details': self.details,
        }


class ActiveLivenessDetector:
    """
    Main orchestrator for rule-based active liveness detection
    Implements complete challenge-response verification pipeline
    """
    
    def __init__(self, config: Optional[RuleBasedConfig] = None):
        if config is None:
            config = RuleBasedConfig()
        
        self.config = config
        
        self.landmark_detector = LandmarkDetector(
            max_num_faces=config.max_num_faces,
            min_detection_confidence=config.min_detection_confidence,
            min_tracking_confidence=config.min_tracking_confidence,
            refine_landmarks=config.refine_landmarks
        )
        
        self.signal_extractor = SignalExtractor(self.landmark_detector)
        
        self.challenge_engine = ChallengeEngine(
            min_challenges=config.min_challenges,
            max_challenges=config.max_challenges,
            challenge_timeout=config.challenge_timeout,
            total_timeout=config.total_timeout
        )
        
        self.state_machine = LivenessStateMachine(
            ear_threshold=config.ear_blink_threshold,
            mar_threshold=config.mar_smile_threshold,
            yaw_threshold=config.head_yaw_threshold,
            pitch_threshold=config.head_pitch_threshold,
            ear_consec_frames=config.ear_consec_frames,
            mar_consec_frames=config.mar_consec_frames,
            head_consec_frames=config.head_consec_frames
        )
        
        self.current_challenge: Optional[Challenge] = None
        self.session_active = False
        
        self.challenge_completed_at = 0.0
        self.last_completed_challenge = None
        self.transition_duration = 1.5  # shorter for web
        
    def start_verification(self) -> Challenge:
        self.current_challenge = self.challenge_engine.start_session()
        self.state_machine.reset_for_new_challenge()
        self.session_active = True
        return self.current_challenge
    
    def process_frame(self, frame: np.ndarray) -> Tuple[Optional[LivenessSignals], VerificationState]:
        if not self.session_active:
            return None, VerificationState.IDLE
        
        face_landmarks = self.landmark_detector.detect(frame)
        
        signals = None
        if face_landmarks:
            timestamp = time.time()
            signals = self.signal_extractor.extract(frame, face_landmarks, timestamp)
        
        state = self.state_machine.update(signals, self.current_challenge)
        
        if state == VerificationState.CHALLENGE_SUCCESS:
            self._handle_challenge_success()
        elif state == VerificationState.CHALLENGE_FAILED:
            self._handle_challenge_failure()
        
        if self.current_challenge and self.current_challenge.is_expired(time.time()):
            self._handle_challenge_timeout()
        
        if self.challenge_engine.is_session_expired():
            self._handle_session_timeout()
        
        return signals, state
    
    def _handle_challenge_success(self):
        if self.current_challenge:
            confidence = self.state_machine.get_action_confidence(self.current_challenge)
            
            self.challenge_engine.mark_challenge_success(
                confidence=confidence,
                metadata={
                    'blink_count': self.state_machine.action_history.blink_count,
                    'smile_detected': self.state_machine.action_history.smile_detected,
                    'head_turns': self.state_machine.action_history.head_turns
                }
            )
            
            self.last_completed_challenge = self.current_challenge
            self.challenge_completed_at = time.time()
            
            self.current_challenge = self.challenge_engine.advance_to_next_challenge()
            
            if self.current_challenge:
                self.state_machine.reset_for_new_challenge()
            else:
                self.session_active = False
                self.state_machine.state = VerificationState.SESSION_COMPLETE
    
    def _handle_challenge_failure(self):
        if self.current_challenge:
            self.challenge_engine.mark_challenge_failure(reason="invalid_response")
            self.session_active = False
            self.state_machine.state = VerificationState.SESSION_FAILED
    
    def _handle_challenge_timeout(self):
        if self.current_challenge and not self.current_challenge.completed:
            self.challenge_engine.mark_challenge_failure(reason="timeout")
            self.session_active = False
            self.state_machine.state = VerificationState.SESSION_FAILED
    
    def _handle_session_timeout(self):
        self.session_active = False
        self.state_machine.state = VerificationState.SESSION_FAILED
    
    def get_result(self) -> LivenessResult:
        if self.session_active:
            return LivenessResult(
                success=False, confidence=0.0,
                message="Verification in progress",
                details=self.challenge_engine.get_session_progress()
            )
        
        summary = self.challenge_engine.get_session_summary()
        
        success = summary['session_passed']
        confidence = summary['average_confidence']
        
        if success:
            message = f"Liveness verified! Completed {summary['successful_challenges']}/{summary['total_challenges']} challenges"
        else:
            message = f"Verification failed. Completed {summary['successful_challenges']}/{summary['total_challenges']} challenges"
        
        return LivenessResult(
            success=success, confidence=confidence,
            message=message, details=summary
        )
    
    def get_current_instruction(self) -> str:
        if self.current_challenge:
            return self.current_challenge.instruction
        return "No active challenge"
    
    def get_remaining_time(self) -> float:
        if self.current_challenge:
            return self.current_challenge.get_remaining_time(time.time())
        return 0.0
    
    def get_progress(self) -> Dict:
        return self.challenge_engine.get_session_progress()
    
    def is_session_active(self) -> bool:
        return self.session_active
    
    def get_state(self) -> VerificationState:
        return self.state_machine.state
    
    def get_all_challenges(self) -> list:
        return self.challenge_engine.challenges
    
    def abort_session(self):
        self.session_active = False
        self.state_machine.state = VerificationState.SESSION_FAILED
        self.current_challenge = None
    
    def reset(self):
        self.challenge_engine.reset()
        self.state_machine.reset_for_new_challenge()
        self.state_machine.state = VerificationState.IDLE
        self.current_challenge = None
        self.session_active = False
    
    def __del__(self):
        if hasattr(self, 'landmark_detector'):
            self.landmark_detector.release()


def create_detector(config: Optional[RuleBasedConfig] = None) -> ActiveLivenessDetector:
    return ActiveLivenessDetector(config)
