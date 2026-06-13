import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_BRANCH__: JSON.stringify('tag-hub-mk'),
    __APP_VERSION__: JSON.stringify('2026-06-12'),
  },
})
