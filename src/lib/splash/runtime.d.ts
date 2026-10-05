export function createSplash(
  canvas: HTMLCanvasElement,
  domain: HTMLElement,
  options: {
    signal: AbortSignal;
    opening: {
      textures: Record<string, Uint8Array[]>;
      camera: unknown;
      data: unknown;
      unit: { positions: number[]; indices: number[] };
      smallUnit: { positions: Float32Array; indices: number[] };
    };
  },
): Promise<{
  render(time: number): void;
  dispose(): void;
  prepareFinale(): Promise<void>;
  canRender(time: number): boolean;
}>;
