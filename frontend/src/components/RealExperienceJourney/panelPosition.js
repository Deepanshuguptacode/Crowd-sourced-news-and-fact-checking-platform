/**
 * Panel position calculator — positions the guide panel near the target element.
 */

export const calcPanelPosition = (targetRect, panelW = 420, panelH = 340) => {
  if (!targetRect) return { bottom: 24, right: 24, position: 'fixed' };
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const GAP = 16;

  // Try right of target
  if (targetRect.right + GAP + panelW < vw - 16) {
    return {
      position: 'fixed',
      top: Math.max(16, Math.min(targetRect.top, vh - panelH - 16)),
      left: targetRect.right + GAP,
    };
  }
  // Try left of target
  if (targetRect.left - GAP - panelW > 16) {
    return {
      position: 'fixed',
      top: Math.max(16, Math.min(targetRect.top, vh - panelH - 16)),
      left: targetRect.left - GAP - panelW,
    };
  }
  // Try below
  if (targetRect.bottom + GAP + panelH < vh - 16) {
    return {
      position: 'fixed',
      top: targetRect.bottom + GAP,
      left: Math.max(16, Math.min(targetRect.left, vw - panelW - 16)),
    };
  }
  // Try above
  if (targetRect.top - GAP - panelH > 16) {
    return {
      position: 'fixed',
      top: targetRect.top - GAP - panelH,
      left: Math.max(16, Math.min(targetRect.left, vw - panelW - 16)),
    };
  }
  // Fallback bottom right
  return { position: 'fixed', bottom: 24, right: 24 };
};
