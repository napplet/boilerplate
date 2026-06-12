# Package Surfaces

## Runtime Packages

### `@napplet/shim`

Side-effect installer. Import once in the entry point.

```ts
import '@napplet/shim';
```

It installs `window.napplet`, routes JSON envelope messages from the shell, and
mounts the NAP namespaces.

### `@napplet/sdk`

Named helpers for napplet app code.

```ts
import { relay, storage, identity, config, resource } from '@napplet/sdk';
```

Use this for most app code. It wraps `window.napplet` at call time and re-exports
types and constants for common NAPs.

### `@napplet/nap`

Domain-specific subpaths. Use these when you need granular imports.

```ts
import { relaySubscribe } from '@napplet/nap/relay/sdk';
import type { ResourceBytesMessage } from '@napplet/nap/resource/types';
```

Do not import from the `@napplet/nap` root. Import a domain subpath.

## Build Package

### `@napplet/vite-plugin`

Vite plugin for local development metadata and local manifest/hash workflow.

```ts
import { nip5aManifest } from '@napplet/vite-plugin';
```

The plugin injects napplet meta tags, folds config schema and connect origins
into aggregate hash inputs, and can write a local `.nip5a-manifest.json` when
`VITE_DEV_PRIVKEY_HEX` is set.

Production relay publishing is intentionally outside this boilerplate.

