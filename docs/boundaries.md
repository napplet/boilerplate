# Napplet Boundaries

Napplets run in a restrictive iframe and delegate privileged work to the shell.
The template should stay on the napplet side of that line.

## Napplet Owns

- UI state and rendering.
- User gestures inside the iframe.
- Calls into `window.napplet` through `@napplet/sdk`.
- Feature detection with `window.napplet.shell.supports()`.
- Subscription cleanup for relay, identity, config, keys, media, notify, and INC
  listeners.
- Graceful fallback when a shell does not implement a requested NAP.

## Shell Owns

- Relay pool access.
- Signing and encryption.
- User identity and signer state.
- Storage persistence and quota.
- External byte fetching through NAP-RESOURCE.
- Direct-network grant prompts and CSP response headers through NAP-CONNECT.
- Security class assignment through NAP-CLASS.
- Settings UI for NAP-CONFIG.

## Forbidden In Napplet Code

- Direct signer access or NIP-07 assumptions.
- Direct host DOM access.
- `localStorage` or `sessionStorage` for durable user data.
- Service worker registration.
- Cookie access.
- Unchecked direct network access.
- Shell policy decisions such as ACL, CSP, resource allowlists, or consent
  persistence.

## Allowed Patterns

- `import '@napplet/shim';` at the app entry point.
- `import { relay, storage, identity } from '@napplet/sdk';` for named helpers.
- `storage.setItem()` for durable key-value app state.
- `resource.bytes()` for external read-only bytes.
- `connectGranted()` and `connectOrigins()` before direct network access.
- `getClass()` as a reflection of shell-assigned posture, not as a way to infer
  policy from the browser environment.

