// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

/**
 * Шрифти хостяться локально, а не тягнуться з CDN.
 *
 * Чому: зовнішній стиль блокує рендер — на живому вимірі це коштувало
 * 3,8 с до першого кадру і Lighthouse 77 замість 100. Плюс жодних
 * запитів на сторонній домен, тобто менше питань щодо персональних даних.
 *
 * subsets обовʼязково з "cyrillic", інакше українські літери
 * підмінюються системним шрифтом і верстка їде.
 */
const g = fontProviders.google();

export default defineConfig({
  fonts: [
    // тема oak
    { provider: g, name: 'Literata', cssVariable: '--f-literata', weights: [400, 600], subsets: ['latin', 'cyrillic'] },
    { provider: g, name: 'Manrope', cssVariable: '--f-manrope', weights: [400, 600, 700], subsets: ['latin', 'cyrillic'] },
    // тема graphite
    { provider: g, name: 'Oswald', cssVariable: '--f-oswald', weights: [400, 500, 600], subsets: ['latin', 'cyrillic'] },
    { provider: g, name: 'IBM Plex Sans', cssVariable: '--f-plex', weights: [400, 500, 600], subsets: ['latin', 'cyrillic'] },
    // тема linen
    { provider: g, name: 'Playfair Display', cssVariable: '--f-playfair', weights: [500, 600], subsets: ['latin', 'cyrillic'] },
    { provider: g, name: 'Commissioner', cssVariable: '--f-commissioner', weights: [400, 500, 600], subsets: ['latin', 'cyrillic'] },
    // тема ink
    { provider: g, name: 'Unbounded', cssVariable: '--f-unbounded', weights: [500, 600], subsets: ['latin', 'cyrillic'] },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
