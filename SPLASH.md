# DG portfolio entrance

The homepage now plays the full eight-second Flubber boot, followed by the
matched-bowl DG monogram with soft lime crater lighting and a diffuse four-way
center split. The portfolio loads behind it and appears through a 450 ms fade.

## Visitor behavior

- Homepage only, once per tab session. Hash links go straight to the page.
- The homepage footer has a quiet "replay intro ↻" button. It mounts a fresh
  player without navigating, keeps the visitor's scroll position and returns
  focus to the button after playback or Skip. Sound starts from the click gesture.
  Opening downloads still overlap renderer loading if the visitor skipped the
  initial boot. The same assets and disposal path serve every replay; there is
  no persistent hidden renderer or extra media asset.
- Explicit replay plays the full boot even when a still-frame preview URL or
  reduced-motion preference bypasses automatic playback. The replay control is
  hidden without JavaScript or the required worker/decompression APIs.
- Skip intro and Escape dismiss immediately; keyboard focus returns to the page.
- Sound is enabled by default; a prepared soundtrack downloads independently
  of the renderer. Autoplay
  starts when the browser permits it; otherwise the control says "Tap for sound"
  and a tap resumes the soundtrack at the current animation time. The sound
  control can mute and re-enable it without restarting the animation.
- Reduced-motion visitors and visitors with JavaScript disabled see the homepage
  directly. WebGL or asset failures also reveal the homepage.
- A twelve-second initialization watchdog prevents a failed loader from covering
  the page indefinitely. Switching tabs pauses the animation and audio.
- The underlying page is inert during playback. The renderer, observers, GPU
  resources and audio context are released after dismissal.

## Full-screen framing

The canvas uses a fixed `100dvh` overlay. The viewport
allows safe-area coverage and the controls stay within safe-area insets.

`src/lib/splash/framing.mjs` preserves the original horizontal camera view on
portrait screens by widening the vertical field of view, rather than stretching
or cropping the animation. After the chamber hands off at 5.8 seconds, the
camera gently frames the DG closer: 1.32× in portrait and 1.08× in landscape.
The domain follows that projection, so it stays beneath the wordmark.

ResizeObserver updates the drawing buffer and camera when the viewport changes.
Physical rendering is limited to 2.5 million pixels, with a 1.5× pixel ratio cap
on narrow screens and 2× elsewhere. The WebGL runtime is imported only when the
intro is actually shown; repeat visits do not fetch its geometry or audio.

## Startup and parallel preparation

The eligibility script conditionally preloads the opening packet and packed
chamber meshes while JavaScript loads. Meshes use the exact Float32
attributes already uploaded by Three.js and the original triangle indices. A
96 KB gzip binary replaces the roughly 281 KB compressed JSON download.
All original JSON remains as build input, with no runtime JSON loading. The
opening packet includes only the animation tables used by playback. Packed
assets and audio have content-hashed build URLs.

Audio is synthesized once with the checked-in retail sequencer, then exported
as a single 96 kbps Opus asset (84 KB). This is a lossy encoding of the existing software reconstruction, not newly captured console
audio. Browser decoding runs independently of scene preparation. The existing
Web Audio buffer scheduling preserves sound unlocking, muting and resume offsets.
The synthesizer and original data stay in the repository for reproducibility;
neither is downloaded by the normal playback path.

The build generates the fixed normalization cubes, rough normal map, glow,
plasma textures, unit spheres and prepared camera path in `opening.bin.gz` (118 KB). Reflected texture
planes are shared; the build chooses the smallest lossless byte predictor per plane.
Integer index differences and shared arrays further reduce download weight without losing
any pixel values. The main sphere retains Float64 unit vectors so its original
deformation remains unchanged. A worker expands these assets while the renderer
module downloads and the browser decodes audio. The document consumes its own
preload and transfers the result to the worker, avoiding a duplicate worker fetch.

The build also generates `finale.bin.gz` (157 KB): packed DG meshes, smoothed
heights, and each field pixel's nearest-edge lookup and inside/outside flag.
Mirrored crater heights share their exact Float32 bits; asymmetric pixels keep
their complete XOR residual. Byte planes improve gzip compression, with no
quantization. Duplicate mesh arrays share packet storage and indices use reversible
integer differences. The worker restores exact Float32 distances and derivatives in a linear pass;
it no longer searches contours or performs Gaussian smoothing. It also expands
the regular crater mesh outside the rendering thread. Storing redundant full
RGBA fields and mesh grids would make downloads much larger, so the worker
expands those from their compact, lossless representation instead.

Normal playback creates only the opening scene before starting its clock. Then
the finale module and prepared finale download concurrently with playback.
Both workers use one document fetch/decompression path and receive transferred
buffers; neither fetches JSON or generates source textures at runtime.
The worker transfers its buffers and terminates. The renderer warms the finale
in a 1×1 offscreen target to upload textures and compile shaders before the
visible handoff. Still-frame previews at or after 5.25 seconds wait for the finale.
Per-frame blob deformation, camera motion and GPU lighting remain real-time.

The portfolio portrait is resized to 384×384 at build time for its 192-pixel
rendered size. The resulting WebP is about 14 KB instead of 235 KB, reducing
competition for splash downloads while retaining 2× display resolution.

Skip, initialization failure and dismissal abort playback fetches and
terminate the worker. If the finale cannot be prepared by 5.25 seconds, playback
reveals the portfolio rather than showing an incomplete monogram. The full
eight-second sequence plays when its assets are ready on time.

The intro has one modern playback path: precomputed binary visuals, native gzip
decompression, module workers and Opus audio. Browsers without native
decompression or workers show the portfolio directly. A failed sound decode
leaves the visual intro usable; it does not try another codec.

To regenerate committed assets, use Node 24 and FFmpeg with libopus:

```sh
npm run generate:splash-audio
npm run generate:splash-geometry
npm run generate:splash-visuals
```

`npm run build` and the Pages workflow regenerate visual assets automatically.
The audio exports are committed so CI does not require FFmpeg. Tests verify their
hashes against the synthesis sources and compare every packed vertex attribute
and triangle index with the original JSON, all generated texture bytes, crater
values and grid vertices, and source sphere precision at animated sample times. In preview mode, the splash exposes
`data-startup-ms` (time from navigation to first render), `data-setup-ms` (time
from controller initialization), and `data-finale-ready-ms` on the canvas for
local diagnostics; these measurements are not sent anywhere.

## Preview and checks

Use Node 24, matching the GitHub Pages build.

```sh
npm run dev -- --host 127.0.0.1
npm run test:splash
npm run build
```

The Pages workflow runs the splash tests and Astro type check before building.

- `/?intro=preview` replays the complete intro, bypassing the session flag.
- `/?intro=preview&frame=7` freezes the final scene.
- `/?intro=preview&frame=3` freezes the chamber.
- `/?intro=preview&frame=5.88` checks the DG takeover without the green flash.

Audio lifecycle tests cover blocked autoplay, buffer readiness, muting, pause
and resume, and dismissal during loading. Worker tests cover delivery, asset
failure and cancellation with queued replies. Framing tests cover portrait phones,
a tablet, landscape phones, desktop and ultrawide displays. Live browser checks covered 390×844 and 844×390 rendering,
the early chamber, the takeover, automatic dismissal, Skip, default-enabled sound, autoplay unlocking and mute behavior.
Actual iOS Safari performance and browser chrome behavior have not been measured
on a physical phone.

Replay checks covered completion, repeated activation, Escape and Skip, sound
starting from the click, unchanged URLs, focus/scroll restoration, and the footer
at phone and tablet widths. The addition changes only a small amount of bundled
JavaScript (about 284 compressed bytes); all media assets are unchanged and the
complete splash remains about 594 KB, below its 610 KB transfer ceiling.

## Measured startup

### Transfer budgets

The production build audits the complete splash dependency graph, including
dynamic imports, shared modules and worker URLs, counting each script once.
JavaScript is measured with gzip level 9; binary assets and Opus are counted at
their actual stored size. These are splash payload estimates, excluding the
underlying homepage, CSS, fonts and HTTP overhead.

| Payload | Before size audit (PR #24) | Compact lossless packets | Enforced ceiling |
| --- | ---: | ---: | ---: |
| Opening visuals and animation tables | 143,960 B | 118,083 B | 120,000 B |
| Chamber meshes | 130,278 B | 96,488 B | 100,000 B |
| DG finale | 273,530 B | 157,139 B | 160,000 B |
| Opus audio | 84,205 B | 84,205 B | 85,000 B |
| Bundled splash JavaScript | 137,301 B | 137,578 B | 145,000 B |
| **Total** | **769,274 B** | **593,493 B** | **610,000 B** |

This removes 175,781 bytes (22.9%) without changing any reconstructed texture,
height, mesh or camera value. Compared with the older runtime-generation version
(PR #22, about 527 KB), precomputation still adds about 67 KB. That bounded cost
keeps expensive generation off the visitor's device. We do not store complete
expanded textures, per-frame animation or redundant full RGBA terrain fields.

`npm run build` and the Pages workflow fail if any ceiling is exceeded.
Use `npm run check:splash-size` to inspect an existing build. Changes to a budget
should include measured justification rather than silently raising the limit.

Fresh no-cache lab samples on this Mac used the same shared per-origin bandwidth
limit and 150 ms asset latency for both builds, rendering the chamber at three
seconds. External fonts were outside the throttle:

| Connection | PR #24 first frame | Compact packets first frame |
| --- | ---: | ---: |
| 5 Mbps | 1.51 s | 1.35 s |
| 1 Mbps | 5.59 s | 5.06 s |

At 1 Mbps, the finale finished preparation 1.64 seconds after the first frame,
versus 2.69 seconds previously. These are single controlled samples, not field
averages or physical-phone measurements. Chamber and DG screenshots at 3 and 7
seconds are pixel-identical at 1280×720. All 19 tests pass, including complete
source-data comparisons and size-guard coverage.

### Earlier measurements

Controlled local tests used production builds on this Mac, a shared bandwidth
limit per origin, 150 ms of added latency per asset request, gzip responses and
`Cache-Control: no-store`. External Google Fonts were outside that throttle.
These measurements are from PR #23, before the single-path cleanup.
The measurement ends after the first rendered frame; it excludes the subsequent
eight-second playback. These are lab comparisons, not physical-phone or field
measurements.

| Connection | Initial integration | Audio/mesh optimization | Build-time visuals |
| --- | ---: | ---: | ---: |
| 5 Mbps | 2.37 s | 1.55 s | 1.52 s |
| 1 Mbps | 9.00 s | 5.59 s | 5.71 s |

The earlier runs used the same setup but occurred separately, so small differences
are within run-to-run variation. Build-time preparation removes fixed CPU work;
it does not materially change network-limited first-frame time. With the new
assets, the finale was ready 2.84 seconds after the first frame at 1 Mbps, before
the 5.25-second deadline. A contemporaneous baseline run took 1.59 s at 5 Mbps
and 5.89 s at 1 Mbps. These single samples should not be treated as field averages.

At 1 Mbps the DG finale was ready 2.37 seconds into playback, before the 5.25-second
deadline. Matching screenshots at 3 and 7 seconds were pixel-identical at
1280×720. The extracted crater distances, heights and texture values also match
the previous implementation byte for byte. Browser checks verified Opus decoding
and fail-open behavior
when the finale request was deliberately delayed by seven seconds.

## Source and attribution

The vendored animation modules and assets come from the local Flubber project,
commit `2be75c6` (`feat: add soft diagonal center lighting`), in
[the Flubber repository](https://github.com/dgrah50/flubber/tree/2be75c6).
Only the selected DG geometry is bundled here. No BIOS or kernel image is copied.
The Astro component handles markup and early visibility; `controller.ts` owns
playback and cleanup, and `audio.ts` owns audio state. Shared AbortSignal
listeners keep dismissal cleanup in one place.

The controller, audio lifecycle and responsive framing are new; the vendored fog and shadow
modules add resource disposal methods. The original animation materials, camera
path, simulation and selected lighting remain in use.

Authenticated retail tables and geometry remain research-derived Xbox material;
audio is a software reconstruction rather than a sample-exact MCPX emulation.
See the source project’s `web/PORT.md` and `web/AUDIO.md` for provenance and known
hardware differences. Original notices remain in the vendored source.

The audio filter retains its Steve Harris / andy@vellocet and xemu attribution
and GPL-2.0-only notice. The corresponding license is in
`public/splash/GPL-2.0.txt`; the source is in `src/lib/splash/audio-filter.mjs`.
The DGRAHAM wordmark uses the XBOX Original fan-font outlines. Its metadata and
usage description are preserved in `public/splash/FONTS.md` and
`public/splash/dgraham-font.json`.
