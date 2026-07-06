import { defineConfig } from 'tsdown'

export default defineConfig({
  platform: 'neutral',
  dts: true,
  external: ['x-manage-share', 'react', 'react-dom'],
})
