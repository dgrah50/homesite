import opusUrl from "../../assets/splash/boot.ogg?url";
import aacUrl from "../../assets/splash/boot.m4a?url";

/** Independent of Three.js: download and native decoding overlap scene setup. */
export async function loadPreparedAudio(
  context: AudioContext,
  signal: AbortSignal,
): Promise<AudioBuffer> {
  for (const url of [opusUrl, aacUrl]) {
    signal.throwIfAborted();
    try {
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error("Splash audio failed to load.");
      const buffer = await context.decodeAudioData(
        await response.arrayBuffer(),
      );
      signal.throwIfAborted();
      return buffer;
    } catch (error) {
      if (signal.aborted || url === aacUrl) throw error;
    }
  }
  throw new Error("Splash audio failed to decode.");
}
