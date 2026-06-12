# Napplet Design Patterns

## Bootstrap

Install the shim once, then use SDK helpers.

```ts
import '@napplet/shim';
import { relay, storage, identity } from '@napplet/sdk';
```

SDK methods read `window.napplet` at call time. This lets app modules import SDK
helpers freely as long as the entry point imports the shim before user actions
invoke protocol calls.

## Feature Detection

Use shell capability checks for optional surfaces.

```ts
const supportsResource = window.napplet.shell.supports('nap:resource');
const supportsRelay = window.napplet.shell.supports('relay');
```

Support checks are advisory. A user-triggered call can still fail because the
shell denied a grant, disconnected a signer, hit a quota, or rejected a policy
input. Always surface operation errors.

## Storage

Use storage for durable app state.

```ts
await storage.setItem('draft', value);
const value = await storage.getItem('draft');
```

Storage is scoped by napplet identity and aggregate hash on the shell side.
Do not add browser storage fallbacks without a deliberate privacy review.

## Config

Prefer manifest-declared config through `@napplet/vite-plugin`.

```ts
nip5aManifest({
  nappletType: 'my-napplet',
  configSchema,
});
```

Use `config.get()` for a one-time snapshot, `config.subscribe()` for live values,
and `config.openSettings()` to deep-link into shell-owned settings UI.

## Relay

Relay calls go through the shell.

```ts
const events = await relay.query({ kinds: [1], limit: 5 });
const sub = relay.subscribe({ kinds: [1] }, onEvent, onEose);
sub.close();
```

Keep subscriptions tied to UI lifecycle and close them on teardown.

## Resource Fetching

Use `resource.bytes()` for external read-only bytes. The shell applies its
resource policy before bytes reach the iframe.

```ts
const blob = await resource.bytes('https://example.com/avatar.png');
```

For images, prefer `bytesAsObjectURL()` and revoke the handle when the element is
done using it.

## Direct Network Access

Direct network access is exceptional. Declare required origins in
`vite.config.ts`, then gate code on the runtime grant.

```ts
if (connectGranted()) {
  const [origin] = connectOrigins();
  await fetch(`${origin}/api`);
}
```

If the grant is absent, use a resource fallback or disable the direct-network
workflow.

## Class

`getClass()` returns the shell-assigned class or `undefined`. Treat it as
information from the shell, not as something the napplet can compute.

```ts
if (window.napplet.shell.supports('nap:class') && getClass() === 2) {
  // The shell says it is enforcing the class-2 posture.
}
```

