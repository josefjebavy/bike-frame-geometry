(function () {
const FIELD_KEYS = [
  "reach", "stack", "ett", "seatTube",
  "chainstay", "bbDrop", "wheelDia",
  "headAngle", "headTubeLen", "forkRake",
  "spacerHeight", "stemLength",
  "saddleHeight", "saddleSetback",
];

const DEFAULTS = {
  reach: 385, stack: 585, ett: 565, seatTube: 520,
  chainstay: 410, bbDrop: 70, wheelDia: 737,
  headAngle: 73, headTubeLen: 150, forkRake: 45,
  spacerHeight: 20, stemLength: 100,
  saddleHeight: 760, saddleSetback: 0,
};

// Fixed stem height (vertical rise from the steerer/spacer top to the bar
// clamp), per the user — not a per-bike input, always this constant.
const STEM_HEIGHT = 40;

function normalizeValues(raw) {
  const out = {};
  for (const k of FIELD_KEYS) {
    const n = Number(raw ? raw[k] : undefined);
    out[k] = Number.isFinite(n) ? n : DEFAULTS[k];
  }
  return out;
}

// Re-bases every point in `geo` so that `geo[refKey]` becomes (0, 0) — the
// scalar-valued fields (angles, lengths) are translation-invariant and pass
// through unchanged; `groundY` is a y-only scalar so it shifts with dy.
function alignGeo(geo, refKey) {
  const ref = geo[refKey] || geo.bb;
  const dx = -ref.x;
  const dy = -ref.y;
  const shift = (p) => ({ x: p.x + dx, y: p.y + dy });
  return {
    ...geo,
    bb: shift(geo.bb),
    headTop: shift(geo.headTop),
    ettPoint: shift(geo.ettPoint),
    seatTop: shift(geo.seatTop),
    rearAxle: shift(geo.rearAxle),
    headBottom: shift(geo.headBottom),
    frontAxle: shift(geo.frontAxle),
    steererTop: shift(geo.steererTop),
    stemEnd: shift(geo.stemEnd),
    barEnd: shift(geo.barEnd),
    saddleBase: shift(geo.saddleBase),
    saddleCenter: shift(geo.saddleCenter),
    groundY: geo.groundY + dy,
  };
}

/**
 * Main-triangle model (exact, from the 4 primary inputs):
 *  - BB is the origin, +x points toward the front of the bike.
 *  - Head tube top sits at (reach, stack).
 *  - The seat tube centerline passes through BB and through the point
 *    where the effective top tube (horizontal, at head-top height)
 *    meets it: (reach - ett, stack). That fixes the seat tube angle
 *    without asking for it separately.
 *  - The actual top of the seat tube is `seatTube` mm from BB along
 *    that same centerline.
 *
 * Everything below (wheels, fork, stem, bars, saddle) is a secondary,
 * orientational silhouette built from the extra inputs — real frames
 * vary a lot in these, they're not implied by reach/stack/ett/seat tube.
 */
function computeGeometry(v) {
  const bb = { x: 0, y: 0 };
  const headTop = { x: v.reach, y: v.stack };

  const px = v.reach - v.ett;
  const py = v.stack;
  const centerlineLen = Math.hypot(px, py) || 1;
  const seatDirX = px / centerlineLen;
  const seatDirY = py / centerlineLen;

  const ettPoint = { x: px, y: py };
  const seatTop = { x: seatDirX * v.seatTube, y: seatDirY * v.seatTube };
  const seatAngleDeg = (Math.atan2(py, -px) * 180) / Math.PI;

  // Rear axle: chainstay length + BB drop fix it relative to BB.
  const csHoriz = Math.sqrt(Math.max(v.chainstay * v.chainstay - v.bbDrop * v.bbDrop, 0));
  const rearAxle = { x: -csHoriz, y: v.bbDrop };

  // Head tube bottom, along the head angle from head tube top.
  const headRad = (v.headAngle * Math.PI) / 180;
  const headDir = { x: Math.cos(headRad), y: -Math.sin(headRad) };
  const headBottom = {
    x: headTop.x + v.headTubeLen * headDir.x,
    y: headTop.y + v.headTubeLen * headDir.y,
  };

  // Front axle: extend the steering axis, then offset by fork rake.
  // The axis length isn't a free input — both wheels share one diameter,
  // so the fork must be exactly long enough to put the front axle at the
  // same height as the rear axle (bbDrop above BB), given head angle,
  // head tube length and rake. Solving for that keeps the wheels level
  // instead of letting an independently-typed fork length float them apart.
  const forkPerp = { x: Math.sin(headRad), y: Math.cos(headRad) };
  const axisLen = (v.bbDrop - headBottom.y - v.forkRake * forkPerp.y) / headDir.y;
  const frontAxle = {
    x: headBottom.x + axisLen * headDir.x + v.forkRake * forkPerp.x,
    y: v.bbDrop,
  };
  const forkLength = Math.hypot(axisLen, v.forkRake);

  const wheelRadius = v.wheelDia / 2;
  const groundY = rearAxle.y - wheelRadius;

  // Headset spacers: stacked on the steerer above the head tube top, so
  // they continue the *steerer axis* (same line as the head tube, just
  // extended upward-and-back), not a vertical line. The stem then starts
  // from the top of that stack instead of straight off the frame.
  const steererUpDir = { x: -headDir.x, y: -headDir.y };
  const steererTop = {
    x: headTop.x + v.spacerHeight * steererUpDir.x,
    y: headTop.y + v.spacerHeight * steererUpDir.y,
  };

  // Stem, from the top of the spacer stack (== head tube top when there
  // are no spacers). `stemLength` is its horizontal reach; its vertical
  // rise is the fixed STEM_HEIGHT constant, not a per-bike input.
  const stemEnd = {
    x: steererTop.x + v.stemLength,
    y: steererTop.y + STEM_HEIGHT,
  };

  // Handlebar: just a ring (bar seen end-on), centered on the stem end.
  const barEnd = { x: stemEnd.x, y: stemEnd.y };

  // Saddle: `saddleHeight` is the straight-line distance from BB along the
  // seat tube centerline (same measure as `seatTube`, just further out to
  // the saddle) — i.e. saddle height from the BB, not from the frame.
  const saddleBase = { x: seatDirX * v.saddleHeight, y: seatDirY * v.saddleHeight };
  const saddleCenter = { x: saddleBase.x - v.saddleSetback, y: saddleBase.y };

  const wheelbase = frontAxle.x - rearAxle.x;
  const saddleToBar = Math.hypot(barEnd.x - saddleCenter.x, barEnd.y - saddleCenter.y);
  // Real (sloped) top tube length, head-tube-top to seat-tube-top — as
  // opposed to `ett`, which is the horizontal-only "effective" measure.
  const topTubeRealLen = Math.hypot(seatTop.x - headTop.x, seatTop.y - headTop.y);

  return {
    bb,
    headTop,
    ettPoint,
    seatTop,
    seatAngleDeg,
    rearAxle,
    headBottom,
    frontAxle,
    wheelRadius,
    groundY,
    steererTop,
    stemEnd,
    barEnd,
    saddleBase,
    saddleCenter,
    wheelbase,
    forkLength,
    saddleToBar,
    topTubeRealLen,
  };
}

function circleBounds(center, r) {
  return [
    { x: center.x - r, y: center.y },
    { x: center.x + r, y: center.y },
    { x: center.x, y: center.y - r },
    { x: center.x, y: center.y + r },
  ];
}

function bikeBoundPoints(geo) {
  return [
    geo.bb,
    geo.headTop,
    geo.seatTop,
    geo.ettPoint,
    geo.headBottom,
    geo.steererTop,
    geo.stemEnd,
    geo.barEnd,
    geo.saddleBase,
    { x: geo.saddleCenter.x - 70, y: geo.saddleCenter.y },
    { x: geo.saddleCenter.x + 70, y: geo.saddleCenter.y },
    ...circleBounds(geo.rearAxle, geo.wheelRadius),
    ...circleBounds(geo.frontAxle, geo.wheelRadius),
  ];
}

window.Geometry = {
  FIELD_KEYS,
  DEFAULTS,
  STEM_HEIGHT,
  normalizeValues,
  alignGeo,
  computeGeometry,
  bikeBoundPoints,
};
})();
