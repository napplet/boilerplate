# Optional gameplay previews

This authoring workflow requires standalone napplet CLI 0.10.0 and its managed recording runner 0.4.0. Install those releases after their release PRs land. It does not require changing the napplet's runtime API or adding a media tag to its manifest. This guide is non-normative; [NIP-5D](https://github.com/nostr-protocol/nips/pull/2303) and [NAPs](https://github.com/napplet/naps) remain the protocol sources.

Build the artifact, initialize CLI deployment settings, and configure an application listing:

```bash
pnpm build
napplet init --source-dir dist
```

Add `zapstore` to `.napplet/config.json`, preserving the settings already there:

```json
{
  "zapstore": {
    "id": "org.example.my-game",
    "name": "My game",
    "description": "A short description of the game",
    "images": ["cover.png"]
  }
}
```

Use your own stable application ID and an existing cover image. Omit `images` if you want the recording's thumbnail to supply the static fallback.

## Capture and review

```bash
napplet record dist --interactive --output gameplay.webm
```

This command opens a visible Paja window with the frozen build. Play until the desired scene, click **Record next 6 seconds**, then continue playing. Closing the window cancels capture. Only the napplet viewport appears in the silent WebM. The default viewport is 960×600; `--width`, `--height`, and `--duration` configure capture. Duration uses milliseconds. The encoder may add a short final-frame tail; the sidecar stores the decoded duration.

For an agent or repeatable capture, adapt [the example recipe](../examples/gameplay-actions.json) to your game's input and layout:

```bash
napplet record dist --actions examples/gameplay-actions.json --output gameplay.webm
```

The recipe uses viewport coordinates and capture-relative millisecond times. The generic starter does not implement an ArrowRight game; replace these actions with inputs that demonstrate your finished napplet. Agents should use headless recipes and obtain the user's agreement before opening an interactive window during unattended work.

Review `gameplay.webm` and `gameplay.webm.png`. Capture saves a `.webm.json` sidecar and selects `zapstore.video` in the deployment config. Existing outputs are never overwritten; choose a new filename for another take. The CLI downloads and caches its own browser runtime and encoder on first use. No global Node or FFmpeg is required for `napplet record`; building this Vite starter still uses its normal development tools.

## Publish or deselect

```bash
napplet deploy --zapstore --dry-run --json
napplet deploy --zapstore
```

The first command previews the event without uploads or broadcasts. The second uploads the selected media through Blossom and publishes the existing kind 32267 application event. The video URL goes in event content with [NIP-92](https://github.com/nostr-protocol/nips/blob/master/92.md) `imeta`; configured covers remain. Recording is optional.

Rebuilding to different bytes makes the selection stale. Record a new clip or run `napplet record --clear` before publishing that listing. Clearing the selection preserves all media files. `--no-zapstore` skips the application listing and its video.

The [Software Applications proposal](https://github.com/nostr-protocol/nips/pull/1336) and [manifest application-reference proposal](https://github.com/dskvr/nips/pull/11) remain proposals. Playback depends on the receiving client; static covers remain useful. Capture duration, dimensions, and file-size limits are CLI policy, not protocol requirements.
