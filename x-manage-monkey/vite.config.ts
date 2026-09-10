import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import monkey from 'vite-plugin-monkey'

export default defineConfig({
  plugins: [
    react(),
    monkey({
      entry: 'src/main.tsx',
      userscript: {
        name: 'X Content Manage',
        namespace: 'x-manage',
        match: [
          'https://x.com/*',
          'https://twitter.com/*',
          'https://mobile.twitter.com/*',
        ],
        grant: [
          'GM_setValue',
          'GM_getValue',
          'GM_deleteValue',
          'GM_addStyle',
          'GM_xmlhttpRequest',
        ],
      },
    }),
  ],
})
