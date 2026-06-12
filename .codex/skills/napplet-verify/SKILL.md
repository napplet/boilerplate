# Napplet Verify

Use this skill before claiming a napplet change is complete.

## Static Checks

```bash
pnpm type-check
pnpm build
```

Read the command output. Do not report success until both pass.

## Artifact Checks

After `pnpm build`, inspect `dist/index.html` for:

- `napplet-aggregate-hash`
- `napplet-napp-type`
- no author-written executable inline script outside the plugin's selected
  artifact mode
- expected config schema metadata when config is declared

## Runtime Smoke

In a compatible shell:

1. Load the built or dev-served napplet in an `allow-scripts` iframe.
2. Confirm shell capability display renders.
3. Trigger one user action that uses the touched NAP surface.
4. Confirm errors are visible in the app output instead of hidden in console.
5. Confirm long-lived subscriptions close when the iframe unloads.

