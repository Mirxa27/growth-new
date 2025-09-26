import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: '/index.html',
        navigateFallbackAllowlist: [/^\/(?!api).*/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'Growth Echo Assistant',
        short_name: 'GrowthEcho',
        description: 'Content overlay and background OpenAI integration for Growth Echo Nexus',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2
      },
      mangle: true,
      format: {
        comments: false
      }
    },
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Critical vendor chunks with optimized splitting
          if (id.includes('node_modules')) {
            // React core - keep all React together to avoid circular dependencies
            if (id.includes('react/') || id.includes('react-dom/') || id.includes('@types/react')) {
              return 'react';
            }
            // React ecosystem - frequently updated
            if (id.includes('react-router') || id.includes('@tanstack/react-query')) {
              return 'react-ecosystem';
            }
            // UI framework - large but stable
            if (id.includes('@radix-ui')) {
              return 'radix-ui';
            }
            // UI animations - separate for optional loading
            if (id.includes('lucide-react') || id.includes('framer-motion')) {
              return 'ui-animations';
            }
            // Data layer - business critical
            if (id.includes('@supabase') || id.includes('supabase')) {
              return 'supabase';
            }
            // AI services - heavy, lazy loaded
            if (id.includes('openai') || id.includes('@openai/agents')) {
              return 'openai-vendor';
            }
            if (id.includes('@anthropic-ai') || id.includes('@google/generative-ai')) {
              return 'ai-vendor';
            }
            // Utilities - small, frequently used
            if (id.includes('date-fns') || id.includes('clsx') || id.includes('zod')) {
              return 'utils';
            }
            // Performance libs - conditional loading
            if (id.includes('react-window') || id.includes('react-intersection-observer') || id.includes('web-vitals')) {
              return 'performance';
            }
            // Chart libraries - large, feature-specific
            if (id.includes('recharts') || id.includes('chart.js') || id.includes('d3')) {
              return 'charts';
            }
            // Form libraries - feature-specific
            if (id.includes('react-hook-form') || id.includes('@hookform')) {
              return 'forms';
            }
            // Capacitor mobile - platform-specific
            if (id.includes('@capacitor')) {
              return 'capacitor';
            }
            // PWA utilities - progressive enhancement
            if (id.includes('workbox') || id.includes('vite-plugin-pwa')) {
              return 'pwa';
            }
            // Other vendors - fallback
            return 'vendor';
          }

          // Application chunks with intelligent organization
          // AI services - separate chunk for code splitting
          if (id.includes('/src/services/ai/') || id.includes('/src/services/openai/')) {
            return 'ai-services';
          }
          // WebRTC - media-heavy, feature-specific
          if (id.includes('/src/services/webrtc/') || id.includes('/src/components/voice/')) {
            return 'webrtc-services';
          }
          // Cache services - performance critical
          if (id.includes('/src/services/cache/') || id.includes('/src/hooks/useAdvancedCache')) {
            return 'cache-services';
          }
          // Assessment system - core business logic
          if (id.includes('/src/services/assessment') || id.includes('/src/components/assessment/')) {
            return 'assessment-core';
          }
          // Admin functionality - role-restricted, split further
          if (id.includes('/src/pages/Admin')) {
            return 'admin-dashboard';
          }
          if (id.includes('/src/components/admin/')) {
            // Split admin components by category for better code splitting
            if (id.includes('UserManagement') || id.includes('RBAC') || id.includes('Audit')) {
              return 'admin-users';
            }
            if (id.includes('Analytics') || id.includes('SystemMonitor')) {
              return 'admin-analytics';
            }
            if (id.includes('VoiceAgent') || id.includes('Voice')) {
              return 'admin-voice';
            }
            if (id.includes('Assessment') || id.includes('Library') || id.includes('Community')) {
              return 'admin-content';
            }
            if (id.includes('AI') || id.includes('Diagnostics') || id.includes('Migration')) {
              return 'admin-ai';
            }
            if (id.includes('Settings') || id.includes('General') || id.includes('TwoFactor')) {
              return 'admin-settings';
            }
            return 'admin-other';
          }
          // Services layer - business logic
          if (id.includes('/src/services/')) {
            return 'services';
          }
          // Shared components - reusable UI
          if (id.includes('/src/components/ui/') || id.includes('/src/components/shared/')) {
            return 'ui-components';
          }
          // Feature components - specific functionality
          if (id.includes('/src/components/')) {
            return 'feature-components';
          }
          // Page components - route-specific
          if (id.includes('/src/pages/')) {
            return 'pages';
          }
          // React hooks - state management
          if (id.includes('/src/hooks/')) {
            return 'hooks';
          }
          // Utilities and helpers - common functions
          if (id.includes('/src/utils/')) {
            return 'app-utils';
          }
          // Types and constants - minimal runtime impact
          if (id.includes('/src/types/') || id.includes('/src/constants/')) {
            return 'shared-types';
          }
        },
        // Optimize chunk names for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `js/[name]-${facadeModuleId}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          // assetInfo.name can be undefined in some Rollup versions or for virtual assets.
          // Fall back to fileName or a safe default to avoid runtime/compile errors.
          const safeName = (assetInfo && (assetInfo.name ?? assetInfo.fileName)) || 'asset';
          const info = safeName.split('.');
          const ext = info[info.length - 1] || '';
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
            return `fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      },
      // Note: experimentalMinChunkSize removed as it's no longer supported
      // Enable tree shaking for better dead code elimination
      plugins: []
    },
    chunkSizeWarningLimit: 500,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize asset inlining
    assetsInlineLimit: 4096
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'openai'
    ]
  },
  server: {
    port: 5173,
    host: true,
    cors: true
  },
  preview: {
    port: 4173,
    host: true
  },
  define: {
    'process.env': {}
  }
});
