const SVG_NS = "http://www.w3.org/2000/svg";
const svg = document.getElementById("frame-svg");
const form = document.getElementById("geo-form");

const inputs = {
  reach: document.getElementById("reach"),
  stack: document.getElementById("stack"),
  ett: document.getElementById("ett"),
  seatTube: document.getElementById("seatTube"),
  chainstay: document.getElementById("chainstay"),
  bbDrop: document.getElementById("bbDrop"),
  wheelDia: document.getElementById("wheelDia"),
  headAngle: document.getElementById("headAngle"),
  headTubeLen: document.getElementById("headTubeLen"),
  forkLength: document.getElementById("forkLength"),
  forkRake: document.getElementById("forkRake"),
  stemLength: document.getElementById("stemLength"),
  stemAngle: document.getElementById("stemAngle"),
  saddleHeight: document.getElementById("saddleHeight"),
  saddleSetback: document.getElementById("saddleSetback"),
};

const outSeatAngle = document.getElementById("out-seat-angle");
const outInfo = document.getElementById("out-info");
const outWheelbase = document.getElementById("out-wheelbase");

form.addEventListener("input", render);

function el(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
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
  const axisLen = Math.sqrt(Math.max(v.forkLength * v.forkLength - v.forkRake * v.forkRake, 0));
  const forkPerp = { x: Math.sin(headRad), y: Math.cos(headRad) };
  const frontAxle = {
    x: headBottom.x + axisLen * headDir.x + v.forkRake * forkPerp.x,
    y: headBottom.y + axisLen * headDir.y + v.forkRake * forkPerp.y,
  };

  const wheelRadius = v.wheelDia / 2;
  const groundY = (rearAxle.y - wheelRadius + (frontAxle.y - wheelRadius)) / 2;

  // Stem, from the head tube top.
  const stemRad = (v.stemAngle * Math.PI) / 180;
  const stemEnd = {
    x: headTop.x + v.stemLength * Math.cos(stemRad),
    y: headTop.y + v.stemLength * Math.sin(stemRad),
  };

  // Handlebar: a simple drop-bar silhouette, fixed proportions (decorative).
  const barRise = 25;
  const barReach = 70;
  const barDrop = 90;
  const barClamp = { x: stemEnd.x, y: stemEnd.y + barRise };
  const barTop = { x: barClamp.x + barReach, y: barClamp.y };
  const barDropPt = { x: barTop.x, y: barTop.y - barDrop };

  // Saddle, along the seat tube centerline extended, then set back.
  const saddleBase = {
    x: seatTop.x + seatDirX * v.saddleHeight,
    y: seatTop.y + seatDirY * v.saddleHeight,
  };
  const saddleCenter = { x: saddleBase.x - v.saddleSetback, y: saddleBase.y };

  const wheelbase = frontAxle.x - rearAxle.x;

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
    stemEnd,
    barClamp,
    barTop,
    barDropPt,
    saddleCenter,
    wheelbase,
  };
}

function project(points, canvas) {
  const PAD = 30;
  const DIM_LEFT = 75;
  const DIM_BOTTOM = 70;
  const DIM_TOP = 55;
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

function dimLineH(group, x1, x2, y, label) {
  group.appendChild(el("line", { class: "dim-line", x1, y1: y, x2, y2: y }));
  for (const x of [x1, x2]) {
    group.appendChild(el("line", { class: "dim-line", x1: x, y1: y - 5, x2: x, y2: y + 5 }));
  }
  const t = el("text", {
    class: "dim-label",
    x: (x1 + x2) / 2,
    y: y - 8,
    "text-anchor": "middle",
  });
  t.textContent = label;
  group.appendChild(t);
}

function dimLineV(group, y1, y2, x, label) {
  group.appendChild(el("line", { class: "dim-line", x1: x, y1, x2: x, y2 }));
  for (const y of [y1, y2]) {
    group.appendChild(el("line", { class: "dim-line", x1: x - 5, y1: y, x2: x + 5, y2: y }));
  }
  const t = el("text", {
    class: "dim-label",
    x: x - 8,
    y: (y1 + y2) / 2,
    "text-anchor": "end",
    "dominant-baseline": "middle",
  });
  t.textContent = label;
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

function label(x, y, text, anchor = "start") {
  const t = el("text", { class: "point-label", x, y, "text-anchor": anchor });
  t.textContent = text;
  return t;
}

function render() {
  const values = {
    reach: parseFloat(inputs.reach.value) || 0,
    stack: parseFloat(inputs.stack.value) || 0,
    ett: parseFloat(inputs.ett.value) || 0,
    seatTube: parseFloat(inputs.seatTube.value) || 0,
    chainstay: parseFloat(inputs.chainstay.value) || 1,
    bbDrop: parseFloat(inputs.bbDrop.value) || 0,
    wheelDia: parseFloat(inputs.wheelDia.value) || 1,
    headAngle: parseFloat(inputs.headAngle.value) || 73,
    headTubeLen: parseFloat(inputs.headTubeLen.value) || 0,
    forkLength: parseFloat(inputs.forkLength.value) || 1,
    forkRake: parseFloat(inputs.forkRake.value) || 0,
    stemLength: parseFloat(inputs.stemLength.value) || 0,
    stemAngle: parseFloat(inputs.stemAngle.value) || 0,
    saddleHeight: parseFloat(inputs.saddleHeight.value) || 0,
    saddleSetback: parseFloat(inputs.saddleSetback.value) || 0,
  };

  const geo = computeGeometry(values);
  const canvas = { w: 800, h: 600 };

  const boundPoints = [
    geo.bb,
    geo.headTop,
    geo.seatTop,
    geo.ettPoint,
    geo.headBottom,
    geo.stemEnd,
    geo.barClamp,
    geo.barTop,
    geo.barDropPt,
    { x: geo.saddleCenter.x - 70, y: geo.saddleCenter.y },
    { x: geo.saddleCenter.x + 70, y: geo.saddleCenter.y },
    ...circleBounds(geo.rearAxle, geo.wheelRadius),
    ...circleBounds(geo.frontAxle, geo.wheelRadius),
  ];

  const proj = project(boundPoints, canvas);
  const px = (p) => proj.toPx(p);

  const bbPx = px(geo.bb);
  const headPx = px(geo.headTop);
  const seatTopPx = px(geo.seatTop);
  const ettPx = px(geo.ettPoint);
  const rearAxlePx = px(geo.rearAxle);
  const frontAxlePx = px(geo.frontAxle);
  const headBottomPx = px(geo.headBottom);
  const stemEndPx = px(geo.stemEnd);
  const barClampPx = px(geo.barClamp);
  const barTopPx = px(geo.barTop);
  const barDropPx = px(geo.barDropPt);
  const saddleCenterPx = px(geo.saddleCenter);
  const wheelRPx = geo.wheelRadius * proj.scale;

  while (svg.firstChild) svg.removeChild(svg.firstChild);
  svg.setAttribute("viewBox", `0 0 ${canvas.w} ${canvas.h}`);

  const gridGroup = el("g");
  drawGrid(gridGroup, canvas, proj.scale * 50 > 15 ? proj.scale * 50 : proj.scale * 100);
  svg.appendChild(gridGroup);

  // Ground line
  const groundPx = px({ x: proj.minX, y: geo.groundY });
  const groundPx2 = px({ x: proj.maxX, y: geo.groundY });
  svg.appendChild(el("line", { class: "ground-line", x1: groundPx.x, y1: groundPx.y, x2: groundPx2.x, y2: groundPx2.y }));

  // Wheels
  svg.appendChild(el("circle", { class: "wheel", cx: rearAxlePx.x, cy: rearAxlePx.y, r: wheelRPx }));
  svg.appendChild(el("circle", { class: "wheel", cx: frontAxlePx.x, cy: frontAxlePx.y, r: wheelRPx }));
  svg.appendChild(el("circle", { class: "hub", cx: rearAxlePx.x, cy: rearAxlePx.y, r: 4 }));
  svg.appendChild(el("circle", { class: "hub", cx: frontAxlePx.x, cy: frontAxlePx.y, r: 4 }));

  // Rear triangle: chainstay + seatstay
  svg.appendChild(el("line", { class: "tube-stay", x1: bbPx.x, y1: bbPx.y, x2: rearAxlePx.x, y2: rearAxlePx.y }));
  svg.appendChild(el("line", { class: "tube-stay", x1: seatTopPx.x, y1: seatTopPx.y, x2: rearAxlePx.x, y2: rearAxlePx.y }));

  // Fork
  svg.appendChild(el("line", { class: "tube-fork", x1: headBottomPx.x, y1: headBottomPx.y, x2: frontAxlePx.x, y2: frontAxlePx.y }));

  // ETT reference (dashed horizontal, actual measured dimension)
  svg.appendChild(el("line", { class: "tube tube-ett", x1: ettPx.x, y1: ettPx.y, x2: headPx.x, y2: headPx.y }));

  // Main triangle: down tube (BB->head bottom), head tube, top tube, seat tube
  svg.appendChild(el("line", { class: "tube tube-down", x1: bbPx.x, y1: bbPx.y, x2: headBottomPx.x, y2: headBottomPx.y }));
  svg.appendChild(el("line", { class: "tube tube-main", x1: headPx.x, y1: headPx.y, x2: headBottomPx.x, y2: headBottomPx.y }));
  svg.appendChild(el("line", { class: "tube tube-top", x1: headPx.x, y1: headPx.y, x2: seatTopPx.x, y2: seatTopPx.y }));
  svg.appendChild(el("line", { class: "tube tube-seat", x1: bbPx.x, y1: bbPx.y, x2: seatTopPx.x, y2: seatTopPx.y }));

  // Stem + handlebar
  svg.appendChild(el("line", { class: "tube-cockpit", x1: headPx.x, y1: headPx.y, x2: stemEndPx.x, y2: stemEndPx.y }));
  const barPoints = [stemEndPx, barClampPx, barTopPx, barDropPx].map((p) => `${p.x},${p.y}`).join(" ");
  svg.appendChild(el("polyline", { class: "tube-cockpit", points: barPoints }));

  // Saddle
  svg.appendChild(
    el("line", {
      class: "saddle-line",
      x1: saddleCenterPx.x - 60,
      y1: saddleCenterPx.y,
      x2: saddleCenterPx.x + 60,
      y2: saddleCenterPx.y,
    })
  );

  // Joints
  for (const p of [bbPx, headPx, seatTopPx, headBottomPx]) {
    svg.appendChild(el("circle", { class: "joint", cx: p.x, cy: p.y, r: 6 }));
  }

  // Labels
  svg.appendChild(label(bbPx.x - 10, bbPx.y + 20, "BB", "middle"));
  svg.appendChild(label(headPx.x + 8, headPx.y - 10, "Hlavová trubka"));
  svg.appendChild(label(seatTopPx.x - 8, seatTopPx.y - 10, "Vršek sedlovky", "end"));
  svg.appendChild(label(rearAxlePx.x, rearAxlePx.y + wheelRPx + 16, "Zadní kolo", "middle"));
  svg.appendChild(label(frontAxlePx.x, frontAxlePx.y + wheelRPx + 16, "Přední kolo", "middle"));
  svg.appendChild(label(saddleCenterPx.x, saddleCenterPx.y - 12, "Sedlo", "middle"));
  svg.appendChild(label(barTopPx.x + 8, barTopPx.y - 6, "Řídítka"));

  // Dimension lines (primary 4 inputs)
  const dimGroup = el("g");

  const reachY = Math.max(bbPx.y, headPx.y) + 30;
  dimLineH(dimGroup, bbPx.x, headPx.x, reachY, `Reach ${values.reach} mm`);

  const stackX = Math.min(bbPx.x, headPx.x) - 30;
  dimLineV(dimGroup, bbPx.y, headPx.y, stackX, `Stack ${values.stack} mm`);

  const ettY = Math.min(ettPx.y, headPx.y) - 20;
  dimLineH(dimGroup, ettPx.x, headPx.x, ettY, `ETT ${values.ett} mm`);

  svg.appendChild(dimGroup);

  const seatMid = { x: (bbPx.x + seatTopPx.x) / 2, y: (bbPx.y + seatTopPx.y) / 2 };
  const seatLenLabel = el("text", { class: "dim-label", x: seatMid.x + 10, y: seatMid.y });
  seatLenLabel.textContent = `${values.seatTube} mm`;
  svg.appendChild(seatLenLabel);

  outSeatAngle.textContent = `${geo.seatAngleDeg.toFixed(1)}°`;
  const frontLen = Math.hypot(geo.headTop.x - geo.bb.x, geo.headTop.y - geo.bb.y);
  outInfo.textContent = `${frontLen.toFixed(0)} mm`;
  outWheelbase.textContent = `${geo.wheelbase.toFixed(0)} mm`;
}

render();
