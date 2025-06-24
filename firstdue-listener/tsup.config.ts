import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  target: 'node18',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  splitting: false,
  minify: false,
  treeshake: true,
  replaceNodeEnv: true,
  external: [
    '@sizeupdashboard/convex/api/_generated/api',
    '@sizeupdashboard/convex/lib',
    '@sizeupdashboard/convex/api/schema'
  ],
})