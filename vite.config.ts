import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // caminhos relativos: o app funciona em qualquer endereço (prévia, hospedagem, subpasta)
  base: './',
  plugins: [react(), tailwindcss()],
})
