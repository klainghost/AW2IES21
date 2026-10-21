// @ts-check
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'

// https://docs.astro.build/es/guides/styling/#tailwind
export default defineConfig({
    vite: {
        plugins: [tailwindcss()]
    }
})
