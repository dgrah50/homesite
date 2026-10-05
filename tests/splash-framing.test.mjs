import test from "node:test";
import assert from "node:assert/strict";
import { splashFraming } from "../src/lib/splash/framing.mjs";

test("phone and desktop projections preserve the authored view without stretching", () => {
  for (const [width, height] of [
    [390, 844],
    [430, 932],
    [768, 1024],
    [1440, 900],
    [3440, 1440],
    [844, 390],
  ]) {
    const frame = splashFraming(width, height, 0, 3);
    assert.equal(frame.aspect, width / height);
    const horizontalTangent =
      Math.tan((frame.fov * Math.PI) / 360) * frame.aspect;
    if (width / height < 4 / 3)
      assert.ok(
        Math.abs(horizontalTangent - (Math.tan(Math.PI / 8) * 4) / 3) < 1e-10,
      );
    else assert.equal(frame.fov, 45);
    assert.ok(width * height * frame.pixelRatio ** 2 <= 2500000.001);
    assert.ok(frame.domainY > 0 && frame.domainY < height);
  }
});

test("logo framing eases closer after takeover and keeps the domain within the viewport", () => {
  for (const [width, height] of [
    [390, 844],
    [1440, 900],
    [844, 390],
  ]) {
    const before = splashFraming(width, height, 5.8),
      mid = splashFraming(width, height, 6.05),
      after = splashFraming(width, height, 7);
    assert.ok(before.fov > mid.fov && mid.fov > after.fov);
    assert.ok(after.domainY < height - 24);
    assert.deepEqual(
      splashFraming(width, height, 7),
      splashFraming(width, height, 8),
    );
  }
});
