import type { Config } from "tailwindcss";

export default {
	darkMode: "class",
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))',
					soft: 'hsl(var(--primary-soft))',
					50: 'hsl(var(--primary) / 0.05)',
					100: 'hsl(var(--primary) / 0.1)',
					200: 'hsl(var(--primary) / 0.2)',
					300: 'hsl(var(--primary) / 0.3)',
					400: 'hsl(var(--primary) / 0.4)',
					500: 'hsl(var(--primary) / 0.5)',
					600: 'hsl(var(--primary) / 0.6)',
					700: 'hsl(var(--primary) / 0.7)',
					800: 'hsl(var(--primary) / 0.8)',
					900: 'hsl(var(--primary) / 0.9)'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					glow: 'hsl(var(--secondary-glow))',
					soft: 'hsl(var(--secondary-soft))',
					50: 'hsl(var(--secondary) / 0.05)',
					100: 'hsl(var(--secondary) / 0.1)',
					200: 'hsl(var(--secondary) / 0.2)',
					300: 'hsl(var(--secondary) / 0.3)',
					400: 'hsl(var(--secondary) / 0.4)',
					500: 'hsl(var(--secondary) / 0.5)',
					600: 'hsl(var(--secondary) / 0.6)',
					700: 'hsl(var(--secondary) / 0.7)',
					800: 'hsl(var(--secondary) / 0.8)',
					900: 'hsl(var(--secondary) / 0.9)'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					50: 'hsl(var(--accent) / 0.05)',
					100: 'hsl(var(--accent) / 0.1)',
					200: 'hsl(var(--accent) / 0.2)',
					300: 'hsl(var(--accent) / 0.3)',
					400: 'hsl(var(--accent) / 0.4)',
					500: 'hsl(var(--accent) / 0.5)',
					600: 'hsl(var(--accent) / 0.6)',
					700: 'hsl(var(--accent) / 0.7)',
					800: 'hsl(var(--accent) / 0.8)',
					900: 'hsl(var(--accent) / 0.9)'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
					border: 'hsl(var(--card-border))'
				},
				glass: {
					bg: 'rgba(var(--glass-bg))',
					border: 'rgba(var(--glass-border))',
					ambient: 'hsla(var(--glass-ambient))',
					glow: 'hsla(var(--glass-glow))'
				}
			},
			fontFamily: {
				hero: 'var(--font-hero)',
				body: 'var(--font-body)'
			},
			fontSize: {
				hero: 'var(--text-hero)',
				display: 'var(--text-display)',
				heading: 'var(--text-heading)'
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-ambient': 'var(--gradient-ambient)',
				'gradient-glow': 'var(--gradient-glow)',
				'gradient-aurora': 'var(--gradient-aurora)'
			},
			backdropBlur: {
				glass: 'var(--glass-blur)'
			},
			boxShadow: {
				glass: 'var(--shadow-glass)',
				glow: 'var(--shadow-glow)',
				ambient: 'var(--shadow-ambient)'
			},
			transitionTimingFunction: {
				smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
				bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
				spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
			},
			transitionDuration: {
				'micro': '100ms',
				'quick': '150ms'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0) rotate(0deg) scale(1)' },
					'33%': { transform: 'translateY(-20px) rotate(1deg) scale(1.02)' },
					'66%': { transform: 'translateY(10px) rotate(-1deg) scale(0.98)' }
				},
				'glow': {
					'from': { filter: 'brightness(1) saturate(1)' },
					'to': { filter: 'brightness(1.2) saturate(1.3)' }
				},
				'micro-bounce': {
					'0%, 100%': { transform: 'scale(1)' },
					'50%': { transform: 'scale(0.95)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'float': 'float 6s ease-in-out infinite',
				'glow': 'glow 3s ease-in-out infinite alternate',
				'micro-bounce': 'micro-bounce 0.1s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;