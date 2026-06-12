# my-napplet

A small TypeScript starter for building a NIP-5D napplet with the published
`@napplet` packages.

Napplets are sandboxed iframe apps. The app imports `@napplet/shim` to install
`window.napplet`, then uses `@napplet/sdk` to ask the host shell for relay,
identity, storage, resource, config, notification, class, and connect services.

## Start

```bash
pnpm install
pnpm dev
```

Build and verify the production artifact:

```bash
pnpm verify
```

`pnpm build` uses `@napplet/vite-plugin` to inject napplet metadata and, when
`VITE_DEV_PRIVKEY_HEX` is set, write a local `.nip5a-manifest.json` for hash
workflow testing.

## Included

- Vanilla Vite + TypeScript napplet app.
- `@napplet/shim` side-effect install and typed `@napplet/sdk` helpers.
- Build-time `@napplet/vite-plugin` wiring with a manifest-declared config
  schema.
- Default app-chrome text selection disabled in `src/styles.css`, with
  opt-in controls for copyable or editable regions.
- Context documents for NIP-5D, shell boundaries, package surfaces, and authoring
  patterns.
- Guidance for handling missing NAP interfaces or numbered wire formats without
  submitting unnecessary protocol PRs.
- Local Codex skills for napplet authoring and verification.

## Authoring Context

Read these before changing protocol-facing behavior:

- `docs/nip-5d.md`
- `docs/boundaries.md`
- `docs/design-patterns.md`
- `docs/package-surfaces.md`
- `docs/new-nap-proposals.md`
- `docs/authoring-checklist.md`

The pinned NIP-5D source is referenced from `docs/nip-5d.md`; this template does
not treat its local notes as normative protocol text.

## Text Selection

The starter disables accidental text selection by default. To change the whole
napplet, set `--napplet-text-selection: text` in `src/styles.css`. To opt in one
region, add `data-napplet-select="text"` or `data-napplet-select="all"`.

## Package Scripts

```bash
pnpm dev          # local Vite dev server
pnpm type-check   # TypeScript strict-mode check
pnpm build        # Vite production build
pnpm preview      # preview dist/
pnpm verify       # type-check + build
```
