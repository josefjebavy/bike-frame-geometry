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
          "headTubeLen": 141.8
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
          "headTubeLen": 120
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
          "headTubeLen": 115
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
          "headTubeLen": 120
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
          "headTubeLen": 145
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
          "headTubeLen": 156.8
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
          "headTubeLen": 125
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
          "forkRake": 46
        }
      },
      // Source: data2/mtb-DUR_11-03-017_torain_Jebavý.pdf — custom-fit frame
      // (Duratec "Frame with Optimized Geometry", mtb komfortní), rám pro 29"
      // kola. Diagram gives I=stack, A2=ett (the bracket at top-tube height;
      // A1=645 sits higher and isn't a standard frame dimension, skipped),
      // B2=seatTube, C1=chainstay, F=headTubeLen, alfa=headAngle, beta=seat
      // tube angle. Reach isn't given directly — derived from stack, ett and
      // beta via the same relation the app itself uses to fix the seat tube
      // direction (reach = ett - stack/tan(beta) = 614 - 684/tan(72.1°) ≈
      // 393.1). No BB drop or fork rake on this chart.
      {
        "brand": "Duratec",
        "velikost": "XXL",
        "typ": "mtb",
        "name": "Duratec Sonix CX4 (custom, 29\")",
        "values": {
          "reach": 393.1,
          "stack": 684,
          "ett": 614,
          "seatTube": 560,
          "chainstay": 450,
          "wheelDia": 737,
          "headAngle": 71.5,
          "headTubeLen": 175
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
          "headTubeLen": 188
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
          "headTubeLen": 206
        }
      },
      // Source: data2/sinickaDUR_17-10-004_COOL R14_Jebavý.pdf — custom-fit
      // frame (Duratec FOG, silniční komfortní). Unlike the mtb calc type,
      // this report has no separate lettered "Geometrie rámu" diagram, only
      // an unlabeled "Geometrie posedu" one — mapping confirmed with the
      // user by testing which ett/stack pair yields a physically plausible
      // reach: ett=621 (top horizontal bracket, at head-tube-top height),
      // stack=629 (inner vertical bracket at the head tube), seatTube=627,
      // headAngle=72.5°, headTubeLen=156, forkRake=45, bbDrop=71. Reach
      // derived the same way as the Sonix CX4 entry: 621 - 629/tan(72.0°
      // seat angle) ≈ 416.6. No chainstay on this diagram (no rear wheel
      // drawn); wheelDia assumed 700 (standard road, not stated).
      {
        "brand": "Duratec",
        "velikost": "XXL",
        "typ": "silnice",
        "name": "Duratec Cool R14 (custom, road)",
        "values": {
          "reach": 416.6,
          "stack": 629,
          "ett": 621,
          "seatTube": 627,
          "bbDrop": 71,
          "wheelDia": 700,
          "headAngle": 72.5,
          "headTubeLen": 156,
          "forkRake": 45
        }
      }
    ]
  }
];
