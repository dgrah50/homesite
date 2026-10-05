export function createSplash(
  canvas: HTMLCanvasElement,
  domain: HTMLElement,
  options: { signal: AbortSignal },
): Promise<{
  render(time: number): void;
  dispose(): void;
  prepareFinale(): Promise<void>;
  canRender(time: number): boolean;
}>;
