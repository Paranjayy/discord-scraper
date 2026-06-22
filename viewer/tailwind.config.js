/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        discord: {
          bg: '#313338',
          sidebar: '#2b2d31',
          input: '#1e1f22',
          blurple: '#5865f2',
          green: '#23a55a',
          red: '#ed4245',
          yellow: '#fee75c',
          muted: '#949ba4',
          text: '#dbdee1',
          header: '#f2f3f5',
        },
      },
    },
  },
  plugins: [],
};
