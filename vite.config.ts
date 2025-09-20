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
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip'
          ],
          'supabase': ['@supabase/supabase-js'],
          'ai-services': ['openai'],
          'utils': ['date-fns', 'clsx', 'zod']
        }
      }
    },
    chunkSizeWarningLimit: 1000
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