/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#121319',
          900: '#0F1015',
          850: '#15161D',
          800: '#1B1D27',
          700: '#23252F',
          600: '#2C2E3A',
          500: '#3A3D4C',
        },
        paper: { DEFAULT: '#F4EFE6', dim: '#BDB6A6', mute: '#8A8473' },
        gold: { DEFAULT: '#E0A94A', hi: '#F2C162', deep: '#9C7327', soft: 'rgba(224,169,74,0.12)' },
        rust: { DEFAULT: '#D15A43', hi: '#E8714F', deep: '#943A2B', soft: 'rgba(209,90,67,0.12)' },
        sage: { DEFAULT: '#86A98E', deep: '#5C7E66' },
        line: { DEFAULT: '#282B38', bright: '#3A3E4F' },
        muted: { DEFAULT: '#8A8FA3', dim: '#5A5F72' },

        // legacy aliases
        primary: '#121319', accent: '#D15A43', highlight: '#E0A94A',
        success: '#86A98E', surface: '#15161D', card: '#1B1D27', hair: '#282B38',
        'hair-2': '#3A3E4F', 'paper-dim': '#BDB6A6', 'paper-mute': '#8A8473',
        'muted-dim': '#5A5F72',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        editorial: ['"Playfair Display"', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: { widest: '0.2em', ultrawide: '0.3em' },
      fontSize: { '2xs': ['10px', '14px'] },
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 44px -26px rgba(0,0,0,0.75)',
        lift: '0 1px 0 rgba(255,255,255,0.05) inset, 0 28px 60px -28px rgba(0,0,0,0.85)',
        glow: '0 0 0 1px rgba(224,169,74,0.25), 0 24px 50px -24px rgba(224,169,74,0.18)',
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
