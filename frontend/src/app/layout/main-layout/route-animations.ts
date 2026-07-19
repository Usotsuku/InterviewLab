import {
  trigger,
  transition,
  style,
  animate,
  query,
  group,
} from '@angular/animations';

const ANIMATION_DURATION = '180ms';
const ANIMATION_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';
const REDUCED_DURATION = '0ms';

const prefersReducedMotion = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const duration = prefersReducedMotion ? REDUCED_DURATION : ANIMATION_DURATION;

export const routeFadeAnimation = trigger('routeAnimation', [
  transition('* <=> *', [
    query(':enter, :leave', [
      style({ position: 'absolute', width: '100%', opacity: 0 }),
    ], { optional: true }),
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(6px)' }),
    ], { optional: true }),
    group([
      query(':leave', [
        animate(`${duration} ${ANIMATION_EASING}`, style({ opacity: 0 })),
      ], { optional: true }),
      query(':enter', [
        animate(`${duration} ${ANIMATION_EASING}`, style({ opacity: 1, transform: 'translateY(0)' })),
      ], { optional: true }),
    ]),
  ]),
]);
