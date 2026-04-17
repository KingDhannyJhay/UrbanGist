/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // UrbanGist Brand Palette
        bg: {
          primary:   '#0B0B0B',
          secondary: '#111111',
          card:      '#161616',
          elevated:  '#1C1C1C',
          border:    '#2A2A2A',
        },
        green: {
          DEFAULT: '#22C55E',
          dim:     '#16A34A',
          glow:    '#4ADE80',
          subtle:  '#052E16',
        },
        purple: {
          DEFAULT: '#A855F7',
          dim:     '#7E22CE',
          subtle:  '#2E1065',
        },
        text: {
          primary:   '#F8F8F8',
          secondary: '#A3A3A3',
          muted:     '#525252',
        },
      },
      fontFamily: {
        display: ['var(--font-clash)', 'system-ui', 'sans-serif'],
        body:    ['var(--font-satoshi)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
      animation: {
        'pulse-green':  'pulseGreen 2s ease-in-out infinite',
        'slide-up':     'slideUp 0.5s ease-out forwards',
        'fade-in':      'fadeIn 0.4s ease-out forwards',
        'equalizer':    'equalizer 0.8s ease-in-out infinite alternate',
        'glow':         'glow 2s ease-in-out infinite',
        'spin-slow':    'spin 4s linear infinite',
        'float':        'float 3s ease-in-out infinite',
      },
      keyframes: {
        pulseGreen: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        equalizer: {
          '0%':   { height: '4px' },
          '100%': { height: '20px' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(34,197,94,0.3)' },
          '50%':      { boxShadow: '0 0 40px rgba(34,197,94,0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
      },
      backgroundImage: {
        'green-gradient':  'linear-gradient(135deg, #22C55E, #16A34A)',
        'purple-gradient': 'linear-gradient(135deg, #A855F7, #7E22CE)',
        'hero-gradient':   'radial-gradient(ellipse at top, #052E16 0%, #0B0B0B 60%)',
        'card-gradient':   'linear-gradient(180deg, #161616, #111111)',
        'boost-gradient':  'linear-gradient(135deg, #A855F7 0%, #22C55E 100%)',
        'noise':           "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'green-glow':  '0 0 30px rgba(34,197,94,0.25)',
        'card':        '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover':  '0 8px 40px rgba(0,0,0,0.6)',
        'inner-dark':  'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
