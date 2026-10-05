import { prepareOpening } from "./opening.mjs";
import geometryUrl from "../../assets/splash/retail-geometry.bin.gz?url";
import openingUrl from "../../assets/splash/opening.bin.gz?url";
import { createSplashAudio } from "./audio";
import type { createSplash } from "./runtime.js";

const BOOT_SECONDS = 8;
const FADE_CLEANUP_MS = 550;

function clearWatchdog() {
  const html = document.documentElement;
  clearTimeout(Number(html.dataset.splashWatchdog));
  delete html.dataset.splashWatchdog;
}

function restoreFocus(previous: Element | null, page: HTMLElement) {
  if (
    previous instanceof HTMLElement &&
    previous !== document.body &&
    previous.isConnected
  ) {
    previous.focus({ preventScroll: true });
    return;
  }
  const main = page.querySelector<HTMLElement>("main");
  if (!main) return;
  const temporaryTabIndex = !main.hasAttribute("tabindex");
  if (temporaryTabIndex) main.setAttribute("tabindex", "-1");
  main.focus({ preventScroll: true });
  if (temporaryTabIndex)
    main.addEventListener("blur", () => main.removeAttribute("tabindex"), {
      once: true,
    });
}

function splashElements() {
  const root = document.querySelector<HTMLElement>("#dg-splash");
  const canvas = root?.querySelector<HTMLCanvasElement>("canvas");
  const domain = root?.querySelector<HTMLElement>("#dg-splash-domain");
  const skip = root?.querySelector<HTMLButtonElement>("#dg-splash-skip");
  const sound = root?.querySelector<HTMLButtonElement>("#dg-splash-sound");
  const page = document.querySelector<HTMLElement>(".gridcontainer");
  return root && canvas && domain && skip && sound && page
    ? { root, canvas, domain, skip, sound, page }
    : undefined;
}

async function initSplash(replay: boolean, onComplete: () => void) {
  const html = document.documentElement;
  if (!html.classList.contains("splash-pending")) return;

  const elements = splashElements();
  if (!elements) {
    clearWatchdog();
    html.classList.remove("splash-pending");
    onComplete();
    return;
  }
  const { root, canvas, domain, skip, sound, page } = elements;
  const startupStarted = performance.now();

  const lifetime = new AbortController();
  const { signal } = lifetime;
  const previousFocus = document.activeElement;
  const wasInert = page.inert;
  const query = new URLSearchParams(location.search);
  const preview = !replay && query.get("intro") === "preview";
  const frame = query.has("frame") ? Number(query.get("frame")) : NaN;
  const still = preview && Number.isFinite(frame);
  let engine: Awaited<ReturnType<typeof createSplash>> | undefined;
  let ready = false;
  let finished = false;
  let cleaned = false;
  let time = 0;
  let previousTick: number | undefined;
  let raf = 0;
  let cleanupTimer = 0;
  const audio = createSplashAudio(sound, () => time, signal);

  page.inert = true;
  skip.focus({ preventScroll: true });
  if (!preview) {
    try {
      sessionStorage.setItem("dg-intro-seen", "1");
    } catch {}
  }

  function cleanup() {
    if (cleaned) return;
    cleaned = true;
    clearTimeout(cleanupTimer);
    root.removeEventListener("transitionend", fadeEnded);
    engine?.dispose();
    root.remove();
    onComplete();
  }

  function fadeEnded(event: TransitionEvent) {
    if (event.target === root && event.propertyName === "opacity") cleanup();
  }

  function finish() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    lifetime.abort();
    audio.dispose();
    clearWatchdog();
    html.classList.remove("splash-pending");
    page.inert = wasInert;
    root.classList.add("is-leaving");
    root.setAttribute("aria-hidden", "true");
    root.addEventListener("transitionend", fadeEnded);
    cleanupTimer = window.setTimeout(cleanup, FADE_CLEANUP_MS);
    restoreFocus(previousFocus, page);
  }

  function tick(now: number) {
    if (finished || document.hidden) return;
    if (previousTick !== undefined)
      time = Math.min(BOOT_SECONDS, time + (now - previousTick) / 1000);
    previousTick = now;
    if (!engine?.canRender(time)) {
      finish();
      return;
    }
    try {
      engine?.render(time);
    } catch {
      finish();
      return;
    }
    if (time >= BOOT_SECONDS) finish();
    else raf = requestAnimationFrame(tick);
  }

  function resume() {
    if (!ready || finished || document.hidden) return;
    previousTick = performance.now();
    audio.play();
    if (!still) raf = requestAnimationFrame(tick);
  }

  function visibilityChanged() {
    cancelAnimationFrame(raf);
    previousTick = undefined;
    audio.pause();
    resume();
  }

  function unlockAudio(event: Event) {
    const activatesButton =
      event.type === "click" ||
      (event instanceof KeyboardEvent && ["Enter", " "].includes(event.key));
    if (
      activatesButton &&
      event.target instanceof Element &&
      event.target.closest("button")
    )
      return;
    audio.unlock();
  }

  function keydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      finish();
      return;
    }
    unlockAudio(event);
    if (event.key !== "Tab") return;
    if (event.shiftKey && document.activeElement === sound) {
      event.preventDefault();
      skip.focus();
    } else if (!event.shiftKey && document.activeElement === skip) {
      event.preventDefault();
      sound.focus();
    }
  }

  skip.addEventListener("click", finish, { signal });
  sound.addEventListener("click", audio.toggle, { signal });
  root.addEventListener("click", unlockAudio, { signal });
  document.addEventListener("keydown", keydown, { signal });
  document.addEventListener("visibilitychange", visibilityChanged, { signal });
  document.addEventListener("dg:splash-timeout", finish, { signal });
  canvas.addEventListener("webglcontextlost", finish, { signal, once: true });
  matchMedia("(prefers-reduced-motion: reduce)").addEventListener(
    "change",
    (event) => {
      if (event.matches && !preview && !replay) finish();
    },
    { signal },
  );
  audio.start();

  try {
    const [{ createSplash }, opening] = await Promise.all([
      import("./runtime.js"),
      prepareOpening(signal),
    ]);
    if (finished) return;
    engine = await createSplash(canvas, domain, { signal, opening });
    if (finished) {
      engine.dispose();
      return;
    }
    time = still ? Math.max(0, Math.min(BOOT_SECONDS, frame)) : 0;
    // Still-frame previews need the finale immediately. Normal playback starts
    // with Flubber while the worker prepares DG in the background.
    if (still && !engine.canRender(time)) await engine.prepareFinale();
    await audio.ready();
    if (finished) {
      engine.dispose();
      return;
    }
    engine.render(time);
    root.dataset.ready = "true";
    ready = true;
    if (preview) {
      root.dataset.startupMs = String(Math.round(performance.now()));
      root.dataset.setupMs = String(
        Math.round(performance.now() - startupStarted),
      );
    }
    clearWatchdog();
    resume();
    void engine.prepareFinale().catch(() => {
      if (!finished) finish();
    });
  } catch {
    finish();
  }
}

/** Mount a fresh player per run; retain only its inert markup between runs. */
export function setupSplash() {
  const template = document.querySelector<HTMLTemplateElement>(
    "#dg-splash-template",
  );
  const replay = document.querySelector<HTMLButtonElement>("#dg-splash-replay");
  if (
    !template ||
    !replay ||
    typeof DecompressionStream !== "function" ||
    typeof Worker !== "function"
  )
    return;

  let playing = false;
  const play = (manual: boolean) => {
    if (playing) return;
    playing = true;
    template.after(template.content.cloneNode(true));
    if (manual) {
      // A visitor may have bypassed the automatic boot. Start both opening
      // downloads before importing the renderer, just as the early script does.
      for (const url of [geometryUrl, openingUrl]) {
        if (document.head.querySelector(`link[rel="preload"][href="${url}"]`))
          continue;
        const preload = document.createElement("link");
        preload.rel = "preload";
        preload.as = "fetch";
        preload.crossOrigin = "anonymous";
        preload.href = url;
        document.head.append(preload);
      }
      const html = document.documentElement;
      html.classList.add("splash-pending");
      html.dataset.splashWatchdog = String(
        window.setTimeout(() => {
          html.classList.remove("splash-pending");
          document.dispatchEvent(new CustomEvent("dg:splash-timeout"));
        }, 12000),
      );
    }
    // Called synchronously from the click so audio.resume retains the gesture.
    void initSplash(manual, () => {
      playing = false;
    });
  };
  replay.hidden = false;
  replay.addEventListener("click", () => play(true));
  if (document.documentElement.classList.contains("splash-pending"))
    play(false);
}
