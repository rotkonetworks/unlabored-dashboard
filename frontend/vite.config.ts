import solid from "solid-start/vite";
import { defineConfig } from "vite";
import UnoCSS from '@unocss/vite'
import presetIcons from '@unocss/preset-icons'
import presetUno from '@unocss/preset-uno'
import presetAttributify from '@unocss/preset-attributify'

export default defineConfig({
  plugins: [
    solid(),
    UnoCSS({
      shortcuts: [
        { logo: 'i-logos-solidjs-icon w-6em h-6em transform transition-800 hover:rotate-360' },
      ],
      presets: [
        presetUno(),
        presetAttributify(),
        presetIcons({
          extraProperties: {
            'display': 'inline-block',
            'vertical-align': 'middle',
          },
        }),
      ],
    }), 
  ],

  ssr: {
    // Avoiding SSR for WebSocket and event-listener packages
    noExternal: ["@solid-primitives/websocket", "@solid-primitives/event-listener"],
  },

  server: {
    port: 5050,
    proxy: {
      // WebSocket proxying
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true,
      },
    },
  },

  build: {
    target: 'esnext',
  }
});
