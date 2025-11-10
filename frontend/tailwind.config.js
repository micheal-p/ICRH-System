/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0056B3',
          light: '#3478C6',
          dark: '#003D82',
          50: '#E6F0FA',
          100: '#CCE1F5',
          200: '#99C3EB',
          300: '#66A5E1',
          400: '#3387D7',
          500: '#0056B3',
          600: '#00458F',
          700: '#00346B',
          800: '#002347',
          900: '#001223',
        },
        gold: {
          DEFAULT: '#FFD700',
          light: '#FFE44D',
          dark: '#CCB200',
          50: '#FFFEF5',
          100: '#FFFAE0',
          200: '#FFF5C2',
          300: '#FFF0A3',
          400: '#FFEB85',
          500: '#FFD700',
          600: '#E6C400',
          700: '#CCB200',
          800: '#B39F00',
          900: '#998C00',
        },
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
        info: '#2196F3',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'custom': '0 4px 6px -1px rgba(0, 86, 179, 0.1), 0 2px 4px -1px rgba(0, 86, 179, 0.06)',
        'custom-lg': '0 10px 15px -3px rgba(0, 86, 179, 0.1), 0 4px 6px -2px rgba(0, 86, 179, 0.05)',
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}

console.log('✓ Tailwind config loaded with custom theme');