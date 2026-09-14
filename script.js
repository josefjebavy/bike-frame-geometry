const SVG_NS = "http://www.w3.org/2000/svg";
const svg = document.getElementById("frame-svg");
const form = document.getElementById("geo-form");

const inputs = {
  reach: document.getElementById("reach"),
  stack: document.getElementById("stack"),
  ett: document.getElementById("ett"),
  seatTube: document.getElementById("seatTube"),
};

const outSeatAngle = document.getElementById("out-seat-angle");
const outInfo = document.getElementById("out-info");

form.addEventListener("input", render);

function el(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

/**
 * Geometry model:
 *  - BB is the origin.
 *  - Head tube top sits at (reach, stack).
 *  - The seat tube centerline passes through BB and through the point
 *    where the effective top tube (horizontal, at head-top height)
 *    meets it: (reach - ett, stack). That fixes the seat tube angle
 *    without asking for it separately.
 *  - The actual top of the seat tube is `seatTube` mm from BB along
 *    that same centerline.
 */
function computeGeometry({ reach, stack, ett, seatTube }) {
  const bb = { x: 0, y: 0 };
  const headTop = { x: reach, y: stack };

  const px = reach - ett;
  const py = stack;
  const centerlineLen = Math.hypot(px, py) || 1;
  const dirX = px / centerlineLen;
  const dirY = py / centerlineLen;

  const ettPoint = { x: px, y: py };
  const seatTop = { x: dirX * seatTube, y: dirY * seatTube };

  const seatAngleDeg = (Math.atan2(py, -px) * 180) / Math.PI;

  return { bb, headTop, ettPoint, seatTop, seatAngleDeg };
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

function render() {
  const values = {
    reach: parseFloat(inputs.reach.value) || 0,
    stack: parseFloat(inputs.stack.value) || 0,
    ett: parseFloat(inputs.ett.value) || 0,
    seatTube: parseFloat(inputs.seatTube.value) || 0,
  };

  const geo = computeGeometry(values);
  const canvas = { w: 800, h: 600 };
  const proj = project([geo.bb, geo.headTop, geo.seatTop, geo.ettPoint], canvas);

  const bbPx = proj.toPx(geo.bb);
  const headPx = proj.toPx(geo.headTop);
  const seatTopPx = proj.toPx(geo.seatTop);
  const ettPx = proj.toPx(geo.ettPoint);

  while (svg.firstChild) svg.removeChild(svg.firstChild);
  svg.setAttribute("viewBox", `0 0 ${canvas.w} ${canvas.h}`);

  const gridGroup = el("g");
  drawGrid(gridGroup, canvas, proj.scale * 50 > 15 ? proj.scale * 50 : proj.scale * 100);
  svg.appendChild(gridGroup);

  // ETT reference (dashed horizontal, actual measured dimension)
  svg.appendChild(
    el("line", {
      class: "tube tube-ett",
      x1: ettPx.x,
      y1: ettPx.y,
      x2: headPx.x,
      y2: headPx.y,
    })
  );

  // Main triangle edges
  svg.appendChild(el("line", { class: "tube tube-down", x1: bbPx.x, y1: bbPx.y, x2: headPx.x, y2: headPx.y }));
  svg.appendChild(el("line", { class: "tube tube-top", x1: headPx.x, y1: headPx.y, x2: seatTopPx.x, y2: seatTopPx.y }));
  svg.appendChild(el("line", { class: "tube tube-seat", x1: bbPx.x, y1: bbPx.y, x2: seatTopPx.x, y2: seatTopPx.y }));

  // Joints
  for (const p of [bbPx, headPx, seatTopPx]) {
    svg.appendChild(el("circle", { class: "joint", cx: p.x, cy: p.y, r: 6 }));
  }

  // Point labels
  const bbLabel = el("text", { class: "point-label", x: bbPx.x - 10, y: bbPx.y + 20, "text-anchor": "middle" });
  bbLabel.textContent = "BB";
  svg.appendChild(bbLabel);

  const headLabel = el("text", { class: "point-label", x: headPx.x + 8, y: headPx.y - 10 });
  headLabel.textContent = "Hlavová trubka";
  svg.appendChild(headLabel);

  const seatLabel = el("text", { class: "point-label", x: seatTopPx.x - 8, y: seatTopPx.y - 10, "text-anchor": "end" });
  seatLabel.textContent = "Vršek sedlovky";
  svg.appendChild(seatLabel);

  // Dimension lines
  const dimGroup = el("g");

  // Reach: horizontal, below the lowest point
  const reachY = Math.max(bbPx.y, headPx.y, seatTopPx.y, ettPx.y) + 45;
  dimLineH(dimGroup, bbPx.x, headPx.x, reachY, `Reach ${values.reach} mm`);

  // Stack: vertical, left of the leftmost point
  const stackX = Math.min(bbPx.x, headPx.x, seatTopPx.x, ettPx.x) - 45;
  dimLineV(dimGroup, bbPx.y, headPx.y, stackX, `Stack ${values.stack} mm`);

  // Effective top tube: horizontal, above the topmost point
  const ettY = Math.min(bbPx.y, headPx.y, seatTopPx.y, ettPx.y) - 25;
  dimLineH(dimGroup, ettPx.x, headPx.x, ettY, `ETT ${values.ett} mm`);

  svg.appendChild(dimGroup);

  // Seat tube length label along the tube
  const seatMid = { x: (bbPx.x + seatTopPx.x) / 2, y: (bbPx.y + seatTopPx.y) / 2 };
  const seatLenLabel = el("text", {
    class: "dim-label",
    x: seatMid.x + 10,
    y: seatMid.y,
  });
  seatLenLabel.textContent = `${values.seatTube} mm`;
  svg.appendChild(seatLenLabel);

  outSeatAngle.textContent = `${geo.seatAngleDeg.toFixed(1)}°`;
  const frontLen = Math.hypot(geo.headTop.x - geo.bb.x, geo.headTop.y - geo.bb.y);
  outInfo.textContent = `${frontLen.toFixed(0)} mm`;
}

render();
