import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Mengizinkan Vite membaca variabel baik berawalan VITE_ maupun SUPABASE_
  envPrefix: ['VITE_', 'SUPABASE_'],
  server: {
    port: 5173,
    host: true,
  },
});
