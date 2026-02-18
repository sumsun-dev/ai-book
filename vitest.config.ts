import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'messages/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/lib/**',
        'src/agents/**',
        'src/hooks/**',
      ],
      exclude: [
        '**/*.test.*',
        '**/*.spec.*',
        '**/test/**',
        '**/*.d.ts',
        '**/types/**',
        'src/lib/db/**',
        'src/lib/barcode.ts',
        'src/lib/cmyk.ts',
        'src/lib/cover-generator.ts',
        'src/lib/cover-templates.ts',
        'src/lib/epub-styles.ts',
        'src/lib/epub.ts',
        'src/lib/pdf.ts',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
