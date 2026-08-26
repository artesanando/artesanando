/* Config do `npm run check:mobile`: sobe o app com o fake do Supabase no lugar
   do cliente real (o mesmo `src/test/fakeSupabase` que o App.test.tsx já usa).
   Assim a checagem de celular roda sem credencial e sem rede — dá para rodar no
   CI e na máquina de quem nunca configurou o .env. */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const fake = fileURLToPath(new URL('./src/test/fakeSupabase.ts', import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    // o alias casa com o texto do import, então precisa das três profundidades
    alias: [
      { find: '../../lib/supabase', replacement: fake },
      { find: '../lib/supabase', replacement: fake },
      { find: './lib/supabase', replacement: fake },
    ],
  },
})
