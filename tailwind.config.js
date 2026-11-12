/** @type {import('tailwindcss').Config} */

// Design tokens: values live as CSS variables in src/index.css (light on :root, dark on .dark),
// so one class like `bg-pf-card` works in both themes. Use these for new UI instead of raw slate-*.
const token = (name) => `rgb(var(--pf-c-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        pf: {
          bg: token('bg'),
          surface: token('surface'),
          card: token('card'),
          elevated: token('elevated'),
          border: token('border'),
          'text-primary': token('text-primary'),
          'text-secondary': token('text-secondary'),
          'text-muted': token('text-muted'),
          accent: token('accent'),
          success: token('success'),
          warning: token('warning'),
          danger: token('danger'),
          info: token('info'),
        },
        // In-between shades the code already uses (e.g. slate-850). Midpoint of the two neighbours.
        slate: {
          150: '#eaeff5',
          250: '#d7dfe9',
          350: '#b0bccd',
          450: '#7c8ca2',
          550: '#56657a',
          650: '#3d4b5f',
          750: '#293548',
          850: '#172033',
        },
        violet: { 650: '#7531e3', 750: '#6425c8' },
        indigo: { 650: '#493fd8' },
        amber: { 450: '#f8af18', 650: '#c76508' },
        red: { 650: '#cb2121' },
        orange: { 350: '#fca658' },
      },
      spacing: {
        0.2: '0.05rem',
        4.5: '1.125rem',
        6.5: '1.625rem',
      },
    },
  },
  plugins: [],
};
