import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.civicai.app',
  appName: 'CivicAI',
  webDir: 'out',
  server: {
    url: 'http://192.168.31.187:3000',
    cleartext: true
  }
};

export default config;
