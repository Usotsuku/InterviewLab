import {
  trigger,
  transition,
  style,
  animate,
  query,
} from '@angular/animations';

const DURATION = '200ms';
const REDUCED_DURATION = '1ms';
const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

const prefersReducedMotion = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const duration = prefersReducedMotion ? REDUCED_DURATION : DURATION;

/**
 * Route transition — inspired by Linear + Vercel.
 *
 * The leaving route is taken out of flow (position: absolute) so it can
 * fade out without resisting the entering route. The entering route stays
 * in flow and holds the container open, preventing layout collapse.
 *
 * Only opacity is animated — no translateX/Y, no scale, no clip-path.
 * This avoids sub-pixel blurriness, repaints, and layout thrashing.
 */
export const routeFadeAnimation = trigger('routeAnimation', [
  transition('* <=> *', [
    query(':leave', [
      style({ position: 'absolute', inset: 0, opacity: 1, pointerEvents: 'none' }),
      animate(`${duration} ${EASING}`, style({ opacity: 0 })),
    ], { optional: true }),
    query(':enter', [
      style({ opacity: 0 }),
      animate(`${duration} ${EASING}`, style({ opacity: 1 })),
    ], { optional: true }),
  ]),
]);
