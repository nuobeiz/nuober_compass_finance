/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  safelist: [
    'border-emerald-200', 'border-amber-200', 'border-red-200', 'border-blue-200',
    'bg-emerald-50', 'bg-amber-50', 'bg-red-50', 'bg-blue-50',
    'text-emerald-600', 'text-amber-600', 'text-red-600', 'text-blue-600',
    'text-emerald-700', 'text-amber-700', 'text-red-700', 'text-blue-700',
    'shadow-emerald-100', 'shadow-amber-100', 'shadow-red-100', 'shadow-blue-100',
    'ring-emerald-200', 'ring-amber-200', 'ring-red-200', 'ring-blue-200',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
