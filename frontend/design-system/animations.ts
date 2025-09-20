/**
 * Design System - Animations
 * Consistent animation system for the E-Learning Platform
 */

export const animations = {
  // Duration
  duration: {
    fastest: '100ms',
    faster: '150ms',
    fast: '200ms',
    normal: '300ms',
    slow: '500ms',
    slower: '700ms',
    slowest: '1000ms',
  },

  // Easing functions
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    // Custom cubic-bezier curves
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },

  // Common animations
  fade: {
    in: {
      from: { opacity: 0 },
      to: { opacity: 1 },
      duration: animations.duration.fast,
      easing: animations.easing.smooth,
    },
    out: {
      from: { opacity: 1 },
      to: { opacity: 0 },
      duration: animations.duration.fast,
      easing: animations.easing.smooth,
    },
  },

  slide: {
    up: {
      from: { transform: 'translateY(100%)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
      duration: animations.duration.normal,
      easing: animations.easing.smooth,
    },
    down: {
      from: { transform: 'translateY(-100%)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
      duration: animations.duration.normal,
      easing: animations.easing.smooth,
    },
    left: {
      from: { transform: 'translateX(-100%)', opacity: 0 },
      to: { transform: 'translateX(0)', opacity: 1 },
      duration: animations.duration.normal,
      easing: animations.easing.smooth,
    },
    right: {
      from: { transform: 'translateX(100%)', opacity: 0 },
      to: { transform: 'translateX(0)', opacity: 1 },
      duration: animations.duration.normal,
      easing: animations.easing.smooth,
    },
  },

  scale: {
    in: {
      from: { transform: 'scale(0.95)', opacity: 0 },
      to: { transform: 'scale(1)', opacity: 1 },
      duration: animations.duration.fast,
      easing: animations.easing.spring,
    },
    out: {
      from: { transform: 'scale(1)', opacity: 1 },
      to: { transform: 'scale(0.95)', opacity: 0 },
      duration: animations.duration.fast,
      easing: animations.easing.smooth,
    },
    hover: {
      from: { transform: 'scale(1)' },
      to: { transform: 'scale(1.05)' },
      duration: animations.duration.fast,
      easing: animations.easing.smooth,
    },
  },

  rotate: {
    spin: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
      duration: animations.duration.slow,
      easing: animations.easing.linear,
      iterationCount: 'infinite',
    },
    bounce: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(10deg)' },
      duration: animations.duration.fast,
      easing: animations.easing.bounce,
      direction: 'alternate',
      iterationCount: 2,
    },
  },

  // Micro-interactions
  micro: {
    button: {
      hover: {
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        duration: animations.duration.fast,
        easing: animations.easing.smooth,
      },
      active: {
        transform: 'translateY(0)',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        duration: animations.duration.fastest,
        easing: animations.easing.smooth,
      },
    },
    card: {
      hover: {
        transform: 'translateY(-2px) scale(1.02)',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
        duration: animations.duration.fast,
        easing: animations.easing.smooth,
      },
    },
    input: {
      focus: {
        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
        borderColor: 'rgb(59, 130, 246)',
        duration: animations.duration.fast,
        easing: animations.easing.smooth,
      },
    },
  },

  // Loading animations
  loading: {
    spinner: {
      animation: 'spin',
      duration: animations.duration.slow,
      easing: animations.easing.linear,
      iterationCount: 'infinite',
    },
    pulse: {
      from: { opacity: 1 },
      to: { opacity: 0.5 },
      duration: animations.duration.normal,
      easing: animations.easing.easeInOut,
      direction: 'alternate',
      iterationCount: 'infinite',
    },
    shimmer: {
      from: { transform: 'translateX(-100%)' },
      to: { transform: 'translateX(100%)' },
      duration: animations.duration.slow,
      easing: animations.easing.easeInOut,
      iterationCount: 'infinite',
    },
  },

  // Page transitions
  page: {
    enter: {
      from: { opacity: 0, transform: 'translateY(20px)' },
      to: { opacity: 1, transform: 'translateY(0)' },
      duration: animations.duration.normal,
      easing: animations.easing.smooth,
    },
    exit: {
      from: { opacity: 1, transform: 'translateY(0)' },
      to: { opacity: 0, transform: 'translateY(-20px)' },
      duration: animations.duration.fast,
      easing: animations.easing.smooth,
    },
  },
} as const;

// CSS keyframes for animations
export const keyframes = {
  spin: `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `,
  pulse: `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `,
  shimmer: `
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `,
  bounce: `
    @keyframes bounce {
      0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
      50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
    }
  `,
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `,
  slideInUp: `
    @keyframes slideInUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `,
  slideInDown: `
    @keyframes slideInDown {
      from { transform: translateY(-100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `,
  scaleIn: `
    @keyframes scaleIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `,
} as const;
