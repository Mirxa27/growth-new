module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        // Mobile-first breakpoints supporting 320px to 8K
        'xs': '320px',      // Mobile small
        'sm': '640px',      // Mobile large
        'md': '768px',      // Tablet
        'lg': '1024px',     // Desktop small
        'xl': '1280px',     // Desktop standard
        '2xl': '1536px',    // Desktop large
        '3xl': '1920px',    // Full HD
        '4xl': '2560px',    // 2K/QHD
        '5xl': '3440px',    // Ultrawide
        '6xl': '3840px',    // 4K UHD
        '7xl': '5120px',    // 5K
        '8xl': '7680px',    // 8K UHD
        
        // Container queries for modern responsive design
        'container-sm': { 'raw': '(min-width: 320px)' },
        'container-md': { 'raw': '(min-width: 768px)' },
        'container-lg': { 'raw': '(min-width: 1024px)' },
        'container-xl': { 'raw': '(min-width: 1280px)' },
        'container-2xl': { 'raw': '(min-width: 1536px)' },
        'container-4xl': { 'raw': '(min-width: 2560px)' },
        'container-8xl': { 'raw': '(min-width: 7680px)' },
      },
      fontSize: {
        // Fluid typography system using clamp()
        'xs': 'var(--text-xs)',
        'sm': 'var(--text-sm)',
        'base': 'var(--text-base)',
        'lg': 'var(--text-lg)',
        'xl': 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
        '4xl': 'var(--text-4xl)',
        '5xl': 'var(--text-5xl)',
        '6xl': 'var(--text-6xl)',
        '7xl': 'var(--text-7xl)',
        '8xl': 'var(--text-8xl)',
        'hero': 'var(--text-hero)',
        'display': 'var(--text-display)',
        'heading': 'var(--text-heading)',
      },
      spacing: {
        // Touch target sizing for accessibility
        'touch': '44px',
        'touch-min': '44px',
        'touch-lg': '48px',
        'touch-xl': '56px',
      },
      minHeight: {
        'touch': '44px',
        'touch-lg': '48px',
        'touch-xl': '56px',
      },
      minWidth: {
        'touch': '44px',
        'touch-lg': '48px',
        'touch-xl': '56px',
      },
      maxWidth: {
        // Container max widths for ultra-wide support
        'container': '1200px',
        'container-lg': '1400px',
        'container-xl': '1600px',
        'container-2xl': '1920px',
        'container-4xl': '2560px',
        'container-8xl': '7680px',
      },
    },
  },
  plugins: [
    // Custom plugin for container queries
    function({ addUtilities }) {
      const newUtilities = {
        '.container-type': {
          'container-type': 'inline-size',
        },
        '.container-fluid': {
          'width': '100%',
          'max-width': '100%',
        },
        '.responsive-padding': {
          'padding': 'clamp(1rem, 2vw, 2rem)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}
