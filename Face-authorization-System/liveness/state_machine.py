"""
State Machine for Liveness Verification
Tracks user actions and validates challenge responses
"""

import time
from enum import Enum
from typing import Optional, Dict, List
from dataclasses import dataclass, field
from collections import deque

from .signal_extractor import LivenessSignals
from .challenge_engine import Challenge, ChallengeType


class VerificationState(Enum):
    IDLE = "idle"
    WAITING_FOR_FACE = "waiting_for_face"
    CHALLENGE_ACTIVE = "challenge_active"
    CHALLENGE_RESPONDING = "challenge_responding"
    CHALLENGE_VALIDATING = "challenge_validating"
    CHALLENGE_SUCCESS = "challenge_success"
    CHALLENGE_FAILED = "challenge_failed"
    SESSION_COMPLETE = "session_complete"
    SESSION_FAILED = "session_failed"


@dataclass
class ActionHistory:
    blink_count: int = 0
    smile_detected: bool = False
    head_turns: List[str] = field(default_factory=list)
    last_action_time: float = 0.0
    
    blink_buffer: deque = field(default_factory=lambda: deque(maxlen=30))
    smile_buffer: deque = field(default_factory=lambda: deque(maxlen=30))
    head_turn_buffer: deque = field(default_factory=lambda: deque(maxlen=30))
    
    def reset(self):
        self.blink_count = 0
        self.smile_detected = False
        self.head_turns = []
        self.last_action_time = 0.0
        self.blink_buffer.clear()
        self.smile_buffer.clear()
        self.head_turn_buffer.clear()


class LivenessStateMachine:
    """State machine for managing liveness verification flow"""
    
    def __init__(self, ear_threshold=0.21, mar_threshold=0.5,
                 yaw_threshold=20.0, pitch_threshold=15.0,
                 ear_consec_frames=2, mar_consec_frames=5,
                 head_consec_frames=10):
        self.ear_threshold = ear_threshold
        self.mar_threshold = mar_threshold
        self.yaw_threshold = yaw_threshold
        self.pitch_threshold = pitch_threshold
        
        self.ear_consec_frames = ear_consec_frames
        self.mar_consec_frames = mar_consec_frames
        self.head_consec_frames = head_consec_frames
        
        self.state = VerificationState.IDLE
        self.action_history = ActionHistory()
        
        self.blink_counter = 0
        self.eye_closed = False
        
        self.baseline_mar = 0.20
        self.mar_readings = []
        self.baseline_start_time = None  # time-based baseline instead of frame count
        self.BASELINE_DURATION = 1.0     # collect baseline for 1 second (any frame rate)

    def update(self, signals, current_challenge):
        if signals is None:
            if self.state not in [VerificationState.IDLE, VerificationState.SESSION_COMPLETE,
                                 VerificationState.SESSION_FAILED]:
                self.state = VerificationState.WAITING_FOR_FACE
            return self.state
        
        if self.state == VerificationState.IDLE:
            self.state = VerificationState.CHALLENGE_ACTIVE
        elif self.state == VerificationState.WAITING_FOR_FACE:
            self.state = VerificationState.CHALLENGE_ACTIVE
        elif self.state == VerificationState.CHALLENGE_ACTIVE:
            if current_challenge:
                self._process_challenge(signals, current_challenge)
        elif self.state in [VerificationState.CHALLENGE_SUCCESS, VerificationState.CHALLENGE_FAILED]:
            pass
        
        return self.state
    
    def _process_challenge(self, signals, challenge):
        challenge_type = challenge.challenge_type
        
        if challenge_type == ChallengeType.BLINK:
            self._process_blink_challenge(signals, challenge)
        elif challenge_type == ChallengeType.SMILE:
            self._process_smile_challenge(signals, challenge)
        elif challenge_type in [ChallengeType.TURN_LEFT, ChallengeType.TURN_RIGHT,
                               ChallengeType.TURN_UP]:
            self._process_head_turn_challenge(signals, challenge)
    
    def _process_blink_challenge(self, signals, challenge):
        ear = signals.ear_avg
        
        if challenge.challenge_type != ChallengeType.BLINK:
            return
        
        yaw = signals.head_yaw
        pitch = signals.head_pitch
        head_moving = abs(yaw) > 10 or abs(pitch) > 10
        
        if head_moving:
            self.eye_closed = False
            return
        
        self.action_history.blink_buffer.append(ear < self.ear_threshold)
        
        if ear < self.ear_threshold:
            if not self.eye_closed:
                self.eye_closed = True
        else:
            if self.eye_closed:
                self.blink_counter += 1
                self.action_history.blink_count += 1
                self.action_history.last_action_time = signals.timestamp
                
                if self.blink_counter >= 1:
                    self.state = VerificationState.CHALLENGE_SUCCESS
                    self._reset_detection_state()
                    
                self.eye_closed = False
    
    def _process_smile_challenge(self, signals, challenge):
        mar = signals.mar
        
        if challenge.challenge_type != ChallengeType.SMILE:
            return
        
        yaw = signals.head_yaw
        pitch = signals.head_pitch
        head_moving = abs(yaw) > 12 or abs(pitch) > 12
        
        if head_moving:
            return
        
        now = time.time()
        
        # Establish baseline for BASELINE_DURATION seconds (works at any frame rate)
        if self.baseline_start_time is None:
            self.baseline_start_time = now
        
        if now - self.baseline_start_time < self.BASELINE_DURATION:
            self.mar_readings.append(mar)
            return  # still collecting baseline
        
        # Compute/update baseline once from collected readings
        if self.mar_readings:
            self.baseline_mar = min(self.mar_readings)
            self.mar_readings = []  # clear so we don't recompute every frame
        
        mar_increase = mar - self.baseline_mar
        
        is_smiling = mar_increase > 0.05
        self.action_history.smile_buffer.append(is_smiling)
        
        recent_smiles = list(self.action_history.smile_buffer)[-self.mar_consec_frames:]
        
        if len(recent_smiles) >= self.mar_consec_frames:
            smile_count = sum(recent_smiles)
            if smile_count >= 2:
                if not self.action_history.smile_detected:
                    self.action_history.smile_detected = True
                    self.action_history.last_action_time = signals.timestamp
                    self.state = VerificationState.CHALLENGE_SUCCESS
                    self._reset_detection_state()
    
    def _process_head_turn_challenge(self, signals, challenge):
        yaw = signals.head_yaw
        pitch = signals.head_pitch
        
        if challenge.challenge_type not in [ChallengeType.TURN_LEFT, ChallengeType.TURN_RIGHT, ChallengeType.TURN_UP]:
            return
        
        direction = None
        
        is_glitch = (abs(abs(yaw) - 90.0) < 1.0)
        
        if not is_glitch and abs(yaw) > self.yaw_threshold:
            direction = 'left' if yaw < 0 else 'right'
        elif abs(pitch) > self.pitch_threshold:
            direction = 'up' if pitch > 0 else 'down'
        
        self.action_history.head_turn_buffer.append(direction)
        
        expected_direction = None
        if challenge.challenge_type == ChallengeType.TURN_LEFT:
            expected_direction = 'left'
        elif challenge.challenge_type == ChallengeType.TURN_RIGHT:
            expected_direction = 'right'
        elif challenge.challenge_type == ChallengeType.TURN_UP:
            expected_direction = 'up'
        
        recent_turns = list(self.action_history.head_turn_buffer)[-self.head_consec_frames:]
        
        if len(recent_turns) >= self.head_consec_frames:
            matching_count = sum(1 for turn in recent_turns if turn == expected_direction)
            
            if matching_count >= 3:
                if expected_direction not in self.action_history.head_turns:
                    self.action_history.head_turns.append(expected_direction)
                    self.action_history.last_action_time = signals.timestamp
                    self.state = VerificationState.CHALLENGE_SUCCESS
                    self._reset_detection_state()
    
    def _reset_detection_state(self):
        self.blink_counter = 0
        self.eye_closed = False
        self.mar_readings = []
        self.baseline_mar = 0.20
        self.baseline_start_time = None  # reset time-based baseline too
    
    def reset_for_new_challenge(self):
        self.state = VerificationState.CHALLENGE_ACTIVE
        self.action_history.reset()
        self._reset_detection_state()
    
    def get_action_confidence(self, challenge):
        challenge_type = challenge.challenge_type
        base_confidence = 0.8
        
        if challenge_type == ChallengeType.BLINK:
            blink_bonus = min(0.2, self.action_history.blink_count * 0.1)
            return min(1.0, base_confidence + blink_bonus)
        elif challenge_type == ChallengeType.SMILE:
            return base_confidence
        elif challenge_type in [ChallengeType.TURN_LEFT, ChallengeType.TURN_RIGHT,
                               ChallengeType.TURN_UP]:
            return base_confidence
        
        return base_confidence
    
    def get_state_description(self):
        descriptions = {
            VerificationState.IDLE: "Ready to start",
            VerificationState.WAITING_FOR_FACE: "Please position your face in frame",
            VerificationState.CHALLENGE_ACTIVE: "Processing challenge",
            VerificationState.CHALLENGE_RESPONDING: "Action detected",
            VerificationState.CHALLENGE_VALIDATING: "Validating response",
            VerificationState.CHALLENGE_SUCCESS: "Challenge completed!",
            VerificationState.CHALLENGE_FAILED: "Challenge failed",
            VerificationState.SESSION_COMPLETE: "Verification complete",
            VerificationState.SESSION_FAILED: "Verification failed"
        }
        return descriptions.get(self.state, "Unknown state")
