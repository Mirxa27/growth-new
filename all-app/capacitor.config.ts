import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.example.allapp',
  appName: 'all-app',
  webDir: 'apps/web/web/dist',
  server: {
    url: 'http://localhost:5173',
    cleartext: true,
  },
}

export default config
