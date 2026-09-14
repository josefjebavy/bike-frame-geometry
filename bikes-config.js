// Auto-loaded bike presets. Only used to seed the app the very first time
// it runs (when nothing is saved in localStorage yet) — after that, the
// app's own saved state takes over and this file is ignored.
//
// Each entry: { name, values } where `values` matches the app's field
// schema (reach, stack, ett, seatTube, chainstay, bbDrop, wheelDia,
// headAngle, headTubeLen, forkRake, stemLength, stemAngle, saddleHeight,
// saddleSetback). Missing fields fall back to the app's own defaults —
// a field is simply omitted below wherever its source geometry chart
// didn't state it (never a guessed number). See notes per bike for what
// was and wasn't on the chart, and which frame size was picked when a
// chart listed several.
//
// Extracted from the geometry charts in frame/.
window.BIKE_PRESETS = [
  {
    // Source: Horské kolo cube Reaction.jpg — size L (middle of S/M/L/XL/XXL)
    // Chart's "BB-Height to Hub" (65mm) read as BB drop. No fork rake on chart.
    name: "Cube Reaction (L, 29\")",
    values: { reach: 426.2, stack: 637.4, ett: 615, seatTube: 470, chainstay: 450, bbDrop: 65, wheelDia: 737, headAngle: 68.5, headTubeLen: 121.8 },
  },
  {
    // Source: KTM MYROON COMP.png — size M (middle of S/M/L/XL)
    // No wheel-size row on chart (left at app default); no fork offset on chart.
    name: "KTM Myroon Comp (M)",
    values: { reach: 443, stack: 604, ett: 610, seatTube: 430, chainstay: 430, bbDrop: 70, headAngle: 69.5, headTubeLen: 100 },
  },
  {
    // Source: LAPIERRE PRORACE CF 5.9 2023.webp — size M (middle of S/M/L/XL)
    // No wheel-size row on chart (left at app default). BB row was signed "-62", used as bbDrop.
    name: "Lapierre Prorace CF (M)",
    values: { reach: 435, stack: 597, ett: 606, seatTube: 430, chainstay: 420, bbDrop: 62, headAngle: 68, headTubeLen: 90, forkRake: 44 },
  },
  {
    // Source: merida.png — size L (middle of S/M/L/XL/XXL). Tire size "29\"" stated on chart.
    // Chart gives fork length (506mm), not rake/offset, so forkRake left at app default.
    name: "Merida (L, 29\")",
    values: { reach: 472, stack: 615, ett: 633, seatTube: 440, chainstay: 436, bbDrop: 65, wheelDia: 737, headAngle: 68, headTubeLen: 105 },
  },
  {
    // Source: Specialized RockHopper Expert-RockHopper2014-Geomerty.jpg — size 19.0 (middle of 15.5/17.5/19.0/21.0/23.0)
    // No wheel-size row (2014 Rockhopper existed in multiple wheel sizes); no fork rake on chart.
    name: "Specialized Rockhopper Expert 2014 (19.0)",
    values: { reach: 430, stack: 639, ett: 625, seatTube: 483, chainstay: 442, bbDrop: 63.5, headAngle: 71, headTubeLen: 115 },
  },
  {
    // Source: Specialized Rockhopper Expert 1X-rockhopper_expert_1x_geo.PNG — size M (middle of XS/S/M/L/XL/XXL)
    // No explicit tire-size row on chart (left at app default) even though it's likely a 29er.
    name: "Specialized Rockhopper Expert 1X (M)",
    values: { reach: 418, stack: 605, ett: 594, seatTube: 430, chainstay: 440, bbDrop: 57.5, headAngle: 69.8, headTubeLen: 95, forkRake: 51 },
  },
  {
    // Source: Specialized Rockhopper Expert 29-eng_specialized_size_Rockhopper-Expert29.pdf — size L (middle of S/M/L/XL/XXL)
    // Complete dataset — every field read directly from the chart, nothing defaulted.
    name: "Specialized Rockhopper Expert 29 (L)",
    values: { reach: 445, stack: 626, ett: 630, seatTube: 450, chainstay: 440, bbDrop: 62, wheelDia: 737, headAngle: 68.5, headTubeLen: 105, forkRake: 48 },
  },
  {
    // Source: SUPERIOR XP 9.1 a 9.2.png — size 17.5" / M (middle of XS/S/M/L/XL)
    // No wheel-size row on chart (left at app default); no fork rake on chart.
    name: "Superior XP 9.1/9.2 (M, 17.5\")",
    values: { reach: 455, stack: 603, ett: 615, seatTube: 431, chainstay: 430, bbDrop: 57, headAngle: 66.5, headTubeLen: 95 },
  },
  {
    // Source: SUPERIOR XP 969 Matte Black.png — size 17.5" / M (middle of S/M/L/XL)
    // Wheel size row explicitly "29" on chart. No fork rake on chart.
    name: "Superior XP 969 Matte Black (M, 17.5\")",
    values: { reach: 428, stack: 602, ett: 620, seatTube: 431, chainstay: 432, bbDrop: 55, wheelDia: 737, headAngle: 69, headTubeLen: 100 },
  },
  {
    // Source: SCOTT Scale 50.png — size M (of XS/S/M/L/XL/XXL)
    // "BB Offset" row (-60mm) read as BB drop. Chart gives fork length (506mm),
    // not rake/offset, so forkRake left at app default. No wheel-size row, but
    // chart does give stem length (60mm) directly, so that's included.
    name: "Scott Scale 50 (M)",
    values: { reach: 442.8, stack: 605.3, ett: 600, seatTube: 440, chainstay: 425, bbDrop: 60, headAngle: 67.4, headTubeLen: 100, stemLength: 60 },
  },
  {
    // Source: trek-Procaliber-xl.png — size XL (named in the filename). Wheel size "29\"" on chart.
    // Chart had no BB-drop row, only BB height (309mm); bbDrop derived exactly as
    // wheel radius (737/2) - BB height = 59.5mm, not a guess. Fork offset row = 43mm.
    name: "Trek Procaliber (XL)",
    values: { reach: 500, stack: 642, ett: 677, seatTube: 510, chainstay: 440, bbDrop: 59.5, wheelDia: 737, headAngle: 67, headTubeLen: 120, forkRake: 43 },
  },
  {
    // Source: trek-Marlin-xxl.png — size XXL / 23" (named in the filename). Wheel size "29\"" on chart.
    // Same as above: chart gave BB height (308mm), bbDrop derived as 737/2 - 308 = 60.5mm.
    // Fork offset row = 46mm.
    name: "Trek Marlin (XXL)",
    values: { reach: 520, stack: 651, ett: 707, seatTube: 540, chainstay: 438, bbDrop: 60.5, wheelDia: 737, headAngle: 66.5, headTubeLen: 150, forkRake: 46 },
  },
];
