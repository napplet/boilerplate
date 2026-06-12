# Authoring Checklist

Use this checklist before shipping meaningful changes to a napplet.

## App Boundary

- [ ] The app imports `@napplet/shim` once in the entry point.
- [ ] Protocol calls use `@napplet/sdk` or explicit `@napplet/nap/<domain>/sdk`
  helpers.
- [ ] No app code reads or writes signer keys.
- [ ] No app code reads shell DOM, parent cookies, service workers, or host
  storage.
- [ ] Durable app state goes through `storage`.

## Network And Resources

- [ ] Read-only external bytes use `resource.bytes()` or
  `resource.bytesAsObjectURL()`.
- [ ] Direct `fetch`/`WebSocket` is used only after `connectGranted()`.
- [ ] Every direct origin is declared in `vite.config.ts` `connect`.
- [ ] The UI has a fallback path when connect is not granted.

## Config

- [ ] User-editable settings are represented in `config.schema.json` or the
  `configSchema` object in `vite.config.ts`.
- [ ] Secret fields use `x-napplet-secret: true` and have no `default`.
- [ ] Schema sections use stable `x-napplet-section` names.

## Lifecycle

- [ ] Long-lived subscriptions are closed on teardown.
- [ ] User-triggered operations surface shell errors without crashing the app.
- [ ] The app feature-detects optional NAPs with `shell.supports()`.

## Build

- [ ] `pnpm type-check` passes.
- [ ] `pnpm build` passes.
- [ ] Production HTML has no author-written executable inline script.
- [ ] Manifest-affecting changes are intentional: config schema, connect origins,
  requires list, and built artifacts all affect aggregate hash behavior.

