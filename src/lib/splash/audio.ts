type LoadBuffer = (
  context: AudioContext,
  signal: AbortSignal,
) => Promise<AudioBuffer>;

const loadBuffer: LoadBuffer = async (context, signal) => {
  const { loadPreparedAudio } = await import("./prepared-audio");
  return loadPreparedAudio(context, signal);
};

/** Audio preference, autoplay unlocking and playback share one lifecycle. */
export function createSplashAudio(
  button: HTMLButtonElement,
  getTime: () => number,
  signal: AbortSignal,
  load: LoadBuffer = loadBuffer,
) {
  let context: AudioContext | undefined;
  let buffer: AudioBuffer | undefined;
  let source: AudioBufferSourceNode | undefined;
  let loading: Promise<void> | undefined;
  let enabled = true;
  let active = false;
  let failed = false;
  let disposed = false;

  function updateButton() {
    if (disposed) return;
    const running = context?.state === "running";
    let label = "Sound on";
    if (!enabled) label = "Sound off";
    else if (failed) label = "Retry sound";
    else if (!running) label = "Tap for sound";
    else if (!buffer) label = "Loading sound…";
    button.textContent = label;
    button.setAttribute("aria-pressed", String(enabled && running && !!buffer));
  }

  function stop() {
    if (!source) return;
    source.onended = null;
    source.stop();
    source.disconnect();
    source = undefined;
  }

  function play() {
    if (
      disposed ||
      !active ||
      !enabled ||
      source ||
      context?.state !== "running" ||
      !buffer
    )
      return;
    const offset = getTime();
    if (offset >= buffer.duration) return;
    const next = context.createBufferSource();
    next.buffer = buffer;
    next.connect(context.destination);
    next.onended = () => {
      next.disconnect();
      if (source === next) source = undefined;
    };
    next.start(0, offset);
    source = next;
  }

  function stateChanged() {
    if (context?.state === "running") play();
    else stop();
    updateButton();
  }

  function start() {
    if (disposed || !enabled) return;
    try {
      if (!context) {
        context = new AudioContext();
        context.addEventListener("statechange", stateChanged);
      }
      // Resume in the gesture's call stack. A blocked resume may stay pending;
      // waiting for it would prevent the intro from running without sound.
      void context.resume().then(stateChanged).catch(updateButton);
      if (!loading && !buffer) {
        failed = false;
        loading = load(context, signal)
          .then((result) => {
            if (disposed) return;
            buffer = result;
            play();
            updateButton();
          })
          .catch(() => {
            failed = true;
            updateButton();
          })
          .finally(() => {
            loading = undefined;
          });
      }
    } catch {
      failed = true;
    }
    updateButton();
  }

  return {
    start,
    // Only allowed autoplay waits for its buffer before the boot clock starts.
    ready: () =>
      enabled && context?.state === "running" ? loading : undefined,
    unlock() {
      if (enabled && context?.state !== "running") start();
    },
    toggle() {
      if (enabled && context?.state === "running" && !failed) {
        enabled = false;
        stop();
        updateButton();
      } else {
        enabled = true;
        start();
      }
    },
    play() {
      active = true;
      play();
    },
    pause() {
      active = false;
      stop();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      stop();
      context?.removeEventListener("statechange", stateChanged);
      void context?.close().catch(() => {});
    },
  };
}
