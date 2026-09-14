const SVG_NS = "http://www.w3.org/2000/svg";
const svg = document.getElementById("frame-svg");
const form = document.getElementById("geo-form");
const bikeListEl = document.getElementById("bike-list");

const FIELD_KEYS = [
  "reach", "stack", "ett", "seatTube",
  "chainstay", "bbDrop", "wheelDia",
  "headAngle", "headTubeLen", "forkRake",
  "stemLength", "stemAngle",
  "saddleHeight", "saddleSetback",
];

const DEFAULTS = {
  reach: 385, stack: 585, ett: 565, seatTube: 520,
  chainstay: 410, bbDrop: 70, wheelDia: 737,
  headAngle: 73, headTubeLen: 150, forkRake: 45,
  stemLength: 100, stemAngle: 7,
  saddleHeight: 240, saddleSetback: 20,
};

const GHOST_PALETTE = ["#b3441f", "#3f6b4d", "#35577d", "#8a5a2b", "#6a4c93", "#a44a74"];
const STORAGE_KEY = "bike-frame-geometry:bikes:v1";

const inputs = Object.fromEntries(FIELD_KEYS.map((k) => [k, document.getElementById(k)]));

const outSeatAngle = document.getElementById("out-seat-angle");
const outInfo = document.getElementById("out-info");
const outWheelbase = document.getElementById("out-wheelbase");
const outForkLength = document.getElementById("out-fork-length");

let bikes = [];
let activeId = null;

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

  // Stem, from the head tube top.
  const stemRad = (v.stemAngle * Math.PI) / 180;
  const stemEnd = {
    x: headTop.x + v.stemLength * Math.cos(stemRad),
    y: headTop.y + v.stemLength * Math.sin(stemRad),
  };

  // Handlebar: just a ring (bar seen end-on), centered on the stem end.
  const barEnd = { x: stemEnd.x, y: stemEnd.y };

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
    barEnd,
    saddleBase,
    saddleCenter,
    wheelbase,
    forkLength,
  };
}

function bikeBoundPoints(geo) {
  return [
    geo.bb,
    geo.headTop,
    geo.seatTop,
    geo.ettPoint,
    geo.headBottom,
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
  const name = opts.name;
  const px = proj.toPx;

  const bbPx = px(geo.bb);
  const headPx = px(geo.headTop);
  const seatTopPx = px(geo.seatTop);
  const ettPx = px(geo.ettPoint);
  const rearAxlePx = px(geo.rearAxle);
  const frontAxlePx = px(geo.frontAxle);
  const headBottomPx = px(geo.headBottom);
  const stemEndPx = px(geo.stemEnd);
  const barEndPx = px(geo.barEnd);
  const saddleBasePx = px(geo.saddleBase);
  const saddleCenterPx = px(geo.saddleCenter);
  const wheelRPx = geo.wheelRadius * proj.scale;

  const g = el("g", ghost ? { class: "ghost-group" } : {});

  const line = (a, b, activeClass) => {
    g.appendChild(
      el("line", ghost
        ? { class: "ghost-line", stroke: color, x1: a.x, y1: a.y, x2: b.x, y2: b.y }
        : { class: activeClass, x1: a.x, y1: a.y, x2: b.x, y2: b.y })
    );
  };

  // Ground line
  const g1 = px({ x: proj.minX, y: geo.groundY });
  const g2 = px({ x: proj.maxX, y: geo.groundY });
  g.appendChild(
    el("line", ghost
      ? { class: "ghost-line", stroke: color, "stroke-width": 1, "stroke-dasharray": "2 5", x1: g1.x, y1: g1.y, x2: g2.x, y2: g2.y }
      : { class: "ground-line", x1: g1.x, y1: g1.y, x2: g2.x, y2: g2.y })
  );

  // Wheels
  for (const c of [rearAxlePx, frontAxlePx]) {
    g.appendChild(
      el("circle", ghost
        ? { class: "ghost-wheel", stroke: color, cx: c.x, cy: c.y, r: wheelRPx }
        : { class: "wheel", cx: c.x, cy: c.y, r: wheelRPx })
    );
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

  // Cockpit
  line(headPx, stemEndPx, "tube-cockpit");
  g.appendChild(
    el("circle", ghost
      ? { class: "ghost-wheel", stroke: color, cx: barEndPx.x, cy: barEndPx.y, r: 9 }
      : { class: "bar-ring", cx: barEndPx.x, cy: barEndPx.y, r: 9 })
  );

  // Seatpost + saddle
  line(seatTopPx, saddleBasePx, "seatpost");
  g.appendChild(
    el("line", ghost
      ? { class: "ghost-line", stroke: color, x1: saddleCenterPx.x - 32, y1: saddleCenterPx.y, x2: saddleCenterPx.x + 32, y2: saddleCenterPx.y }
      : { class: "saddle-line", x1: saddleCenterPx.x - 32, y1: saddleCenterPx.y, x2: saddleCenterPx.x + 32, y2: saddleCenterPx.y })
  );

  if (ghost) {
    g.appendChild(label(headPx.x + 6, headPx.y - 8, name, "start", "ghost-label"));
  } else {
    for (const p of [bbPx, headPx, seatTopPx, headBottomPx]) {
      g.appendChild(el("circle", { class: "joint", cx: p.x, cy: p.y, r: 6 }));
    }

    g.appendChild(label(bbPx.x - 10, bbPx.y + 20, "BB", "middle"));
    g.appendChild(label(headPx.x + 8, headPx.y - 10, "Hlavová trubka"));
    g.appendChild(label(seatTopPx.x - 8, seatTopPx.y - 10, "Vršek sedlovky", "end"));
    g.appendChild(label(rearAxlePx.x, rearAxlePx.y + wheelRPx + 16, "Zadní kolo", "middle"));
    g.appendChild(label(frontAxlePx.x, frontAxlePx.y + wheelRPx + 16, "Přední kolo", "middle"));
    g.appendChild(label(saddleCenterPx.x, saddleCenterPx.y - 12, "Sedlo", "middle"));
    g.appendChild(label(barEndPx.x + 12, barEndPx.y - 6, "Řídítka"));

    const dimGroup = el("g");
    const reachVal = Math.round(geo.headTop.x - geo.bb.x);
    const stackVal = Math.round(geo.headTop.y - geo.bb.y);
    const ettVal = Math.round(geo.headTop.x - geo.ettPoint.x);
    const seatTubeVal = Math.round(Math.hypot(geo.seatTop.x, geo.seatTop.y));

    const reachY = Math.max(bbPx.y, headPx.y) + 30;
    dimLineH(dimGroup, bbPx.x, headPx.x, reachY, `Reach ${reachVal} mm`);

    const stackX = Math.min(bbPx.x, headPx.x) - 30;
    dimLineV(dimGroup, bbPx.y, headPx.y, stackX, `Stack ${stackVal} mm`);

    const ettY = Math.min(ettPx.y, headPx.y) - 20;
    dimLineH(dimGroup, ettPx.x, headPx.x, ettY, `ETT ${ettVal} mm`);

    g.appendChild(dimGroup);

    const seatMid = { x: (bbPx.x + seatTopPx.x) / 2, y: (bbPx.y + seatTopPx.y) / 2 };
    const seatLenLabel = el("text", { class: "dim-label", x: seatMid.x + 10, y: seatMid.y });
    seatLenLabel.textContent = `${seatTubeVal} mm`;
    g.appendChild(seatLenLabel);
  }

  container.appendChild(g);
}

// ---- Persistence ----

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.bikes) && parsed.bikes.length) {
        bikes = parsed.bikes.map((b) => ({
          id: (b && b.id) || uid(),
          name: (b && b.name) || "Kolo",
          values: normalizeValues(b && b.values),
        }));
        activeId = bikes.some((b) => b.id === parsed.activeId) ? parsed.activeId : bikes[0].id;
        return;
      }
    }
  } catch (e) {
    /* corrupt or unavailable storage: fall back to a fresh default bike */
  }
  bikes = [{ id: uid(), name: "Kolo 1", values: { ...DEFAULTS } }];
  activeId = bikes[0].id;
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ bikes, activeId }));
  } catch (e) {
    /* private mode / quota exceeded: silently skip persistence */
  }
}

function getActiveBike() {
  return bikes.find((b) => b.id === activeId) || bikes[0];
}

function loadFormFromActive() {
  const v = getActiveBike().values;
  for (const k of FIELD_KEYS) inputs[k].value = v[k];
}

function syncActiveFromForm() {
  const bike = getActiveBike();
  bike.values = normalizeValues(Object.fromEntries(FIELD_KEYS.map((k) => [k, parseFloat(inputs[k].value)])));
}

// ---- Bike list UI ----

function renderBikeList() {
  bikeListEl.innerHTML = "";
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
          loadFormFromActive();
          saveState();
          render();
        },
      },
      [bike.name]
    );

    const renameBtn = h(
      "button",
      {
        type: "button",
        class: "bike-icon-btn",
        title: "Přejmenovat",
        onclick: () => {
          const next = window.prompt("Název kola", bike.name);
          if (next && next.trim()) {
            bike.name = next.trim();
            saveState();
            render();
          }
        },
      },
      ["✎"]
    );

    const deleteBtn = h(
      "button",
      {
        type: "button",
        class: "bike-icon-btn",
        title: "Smazat",
        disabled: bikes.length <= 1,
        onclick: () => {
          if (bikes.length <= 1) return;
          if (!window.confirm(`Smazat kolo „${bike.name}“?`)) return;
          bikes = bikes.filter((b) => b.id !== bike.id);
          if (activeId === bike.id) activeId = bikes[0].id;
          loadFormFromActive();
          saveState();
          render();
        },
      },
      ["×"]
    );

    bikeListEl.appendChild(h("li", { class: `bike-row${isActive ? " active" : ""}` }, [swatch, selectBtn, renameBtn, deleteBtn]));
  });
}

document.getElementById("add-bike").addEventListener("click", () => {
  const base = getActiveBike();
  const id = uid();
  bikes.push({ id, name: `Kolo ${bikes.length + 1}`, values: { ...base.values } });
  activeId = id;
  loadFormFromActive();
  saveState();
  render();
});

document.getElementById("export-bikes").addEventListener("click", () => {
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

document.getElementById("import-bikes").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const importedRaw = Array.isArray(parsed) ? parsed : Array.isArray(parsed.bikes) ? parsed.bikes : null;
      if (!importedRaw || !importedRaw.length) throw new Error("no bikes in file");
      const imported = importedRaw.map((b) => ({
        id: uid(),
        name: (b && b.name) || "Importované kolo",
        values: normalizeValues(b && b.values),
      }));
      bikes = bikes.concat(imported);
      activeId = imported[0].id;
      loadFormFromActive();
      saveState();
      render();
    } catch (err) {
      window.alert("Soubor se nepodařilo načíst jako platný JSON export kol.");
    }
    e.target.value = "";
  };
  reader.readAsText(file);
});

form.addEventListener("input", () => {
  syncActiveFromForm();
  saveState();
  render();
});

// ---- Render ----

function render() {
  const canvas = { w: 800, h: 600 };
  const entries = bikes.map((b) => ({ bike: b, geo: computeGeometry(b.values) }));

  const boundPoints = entries.flatMap(({ geo }) => bikeBoundPoints(geo));
  const proj = project(boundPoints, canvas);

  while (svg.firstChild) svg.removeChild(svg.firstChild);
  svg.setAttribute("viewBox", `0 0 ${canvas.w} ${canvas.h}`);

  const gridGroup = el("g");
  drawGrid(gridGroup, canvas, proj.scale * 50 > 15 ? proj.scale * 50 : proj.scale * 100);
  svg.appendChild(gridGroup);

  let activeEntry = entries.find((entry) => entry.bike.id === activeId);
  if (!activeEntry) activeEntry = entries[0];

  entries.forEach((entry, i) => {
    if (entry === activeEntry) return;
    drawSilhouette(svg, proj, entry.geo, { ghost: true, color: ghostColor(i), name: entry.bike.name });
  });
  drawSilhouette(svg, proj, activeEntry.geo, { ghost: false });

  outSeatAngle.textContent = `${activeEntry.geo.seatAngleDeg.toFixed(1)}°`;
  const frontLen = Math.hypot(activeEntry.geo.headTop.x - activeEntry.geo.bb.x, activeEntry.geo.headTop.y - activeEntry.geo.bb.y);
  outInfo.textContent = `${frontLen.toFixed(0)} mm`;
  outWheelbase.textContent = `${activeEntry.geo.wheelbase.toFixed(0)} mm`;
  outForkLength.textContent = `${activeEntry.geo.forkLength.toFixed(0)} mm`;

  renderBikeList();
}

// ---- Bootstrap ----

loadState();
loadFormFromActive();
render();
