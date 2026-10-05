# DG portfolio entrance

The homepage now plays the full eight-second Flubber boot, followed by the
matched-bowl DG monogram with soft lime crater lighting and a diffuse four-way
center split. The portfolio loads behind it and appears through a 450 ms fade.

## Visitor behavior

- Homepage only, once per tab session. Hash links go straight to the page.
- Skip intro and Escape dismiss immediately; keyboard focus returns to the page.
- Sound is enabled by default and its assets preload with the intro. Autoplay
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

The canvas uses a fixed `100dvh` overlay, with `100vh` as a fallback. The viewport
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
and resume, and dismissal during loading. Framing tests cover portrait phones,
a tablet, landscape phones, desktop and ultrawide displays. Live browser checks covered 390×844 and 844×390 rendering,
the early chamber, the takeover, automatic dismissal, Skip, default-enabled sound, autoplay unlocking and mute behavior.
Actual iOS Safari performance and browser chrome behavior still need a physical
phone check before deployment.

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
