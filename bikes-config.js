// Auto-loaded bike presets. Only used to seed the app the very first time
// it runs (when nothing is saved in localStorage yet), or when the user
// clicks "Reset na výchozí kola" — after that, the app's own saved state
// takes over and this file is ignored until a reset.
//
// Each entry: { name, values } where `values` matches the app's field
// schema (reach, stack, ett, seatTube, chainstay, bbDrop, wheelDia,
// headAngle, headTubeLen, forkRake, stemLength, stemAngle, saddleHeight,
// saddleSetback). A field is simply omitted below wherever its source
// geometry chart didn't state it (never a guessed number) — the app then
// falls back to its own default for that field.
//
// Extracted from the geometry charts in frame/, always using the largest
// frame size on each chart — both XL and XXL when a chart offers both.
window.BIKE_PRESETS = [
  {
    // Source: Horské kolo cube Reaction.jpg — size XL (of S/M/L/XL/XXL)
    // "BB-Height to Hub" row read as BB drop. No fork rake/offset or stem length on chart.
    name: "Cube Reaction (XL, 29\")",
    values: { reach: 440.7, stack: 656, ett: 635, seatTube: 515, chainstay: 450, bbDrop: 65, wheelDia: 737, headAngle: 68.5, headTubeLen: 141.8 },
  },
  {
    // Source: Horské kolo cube Reaction.jpg — size XXL (largest of S/M/L/XL/XXL)
    name: "Cube Reaction (XXL, 29\")",
    values: { reach: 456.6, stack: 669.9, ett: 655, seatTube: 560, chainstay: 450, bbDrop: 65, wheelDia: 737, headAngle: 68.5, headTubeLen: 156.8 },
  },
  {
    // Source: KTM MYROON COMP.png — size XL (largest; chart has no XXL)
    // BB drop given directly. No wheel-size row, no fork offset, no stem length.
    name: "KTM Myroon Comp (XL)",
    values: { reach: 477, stack: 622, ett: 650, seatTube: 530, chainstay: 430, bbDrop: 70, headAngle: 69.5, headTubeLen: 120 },
  },
  {
    // Source: LAPIERRE PRORACE CF 5.9 2023.webp — size XL (largest; chart has no XXL)
    // BB row shown signed "-62", used as bbDrop. Fork offset given directly.
    name: "Lapierre Prorace CF (XL)",
    values: { reach: 480, stack: 616, ett: 657, seatTube: 510, chainstay: 420, bbDrop: 62, headAngle: 68, headTubeLen: 110, forkRake: 44 },
  },
  {
    // Source: merida.png — size XL (of S/M/L/XL/XXL). Tire size "29\"" stated on chart.
    // Chart gives fork length (506mm), not rake/offset, so forkRake left at app default.
    name: "Merida (XL, 29\")",
    values: { reach: 492, stack: 624, ett: 655, seatTube: 470, chainstay: 439, bbDrop: 65, wheelDia: 737, headAngle: 68, headTubeLen: 115 },
  },
  {
    // Source: merida.png — size XXL (largest of S/M/L/XL/XXL)
    name: "Merida (XXL, 29\")",
    values: { reach: 512, stack: 634, ett: 678, seatTube: 500, chainstay: 442, bbDrop: 65, wheelDia: 737, headAngle: 68, headTubeLen: 125 },
  },
  {
    // Source: Specialized RockHopper Expert-RockHopper2014-Geomerty.jpg — size 23.0 (largest;
    // chart uses numeric sizes only, no separate XL/XXL labels, so just one entry).
    // BB drop and stem length (90mm) both given directly. No wheel-size row (this 2014 model
    // spanned multiple wheel sizes, not stated here); no fork rake/offset.
    name: "Specialized Rockhopper Expert 2014 (23.0)",
    values: { reach: 464, stack: 672, ett: 670, seatTube: 584, chainstay: 442, bbDrop: 63.5, headAngle: 71, headTubeLen: 150, stemLength: 90 },
  },
  {
    // Source: Specialized Rockhopper Expert 1X-rockhopper_expert_1x_geo.PNG — size XL (of XS..XXL)
    // BB drop and fork rake/offset given directly (constant across sizes). No wheel-size/stem-length row.
    name: "Specialized Rockhopper Expert 1X (XL)",
    values: { reach: 462, stack: 633, ett: 648, seatTube: 520, chainstay: 440, bbDrop: 57.5, headAngle: 69.8, headTubeLen: 125, forkRake: 51 },
  },
  {
    // Source: Specialized Rockhopper Expert 1X-rockhopper_expert_1x_geo.PNG — size XXL (largest)
    name: "Specialized Rockhopper Expert 1X (XXL)",
    values: { reach: 474, stack: 633, ett: 660, seatTube: 560, chainstay: 440, bbDrop: 57.5, headAngle: 69.8, headTubeLen: 125, forkRake: 51 },
  },
  {
    // Source: Specialized Rockhopper Expert 29-eng_specialized_size_Rockhopper-Expert29.pdf — size XL (of S..XXL)
    // Complete dataset — model name states "29", every field read directly, nothing defaulted.
    name: "Specialized Rockhopper Expert 29 (XL)",
    values: { reach: 465, stack: 640, ett: 654, seatTube: 500, chainstay: 440, bbDrop: 62, wheelDia: 737, headAngle: 68.5, headTubeLen: 120, forkRake: 48, stemLength: 70 },
  },
  {
    // Source: Specialized Rockhopper Expert 29-eng_specialized_size_Rockhopper-Expert29.pdf — size XXL (largest)
    name: "Specialized Rockhopper Expert 29 (XXL)",
    values: { reach: 485, stack: 654, ett: 679, seatTube: 580, chainstay: 440, bbDrop: 62, wheelDia: 737, headAngle: 68.5, headTubeLen: 135, forkRake: 48, stemLength: 70 },
  },
  {
    // Source: SUPERIOR XP 9.1 a 9.2.png — size 21"/XL (largest; chart has no XXL)
    // BB drop and stem length (80mm) given directly. No wheel-size row, no fork rake/offset.
    name: "Superior XP 9.1/9.2 (XL, 21\")",
    values: { reach: 495, stack: 622, ett: 645, seatTube: 533, chainstay: 430, bbDrop: 57, headAngle: 66.5, headTubeLen: 115, stemLength: 80 },
  },
  {
    // Source: SUPERIOR XP 969 Matte Black.png — size 21.0"/XL (largest; chart has no XXL)
    // Wheel-size row explicit "29". BB drop given directly. No fork rake/offset or stem length.
    name: "Superior XP 969 Matte Black (XL, 21.0\")",
    values: { reach: 477, stack: 620, ett: 655, seatTube: 533, chainstay: 432, bbDrop: 55, wheelDia: 737, headAngle: 69, headTubeLen: 120 },
  },
  {
    // Source: SCOTT Scale 50.png — size XL (of XS..XXL)
    // "BB Offset" row (-60mm) read as BB drop. Stem length given directly (80mm). No wheel-size
    // row despite clearly being a 29er by convention, so left at app default rather than assumed.
    name: "Scott Scale 50 (XL)",
    values: { reach: 492.9, stack: 623.8, ett: 655, seatTube: 530, chainstay: 425, bbDrop: 60, headAngle: 67.4, headTubeLen: 120, stemLength: 80 },
  },
  {
    // Source: SCOTT Scale 50.png — size XXL (largest). Stack is identical to L/XL on this chart
    // (623.8mm) — read directly from the table, not a transcription error.
    name: "Scott Scale 50 (XXL)",
    values: { reach: 512.9, stack: 623.8, ett: 675, seatTube: 580, chainstay: 425, bbDrop: 60, headAngle: 67.4, headTubeLen: 120, stemLength: 80 },
  },
  {
    // Source: trek-Procaliber-xl.png — size XL (largest; chart spans S/M/ML/L/XL, no XXL). Wheel size "29\"" on chart.
    // bbDrop taken from the chart's direct wheel-axle-line-to-BB row (64mm) — a real BB-drop
    // measurement, not derived from BB height. Fork offset row = 43mm.
    name: "Trek Procaliber (XL)",
    values: { reach: 500, stack: 642, ett: 677, seatTube: 510, chainstay: 440, bbDrop: 64, wheelDia: 737, headAngle: 67, headTubeLen: 120, forkRake: 43 },
  },
  {
    // Source: trek-Marlin-xxl.png — size XL (of M/ML/L/XL/XXL, second-largest). Wheel size "29\"" on chart.
    // Same direct BB-drop row as Procaliber (60mm, constant across sizes). Fork offset row = 46mm.
    name: "Trek Marlin (XL)",
    values: { reach: 495, stack: 637, ett: 678, seatTube: 500, chainstay: 438, bbDrop: 60, wheelDia: 737, headAngle: 66.5, headTubeLen: 135, forkRake: 46 },
  },
  {
    // Source: trek-Marlin-xxl.png — size XXL (largest of M/ML/L/XL/XXL)
    name: "Trek Marlin (XXL)",
    values: { reach: 520, stack: 651, ett: 707, seatTube: 540, chainstay: 438, bbDrop: 60, wheelDia: 737, headAngle: 66.5, headTubeLen: 150, forkRake: 46 },
  },
];
