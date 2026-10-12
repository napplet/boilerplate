# Controller input

This non-normative authoring guide defers to the living [NAP-GAMEPAD proposal](https://github.com/napplet/naps/pull/108) and [NIP-5D](https://github.com/nostr-protocol/nips/pull/2303).

Controller support is optional for this generic starter. Check `runtimeHasDomain('gamepad')` before using controller helpers. On a GAMEPAD-capable SDK release, import the namespace from `@napplet/sdk/gamepad` (or `@napplet/sdk`) and use cached `getGamepads()`, read-only `available` and `focused`, and `onChange(handler)`. The SDK range accepts the current base release and the GAMEPAD release; installing the GAMEPAD release is required before importing these helpers. Package installation alone does not imply the host exposes the domain.

Keep keyboard and pointer controls usable. Ignore gameplay edges while unfocused; establish a fresh baseline when focus returns so held buttons are not treated as new presses. Preserve null slots and route pads by their `index`. Close local change listeners when their owning view is disposed.

Use `optional: ['gamepad']` with a compatible manifest plugin when the core task works without controllers. Use `requires: ['gamepad']` only when it cannot. The canonical manifest domain is `gamepad`; no invented `gamepad:read` capability or readiness handshake is necessary.

The shell reads native controllers and owns focus isolation. Napplet code never calls native `navigator.getGamepads()` or opens raw HID devices. The required NAP API does not include haptics, remapping, or controller selection. The proposal's optional native API replacement conflicts with NIP-5D's current namespace-only injection restriction; use the injected domain and leave that replacement to specification clarification.
