const SVG_NS = "http://www.w3.org/2000/svg";

// ---- DOM refs ----
const svg = document.getElementById("frame-svg");
const form = document.getElementById("geo-form");
const bikeListEl = document.getElementById("bike-list");
const dataFilesListEl = document.getElementById("data-files-list");
const dataFilesSectionEl = document.getElementById("data-files-section");

const outSeatAngle = document.getElementById("out-seat-angle");
const outInfo = document.getElementById("out-info");
const outWheelbase = document.getElementById("out-wheelbase");
const outForkLength = document.getElementById("out-fork-length");
const outSaddleToBar = document.getElementById("out-saddle-to-bar");

const addBikeBtn = document.getElementById("add-bike");
const resetBikesBtn = document.getElementById("reset-bikes");
const exportBikesBtn = document.getElementById("export-bikes");
const importBikesInput = document.getElementById("import-bikes");
const saddleHeightApplyAllBtn = document.getElementById("saddle-height-apply-all");
const topTubeRealInput = document.getElementById("topTubeReal");
const stemHeightInput = document.getElementById("stemHeight");
const alignHintLabelEl = document.getElementById("align-hint-label");
const alignResetBtn = document.getElementById("align-reset");

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
stemHeightInput.value = STEM_HEIGHT;

const GHOST_PALETTE = ["#b3441f", "#3f6b4d", "#35577d", "#8a5a2b", "#6a4c93", "#a44a74"];
const STORAGE_KEY = "bike-frame-geometry:bikes:v1";

const inputs = Object.fromEntries(FIELD_KEYS.map((k) => [k, document.getElementById(k)]));

let bikes = [];
let activeId = null;

// Which point every bike's frame gets aligned on when drawn together. Click
// one of the 4 joint dots on the active frame to change it — every bike's
// geometry is then re-based so that point sits at the same spot (instead of
// always comparing from BB).
const ALIGN_POINTS = I18N.t("alignPoints");
let alignPoint = "bb";

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

function el(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

function h(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v === true) node.setAttribute(k, "");
    else if (v !== false && v != null) node.setAttribute(k, v);
  }
  for (const c of children) {
    if (c == null) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function ghostColor(index) {
  return GHOST_PALETTE[index % GHOST_PALETTE.length];
}

function normalizeValues(raw) {
  const out = {};
  for (const k of FIELD_KEYS) {
    const n = Number(raw ? raw[k] : undefined);
    out[k] = Number.isFinite(n) ? n : DEFAULTS[k];
  }
  return out;
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

function project(points, canvas) {
  const PAD = 30;
  const DIM_LEFT = 75;
  const DIM_BOTTOM = 70;
  const DIM_TOP = 95;
  const DIM_RIGHT = 40;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const availW = canvas.w - PAD - DIM_LEFT - DIM_RIGHT;
  const availH = canvas.h - PAD - DIM_TOP - DIM_BOTTOM;

  const rangeX = Math.max(maxX - minX, 1);
  const rangeY = Math.max(maxY - minY, 1);

  const scale = Math.min(availW / rangeX, availH / rangeY);

  const originX = DIM_LEFT + (availW - rangeX * scale) / 2;
  const originYTop = PAD + DIM_TOP + (availH - rangeY * scale) / 2;

  function toPx(p) {
    return {
      x: originX + (p.x - minX) * scale,
      y: originYTop + (maxY - p.y) * scale,
    };
  }

  return { toPx, minX, maxX, minY, maxY, scale };
}

function circleBounds(center, r) {
  return [
    { x: center.x - r, y: center.y },
    { x: center.x + r, y: center.y },
    { x: center.x, y: center.y - r },
    { x: center.x, y: center.y + r },
  ];
}

function dimLineH(group, x1, x2, y, text) {
  group.appendChild(el("line", { class: "dim-line", x1, y1: y, x2, y2: y }));
  for (const x of [x1, x2]) {
    group.appendChild(el("line", { class: "dim-line", x1: x, y1: y - 5, x2: x, y2: y + 5 }));
  }
  const t = el("text", { class: "dim-label", x: (x1 + x2) / 2, y: y - 8, "text-anchor": "middle" });
  t.textContent = text;
  group.appendChild(t);
}

function dimLineV(group, y1, y2, x, text) {
  group.appendChild(el("line", { class: "dim-line", x1: x, y1, x2: x, y2 }));
  for (const y of [y1, y2]) {
    group.appendChild(el("line", { class: "dim-line", x1: x - 5, y1: y, x2: x + 5, y2: y }));
  }
  const t = el("text", { class: "dim-label", x: x - 8, y: (y1 + y2) / 2, "text-anchor": "end", "dominant-baseline": "middle" });
  t.textContent = text;
  group.appendChild(t);
}

// Dimension line between two arbitrary points (e.g. saddle-to-bar), with
// small perpendicular tick marks at each end and a label offset to the side.
// Dimension between two arbitrary points, drawn offset to the side (like a
// technical-drawing dimension: short extension lines from the real points
// out to a parallel dimension line, which carries the label) instead of
// right on top of the measured segment — so it doesn't sit under the frame.
function dimLineBetween(group, p1, p2, text, offset = 40, forcedDir = null) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  let nx, ny;
  if (forcedDir) {
    nx = forcedDir.x;
    ny = forcedDir.y;
  } else {
    nx = -uy;
    ny = ux;
    if (ny > 0) {
      nx = -nx;
      ny = -ny;
    } // keep the offset pointing up (smaller y), i.e. above the bike
  }

  const o1 = { x: p1.x + nx * offset, y: p1.y + ny * offset };
  const o2 = { x: p2.x + nx * offset, y: p2.y + ny * offset };

  group.appendChild(el("line", { class: "dim-line", x1: p1.x, y1: p1.y, x2: o1.x, y2: o1.y }));
  group.appendChild(el("line", { class: "dim-line", x1: p2.x, y1: p2.y, x2: o2.x, y2: o2.y }));
  group.appendChild(el("line", { class: "dim-line", x1: o1.x, y1: o1.y, x2: o2.x, y2: o2.y }));
  for (const o of [o1, o2]) {
    group.appendChild(el("line", { class: "dim-line", x1: o.x - nx * 5, y1: o.y - ny * 5, x2: o.x + nx * 5, y2: o.y + ny * 5 }));
  }

  const t = el("text", { class: "dim-label", x: (o1.x + o2.x) / 2, y: (o1.y + o2.y) / 2 - 6, "text-anchor": "middle" });
  t.textContent = text;
  group.appendChild(t);
}

function drawGrid(group, canvas, stepPx) {
  for (let x = 0; x <= canvas.w; x += stepPx) {
    group.appendChild(el("line", { class: "grid-line", x1: x, y1: 0, x2: x, y2: canvas.h }));
  }
  for (let y = 0; y <= canvas.h; y += stepPx) {
    group.appendChild(el("line", { class: "grid-line", x1: 0, y1: y, x2: canvas.w, y2: y }));
  }
}

function label(x, y, text, anchor = "start", extraClass = "") {
  const t = el("text", { class: `point-label ${extraClass}`.trim(), x, y, "text-anchor": anchor });
  t.textContent = text;
  return t;
}

/** Draws one bike's silhouette. Ghost mode: single muted color, no labels/dims. */
function drawSilhouette(container, proj, geo, opts) {
  const ghost = !!opts.ghost;
  const color = opts.color;
  const px = proj.toPx;

  const bbPx = px(geo.bb);
  const headPx = px(geo.headTop);
  const seatTopPx = px(geo.seatTop);
  const ettPx = px(geo.ettPoint);
  const rearAxlePx = px(geo.rearAxle);
  const frontAxlePx = px(geo.frontAxle);
  const headBottomPx = px(geo.headBottom);
  const steererTopPx = px(geo.steererTop);
  const stemEndPx = px(geo.stemEnd);
  const barEndPx = px(geo.barEnd);
  const saddleBasePx = px(geo.saddleBase);
  const saddleCenterPx = px(geo.saddleCenter);
  const wheelRPx = geo.wheelRadius * proj.scale;

  const g = el("g", ghost ? { class: "ghost-group" } : {});

  // In ghost mode every part collapses to one muted, bike-colored style
  // (`ghost-line`/`ghost-wheel` + explicit stroke); in active mode each
  // part keeps its own class/color from style.css.
  const line = (a, b, activeClass, ghostExtra = {}) =>
    g.appendChild(
      el("line", ghost
        ? { class: "ghost-line", stroke: color, x1: a.x, y1: a.y, x2: b.x, y2: b.y, ...ghostExtra }
        : { class: activeClass, x1: a.x, y1: a.y, x2: b.x, y2: b.y })
    );

  const circle = (c, r, activeClass) =>
    g.appendChild(
      el("circle", ghost
        ? { class: "ghost-wheel", stroke: color, cx: c.x, cy: c.y, r }
        : { class: activeClass, cx: c.x, cy: c.y, r })
    );

  // Ground line
  const groundStart = px({ x: proj.minX, y: geo.groundY });
  const groundEnd = px({ x: proj.maxX, y: geo.groundY });
  line(groundStart, groundEnd, "ground-line", { "stroke-width": 1, "stroke-dasharray": "2 5" });

  // Wheels
  for (const c of [rearAxlePx, frontAxlePx]) {
    circle(c, wheelRPx, "wheel");
    if (!ghost) g.appendChild(el("circle", { class: "hub", cx: c.x, cy: c.y, r: 4 }));
  }

  // Rear triangle
  line(bbPx, rearAxlePx, "tube-stay");
  line(seatTopPx, rearAxlePx, "tube-stay");

  // Fork
  line(headBottomPx, frontAxlePx, "tube-fork");

  if (!ghost) {
    g.appendChild(el("line", { class: "tube tube-ett", x1: ettPx.x, y1: ettPx.y, x2: headPx.x, y2: headPx.y }));
  }

  // Main triangle
  line(bbPx, headBottomPx, "tube tube-down");
  line(headPx, headBottomPx, "tube tube-main");
  line(headPx, seatTopPx, "tube tube-top");
  line(bbPx, seatTopPx, "tube tube-seat");

  // Headset spacers (steerer extension above the head tube) + cockpit
  line(headPx, steererTopPx, "tube-spacers");
  line(steererTopPx, stemEndPx, "tube-cockpit");
  const barRing = circle(barEndPx, 9, "bar-ring");
  if (!ghost) {
    const isAlign = opts.alignPoint === "barEnd";
    if (isAlign) barRing.classList.add("bar-ring-align");
    const barTitle = el("title");
    barTitle.textContent = isAlign
      ? I18N.t("alignTooltipActive", ALIGN_POINTS.barEnd)
      : I18N.t("alignTooltipClick", ALIGN_POINTS.barEnd);
    barRing.appendChild(barTitle);
    barRing.addEventListener("click", () => {
      alignPoint = "barEnd";
      commit();
    });
  }

  // Seatpost + saddle
  line(seatTopPx, saddleBasePx, "seatpost");
  line(
    { x: saddleCenterPx.x - 32, y: saddleCenterPx.y },
    { x: saddleCenterPx.x + 32, y: saddleCenterPx.y },
    "saddle-line"
  );

  if (!ghost) {
    const jointPx = { bb: bbPx, headTop: headPx, seatTop: seatTopPx, headBottom: headBottomPx };
    for (const key of Object.keys(jointPx)) {
      const p = jointPx[key];
      const isAlign = key === opts.alignPoint;
      const joint = el("circle", { class: `joint${isAlign ? " joint-align" : ""}`, cx: p.x, cy: p.y, r: 6 });
      const title = el("title");
      title.textContent = isAlign
        ? I18N.t("alignTooltipActive", ALIGN_POINTS[key])
        : I18N.t("alignTooltipClick", ALIGN_POINTS[key]);
      joint.appendChild(title);
      joint.addEventListener("click", () => {
        alignPoint = key;
        commit();
      });
      g.appendChild(joint);
    }

    g.appendChild(label(bbPx.x - 10, bbPx.y + 20, ALIGN_POINTS.bb, "middle"));
    g.appendChild(label(headPx.x + 8, headPx.y - 10, ALIGN_POINTS.headTop));
    g.appendChild(label(seatTopPx.x - 8, seatTopPx.y - 10, ALIGN_POINTS.seatTop, "end"));
    g.appendChild(label(rearAxlePx.x, rearAxlePx.y + wheelRPx + 16, I18N.t("labelRearWheel"), "middle"));
    g.appendChild(label(frontAxlePx.x, frontAxlePx.y + wheelRPx + 16, I18N.t("labelFrontWheel"), "middle"));
    g.appendChild(label(saddleCenterPx.x, saddleCenterPx.y - 12, I18N.t("labelSaddle"), "middle"));
    g.appendChild(label(barEndPx.x + 12, barEndPx.y - 6, ALIGN_POINTS.barEnd));

    const dimGroup = el("g");
    const reachVal = Math.round(geo.headTop.x - geo.bb.x);
    const stackVal = Math.round(geo.headTop.y - geo.bb.y);
    const ettVal = Math.round(geo.headTop.x - geo.ettPoint.x);
    const seatTubeVal = Math.round(Math.hypot(geo.seatTop.x - geo.bb.x, geo.seatTop.y - geo.bb.y));
    const topTubeRealVal = Math.round(geo.topTubeRealLen);

    const reachY = Math.max(bbPx.y, headPx.y) + 30;
    dimLineH(dimGroup, bbPx.x, headPx.x, reachY, I18N.t("dimReach", reachVal));

    const stackX = Math.min(bbPx.x, headPx.x) - 30;
    dimLineV(dimGroup, bbPx.y, headPx.y, stackX, I18N.t("dimStack", stackVal));

    const ettY = Math.min(ettPx.y, headPx.y) - 20;
    dimLineH(dimGroup, ettPx.x, headPx.x, ettY, I18N.t("dimEtt", ettVal));

    dimLineBetween(dimGroup, saddleCenterPx, barEndPx, I18N.t("dimSaddleToBar", Math.round(geo.saddleToBar)));
    dimLineBetween(dimGroup, bbPx, seatTopPx, I18N.t("dimSeatTube", seatTubeVal), 60, { x: -1, y: 0 });
    dimLineBetween(dimGroup, headPx, seatTopPx, I18N.t("dimTopTubeReal", topTubeRealVal), 22);

    const spacerVal = Math.round(Math.hypot(geo.steererTop.x - geo.headTop.x, geo.steererTop.y - geo.headTop.y));
    if (spacerVal > 0) {
      g.appendChild(label(steererTopPx.x + 8, steererTopPx.y, I18N.t("labelSpacers"), "start"));
      dimLineBetween(dimGroup, headPx, steererTopPx, I18N.t("dimSpacers", spacerVal), 16);
    }

    g.appendChild(dimGroup);
  }

  container.appendChild(g);
}

function buildArrowDefs() {
  const defs = el("defs");
  const makeMarker = (id, colorAttr) => {
    const marker = el("marker", {
      id,
      viewBox: "0 0 10 10",
      refX: "9",
      refY: "5",
      markerWidth: "6",
      markerHeight: "6",
      orient: "auto-start-reverse",
    });
    const path = el("path", { d: "M0,0 L10,5 L0,10 z" });
    if (colorAttr) path.setAttribute("fill", colorAttr);
    else path.setAttribute("class", "arrow-active-fill");
    marker.appendChild(path);
    return marker;
  };
  GHOST_PALETTE.forEach((color, i) => defs.appendChild(makeMarker(`arrow-ghost-${i}`, color)));
  defs.appendChild(makeMarker("arrow-active", null));
  return defs;
}

/** Name label with a leader-line arrow pointing at the bike's saddle, so
 * overlapping silhouettes can be told apart. */
function drawNameTag(container, proj, geo, opts) {
  const { ghost, color, name, index } = opts;
  const anchor = proj.toPx(geo.saddleCenter);
  const goRight = index % 2 === 0;
  const dx = goRight ? 42 : -42;
  const dy = -70 - (index % 3) * 15;
  const labelPt = { x: anchor.x + dx, y: anchor.y + dy };

  const markerId = ghost ? `arrow-ghost-${index % GHOST_PALETTE.length}` : "arrow-active";
  const lineAttrs = {
    x1: labelPt.x,
    y1: labelPt.y,
    x2: anchor.x,
    y2: anchor.y,
    "marker-end": `url(#${markerId})`,
  };
  container.appendChild(
    el("line", ghost
      ? { ...lineAttrs, class: "nametag-line", stroke: color }
      : { ...lineAttrs, class: "nametag-line nametag-line-active" })
  );

  const text = el("text", {
    class: ghost ? "nametag-text" : "nametag-text nametag-text-active",
    x: labelPt.x + (goRight ? 4 : -4),
    y: labelPt.y + 4,
    "text-anchor": goRight ? "start" : "end",
  });
  if (ghost) text.setAttribute("fill", color);
  text.textContent = name;
  container.appendChild(text);
}

// ---- Persistence ----

// Builds a bike record from raw data (localStorage, import, or an add-bike
// clone), keeping brand/velikost/typ as free-form metadata alongside the
// numeric geometry.
function normalizeBikeRecord(b) {
  return {
    id: (b && b.id) || uid(),
    name: (b && b.name) || I18N.t("defaultBikeName"),
    brand: (b && b.brand) || "",
    velikost: (b && b.velikost) || "",
    typ: (b && b.typ) || "",
    values: normalizeValues(b && b.values),
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.bikes)) {
        bikes = parsed.bikes.map(normalizeBikeRecord);
        activeId = bikes.some((b) => b.id === parsed.activeId) ? parsed.activeId : bikes[0] ? bikes[0].id : null;
        return;
      }
    }
  } catch (e) {
    /* corrupt or unavailable storage: fall back below */
  }

  // First run: the app starts with no bikes loaded. Add one manually or
  // use "Import JSON" to load a data file (e.g. data/mtb-XL.json).
  bikes = [];
  activeId = null;
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ bikes, activeId }));
  } catch (e) {
    /* private mode / quota exceeded: silently skip persistence */
  }
}

function getActiveBike() {
  return bikes.find((b) => b.id === activeId) || bikes[0] || null;
}

function setFormDisabled(disabled) {
  for (const input of form.querySelectorAll("input:not([readonly])")) input.disabled = disabled;
  saddleHeightApplyAllBtn.disabled = disabled;
}

function loadFormFromActive() {
  const bike = getActiveBike();
  const v = bike ? bike.values : DEFAULTS;
  for (const k of FIELD_KEYS) inputs[k].value = v[k];
  setFormDisabled(!bike);
}

function syncActiveFromForm() {
  const bike = getActiveBike();
  if (!bike) return;
  bike.values = normalizeValues(Object.fromEntries(FIELD_KEYS.map((k) => [k, parseFloat(inputs[k].value)])));
}

// Persist + redraw — every mutation to `bikes`/`activeId` ends with this.
function commit() {
  saveState();
  render();
}

// Same, plus refreshing the form to match the (possibly new) active bike —
// use this whenever activeId changes or a bike is added/removed/imported.
function commitBikeSwitch() {
  loadFormFromActive();
  commit();
}

// ---- Bike list UI ----

function iconBtn(title, text, onclick) {
  return h("button", { type: "button", class: "bike-icon-btn", title, onclick }, [text]);
}

function renderBikeList() {
  bikeListEl.innerHTML = "";

  if (bikes.length === 0) {
    bikeListEl.appendChild(h("li", { class: "bike-list-empty" }, [I18N.t("bikeListEmpty")]));
    return;
  }

  bikes.forEach((bike, i) => {
    const isActive = bike.id === activeId;

    const swatch = h("span", { class: "bike-swatch" });
    swatch.style.background = isActive ? "var(--accent)" : ghostColor(i);

    const selectBtn = h(
      "button",
      {
        type: "button",
        class: "bike-select",
        title: bike.name,
        onclick: () => {
          if (activeId === bike.id) return;
          activeId = bike.id;
          commitBikeSwitch();
        },
      },
      [bike.name]
    );

    const renameBtn = iconBtn(I18N.t("renameTitle"), "✎", () => {
      const next = window.prompt(I18N.t("renamePrompt"), bike.name);
      if (next && next.trim()) {
        bike.name = next.trim();
        commit();
      }
    });

    const deleteBtn = iconBtn(I18N.t("deleteTitle"), "×", () => {
      bikes = bikes.filter((b) => b.id !== bike.id);
      if (activeId === bike.id) activeId = bikes[0] ? bikes[0].id : null;
      commitBikeSwitch();
    });

    bikeListEl.appendChild(h("li", { class: `bike-row${isActive ? " active" : ""}` }, [swatch, selectBtn, renameBtn, deleteBtn]));
  });
}

addBikeBtn.addEventListener("click", () => {
  const base = getActiveBike();
  const id = uid();
  bikes.push({
    id,
    name: I18N.t("newBikeName", bikes.length + 1),
    brand: base ? base.brand : "",
    velikost: base ? base.velikost : "",
    typ: base ? base.typ : "",
    values: base ? { ...base.values } : { ...DEFAULTS },
  });
  activeId = id;
  commitBikeSwitch();
});

resetBikesBtn.addEventListener("click", () => {
  if (bikes.length === 0) return;
  if (!window.confirm(I18N.t("confirmResetBikes"))) return;
  bikes = [];
  activeId = null;
  commitBikeSwitch();
});

exportBikesBtn.addEventListener("click", () => {
  const data = JSON.stringify({ bikes, activeId }, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bike-frame-geometry.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// Shared by both the manual file-picker import and clicking a "+" in the
// data-files catalog: merges the bikes it contains into the current list.
function mergeImportedBikes(parsed) {
  const importedRaw = Array.isArray(parsed) ? parsed : Array.isArray(parsed.bikes) ? parsed.bikes : null;
  if (!importedRaw || !importedRaw.length) throw new Error("no bikes in data");
  const imported = importedRaw.map((b) => normalizeBikeRecord({ ...b, name: (b && b.name) || I18N.t("importedBikeName") }));
  bikes = bikes.concat(imported);
  activeId = imported[0].id;
  commitBikeSwitch();
  return imported.map((b) => b.id);
}

importBikesInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      mergeImportedBikes(JSON.parse(reader.result));
    } catch (err) {
      window.alert(I18N.t("invalidJsonAlert"));
    }
    e.target.value = "";
  };
  reader.readAsText(file);
});

// ---- Data files list ----
//
// bikes-config.js (loaded via a plain <script> tag before this file) sets
// window.BIKE_GROUPS directly — a plain in-memory JS value, so this whole
// section is synchronous. No fetch, no server, works straight off file://.

// Tracks which catalog entries currently have a bike added to the list, so
// their row can be hidden until that bike is removed again. Keyed by the raw
// catalog bike object (identity from bikes-config.js), not by id — the added
// bike gets its own fresh uid, unrelated to the catalog.
const catalogBikeAddedIds = new Map();
const catalogBikeRows = new Map();

function trackCatalogAdd(bikeRaw, ids) {
  const existing = catalogBikeAddedIds.get(bikeRaw) || [];
  catalogBikeAddedIds.set(bikeRaw, existing.concat(ids));
}

// Re-checks which tracked ids are still present in `bikes` and hides/shows
// each catalog row accordingly.
function updateDataFilesAddedState() {
  catalogBikeRows.forEach((row, bikeRaw) => {
    const ids = catalogBikeAddedIds.get(bikeRaw) || [];
    const stillPresent = ids.filter((id) => bikes.some((b) => b.id === id));
    catalogBikeAddedIds.set(bikeRaw, stillPresent);
    row.hidden = stillPresent.length > 0;
  });
}

function renderDataFileGroup(group) {
  const label = group.label || I18N.t("catalogDefaultLabel");
  const groupBikes = (Array.isArray(group.bikes) ? group.bikes : [])
    .slice()
    .sort((a, b) => ((a && a.name) || "").localeCompare((b && b.name) || "", I18N.lang));
  let expanded = false;

  const bikesList = h("ul", { class: "data-file-bikes", hidden: true });
  if (!groupBikes.length) {
    bikesList.appendChild(h("li", { class: "data-file-bike-empty" }, [I18N.t("catalogEmptyGroup")]));
  } else {
    groupBikes.forEach((bikeRaw) => {
      const name = (bikeRaw && bikeRaw.name) || I18N.t("defaultBikeName");
      const nameBtn = h(
        "button",
        {
          type: "button",
          class: "data-file-bike-name",
          title: I18N.t("catalogAddTitle", name),
          onclick: () => {
            const ids = mergeImportedBikes([bikeRaw]);
            trackCatalogAdd(bikeRaw, ids);
            updateDataFilesAddedState();
          },
        },
        [name]
      );
      const row = h("li", { class: "data-file-bike-row" }, [nameBtn]);
      catalogBikeRows.set(bikeRaw, row);
      bikesList.appendChild(row);
    });
  }

  const toggleBtn = h(
    "button",
    {
      type: "button",
      class: "data-file-toggle",
      onclick: () => {
        expanded = !expanded;
        bikesList.hidden = !expanded;
        toggleBtn.textContent = `${expanded ? "▾" : "▸"} ${label}`;
      },
    },
    [`▸ ${label}`]
  );

  const addAllBtn = h(
    "button",
    {
      type: "button",
      class: "data-file-group-add",
      title: I18N.t("catalogAddAllTitle", label),
      disabled: groupBikes.length === 0,
      onclick: () => {
        const ids = mergeImportedBikes(groupBikes);
        groupBikes.forEach((bikeRaw, i) => trackCatalogAdd(bikeRaw, [ids[i]]));
        updateDataFilesAddedState();
      },
    },
    [I18N.t("catalogAddAllText", groupBikes.length)]
  );

  const header = h("div", { class: "data-file-group-header" }, [toggleBtn, addAllBtn]);

  return h("li", { class: "data-file-group" }, [header, bikesList]);
}

function renderDataFilesList(groups) {
  dataFilesListEl.innerHTML = "";
  dataFilesSectionEl.hidden = !groups || !groups.length;
  if (dataFilesSectionEl.hidden) return;
  groups.forEach((group) => dataFilesListEl.appendChild(renderDataFileGroup(group)));
}

if (Array.isArray(window.BIKE_GROUPS)) {
  renderDataFilesList(window.BIKE_GROUPS);
}

form.addEventListener("input", () => {
  syncActiveFromForm();
  commit();
});

alignResetBtn.addEventListener("click", () => {
  alignPoint = "bb";
  commit();
});

saddleHeightApplyAllBtn.addEventListener("click", () => {
  const raw = parseFloat(inputs.saddleHeight.value);
  const value = Number.isFinite(raw) ? raw : DEFAULTS.saddleHeight;
  for (const bike of bikes) bike.values.saddleHeight = value;
  commit();
});

// ---- Render ----

function render() {
  const canvas = { w: 800, h: 600 };

  alignHintLabelEl.textContent = ALIGN_POINTS[alignPoint];
  alignResetBtn.disabled = alignPoint === "bb";

  if (bikes.length === 0) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute("viewBox", `0 0 ${canvas.w} ${canvas.h}`);
    outSeatAngle.textContent = "–";
    outInfo.textContent = "–";
    outWheelbase.textContent = "–";
    outForkLength.textContent = "–";
    outSaddleToBar.textContent = "–";
    topTubeRealInput.value = "";
    renderBikeList();
    updateDataFilesAddedState();
    return;
  }

  const entries = bikes.map((b) => ({ bike: b, geo: alignGeo(computeGeometry(b.values), alignPoint) }));

  const boundPoints = entries.flatMap(({ geo }) => bikeBoundPoints(geo));
  const proj = project(boundPoints, canvas);

  while (svg.firstChild) svg.removeChild(svg.firstChild);
  svg.setAttribute("viewBox", `0 0 ${canvas.w} ${canvas.h}`);
  svg.appendChild(buildArrowDefs());

  const gridGroup = el("g");
  drawGrid(gridGroup, canvas, proj.scale * 50 > 15 ? proj.scale * 50 : proj.scale * 100);
  svg.appendChild(gridGroup);

  let activeEntry = entries.find((entry) => entry.bike.id === activeId);
  if (!activeEntry) activeEntry = entries[0];

  entries.forEach((entry, i) => {
    if (entry === activeEntry) return;
    drawSilhouette(svg, proj, entry.geo, { ghost: true, color: ghostColor(i), name: entry.bike.name });
  });
  drawSilhouette(svg, proj, activeEntry.geo, { ghost: false, alignPoint });

  // Name-tag arrows on top of everything, so multiple bikes stay tellable apart.
  entries.forEach((entry, i) => {
    const isActive = entry === activeEntry;
    drawNameTag(svg, proj, entry.geo, {
      ghost: !isActive,
      color: ghostColor(i),
      name: entry.bike.name,
      index: i,
    });
  });

  outSeatAngle.textContent = `${activeEntry.geo.seatAngleDeg.toFixed(1)}°`;
  outInfo.textContent = `${activeEntry.geo.topTubeRealLen.toFixed(0)} mm`;
  topTubeRealInput.value = Math.round(activeEntry.geo.topTubeRealLen);
  outWheelbase.textContent = `${activeEntry.geo.wheelbase.toFixed(0)} mm`;
  outForkLength.textContent = `${activeEntry.geo.forkLength.toFixed(0)} mm`;
  outSaddleToBar.textContent = `${activeEntry.geo.saddleToBar.toFixed(0)} mm`;

  renderBikeList();
  updateDataFilesAddedState();
}

// ---- Bootstrap ----

loadState();
loadFormFromActive();
render();
