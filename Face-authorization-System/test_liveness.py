"""
Standalone Liveness Detection Test
===================================
Runs the liveness detection module directly on your webcam.
No Flask server or browser required.

Usage:
    .venv/Scripts/python.exe test_liveness.py
    .venv/Scripts/python.exe test_liveness.py --camera 1   # use second camera
    .venv/Scripts/python.exe test_liveness.py --no-display  # headless (print-only)

Controls:
    Q / ESC  — Quit
    R        — Restart
"""

import sys
import argparse
import time
import cv2
import numpy as np

# ── Import liveness module from this package ──────────────────────────────────
try:
    from liveness import create_detector, RuleBasedConfig
    from liveness.challenge_engine import ChallengeType
    from liveness.state_machine import VerificationState
except ImportError as e:
    print(f"[ERROR] Could not import liveness module: {e}")
    print("Make sure you are running this from the Face-authorization-System directory.")
    sys.exit(1)


# ── Colour palette ─────────────────────────────────────────────────────────────
CLR_BG     = (30,  30,  30)
CLR_WHITE  = (255, 255, 255)
CLR_GREEN  = (50,  220, 100)
CLR_RED    = (80,   80, 240)   # BGR
CLR_YELLOW = (30,  220, 220)
CLR_BLUE   = (220, 160,  50)
CLR_GRAY   = (150, 150, 150)
CLR_PANEL  = (45,  45,  45)


def draw_rounded_rect(img, pt1, pt2, color, radius=10, thickness=-1):
    """Draw a filled or outlined rounded rectangle."""
    x1, y1 = pt1
    x2, y2 = pt2
    if thickness == -1:
        cv2.rectangle(img, (x1 + radius, y1), (x2 - radius, y2), color, -1)
        cv2.rectangle(img, (x1, y1 + radius), (x2, y2 - radius), color, -1)
        for cx, cy in [(x1+radius, y1+radius), (x2-radius, y1+radius),
                       (x1+radius, y2-radius), (x2-radius, y2-radius)]:
            cv2.circle(img, (cx, cy), radius, color, -1)
    else:
        cv2.rectangle(img, (x1 + radius, y1), (x2 - radius, y2), color, thickness)
        cv2.rectangle(img, (x1, y1 + radius), (x2, y2 - radius), color, thickness)
        for cx, cy in [(x1+radius, y1+radius), (x2-radius, y1+radius),
                       (x1+radius, y2-radius), (x2-radius, y2-radius)]:
            cv2.circle(img, (cx, cy), radius, color, thickness)


def put_text_centered(img, text, y, font_scale, color, thickness=1):
    """Draw centred text on the frame."""
    (w, _), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)
    x = (img.shape[1] - w) // 2
    cv2.putText(img, text, (x, y), cv2.FONT_HERSHEY_SIMPLEX, font_scale, color, thickness, cv2.LINE_AA)


def draw_overlay(frame, challenge, progress, signals, state, elapsed, total_timeout):
    """Draw the HUD overlay onto the frame."""
    h, w = frame.shape[:2]
    overlay = frame.copy()

    # ── Top status bar ─────────────────────────────────────────────────────────
    bar_h = 55
    cv2.rectangle(overlay, (0, 0), (w, bar_h), CLR_PANEL, -1)

    # State label
    state_text = state.value.upper().replace("_", " ") if hasattr(state, 'value') else str(state)
    state_color = CLR_GREEN if 'pass' in state_text.lower() or 'complete' in state_text.lower() \
                  else CLR_RED if 'fail' in state_text.lower() \
                  else CLR_YELLOW
    cv2.putText(overlay, f"STATE: {state_text}", (12, 35),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, state_color, 1, cv2.LINE_AA)

    # Elapsed / timeout
    remaining = max(0.0, total_timeout - elapsed)
    timer_color = CLR_RED if remaining < 5 else CLR_YELLOW if remaining < 10 else CLR_WHITE
    timer_text = f"Time: {remaining:.1f}s"
    (tw, _), _ = cv2.getTextSize(timer_text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 1)
    cv2.putText(overlay, timer_text, (w - tw - 12, 35),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, timer_color, 1, cv2.LINE_AA)

    # ── Progress dots (challenge pills) ────────────────────────────────────────
    if progress:
        total = progress['total_challenges']
        done  = progress['successful_challenges']
        current_idx = progress['current_challenge_idx']
        dot_r = 10
        spacing = 36
        start_x = w // 2 - (total - 1) * spacing // 2
        for i in range(total):
            cx = start_x + i * spacing
            cy = bar_h + 20
            if i < done:
                cv2.circle(overlay, (cx, cy), dot_r, CLR_GREEN, -1)
                cv2.putText(overlay, "✓", (cx - 6, cy + 5),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.4, CLR_BG, 1, cv2.LINE_AA)
            elif i == current_idx:
                cv2.circle(overlay, (cx, cy), dot_r, CLR_YELLOW, -1)
            else:
                cv2.circle(overlay, (cx, cy), dot_r, CLR_GRAY, -1)

    # ── Challenge instruction box ────────────────────────────────────────────
    if challenge:
        instr = challenge.instruction
        box_y1, box_y2 = h - 140, h - 80
        draw_rounded_rect(overlay, (20, box_y1), (w - 20, box_y2), CLR_PANEL, radius=12)
        put_text_centered(overlay, instr, box_y1 + 38, 0.9, CLR_WHITE, 2)

        # Challenge time-remaining bar
        if challenge.start_time:
            ch_remaining = max(0.0, challenge.timeout - (time.time() - challenge.start_time))
            bar_frac = ch_remaining / challenge.timeout
            bar_x1, bar_x2 = 20, w - 20
            bar_y = box_y2 + 8
            cv2.rectangle(overlay, (bar_x1, bar_y), (bar_x2, bar_y + 6), CLR_PANEL, -1)
            bar_fill = int((bar_x2 - bar_x1) * bar_frac)
            fill_color = CLR_GREEN if bar_frac > 0.5 else CLR_YELLOW if bar_frac > 0.2 else CLR_RED
            cv2.rectangle(overlay, (bar_x1, bar_y), (bar_x1 + bar_fill, bar_y + 6), fill_color, -1)

    # ── Signals panel (bottom-left) ─────────────────────────────────────────
    if signals:
        sv = [
            f"EAR: {signals.ear_avg:.3f}",
            f"MAR: {signals.mar:.3f}",
            f"Yaw: {signals.head_yaw:.1f}",
            f"Pitch: {signals.head_pitch:.1f}",
        ]
        px, py = 12, h - 130
        for line in sv:
            cv2.putText(overlay, line, (px, py),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.42, CLR_GRAY, 1, cv2.LINE_AA)
            py += 18

    # Blend overlay with original frame
    alpha = 0.80
    cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)
    return frame


def draw_result_screen(frame, result):
    """Draw a full-screen result overlay (pass/fail)."""
    h, w = frame.shape[:2]
    # Darken frame
    dark = frame.copy()
    cv2.rectangle(dark, (0, 0), (w, h), (0, 0, 0), -1)
    cv2.addWeighted(dark, 0.55, frame, 0.45, 0, frame)

    if result.success:
        color = CLR_GREEN
        icon = "PASSED"
    else:
        color = CLR_RED
        icon = "FAILED"

    put_text_centered(frame, icon, h // 2 - 30, 2.0, color, 3)
    put_text_centered(frame, result.message, h // 2 + 20, 0.65, CLR_WHITE, 1)
    conf_text = f"Confidence: {result.confidence:.0%}"
    put_text_centered(frame, conf_text, h // 2 + 55, 0.65, CLR_YELLOW, 1)
    put_text_centered(frame, "Press R to retry  |  Q to quit", h // 2 + 100, 0.5, CLR_GRAY, 1)
    return frame


def run_test(camera_index: int = 0, show_display: bool = True):
    """Main test loop."""
    print("\n" + "=" * 60)
    print("  Liveness Detection — Standalone Test")
    print("=" * 60)
    print(f"  Camera index : {camera_index}")
    print(f"  Display      : {show_display}")
    print("  Controls     : Q/ESC = quit | R = restart")
    print("=" * 60 + "\n")

    config = RuleBasedConfig()
    cap = cv2.VideoCapture(camera_index)

    if not cap.isOpened():
        print(f"[ERROR] Cannot open camera {camera_index}.")
        print("  Try: python test_liveness.py --camera 0")
        return False

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_FPS, 30)

    def make_detector():
        d = create_detector(config)
        ch = d.start_verification()
        print(f"\n[SESSION START] {config.max_challenges} challenges:")
        for i, c in enumerate(d.get_all_challenges()):
            print(f"  {i+1}. {c.instruction} (timeout: {c.timeout}s)")
        print(f"\n[CHALLENGE 1] {ch.instruction}\n")
        return d

    detector = make_detector()
    session_start = time.time()
    result = None
    frame_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            print("[WARNING] Frame grab failed — retrying...")
            time.sleep(0.05)
            continue

        frame = cv2.flip(frame, 1)  # mirror
        frame_count += 1
        elapsed = time.time() - session_start

        if result:
            # Show result screen until keypress
            frame = draw_result_screen(frame, result)
            if show_display:
                cv2.imshow("Liveness Detection Test", frame)
            key = cv2.waitKey(30) & 0xFF
            if key in (ord('q'), 27):
                break
            if key == ord('r'):
                # Restart
                detector = make_detector()
                session_start = time.time()
                result = None
                frame_count = 0
            continue

        # Process frame
        signals, state = detector.process_frame(frame)

        # Log interesting signals every 30 frames (~1s)
        if frame_count % 30 == 0 and signals:
            print(f"  [t={elapsed:5.1f}s] EAR={signals.ear_avg:.3f}  MAR={signals.mar:.3f}"
                  f"  Yaw={signals.head_yaw:+.1f}°  Pitch={signals.head_pitch:+.1f}°"
                  f"  State={state.value}")

        progress = detector.get_progress()
        challenge = detector.current_challenge

        # Detect challenge completion from progress
        if progress['successful_challenges'] > 0:
            prev_done = getattr(run_test, '_prev_done', 0)
            if progress['successful_challenges'] != prev_done:
                run_test._prev_done = progress['successful_challenges']
                print(f"\n[✓ CHALLENGE PASSED] {progress['successful_challenges']}/{progress['total_challenges']}")
                if challenge:
                    print(f"[NEXT CHALLENGE] {challenge.instruction}\n")

        # Session complete?
        if not detector.is_session_active():
            result = detector.get_result()
            run_test._prev_done = 0
            print("\n" + "=" * 60)
            status = "✅ PASSED" if result.success else "❌ FAILED"
            print(f"  {status}")
            print(f"  Confidence : {result.confidence:.0%}")
            print(f"  Message    : {result.message}")
            if result.details:
                print(f"  Details    : {result.details}")
            print("=" * 60)

        if show_display:
            display = frame.copy()
            display = draw_overlay(display, challenge, progress, signals, state, elapsed, config.total_timeout)
            cv2.imshow("Liveness Detection Test", display)

        key = cv2.waitKey(1) & 0xFF
        if key in (ord('q'), 27):
            print("\n[QUIT] User exited.")
            break
        if key == ord('r'):
            run_test._prev_done = 0
            detector = make_detector()
            session_start = time.time()
            result = None
            frame_count = 0
            print("\n[RESTART]\n")

    cap.release()
    if show_display:
        cv2.destroyAllWindows()
    return True


def main():
    parser = argparse.ArgumentParser(description="Standalone Liveness Detection Test")
    parser.add_argument("--camera", type=int, default=0, help="Camera device index (default: 0)")
    parser.add_argument("--no-display", action="store_true", help="Run headless (no OpenCV window)")
    args = parser.parse_args()

    run_test(camera_index=args.camera, show_display=not args.no_display)


if __name__ == "__main__":
    main()
