// Minimal i18n: language is auto-detected from the browser (cs/sk -> cs,
// everything else -> en) and can't be switched manually in the UI. Loaded
// before bikes-config.js/script.js so `I18N.t` is ready when they run.
(function () {
  const DICT = {
    cs: {
      subtitle: "Zadej klíčové rozměry a app vykreslí hlavní trojúhelník rámu i orientační siluetu celého kola. Můžeš mít zadaných víc kol najednou a porovnávat je přes sebe.",
      bikesHeading: "Kola",
      alignHintPrefix: "Kola jsou zarovnaná podle bodu:",
      alignHintSuffix: "klikni na kterýkoli z bodů na aktivním rámu (BB, hlavová trubka, vršek sedlovky, spodek hlavové trubky, řídítka), podle kterého se mají všechna kola srovnat.",
      alignReset: "Zpět na BB",
      addBike: "+ Přidat kolo",
      exportJson: "Export JSON",
      importJson: "Import JSON",
      resetBikes: "Vymazat všechna kola",
      dataFilesHeading: "Datové soubory k dispozici",
      introNote: "Appka po startu nemá žádné kolo načtené. Rozbal si kategorii výše a tlačítkem „+“ přidej jednotlivá kola, přidej prázdné ručně, nebo přes „Import JSON“ načti vlastní soubor. Aktivní kolo se kreslí plnou barvou a jde upravovat dole ve formuláři, ostatní kola se kreslí poloprůhledně na pozadí pro porovnání.",
      geoHeading: "Rozměry (aktivní kolo)",
      reachLabel: "Reach (mm)",
      stackLabel: "Stack (mm)",
      ettLabel: "Effective Top Tube (mm)",
      topTubeRealLabel: "Skutečná délka horní trubky (mm, dopočtená ze sklonu)",
      seatTubeLabel: "Délka sedlové trubky (mm, BB–horní hrana)",
      extraSummary: "Doplňkové rozměry (orientační silueta)",
      chainstayLabel: "Rozteč zadní stavby (mm)",
      bbDropLabel: "Pokles středu / BB drop (mm)",
      wheelDiaLabel: "Průměr kol (mm, 29″ ≈ 737 mm)",
      headAngleLabel: "Úhel hlavové trubky (°)",
      headTubeLenLabel: "Délka hlavové trubky (mm)",
      forkRakeLabel: "Offset (rake) vidlice (mm)",
      spacerHeightLabel: "Podložky pod představcem (mm, podél sloupku vidlice)",
      stemLengthLabel: "Délka představce (mm, vodorovný dosah)",
      stemHeightLabel: "Výška představce (mm, pevná hodnota)",
      saddleHeightLabel: "Výška sedla od středového složení (mm)",
      saddleApplyAllTitle: "Nastaví tuhle výšku sedla u všech kol v seznamu",
      saddleApplyAllText: "Pro všechny",
      saddleSetbackLabel: "Posun sedla dozadu (mm)",
      derivedHeading: "Odvozené hodnoty",
      outSeatAngleLabel: "Úhel sedlové trubky",
      outInfoLabel: "Reálná délka horní trubky (hlava–sedlovka, přímka)",
      outWheelbaseLabel: "Rozvor (wheelbase)",
      outForkLengthLabel: "Délka vidlice, osa–koruna (dopočtená)",
      outSaddleToBarLabel: "Sedlo–řídítka (přímá vzdálenost)",
      derivedNote: "Sedlová trubka je vedena z BB přes bod, kde ji ve výšce stacku protíná effective top tube; úhel sedlovky je z toho dopočítán, ne zadáván. Kola, vidlice, představec, řídítka a sedlo jsou orientační silueta z doplňkových rozměrů — nejsou odvozené z hlavních 4 hodnot. Délka vidlice se dopočítává tak, aby přední i zadní kolo (stejný průměr) stála na stejné zemní lince.",

      alignPoints: {
        bb: "BB",
        headTop: "Hlavová trubka",
        seatTop: "Vršek sedlovky",
        headBottom: "Spodek hlavové trubky",
        barEnd: "Řídítka",
      },
      alignTooltipActive: (label) => `Zarovnávací bod (${label})`,
      alignTooltipClick: (label) => `Zarovnat všechna kola podle: ${label}`,
      labelRearWheel: "Zadní kolo",
      labelFrontWheel: "Přední kolo",
      labelSaddle: "Sedlo",
      labelSpacers: "Podložky",

      dimReach: (v) => `Reach ${v} mm`,
      dimStack: (v) => `Stack ${v} mm`,
      dimEtt: (v) => `ETT ${v} mm`,
      dimSaddleToBar: (v) => `Sedlo–řídítka ${v} mm`,
      dimSeatTube: (v) => `Sedlová trubka ${v} mm`,
      dimTopTubeReal: (v) => `Horní trubka (skut.) ${v} mm`,
      dimSpacers: (v) => `Podložky ${v} mm`,

      bikeListEmpty: "Zatím žádné kolo — přidej nové nebo načti datový soubor (Import JSON).",
      renameTitle: "Přejmenovat",
      deleteTitle: "Smazat",
      renamePrompt: "Název kola",
      defaultBikeName: "Kolo",
      newBikeName: (n) => `Kolo ${n}`,
      confirmResetBikes: "Smazat všechna kola ze seznamu?",
      invalidJsonAlert: "Soubor se nepodařilo načíst jako platný JSON export kol.",
      importedBikeName: "Importované kolo",
      catalogEmptyGroup: "(žádná kola v této kategorii)",
      catalogAddTitle: (name) => `Přidat „${name}“`,
      catalogAddAllTitle: (label) => `Přidat všechna kola ze skupiny „${label}“`,
      catalogAddAllText: (count) => `+ Přidat vše (${count})`,
      catalogDefaultLabel: "Kola",
    },

    en: {
      subtitle: "Enter the key dimensions and the app draws the frame's main triangle plus an approximate silhouette of the whole bike. You can have several bikes at once and compare them overlaid.",
      bikesHeading: "Bikes",
      alignHintPrefix: "Bikes are aligned on the point:",
      alignHintSuffix: "click any of the points on the active frame (BB, head tube top, seat tube top, head tube bottom, handlebar) to align all bikes on it.",
      alignReset: "Back to BB",
      addBike: "+ Add bike",
      exportJson: "Export JSON",
      importJson: "Import JSON",
      resetBikes: "Clear all bikes",
      dataFilesHeading: "Available data files",
      introNote: "The app starts with no bike loaded. Expand a category above and use the “+” to add individual bikes, add a blank one manually, or use “Import JSON” to load your own file. The active bike is drawn in full color and can be edited in the form below; other bikes are drawn semi-transparent in the background for comparison.",
      geoHeading: "Dimensions (active bike)",
      reachLabel: "Reach (mm)",
      stackLabel: "Stack (mm)",
      ettLabel: "Effective Top Tube (mm)",
      topTubeRealLabel: "Actual top tube length (mm, derived from the slope)",
      seatTubeLabel: "Seat tube length (mm, BB–top edge)",
      extraSummary: "Additional dimensions (approximate silhouette)",
      chainstayLabel: "Chainstay length (mm)",
      bbDropLabel: "BB drop (mm)",
      wheelDiaLabel: "Wheel diameter (mm, 29″ ≈ 737 mm)",
      headAngleLabel: "Head tube angle (°)",
      headTubeLenLabel: "Head tube length (mm)",
      forkRakeLabel: "Fork offset (rake) (mm)",
      spacerHeightLabel: "Spacers under the stem (mm, along the steerer)",
      stemLengthLabel: "Stem length (mm, horizontal reach)",
      stemHeightLabel: "Stem height (mm, fixed value)",
      saddleHeightLabel: "Saddle height from BB (mm)",
      saddleApplyAllTitle: "Sets this saddle height for every bike in the list",
      saddleApplyAllText: "Apply to all",
      saddleSetbackLabel: "Saddle setback (mm)",
      derivedHeading: "Derived values",
      outSeatAngleLabel: "Seat tube angle",
      outInfoLabel: "Actual top tube length (head–seat, straight line)",
      outWheelbaseLabel: "Wheelbase",
      outForkLengthLabel: "Fork length, axle–crown (derived)",
      outSaddleToBarLabel: "Saddle–bar (straight-line distance)",
      derivedNote: "The seat tube runs from the BB through the point where the effective top tube (at stack height) crosses it; the seat angle is derived from that, not entered directly. The wheels, fork, stem, bars and saddle are an approximate silhouette built from the additional dimensions — they are not derived from the main 4 values. Fork length is computed so that the front and rear wheel (same diameter) sit on the same ground line.",

      alignPoints: {
        bb: "BB",
        headTop: "Head tube top",
        seatTop: "Seat tube top",
        headBottom: "Head tube bottom",
        barEnd: "Handlebar",
      },
      alignTooltipActive: (label) => `Alignment point (${label})`,
      alignTooltipClick: (label) => `Align all bikes by: ${label}`,
      labelRearWheel: "Rear wheel",
      labelFrontWheel: "Front wheel",
      labelSaddle: "Saddle",
      labelSpacers: "Spacers",

      dimReach: (v) => `Reach ${v} mm`,
      dimStack: (v) => `Stack ${v} mm`,
      dimEtt: (v) => `ETT ${v} mm`,
      dimSaddleToBar: (v) => `Saddle–bar ${v} mm`,
      dimSeatTube: (v) => `Seat tube ${v} mm`,
      dimTopTubeReal: (v) => `Top tube (actual) ${v} mm`,
      dimSpacers: (v) => `Spacers ${v} mm`,

      bikeListEmpty: "No bikes yet — add one or load a data file (Import JSON).",
      renameTitle: "Rename",
      deleteTitle: "Delete",
      renamePrompt: "Bike name",
      defaultBikeName: "Bike",
      newBikeName: (n) => `Bike ${n}`,
      confirmResetBikes: "Delete all bikes from the list?",
      invalidJsonAlert: "The file could not be loaded as a valid JSON bike export.",
      importedBikeName: "Imported bike",
      catalogEmptyGroup: "(no bikes in this category)",
      catalogAddTitle: (name) => `Add “${name}”`,
      catalogAddAllTitle: (label) => `Add all bikes from group “${label}”`,
      catalogAddAllText: (count) => `+ Add all (${count})`,
      catalogDefaultLabel: "Bikes",
    },
  };

  const LANG_STORAGE_KEY = "bike-frame-geometry:lang";

  function detectLang() {
    const candidates = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "en"];
    for (const raw of candidates) {
      const l = (raw || "").toLowerCase();
      if (l.startsWith("cs") || l.startsWith("sk")) return "cs";
    }
    return "en";
  }

  // A manual choice (saved via the CS/EN switcher) always wins over the
  // browser-detected language.
  function storedLang() {
    try {
      const v = localStorage.getItem(LANG_STORAGE_KEY);
      return v === "cs" || v === "en" ? v : null;
    } catch (e) {
      return null;
    }
  }

  const lang = storedLang() || detectLang();
  const dict = DICT[lang] || DICT.en;

  function t(key, ...args) {
    const entry = dict[key];
    if (entry === undefined) return key;
    return typeof entry === "function" ? entry(...args) : entry;
  }

  function applyStaticTranslations() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = t(node.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-title]").forEach((node) => {
      node.title = t(node.getAttribute("data-i18n-title"));
    });
  }

  // Switching language changes module-level state throughout script.js
  // (e.g. ALIGN_POINTS, built once at load), so a reload is the simplest way
  // to keep everything consistent instead of re-wiring the whole render path.
  function setupLangSwitch() {
    const buttons = document.querySelectorAll("#lang-switch .lang-btn");
    buttons.forEach((btn) => {
      const btnLang = btn.getAttribute("data-lang");
      btn.classList.toggle("active", btnLang === lang);
      btn.setAttribute("aria-pressed", String(btnLang === lang));
      btn.addEventListener("click", () => {
        if (btnLang === lang) return;
        try {
          localStorage.setItem(LANG_STORAGE_KEY, btnLang);
        } catch (e) {
          /* private mode / quota exceeded: switch for this load only */
        }
        location.reload();
      });
    });
  }

  applyStaticTranslations();
  setupLangSwitch();
  window.I18N = { lang, t };
})();
