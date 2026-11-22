// @ts-check
import { defineConfig, envField } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  env: {
    schema: {
      PUBLIC_SUPABASE_URL: envField.string({ context: 'client', access: 'public', url: true }),
      PUBLIC_SUPABASE_ANON_KEY: envField.string({ context: 'client', access: 'public' }),
      PUBLIC_HCAPTCHA_SITE_KEY: envField.string({ context: 'client', access: 'public' }),
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },
});