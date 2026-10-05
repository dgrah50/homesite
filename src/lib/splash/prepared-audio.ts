import opusUrl from "../../assets/splash/boot.ogg?url";

/** Independent of Three.js: download and native decoding overlap scene setup. */
export async function loadPreparedAudio(
  context: AudioContext,
  signal: AbortSignal,
): Promise<AudioBuffer> {
  signal.throwIfAborted();
  const response = await fetch(opusUrl, { signal });
  if (!response.ok) throw new Error("Splash audio failed to load.");
  const buffer = await context.decodeAudioData(await response.arrayBuffer());
  signal.throwIfAborted();
  return buffer;
}
