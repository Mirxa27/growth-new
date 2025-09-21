import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    // Custom plugin to handle Capacitor imports gracefully in web builds
    {
      name: 'capacitor-web-handler',
      resolveId(id) {
        // Handle Capacitor imports by providing web-compatible stubs
        if (id.startsWith('@capacitor/')) {
          return id;
        }
        return null;
      },
      load(id) {
        // Provide empty exports for Capacitor modules in web builds
        if (id.startsWith('@capacitor/')) {
          return `
            console.warn('Capacitor module ${id} is not available in web builds');
            export const Capacitor = {
              isNativePlatform: () => false,
              getPlatform: () => 'web'
            };
            export const Camera = {};
            export const App = {};
            export const StatusBar = {};
            export const SplashScreen = {};
            export const Keyboard = {};
            export const Preferences = {};
            export const Network = {};
            export const PushNotifications = {};
            export const Geolocation = {};
            export const LocalNotifications = {};
            export default {};
          `;
        }
        return null;
      }
    }
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      // Removed Capacitor externals - now handled by custom plugin
      output: {
        manualChunks: (id) => {
          // React ecosystem
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'react-vendor';
          }
          
          // Radix UI components
          if (id.includes('@radix-ui')) {
            return 'ui-vendor';
          }
          
          // Supabase
          if (id.includes('@supabase')) {
            return 'supabase';
          }
          
          // OpenAI and AI services
          if (id.includes('openai') || id.includes('@anthropic-ai') || id.includes('@google/generative-ai')) {
            return 'ai-services';
          }
          
          // Admin components (large bundle)
          if (id.includes('src/components/admin') || id.includes('src/pages/AdminDashboard')) {
            return 'admin';
          }
          
          // Assessment components
          if (id.includes('src/components/assessment') || id.includes('src/data/assessments')) {
            return 'assessments';
          }
          
          // Utilities and helpers
          if (id.includes('date-fns') || id.includes('clsx') || id.includes('zod') || id.includes('framer-motion')) {
            return 'utils';
          }
          
          // Node modules (third-party)
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          
          // Default chunk for app code
          return 'index';
        }
      }
    },
    chunkSizeWarningLimit: 2000
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'openai'
    ]
    // Removed Capacitor excludes - now handled by custom plugin
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
    'process.env': {},
    // Prevent Capacitor import errors in web builds
    '__CAPACITOR_WEB__': true
  }
});