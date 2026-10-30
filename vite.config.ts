import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

export default defineConfig({
  // caminhos relativos: o app funciona em qualquer endereço (prévia, hospedagem, subpasta)
  base: './',
  define: { __VERSAO__: JSON.stringify(version) },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // a pessoa decide quando atualizar (aviso "Há uma versão nova")
      registerType: 'prompt',
      includeAssets: ['icone.svg', 'apple-touch-icon.png', 'favicon-32.png'],
      manifest: {
        id: './',
        name: 'Caderninho',
        short_name: 'Caderninho',
        description: 'Hábitos e rotina, muito visual, para pessoas com TDAH.',
        lang: 'pt-BR',
        start_url: './#/hoje',
        scope: './',
        display: 'standalone',
        background_color: '#FBF6EE',
        theme_color: '#FBF6EE',
        icons: [
          { src: 'icone-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icone-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icone-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // guarda tudo (telas, estilos, fontes, ícones) para abrir sem internet
        // (mjs: o leitor de PDF do plano alimentar)
        globPatterns: ['**/*.{js,mjs,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
