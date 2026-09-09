import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Expose custom prefixes (VITE_, REACT_APP_, FIREBASE_, BACKEND_, API_) to client
export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'REACT_APP_', 'FIREBASE_', 'BACKEND_', 'API_'],
})
