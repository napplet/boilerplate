import { defineConfig } from 'vite';
import { nip5aManifest } from '@napplet/vite-plugin';

export default defineConfig({
  build: {
    // Vite's module-preload polyfill calls `fetch`; one inlined entry needs no
    // preload graph, and NIP-5D napplet code has no ambient network authority.
    modulePreload: { polyfill: false },
  },
  plugins: [
    // Produce one self-contained `/index.html` for NIP-5D `srcdoc` loading,
    // Content-address it using the current NIP-5D artifact-hash schema.
    nip5aManifest({
      nappletType: 'my-napplet',
      description: 'A compact starter with optional runtime actions.',
      artifactMode: 'single-file',
    }),
  ],
});
