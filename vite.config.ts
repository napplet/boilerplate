import { defineConfig } from 'vite';
import { nip5aManifest } from '@napplet/vite-plugin';
import type { NappletConfigSchema } from '@napplet/sdk';

const configSchema = {
  type: 'object',
  properties: {
    accentColor: {
      type: 'string',
      enum: ['blue', 'green', 'amber'],
      default: 'blue',
      'x-napplet-section': 'appearance',
      'x-napplet-order': 1,
    },
    defaultRelayLimit: {
      type: 'integer',
      minimum: 1,
      maximum: 50,
      default: 5,
      'x-napplet-section': 'relay',
      'x-napplet-order': 1,
    },
  },
  required: ['accentColor'],
} satisfies NappletConfigSchema;

export default defineConfig({
  plugins: [
    nip5aManifest({
      nappletType: 'my-napplet',
      // External assets keep scripts out of index.html so the build runs under the
      // shell's `script-src 'self'` CSP. Inline scripts (single-file mode) are
      // blocked at runtime and fail `napplet-conformance`.
      artifactMode: 'external-assets',
      requires: ['relay', 'storage', 'identity', 'config', 'resource', 'notify'],
      configSchema,
      // Add explicit origins here only when this napplet really needs direct
      // network access. Prefer resource.bytes() for read-only external bytes.
      connect: [],
    }),
  ],
});

