/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      components: path.resolve(__dirname, 'src/components'),
      store:      path.resolve(__dirname, 'src/store'),
      utils:      path.resolve(__dirname, 'src/utils'),
      styles:     path.resolve(__dirname, 'src/styles'),
      hooks:      path.resolve(__dirname, 'src/hooks'),
    }
  },
  test: {
    globals: true,
    environment: 'node',
  },
})
