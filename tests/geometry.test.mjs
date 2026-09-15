import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const geometryPath = path.join(__dirname, "..", "geometry.js");
const geometrySource = fs.readFileSync(geometryPath, "utf8");
const context = { window: {} };
vm.createContext(context);
vm.runInContext(geometrySource, context, { filename: "geometry.js" });

const { DEFAULTS, alignGeo, computeGeometry, normalizeValues } = context.window.Geometry;

function almostEqual(actual, expected, eps = 1e-6) {
  assert.ok(Math.abs(actual - expected) <= eps, `Expected ${actual} ~= ${expected} (eps=${eps})`);
}

test("normalizeValues fills missing numeric fields from defaults", () => {
  const values = normalizeValues({ reach: 500, stack: "620" });
  assert.equal(values.reach, 500);
  assert.equal(values.stack, 620);
  assert.equal(values.bbDrop, DEFAULTS.bbDrop);
  assert.equal(values.headAngle, DEFAULTS.headAngle);
  assert.equal(values.saddleSetback, DEFAULTS.saddleSetback);
});

test("computeGeometry keeps wheel axles on the same y level", () => {
  const v = normalizeValues({
    reach: 470,
    stack: 630,
    ett: 650,
    seatTube: 520,
    chainstay: 435,
    bbDrop: 62,
    headAngle: 68.5,
    headTubeLen: 120,
    forkRake: 44,
  });
  const geo = computeGeometry(v);
  almostEqual(geo.rearAxle.y, v.bbDrop);
  almostEqual(geo.frontAxle.y, v.bbDrop);
  assert.ok(geo.wheelbase > 0);
});

test("computeGeometry seat tube and top tube lengths match computed points", () => {
  const v = normalizeValues({
    reach: 492,
    stack: 624,
    ett: 660,
    seatTube: 530,
  });
  const geo = computeGeometry(v);
  const seatTubeLen = Math.hypot(geo.seatTop.x - geo.bb.x, geo.seatTop.y - geo.bb.y);
  const topTubeReal = Math.hypot(geo.seatTop.x - geo.headTop.x, geo.seatTop.y - geo.headTop.y);
  almostEqual(seatTubeLen, v.seatTube, 1e-4);
  almostEqual(topTubeReal, geo.topTubeRealLen, 1e-4);
});

test("alignGeo moves selected point to origin and preserves shape", () => {
  const v = normalizeValues({ reach: 490, stack: 658, ett: 666, seatTube: 500 });
  const geo = computeGeometry(v);
  const aligned = alignGeo(geo, "headTop");

  almostEqual(aligned.headTop.x, 0);
  almostEqual(aligned.headTop.y, 0);

  const originalDelta = {
    x: geo.barEnd.x - geo.saddleCenter.x,
    y: geo.barEnd.y - geo.saddleCenter.y,
  };
  const alignedDelta = {
    x: aligned.barEnd.x - aligned.saddleCenter.x,
    y: aligned.barEnd.y - aligned.saddleCenter.y,
  };
  almostEqual(alignedDelta.x, originalDelta.x);
  almostEqual(alignedDelta.y, originalDelta.y);
});
