/** True when the user (or the system) asked for less motion: nothing should animate or scroll smoothly. */
export function motionOff() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce';
}
