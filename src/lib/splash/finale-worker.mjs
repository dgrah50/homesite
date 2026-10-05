import { craterField } from "./crater-field.mjs";

// JSON parsing and the fixed crater calculation run off the rendering thread.
self.onmessage = async ({ data: url }) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Splash finale failed to load.");
    const study = await response.json();
    const field = craterField(study.polygons);
    self.postMessage({ study, field }, [
      field.distances.buffer,
      field.heights.buffer,
      field.texels.buffer,
    ]);
  } catch (error) {
    self.postMessage({ error: String(error) });
  }
};
