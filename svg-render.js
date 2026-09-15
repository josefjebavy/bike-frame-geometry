(function () {
const SVG_NS = "http://www.w3.org/2000/svg";
const GHOST_PALETTE = ["#b3441f", "#3f6b4d", "#35577d", "#8a5a2b", "#6a4c93", "#a44a74"];

function el(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
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

function dimLineBetween(group, p1, p2, text, offset = 40, forcedDir = null) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy) || 1;
  const uy = dy / len;
  let nx;
  let ny;
  if (forcedDir) {
    nx = forcedDir.x;
    ny = forcedDir.y;
  } else {
    nx = -uy;
    ny = dx / len;
    if (ny > 0) {
      nx = -nx;
      ny = -ny;
    }
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

function label(x, y, text, anchor = "start", extraClass = "") {
  const t = el("text", { class: `point-label ${extraClass}`.trim(), x, y, "text-anchor": anchor });
  t.textContent = text;
  return t;
}

function ghostColor(index) {
  return GHOST_PALETTE[index % GHOST_PALETTE.length];
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

function drawGrid(group, canvas, stepPx) {
  for (let x = 0; x <= canvas.w; x += stepPx) {
    group.appendChild(el("line", { class: "grid-line", x1: x, y1: 0, x2: x, y2: canvas.h }));
  }
  for (let y = 0; y <= canvas.h; y += stepPx) {
    group.appendChild(el("line", { class: "grid-line", x1: 0, y1: y, x2: canvas.w, y2: y }));
  }
}

function drawSilhouette(container, proj, geo, opts) {
  const {
    ghost = false,
    color,
    alignPoint,
    alignPoints,
    onAlignSelect,
    i18n,
  } = opts;
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

  const groundStart = px({ x: proj.minX, y: geo.groundY });
  const groundEnd = px({ x: proj.maxX, y: geo.groundY });
  line(groundStart, groundEnd, "ground-line", { "stroke-width": 1, "stroke-dasharray": "2 5" });

  for (const c of [rearAxlePx, frontAxlePx]) {
    circle(c, wheelRPx, "wheel");
    if (!ghost) g.appendChild(el("circle", { class: "hub", cx: c.x, cy: c.y, r: 4 }));
  }

  line(bbPx, rearAxlePx, "tube-stay");
  line(seatTopPx, rearAxlePx, "tube-stay");
  line(headBottomPx, frontAxlePx, "tube-fork");

  if (!ghost) {
    g.appendChild(el("line", { class: "tube tube-ett", x1: ettPx.x, y1: ettPx.y, x2: headPx.x, y2: headPx.y }));
  }

  line(bbPx, headBottomPx, "tube tube-down");
  line(headPx, headBottomPx, "tube tube-main");
  line(headPx, seatTopPx, "tube tube-top");
  line(bbPx, seatTopPx, "tube tube-seat");
  line(headPx, steererTopPx, "tube-spacers");
  line(steererTopPx, stemEndPx, "tube-cockpit");

  const barRing = circle(barEndPx, 9, "bar-ring");
  if (!ghost) {
    const isAlign = alignPoint === "barEnd";
    if (isAlign) barRing.classList.add("bar-ring-align");
    const barTitle = el("title");
    barTitle.textContent = isAlign
      ? i18n.t("alignTooltipActive", alignPoints.barEnd)
      : i18n.t("alignTooltipClick", alignPoints.barEnd);
    barRing.appendChild(barTitle);
    barRing.addEventListener("click", () => onAlignSelect("barEnd"));
  }

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
      const isAlign = key === alignPoint;
      const joint = el("circle", { class: `joint${isAlign ? " joint-align" : ""}`, cx: p.x, cy: p.y, r: 6 });
      const title = el("title");
      title.textContent = isAlign
        ? i18n.t("alignTooltipActive", alignPoints[key])
        : i18n.t("alignTooltipClick", alignPoints[key]);
      joint.appendChild(title);
      joint.addEventListener("click", () => onAlignSelect(key));
      g.appendChild(joint);
    }

    g.appendChild(label(bbPx.x - 10, bbPx.y + 20, alignPoints.bb, "middle"));
    g.appendChild(label(headPx.x + 8, headPx.y - 10, alignPoints.headTop));
    g.appendChild(label(seatTopPx.x - 8, seatTopPx.y - 10, alignPoints.seatTop, "end"));
    g.appendChild(label(rearAxlePx.x, rearAxlePx.y + wheelRPx + 16, i18n.t("labelRearWheel"), "middle"));
    g.appendChild(label(frontAxlePx.x, frontAxlePx.y + wheelRPx + 16, i18n.t("labelFrontWheel"), "middle"));
    g.appendChild(label(saddleCenterPx.x, saddleCenterPx.y - 12, i18n.t("labelSaddle"), "middle"));
    g.appendChild(label(barEndPx.x + 12, barEndPx.y - 6, alignPoints.barEnd));

    const dimGroup = el("g");
    const reachVal = Math.round(geo.headTop.x - geo.bb.x);
    const stackVal = Math.round(geo.headTop.y - geo.bb.y);
    const ettVal = Math.round(geo.headTop.x - geo.ettPoint.x);
    const seatTubeVal = Math.round(Math.hypot(geo.seatTop.x - geo.bb.x, geo.seatTop.y - geo.bb.y));
    const topTubeRealVal = Math.round(geo.topTubeRealLen);

    const reachY = Math.max(bbPx.y, headPx.y) + 30;
    dimLineH(dimGroup, bbPx.x, headPx.x, reachY, i18n.t("dimReach", reachVal));
    const stackX = Math.min(bbPx.x, headPx.x) - 30;
    dimLineV(dimGroup, bbPx.y, headPx.y, stackX, i18n.t("dimStack", stackVal));
    const ettY = Math.min(ettPx.y, headPx.y) - 20;
    dimLineH(dimGroup, ettPx.x, headPx.x, ettY, i18n.t("dimEtt", ettVal));

    dimLineBetween(dimGroup, saddleCenterPx, barEndPx, i18n.t("dimSaddleToBar", Math.round(geo.saddleToBar)));
    dimLineBetween(dimGroup, bbPx, seatTopPx, i18n.t("dimSeatTube", seatTubeVal), 60, { x: -1, y: 0 });
    dimLineBetween(dimGroup, headPx, seatTopPx, i18n.t("dimTopTubeReal", topTubeRealVal), 22);

    const spacerVal = Math.round(Math.hypot(geo.steererTop.x - geo.headTop.x, geo.steererTop.y - geo.headTop.y));
    if (spacerVal > 0) {
      g.appendChild(label(steererTopPx.x + 8, steererTopPx.y, i18n.t("labelSpacers"), "start"));
      dimLineBetween(dimGroup, headPx, steererTopPx, i18n.t("dimSpacers", spacerVal), 16);
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

function createSvgElement(tag, attrs = {}) {
  return el(tag, attrs);
}

window.SvgRender = {
  ghostColor,
  project,
  drawGrid,
  drawSilhouette,
  buildArrowDefs,
  drawNameTag,
  createSvgElement,
};
})();
