// Bike catalog, grouped by type/size, loaded via a plain <script> tag at
// startup so it works with the page opened directly (file://), no server
// or fetch() needed. Shown in the "Datove soubory k dispozici" panel, where
// each group expands to a per-bike "+" button to add just that one bike.
window.BIKE_GROUPS = [
  {
    "label": "MTB – XL",
    "bikes": [
      {
        "brand": "Cube",
        "velikost": "XL",
        "typ": "mtb",
        "name": "Cube Reaction (XL, 29\")",
        "values": {
          "reach": 440.7,
          "stack": 656,
          "ett": 635,
          "seatTube": 515,
          "chainstay": 450,
          "bbDrop": 65,
          "wheelDia": 737,
          "headAngle": 68.5,
          "headTubeLen": 141.8,
          "spacerHeight": 20
        }
      },
      {
        "brand": "KTM",
        "velikost": "XL",
        "typ": "mtb",
        "name": "KTM Myroon Comp (XL)",
        "values": {
          "reach": 477,
          "stack": 622,
          "ett": 650,
          "seatTube": 530,
          "chainstay": 430,
          "bbDrop": 70,
          "headAngle": 69.5,
          "headTubeLen": 120,
          "spacerHeight": 20
        }
      },
      {
        "brand": "Lapierre",
        "velikost": "XL",
        "typ": "mtb",
        "name": "Lapierre Prorace CF (XL)",
        "values": {
          "reach": 480,
          "stack": 616,
          "ett": 657,
          "seatTube": 510,
          "chainstay": 420,
          "bbDrop": 62,
          "headAngle": 68,
          "headTubeLen": 110,
          "spacerHeight": 20,
          "forkRake": 44
        }
      },
      {
        "brand": "Merida",
        "velikost": "XL",
        "typ": "mtb",
        "name": "Merida (XL, 29\")",
        "values": {
          "reach": 492,
          "stack": 624,
          "ett": 655,
          "seatTube": 470,
          "chainstay": 439,
          "bbDrop": 65,
          "wheelDia": 737,
          "headAngle": 68,
          "headTubeLen": 115,
          "spacerHeight": 20
        }
      },
      {
        "brand": "Specialized",
        "velikost": "XL",
        "typ": "mtb",
        "name": "Specialized Rockhopper Expert 2014 (23.0)",
        "values": {
          "reach": 464,
          "stack": 672,
          "ett": 670,
          "seatTube": 584,
          "chainstay": 442,
          "bbDrop": 63.5,
          "headAngle": 71,
          "headTubeLen": 150,
          "spacerHeight": 20,
          "stemLength": 90
        }
      },
      {
        "brand": "Specialized",
        "velikost": "XL",
        "typ": "mtb",
        "name": "Specialized Rockhopper Expert 1X (XL)",
        "values": {
          "reach": 462,
          "stack": 633,
          "ett": 648,
          "seatTube": 520,
          "chainstay": 440,
          "bbDrop": 57.5,
          "headAngle": 69.8,
          "headTubeLen": 125,
          "spacerHeight": 20,
          "forkRake": 51
        }
      },
      {
        "brand": "Specialized",
        "velikost": "XL",
        "typ": "mtb",
        "name": "Specialized Rockhopper Expert 29 (XL)",
        "values": {
          "reach": 465,
          "stack": 640,
          "ett": 654,
          "seatTube": 500,
          "chainstay": 440,
          "bbDrop": 62,
          "wheelDia": 737,
          "headAngle": 68.5,
          "headTubeLen": 120,
          "spacerHeight": 20,
          "forkRake": 48,
          "stemLength": 70
        }
      },
      {
        "brand": "Superior",
        "velikost": "XL",
        "typ": "mtb",
        "name": "Superior XP 9.1/9.2 (XL, 21\")",
        "values": {
          "reach": 495,
          "stack": 622,
          "ett": 645,
          "seatTube": 533,
          "chainstay": 430,
          "bbDrop": 57,
          "headAngle": 66.5,
          "headTubeLen": 115,
          "spacerHeight": 20,
          "stemLength": 80
        }
      },
      {
        "brand": "Superior",
        "velikost": "XL",
        "typ": "mtb",
        "name": "Superior XP 969 Matte Black (XL, 21.0\")",
        "values": {
          "reach": 477,
          "stack": 620,
          "ett": 655,
          "seatTube": 533,
          "chainstay": 432,
          "bbDrop": 55,
          "wheelDia": 737,
          "headAngle": 69,
          "headTubeLen": 120,
          "spacerHeight": 20
        }
      },
      {
        "brand": "Scott",
        "velikost": "XL",
        "typ": "mtb",
        "name": "Scott Scale 50 (XL)",
        "values": {
          "reach": 492.9,
          "stack": 623.8,
          "ett": 655,
          "seatTube": 530,
          "chainstay": 425,
          "bbDrop": 60,
          "headAngle": 67.4,
          "headTubeLen": 120,
          "spacerHeight": 20,
          "stemLength": 80
        }
      },
      {
        "brand": "Trek",
        "velikost": "XL",
        "typ": "mtb",
        "name": "Trek Procaliber (XL)",
        "values": {
          "reach": 500,
          "stack": 642,
          "ett": 677,
          "seatTube": 510,
          "chainstay": 440,
          "bbDrop": 64,
          "wheelDia": 737,
          "headAngle": 67,
          "headTubeLen": 120,
          "spacerHeight": 20,
          "forkRake": 43
        }
      },
      {
        "brand": "Trek",
        "velikost": "XL",
        "typ": "mtb",
        "name": "Trek Marlin (XL)",
        "values": {
          "reach": 495,
          "stack": 637,
          "ett": 678,
          "seatTube": 500,
          "chainstay": 438,
          "bbDrop": 60,
          "wheelDia": 737,
          "headAngle": 66.5,
          "headTubeLen": 135,
          "spacerHeight": 20,
          "forkRake": 46
        }
      },
      {
        "brand": "Canyon",
        "velikost": "XL",
        "typ": "mtb",
        "name": "Canyon Grand Canyon AL 7 (XL)",
        "values": {
          "reach": 490,
          "stack": 658,
          "ett": 666,
          "seatTube": 500,
          "chainstay": 435,
          "bbDrop": 65,
          "headAngle": 66,
          "headTubeLen": 145,
          "spacerHeight": 20
        }
      },
      {
        "brand": "Lapierre",
        "velikost": "XL",
        "typ": "mtb",
        "name": "Lapierre Prorace 4.9 (XL)",
        "values": {
          "reach": 480,
          "stack": 616,
          "ett": 657,
          "seatTube": 510,
          "chainstay": 425,
          "bbDrop": 62,
          "headAngle": 68,
          "headTubeLen": 110,
          "spacerHeight": 20
        }
      },
      // Source: frame/new/Rock Machine Blizz 50 ... .webp — manufacturer's own
      // table lists "úhel sedlové trubky" (seat tube angle) = 67° and "úhel
      // hlavové trubky" (head tube angle) = 74°. Those two are almost
      // certainly swapped in the source table (74° head angle / 67° seat
      // angle would be reversed of every other hardtail here) — using
      // headAngle=67 to match typical geometry.
      {
        "brand": "Rock Machine",
        "velikost": "XL",
        "typ": "mtb",
        "name": "Rock Machine Blizz 50 (XL, 29\")",
        "values": {
          "reach": 483,
          "stack": 652,
          "ett": 670,
          "seatTube": 533,
          "chainstay": 443,
          "bbDrop": 53,
          "wheelDia": 737,
          "headAngle": 67,
          "headTubeLen": 140,
          "spacerHeight": 20,
          "stemLength": 45
        }
      },
      {
        "brand": "Pells",
        "velikost": "XL",
        "typ": "mtb",
        "name": "Pells Duke Elite 9 (XL, 29\")",
        "values": {
          "reach": 475,
          "stack": 625,
          "ett": 655,
          "seatTube": 530,
          "chainstay": 425,
          "bbDrop": 51,
          "wheelDia": 737,
          "headAngle": 69.5,
          "headTubeLen": 125,
          "spacerHeight": 20
        }
      },
      {
        "brand": "Pells",
        "velikost": "XL",
        "typ": "mtb",
        "name": "Pells Duke 2 (XL, 29\")",
        "values": {
          "reach": 481,
          "stack": 631,
          "ett": 651,
          "seatTube": 520,
          "chainstay": 430,
          "bbDrop": 60,
          "wheelDia": 737,
          "headAngle": 69,
          "headTubeLen": 125,
          "spacerHeight": 20
        }
      }
    ]
  },
  {
    "label": "MTB – XXL",
    "bikes": [
      {
        "brand": "Cube",
        "velikost": "XXL",
        "typ": "mtb",
        "name": "Cube Reaction (XXL, 29\")",
        "values": {
          "reach": 456.6,
          "stack": 669.9,
          "ett": 655,
          "seatTube": 560,
          "chainstay": 450,
          "bbDrop": 65,
          "wheelDia": 737,
          "headAngle": 68.5,
          "headTubeLen": 156.8,
          "spacerHeight": 20
        }
      },
      {
        "brand": "Merida",
        "velikost": "XXL",
        "typ": "mtb",
        "name": "Merida (XXL, 29\")",
        "values": {
          "reach": 512,
          "stack": 634,
          "ett": 678,
          "seatTube": 500,
          "chainstay": 442,
          "bbDrop": 65,
          "wheelDia": 737,
          "headAngle": 68,
          "headTubeLen": 125,
          "spacerHeight": 20
        }
      },
      {
        "brand": "Specialized",
        "velikost": "XXL",
        "typ": "mtb",
        "name": "Specialized Rockhopper Expert 1X (XXL)",
        "values": {
          "reach": 474,
          "stack": 633,
          "ett": 660,
          "seatTube": 560,
          "chainstay": 440,
          "bbDrop": 57.5,
          "headAngle": 69.8,
          "headTubeLen": 125,
          "spacerHeight": 20,
          "forkRake": 51
        }
      },
      {
        "brand": "Specialized",
        "velikost": "XXL",
        "typ": "mtb",
        "name": "Specialized Rockhopper Expert 29 (XXL)",
        "values": {
          "reach": 485,
          "stack": 654,
          "ett": 679,
          "seatTube": 580,
          "chainstay": 440,
          "bbDrop": 62,
          "wheelDia": 737,
          "headAngle": 68.5,
          "headTubeLen": 135,
          "spacerHeight": 20,
          "forkRake": 48,
          "stemLength": 70
        }
      },
      {
        "brand": "Scott",
        "velikost": "XXL",
        "typ": "mtb",
        "name": "Scott Scale 50 (XXL)",
        "values": {
          "reach": 512.9,
          "stack": 623.8,
          "ett": 675,
          "seatTube": 580,
          "chainstay": 425,
          "bbDrop": 60,
          "headAngle": 67.4,
          "headTubeLen": 120,
          "spacerHeight": 20,
          "stemLength": 80
        }
      },
      {
        "brand": "Trek",
        "velikost": "XXL",
        "typ": "mtb",
        "name": "Trek Marlin (XXL)",
        "values": {
          "reach": 520,
          "stack": 651,
          "ett": 707,
          "seatTube": 540,
          "chainstay": 438,
          "bbDrop": 60,
          "wheelDia": 737,
          "headAngle": 66.5,
          "headTubeLen": 150,
          "spacerHeight": 20,
          "forkRake": 46
        }
      },
      // Source: data2/mtb-DUR_11-03-017_torain_Jebavý.pdf — custom-fit frame
      // (Duratec "Frame with Optimized Geometry", mtb komfortní), rám pro 29"
      // kola. Diagram gives I=stack, A1=ett (the higher horizontal bracket,
      // at head-tube-top height), A2=614 (the real/sloped top-tube length,
      // confirmed by the user against this app's computed value — see
      // below), B2=seatTube, C1=chainstay, F=headTubeLen, alfa=headAngle,
      // beta=seat tube angle. No BB drop or fork rake on this chart.
      //
      // Reach: derived from A1/I/beta (reach = ett - stack/tan(beta) =
      // 645 - 684/tan(72.1°) ≈ 424), which reproduces A2=614 as this app's
      // computed real top-tube length (headTop-to-seatTop distance) to
      // within ~1mm rounding. A prior session had instead computed reach
      // from the PDF's separate "Geometrie posedu" (fit) chart — stem
      // length (130mm) + frame reach = 531mm horizontal, so reach = 401 —
      // but that subtracted the full 130mm stem as if horizontal, when the
      // diagram shows the stem at ~84° from the head tube itself (not from
      // horizontal). That reach (401) was wrong; 424 is the value
      // consistent with the frame diagram itself.
      // saddleHeight=840 is still that same posedu chart's direct
      // BB-to-saddle reading (not affected by the stem-angle mistake).
      // stemLength=130 is that same stem's length, close enough to its
      // horizontal reach (~127mm at 84° off the head tube) for this
      // app's model, where the stem's vertical rise is now the fixed
      // STEM_HEIGHT constant (script.js) rather than a per-bike angle.
      //
      // spacerHeight=40: set directly by the user (overriding the app-wide
      // 20mm default and an earlier 50.9mm derived from a saddle/bar-height
      // constraint — stack + spacerHeight(vertical) + STEM_HEIGHT + 27 =
      // saddle's true vertical height above BB).
      {
        "brand": "Duratec",
        "velikost": "XXL",
        "typ": "mtb",
        "name": "Duratec Torain C1 (custom, 29\")",
        "values": {
          "reach": 424,
          "stack": 684,
          "ett": 645,
          "seatTube": 560,
          "chainstay": 450,
          "wheelDia": 737,
          "headAngle": 71.5,
          "headTubeLen": 175,
          "spacerHeight": 40,
          "saddleHeight": 840,
          "stemLength": 130
        }
      }
    ]
  },
  {
    "label": "Silniční – XL",
    "bikes": [
      {
        "brand": "Canyon",
        "velikost": "XL",
        "typ": "silnice",
        "name": "Canyon Ultimate CF 7 (XL)",
        "values": {
          "reach": 419,
          "stack": 606,
          "ett": 594,
          "seatTube": 570,
          "chainstay": 415,
          "bbDrop": 73,
          "wheelDia": 700,
          "headAngle": 73.5,
          "headTubeLen": 188,
          "spacerHeight": 20
        }
      }
    ]
  },
  {
    "label": "Silniční – XXL",
    "bikes": [
      {
        "brand": "Canyon",
        "velikost": "XXL",
        "typ": "silnice",
        "name": "Canyon Ultimate CF 7 (XXL)",
        "values": {
          "reach": 429,
          "stack": 624,
          "ett": 610,
          "seatTube": 600,
          "chainstay": 415,
          "bbDrop": 73,
          "wheelDia": 700,
          "headAngle": 73.8,
          "headTubeLen": 206,
          "spacerHeight": 20
        }
      },
      // Source: data2/sinickaDUR_17-10-004_COOL R14_Jebavý.pdf — custom-fit
      // frame (Duratec FOG, silniční komfortní). Unlike the mtb calc type,
      // this report has no separate lettered "Geometrie rámu" diagram, only
      // an unlabeled "Geometrie posedu" one. reach=416 and ett=621 confirmed
      // directly by the user (not derived). stack=629, seatTube=627,
      // headAngle=72.5°, headTubeLen=156, forkRake=45, bbDrop=71 from the
      // earlier best-effort chart reading. No chainstay on this diagram (no
      // rear wheel drawn); wheelDia assumed 700 (standard road, not stated).
      {
        "brand": "Duratec",
        "velikost": "XXL",
        "typ": "silnice",
        "name": "Duratec Rebel S8 (custom, road/cyklokros)",
        "values": {
          "reach": 416,
          "stack": 629,
          "ett": 621,
          "seatTube": 627,
          "bbDrop": 71,
          "wheelDia": 700,
          "headAngle": 72.5,
          "headTubeLen": 156,
          "spacerHeight": 20,
          "forkRake": 45
        }
      }
    ]
  }
];
