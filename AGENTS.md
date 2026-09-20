# AGENTS.md

Static, no-build web app for comparing bicycle frame geometries. Vanilla
HTML/CSS/JS only — no bundler, no framework, no package.json. Open
`index.html` directly (works from `file://`) or serve the directory with
any static file server.

## Structure

- `index.html` — page shell; loads scripts in dependency order:
  `i18n.js` → `bikes-config.js` → `geometry.js` → `svg-render.js` → `script.js`.
- `i18n.js` — minimal i18n (CS/EN, auto-detected from the browser). All
  user-facing strings go through `data-i18n` attributes / `I18N.t`, defined
  once per language in the `DICT` object.
- `geometry.js` — pure geometry math (`window.Geometry`): field defaults,
  normalization, and the trig that derives seat angle, wheelbase, fork
  length, etc. from reach/stack/ETT/seat tube. No DOM access — this is what
  `tests/geometry.test.mjs` exercises directly.
- `svg-render.js` — draws the frame/bike silhouette into the `<svg>`
  (`window.SvgRender`). No state, just rendering from computed geometry.
- `script.js` — app state, form wiring, bike list management, import/export,
  align-by-point logic. Glues `Geometry` + `SvgRender` + `I18N` together.
- `bikes-config.js` — static catalog of preset bikes (`window.BIKE_GROUPS`),
  grouped by type/size, shown in the "data files available" panel.
- `frame/` — reference geometry images/PDFs used as sources when adding new
  bikes to the catalog (not loaded by the app itself).
- `scripts/validate-bikes-config.mjs` — validates `bikes-config.js` against
  required/optional fields and numeric sanity ranges.
- `tests/geometry.test.mjs` — Node's built-in test runner against
  `geometry.js` (loaded via `vm`, no build step).

## Commands

```sh
node scripts/validate-bikes-config.mjs   # validate the bike catalog data
node --test tests/geometry.test.mjs      # run geometry unit tests
```

Both run in CI on every push to `main` (`.github/workflows/pages.yml`),
before deploying to GitHub Pages at `bike-frame-compare.xeres.cz` (see
`CNAME`).

## Conventions

- No build tooling — keep code runnable as plain `<script>` tags with no
  transpilation. Each module attaches itself to `window` (`Geometry`,
  `SvgRender`, `I18N`) rather than using ES modules, so it also works when
  opened via `file://`.
- Any new user-facing string needs an entry in **both** the `cs` and `en`
  blocks of `i18n.js`, keyed the same way, and referenced via `data-i18n`
  (or `I18N.t(...)` from JS).
- When adding a bike to `bikes-config.js`, run the validator — it checks
  required fields (`reach`, `stack`, `ett`, `seatTube`) and flags
  out-of-range values.
- Geometry changes belong in `geometry.js` and should stay framework/DOM
  free so they remain unit-testable; add/extend cases in
  `tests/geometry.test.mjs` alongside any change there.
- Commit without any AI/agent signature or co-authorship line — plain
  commit messages only.
