#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import process from "node:process";

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, "bikes-config.js");

const REQUIRED_FIELDS = ["reach", "stack", "ett", "seatTube"];
const OPTIONAL_FIELDS = [
  "chainstay",
  "bbDrop",
  "wheelDia",
  "headAngle",
  "headTubeLen",
  "forkRake",
  "spacerHeight",
  "stemLength",
  "saddleHeight",
  "saddleSetback",
];

const ALL_KNOWN_FIELDS = new Set([...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]);

const NUMERIC_RANGES = {
  reach: [250, 700],
  stack: [400, 900],
  ett: [450, 900],
  seatTube: [300, 800],
  chainstay: [300, 600],
  bbDrop: [0, 120],
  wheelDia: [500, 850],
  headAngle: [55, 90],
  headTubeLen: [60, 300],
  forkRake: [0, 80],
  spacerHeight: [0, 120],
  stemLength: [20, 200],
  saddleHeight: [500, 1100],
  saddleSetback: [-150, 150],
};

function loadConfig(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: "bikes-config.js" });
  return context.window.BIKE_GROUPS;
}

function describeBike(groupLabel, bikeName, indexInGroup) {
  const safeGroup = groupLabel || "Unknown group";
  const safeName = bikeName || "(unnamed bike)";
  return `${safeGroup} / ${safeName} (#${indexInGroup + 1})`;
}

function validate() {
  const errors = [];
  const warnings = [];
  const missingOptionalCounter = Object.fromEntries(OPTIONAL_FIELDS.map((k) => [k, 0]));
  const duplicateNameCounter = new Map();
  const geometryCounter = new Map();

  let groups;
  try {
    groups = loadConfig(CONFIG_PATH);
  } catch (error) {
    errors.push(`Cannot load bikes-config.js: ${error.message}`);
    return { errors, warnings };
  }

  if (!Array.isArray(groups)) {
    errors.push("window.BIKE_GROUPS is not an array.");
    return { errors, warnings };
  }

  groups.forEach((group, groupIndex) => {
    const label = group && typeof group.label === "string" ? group.label : `Group ${groupIndex + 1}`;
    if (!group || !Array.isArray(group.bikes)) {
      errors.push(`${label}: missing "bikes" array.`);
      return;
    }

    group.bikes.forEach((bike, bikeIndex) => {
      const ref = describeBike(label, bike && bike.name, bikeIndex);
      if (!bike || typeof bike !== "object") {
        errors.push(`${ref}: bike record is not an object.`);
        return;
      }

      const values = bike.values;
      if (!values || typeof values !== "object") {
        errors.push(`${ref}: missing "values" object.`);
        return;
      }

      const bikeName = typeof bike.name === "string" ? bike.name.trim() : "";
      if (!bikeName) {
        warnings.push(`${ref}: missing/empty bike name.`);
      } else {
        duplicateNameCounter.set(bikeName, (duplicateNameCounter.get(bikeName) || 0) + 1);
      }

      if (typeof bike.brand !== "string" || !bike.brand.trim()) {
        warnings.push(`${ref}: missing/empty brand.`);
      }

      REQUIRED_FIELDS.forEach((key) => {
        if (!(key in values)) {
          errors.push(`${ref}: missing required field "${key}".`);
          return;
        }
        const value = Number(values[key]);
        if (!Number.isFinite(value)) {
          errors.push(`${ref}: "${key}" is not a finite number.`);
          return;
        }
        const [min, max] = NUMERIC_RANGES[key];
        if (value < min || value > max) {
          errors.push(`${ref}: "${key}"=${value} is out of expected range ${min}..${max}.`);
        }
      });

      OPTIONAL_FIELDS.forEach((key) => {
        if (!(key in values)) {
          missingOptionalCounter[key] += 1;
          return;
        }
        const value = Number(values[key]);
        if (!Number.isFinite(value)) {
          errors.push(`${ref}: optional "${key}" is not a finite number.`);
          return;
        }
        const [min, max] = NUMERIC_RANGES[key];
        if (value < min || value > max) {
          warnings.push(`${ref}: optional "${key}"=${value} is out of expected range ${min}..${max}.`);
        }
      });

      for (const key of Object.keys(values)) {
        if (!ALL_KNOWN_FIELDS.has(key)) {
          warnings.push(`${ref}: unknown field "${key}" in values.`);
        }
      }

      if (typeof bike.typ === "string" && bike.typ.trim()) {
        const typ = bike.typ.trim().toLowerCase();
        if (!["mtb", "silnice", "road", "gravel", "cx"].includes(typ)) {
          warnings.push(`${ref}: uncommon typ "${bike.typ}".`);
        }
      }

      const geomKey = JSON.stringify(
        Object.keys(values)
          .sort()
          .reduce((acc, key) => {
            acc[key] = values[key];
            return acc;
          }, {})
      );
      const names = geometryCounter.get(geomKey) || [];
      names.push(ref);
      geometryCounter.set(geomKey, names);
    });
  });

  for (const [name, count] of duplicateNameCounter.entries()) {
    if (count > 1) {
      errors.push(`Duplicate bike name "${name}" appears ${count}x.`);
    }
  }

  for (const refs of geometryCounter.values()) {
    if (refs.length > 1) {
      warnings.push(`Identical geometry shared by ${refs.length} bikes: ${refs.join(" | ")}`);
    }
  }

  const missingOptionalSummary = OPTIONAL_FIELDS.map(
    (key) => `${key}: ${missingOptionalCounter[key]}`
  ).join(", ");
  warnings.push(`Missing optional fields summary -> ${missingOptionalSummary}`);

  return { errors, warnings };
}

const { errors, warnings } = validate();

if (warnings.length) {
  console.log("Warnings:");
  warnings.forEach((line) => console.log(`  - ${line}`));
}

if (errors.length) {
  console.error("Validation FAILED:");
  errors.forEach((line) => console.error(`  - ${line}`));
  process.exitCode = 1;
} else {
  console.log("Validation OK: bikes-config.js passed required-field and range checks.");
}
