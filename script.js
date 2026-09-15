const I18N = window.I18N;
if (!I18N) {
  throw new Error("I18N is not loaded. Make sure i18n.js is included before script.js.");
}
const Geometry = window.Geometry;
if (!Geometry) {
  throw new Error("Geometry is not loaded. Make sure geometry.js is included before script.js.");
}
const SvgRender = window.SvgRender;
if (!SvgRender) {
  throw new Error("SvgRender is not loaded. Make sure svg-render.js is included before script.js.");
}

const {
  FIELD_KEYS,
  DEFAULTS,
  STEM_HEIGHT,
  normalizeValues,
  alignGeo,
  computeGeometry,
  bikeBoundPoints,
} = Geometry;
const {
  createSvgElement: el,
  buildArrowDefs,
  drawGrid,
  drawNameTag,
  drawSilhouette,
  ghostColor,
  project,
} = SvgRender;

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

const STORAGE_KEY = "bike-frame-geometry:bikes:v1";
const FORM_UPDATE_DEBOUNCE_MS = 120;
const inputs = Object.fromEntries(FIELD_KEYS.map((k) => [k, document.getElementById(k)]));

let bikes = [];
let activeId = null;
let pendingFormCommitTimer = null;
const ALIGN_POINTS = I18N.t("alignPoints");
let alignPoint = "bb";

stemHeightInput.value = STEM_HEIGHT;

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

// Preloaded on a genuinely first run (no saved state yet) — a small default
// comparison set pulled from the bikes-config.js catalog. Matched by exact
// catalog `name`; any that isn't found (e.g. catalog changed) is silently
// skipped rather than blocking startup.
const DEFAULT_BIKE_NAMES = [
  "Canyon Grand Canyon AL 7 (XL)",
  "Duratec Torain C1 (custom, 29\")",
  "Cube Reaction (XXL, 29\")",
];

// Returns [{ raw, bike }] — `raw` is the original bikes-config.js object
// (needed to mark its catalog row as already-added), `bike` the normalized
// record with a fresh id.
function defaultCatalogBikes() {
  const groups = Array.isArray(window.BIKE_GROUPS) ? window.BIKE_GROUPS : [];
  const all = groups.flatMap((g) => (Array.isArray(g.bikes) ? g.bikes : []));
  return DEFAULT_BIKE_NAMES.map((name) => all.find((b) => b && b.name === name))
    .filter(Boolean)
    .map((raw) => ({ raw, bike: normalizeBikeRecord({ ...raw }) }));
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

  // First run: preload a default comparison set from the catalog.
  const defaults = defaultCatalogBikes();
  bikes = defaults.map((d) => d.bike);
  activeId = bikes[0] ? bikes[0].id : null;
  defaults.forEach((d) => trackCatalogAdd(d.raw, [d.bike.id]));
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
  if (pendingFormCommitTimer) {
    clearTimeout(pendingFormCommitTimer);
    pendingFormCommitTimer = null;
  }
  saveState();
  render();
}

function scheduleFormCommit() {
  if (pendingFormCommitTimer) clearTimeout(pendingFormCommitTimer);
  pendingFormCommitTimer = setTimeout(() => {
    pendingFormCommitTimer = null;
    commit();
  }, FORM_UPDATE_DEBOUNCE_MS);
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
  scheduleFormCommit();
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
  drawSilhouette(svg, proj, activeEntry.geo, {
    ghost: false,
    alignPoint,
    alignPoints: ALIGN_POINTS,
    i18n: I18N,
    onAlignSelect: (nextAlignPoint) => {
      alignPoint = nextAlignPoint;
      commit();
    },
  });

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
