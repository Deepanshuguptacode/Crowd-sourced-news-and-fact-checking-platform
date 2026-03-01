"""
Challenge-Response Engine for Active Liveness Detection
Generates randomized challenges and validates user responses
"""

import random
import time
from enum import Enum
from typing import List, Optional, Dict
from dataclasses import dataclass


class ChallengeType(Enum):
    """Types of liveness challenges"""
    BLINK = "blink"
    SMILE = "smile"
    TURN_LEFT = "turn_left"
    TURN_RIGHT = "turn_right"
    TURN_UP = "turn_up"


@dataclass
class Challenge:
    """Represents a single liveness challenge"""
    challenge_type: ChallengeType
    instruction: str
    timeout: float
    start_time: float
    expected_response: str
    completed: bool = False
    success: bool = False
    confidence: float = 0.0
    metadata: Dict = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}
    
    def is_expired(self, current_time: float) -> bool:
        return (current_time - self.start_time) > self.timeout
    
    def get_remaining_time(self, current_time: float) -> float:
        elapsed = current_time - self.start_time
        return max(0, self.timeout - elapsed)
    
    def to_dict(self) -> Dict:
        return {
            'type': self.challenge_type.value,
            'instruction': self.instruction,
            'timeout': self.timeout,
            'completed': self.completed,
            'success': self.success,
            'confidence': self.confidence,
        }


class ChallengeEngine:
    """
    Generates and manages randomized liveness challenges
    Implements challenge-response protocol for anti-spoofing
    """
    
    INSTRUCTIONS = {
        ChallengeType.BLINK: "Please blink your eyes",
        ChallengeType.SMILE: "Please smile",
        ChallengeType.TURN_LEFT: "Please turn your head left",
        ChallengeType.TURN_RIGHT: "Please turn your head right",
        ChallengeType.TURN_UP: "Please look up",
    }
    
    CHALLENGE_WEIGHTS = {
        ChallengeType.BLINK: 0.40,
        ChallengeType.SMILE: 0.30,
        ChallengeType.TURN_LEFT: 0.15,
        ChallengeType.TURN_RIGHT: 0.15,
        ChallengeType.TURN_UP: 0.00,  # Disabled
    }
    
    def __init__(self, min_challenges=2, max_challenges=3,
                 challenge_timeout=8.0, total_timeout=30.0,
                 randomize=True, seed=None):
        self.min_challenges = min_challenges
        self.max_challenges = max_challenges
        self.challenge_timeout = challenge_timeout
        self.total_timeout = total_timeout
        self.randomize = randomize
        
        if seed is not None:
            random.seed(seed)
        
        self.challenges: List[Challenge] = []
        self.current_challenge_idx: int = 0
        self.session_start_time: Optional[float] = None
        self.session_completed: bool = False
        
    def generate_challenge_sequence(self) -> List[Challenge]:
        num_challenges = random.randint(self.min_challenges, self.max_challenges)
        
        if self.randomize:
            challenge_types = self._select_random_challenges(num_challenges)
        else:
            challenge_types = [
                ChallengeType.BLINK, ChallengeType.SMILE, ChallengeType.TURN_LEFT
            ][:num_challenges]
        
        challenges = []
        for ctype in challenge_types:
            challenge = Challenge(
                challenge_type=ctype,
                instruction=self.INSTRUCTIONS[ctype],
                timeout=self.challenge_timeout,
                start_time=0.0,
                expected_response=ctype.value
            )
            challenges.append(challenge)
        
        return challenges
    
    def _select_random_challenges(self, num_challenges):
        challenge_types = list(self.CHALLENGE_WEIGHTS.keys())
        weights = list(self.CHALLENGE_WEIGHTS.values())
        
        selected = []
        for _ in range(num_challenges):
            if selected:
                available_types = [ct for ct in challenge_types if ct != selected[-1]]
                available_weights = [self.CHALLENGE_WEIGHTS[ct] for ct in available_types]
            else:
                available_types = challenge_types
                available_weights = weights
            
            total_weight = sum(available_weights)
            normalized_weights = [w / total_weight for w in available_weights]
            
            chosen = random.choices(available_types, weights=normalized_weights, k=1)[0]
            selected.append(chosen)
        
        return selected
    
    def start_session(self) -> Challenge:
        self.challenges = self.generate_challenge_sequence()
        self.current_challenge_idx = 0
        self.session_start_time = time.time()
        self.session_completed = False
        
        current_challenge = self.challenges[0]
        current_challenge.start_time = self.session_start_time
        
        return current_challenge
    
    def get_current_challenge(self) -> Optional[Challenge]:
        if self.current_challenge_idx < len(self.challenges):
            return self.challenges[self.current_challenge_idx]
        return None
    
    def advance_to_next_challenge(self) -> Optional[Challenge]:
        self.current_challenge_idx += 1
        
        if self.current_challenge_idx < len(self.challenges):
            next_challenge = self.challenges[self.current_challenge_idx]
            next_challenge.start_time = time.time()
            return next_challenge
        else:
            self.session_completed = True
            return None
    
    def is_session_expired(self) -> bool:
        if self.session_start_time is None:
            return False
        elapsed = time.time() - self.session_start_time
        return elapsed > self.total_timeout
    
    def get_session_progress(self) -> Dict:
        total_challenges = len(self.challenges)
        completed_challenges = sum(1 for c in self.challenges if c.completed)
        successful_challenges = sum(1 for c in self.challenges if c.success)
        
        current_time = time.time()
        elapsed_time = 0.0
        remaining_time = self.total_timeout
        
        if self.session_start_time:
            elapsed_time = current_time - self.session_start_time
            remaining_time = max(0, self.total_timeout - elapsed_time)
        
        return {
            'total_challenges': total_challenges,
            'completed_challenges': completed_challenges,
            'successful_challenges': successful_challenges,
            'current_challenge_idx': self.current_challenge_idx,
            'elapsed_time': elapsed_time,
            'remaining_time': remaining_time,
            'session_completed': self.session_completed,
            'session_expired': self.is_session_expired()
        }
    
    def mark_challenge_success(self, confidence=1.0, metadata=None):
        current_challenge = self.get_current_challenge()
        if current_challenge:
            current_challenge.completed = True
            current_challenge.success = True
            current_challenge.confidence = confidence
            if metadata:
                current_challenge.metadata.update(metadata)
    
    def mark_challenge_failure(self, reason="timeout"):
        current_challenge = self.get_current_challenge()
        if current_challenge:
            current_challenge.completed = True
            current_challenge.success = False
            current_challenge.confidence = 0.0
            current_challenge.metadata['failure_reason'] = reason
    
    def get_session_summary(self) -> Dict:
        progress = self.get_session_progress()
        
        successful_challenges = [c for c in self.challenges if c.success]
        
        if successful_challenges:
            avg_confidence = sum(c.confidence for c in successful_challenges) / len(successful_challenges)
        else:
            avg_confidence = 0.0
        
        min_successful = max(1, self.min_challenges)
        
        session_passed = (
            progress['successful_challenges'] >= min_successful and
            not progress['session_expired']
        )
        
        return {
            'session_passed': session_passed,
            'total_challenges': progress['total_challenges'],
            'successful_challenges': progress['successful_challenges'],
            'failed_challenges': progress['completed_challenges'] - progress['successful_challenges'],
            'average_confidence': avg_confidence,
            'total_time': progress['elapsed_time'],
            'challenges': [c.to_dict() for c in self.challenges]
        }
    
    def reset(self):
        self.challenges = []
        self.current_challenge_idx = 0
        self.session_start_time = None
        self.session_completed = False
