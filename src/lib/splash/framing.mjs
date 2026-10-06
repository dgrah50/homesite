const smooth = (t) => {
  const u = Math.max(0, Math.min(1, t));
  return u * u * (3 - 2 * u);
};

// Preserve the authored horizontal view on narrow screens. Ease closer only
// after the chamber has handed off, so the four tips and wordmark stay visible.
export function splashFraming(width, height, time = 0, deviceRatio = 1) {
  const aspect = Math.max(1, width) / Math.max(1, height);
  const fit = Math.min(1, aspect / (4 / 3));
  const zoom =
    1 + ((aspect < 1 ? 1.32 : 1.08) - 1) * smooth((time - 5.8) / 0.5);
  const fov =
    (2 * Math.atan(Math.tan(Math.PI / 8) / (fit * zoom)) * 180) / Math.PI;
  const pixelRatio = Math.min(
    deviceRatio,
    width < 600 ? 1.5 : 2,
    Math.sqrt(2500000 / (width * height)),
  );
  return {
    aspect,
    fov,
    pixelRatio,
    domainY: height / 2 + height * fit * zoom * 0.18,
    domainWidth: height * fit * zoom * 0.66,
  };
}
