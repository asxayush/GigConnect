/**
 * GigConnect Design Tokens — Extracted from Stitch ("Cooperative Trust")
 * Project ID: 8089337616357810810
 * Compatible with Tailwind CSS theme configuration or JavaScript UI tokens
 */

export const tokens = {
  colors: {
    primary: {
      DEFAULT: '#003548',
      container: '#0e4d64',
      brandTeal: '#0e4d64',
      onPrimary: '#ffffff',
      onContainer: '#89bdd8',
      fixed: '#bfe8ff',
      fixedDim: '#99cee9',
    },
    secondary: {
      DEFAULT: '#a73a00',
      kinetic: '#ea580c',
      container: '#fd651e',
      onSecondary: '#ffffff',
      onContainer: '#571a00',
      fixed: '#ffdbce',
      fixedDim: '#ffb599',
    },
    tertiary: {
      DEFAULT: '#003914',
      green: '#16a34a',
      container: '#005321',
      onTertiary: '#ffffff',
      onContainer: '#4fcd6e',
      fixed: '#7ffc97',
      fixedDim: '#62df7d',
    },
    canvas: {
      base: '#ffffff',
      neutral: '#f8fafc',
      recessed: '#f1f5f9',
      border: '#e2e8f0',
      navyAnchor: '#0f172a',
      navyDeep: '#0b192c',
    },
    surface: {
      DEFAULT: '#faf8ff',
      dim: '#d2d9f4',
      bright: '#faf8ff',
      variant: '#dae2fd',
      lowest: '#ffffff',
      low: '#f2f3ff',
      container: '#eaedff',
      high: '#e2e7ff',
      highest: '#dae2fd',
      onSurface: '#131b2e',
      onVariant: '#40484c',
    },
    status: {
      verified: {
        text: '#15803d',
        bg: '#dcfce7',
        border: '#bbf7d0',
      },
      pending: {
        text: '#b45309',
        bg: '#fef3c7',
        border: '#fde68a',
      },
      disputed: {
        text: '#be123c',
        bg: '#ffe4e6',
        border: '#fecdd3',
      },
      error: {
        DEFAULT: '#ba1a1a',
        container: '#ffdad6',
        onContainer: '#93000a',
      },
    },
  },

  fontFamily: {
    sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
  },

  fontSize: {
    'display': ['48px', { lineHeight: '56px', fontWeight: '800', letterSpacing: '-0.03em' }],
    'headline-lg': ['36px', { lineHeight: '44px', fontWeight: '700', letterSpacing: '-0.02em' }],
    'headline-lg-mobile': ['28px', { lineHeight: '36px', fontWeight: '700', letterSpacing: '-0.01em' }],
    'headline-md': ['24px', { lineHeight: '32px', fontWeight: '700', letterSpacing: '-0.015em' }],
    'headline-sm': ['20px', { lineHeight: '28px', fontWeight: '600', letterSpacing: '-0.01em' }],
    'title-md': ['18px', { lineHeight: '26px', fontWeight: '600', letterSpacing: '-0.005em' }],
    'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400', letterSpacing: '0' }],
    'body-md': ['14px', { lineHeight: '20px', fontWeight: '400', letterSpacing: '0' }],
    'body-sm': ['12px', { lineHeight: '16px', fontWeight: '400', letterSpacing: '0.01em' }],
    'label-lg': ['14px', { lineHeight: '20px', fontWeight: '600', letterSpacing: '0.01em' }],
    'label-md': ['12px', { lineHeight: '16px', fontWeight: '600', letterSpacing: '0.02em' }],
    'label-sm': ['11px', { lineHeight: '14px', fontWeight: '700', letterSpacing: '0.04em' }],
  },

  spacing: {
    '1': '0.25rem', // 4px
    '2': '0.5rem',  // 8px
    '3': '0.75rem', // 12px
    '4': '1rem',    // 16px
    '6': '1.5rem',  // 24px
    '8': '2rem',    // 32px
    '12': '3rem',   // 48px
    '16': '4rem',   // 64px
    'gutter-mobile': '1rem',
    'gutter-desktop': '1.5rem',
    'margin-mobile': '1rem',
    'margin-desktop': '2rem',
    'max-content': '1240px',
  },

  borderRadius: {
    'sm': '0.25rem', // 4px
    'DEFAULT': '0.5rem', // 8px
    'md': '0.75rem', // 12px
    'lg': '1rem', // 16px
    'xl': '1.5rem', // 24px
    'full': '9999px',
  },

  boxShadow: {
    'flat': 'none',
    'resting': '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.03)',
    'raised': '0 10px 15px -3px rgba(14, 77, 100, 0.08), 0 4px 6px -4px rgba(14, 77, 100, 0.04)',
    'overlay': '0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
    'cta-glow': '0 4px 14px rgba(234, 88, 12, 0.35)',
  },
};

export default tokens;
