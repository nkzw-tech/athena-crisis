export default function syncAnimation(element: HTMLElement | null) {
  const animation = element?.getAnimations()[0];
  if (animation) {
    const { animationDuration } = getComputedStyle(element);
    const duration =
      (Number.parseFloat(animationDuration) || 0) *
      (animationDuration.includes('ms') ? 1 : 1000);
    if (duration != null && duration > 0) {
      const now = Number(document.timeline.currentTime);
      animation.startTime = now - (now % duration);
    }
  }
}
