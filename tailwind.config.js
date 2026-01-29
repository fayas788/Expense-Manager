/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./App.{js,jsx,ts,tsx}",
        "./src/**/*.{js,jsx,ts,tsx}"
    ],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#EEF2FF',
                    100: '#E0E7FF',
                    200: '#C7D2FE',
                    300: '#A5B4FC',
                    400: '#818CF8',
                    500: '#6366F1',
                    600: '#4F46E5',
                    700: '#4338CA',
                    800: '#3730A3',
                    900: '#312E81',
                },
                borrow: {
                    light: '#FEE2E2',
                    DEFAULT: '#EF4444',
                    dark: '#B91C1C',
                },
                lend: {
                    light: '#DCFCE7',
                    DEFAULT: '#22C55E',
                    dark: '#15803D',
                },
                expense: {
                    light: '#DBEAFE',
                    DEFAULT: '#3B82F6',
                    dark: '#1D4ED8',
                },
                dark: {
                    bg: '#0F172A',
                    card: '#1E293B',
                    border: '#334155',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
