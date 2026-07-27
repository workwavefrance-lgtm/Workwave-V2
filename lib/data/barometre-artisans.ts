// Baromètre densité d'entreprises artisanales par département.
// Généré le 2026-07-27 par scripts/build-barometre.ts — NE PAS éditer à la main.
// Pros = notre base (source SIRENE). Population = INSEE population municipale 2021 (data.gouv).
// Densité = entreprises référencées / population * 10 000. 0 invention.

export type BarometreDept = {
  rank: number; code: string; name: string; region: string;
  pros: number; population: number; superficie: number; densite: number;
};

export const BAROMETRE_ARTISANS: BarometreDept[] = [
  {
    "code": "05",
    "name": "Hautes-Alpes",
    "region": "Provence-Alpes-Côte d'Azur",
    "pros": 10365,
    "population": 140976,
    "superficie": 5548.68,
    "densite": 735.2,
    "rank": 1
  },
  {
    "code": "04",
    "name": "Alpes-de-Haute-Provence",
    "region": "Provence-Alpes-Côte d'Azur",
    "pros": 11498,
    "population": 166077,
    "superficie": 6925.22,
    "densite": 692.3,
    "rank": 2
  },
  {
    "code": "09",
    "name": "Ariège",
    "region": "Occitanie",
    "pros": 10276,
    "population": 154596,
    "superficie": 4889.92,
    "densite": 664.7,
    "rank": 3
  },
  {
    "code": "46",
    "name": "Lot",
    "region": "Occitanie",
    "pros": 11258,
    "population": 174942,
    "superficie": 5216.53,
    "densite": 643.5,
    "rank": 4
  },
  {
    "code": "65",
    "name": "Hautes-Pyrénées",
    "region": "Occitanie",
    "pros": 14473,
    "population": 230956,
    "superficie": 4464.04,
    "densite": 626.7,
    "rank": 5
  },
  {
    "code": "2A",
    "name": "Corse-du-Sud",
    "region": "Corse",
    "pros": 10097,
    "population": 162942,
    "superficie": 4014.22,
    "densite": 619.7,
    "rank": 6
  },
  {
    "code": "23",
    "name": "Creuse",
    "region": "Nouvelle-Aquitaine",
    "pros": 7096,
    "population": 115702,
    "superficie": 5565.38,
    "densite": 613.3,
    "rank": 7
  },
  {
    "code": "32",
    "name": "Gers",
    "region": "Occitanie",
    "pros": 11729,
    "population": 192437,
    "superficie": 6256.82,
    "densite": 609.5,
    "rank": 8
  },
  {
    "code": "19",
    "name": "Corrèze",
    "region": "Nouvelle-Aquitaine",
    "pros": 14376,
    "population": 239784,
    "superficie": 5856.83,
    "densite": 599.5,
    "rank": 9
  },
  {
    "code": "82",
    "name": "Tarn-et-Garonne",
    "region": "Occitanie",
    "pros": 14844,
    "population": 263377,
    "superficie": 3718.28,
    "densite": 563.6,
    "rank": 10
  },
  {
    "code": "47",
    "name": "Lot-et-Garonne",
    "region": "Nouvelle-Aquitaine",
    "pros": 17918,
    "population": 331229,
    "superficie": 5360.91,
    "densite": 541,
    "rank": 11
  },
  {
    "code": "43",
    "name": "Haute-Loire",
    "region": "Auvergne-Rhône-Alpes",
    "pros": 12060,
    "population": 227284,
    "superficie": 4977.14,
    "densite": 530.6,
    "rank": 12
  },
  {
    "code": "48",
    "name": "Lozère",
    "region": "Occitanie",
    "pros": 4059,
    "population": 76519,
    "superficie": 5166.88,
    "densite": 530.5,
    "rank": 13
  },
  {
    "code": "2B",
    "name": "Haute-Corse",
    "region": "Corse",
    "pros": 9632,
    "population": 184655,
    "superficie": 4665.57,
    "densite": 521.6,
    "rank": 14
  },
  {
    "code": "12",
    "name": "Aveyron",
    "region": "Occitanie",
    "pros": 14294,
    "population": 279649,
    "superficie": 8735.12,
    "densite": 511.1,
    "rank": 15
  },
  {
    "code": "40",
    "name": "Landes",
    "region": "Nouvelle-Aquitaine",
    "pros": 21586,
    "population": 422976,
    "superficie": 9242.6,
    "densite": 510.3,
    "rank": 16
  },
  {
    "code": "15",
    "name": "Cantal",
    "region": "Auvergne-Rhône-Alpes",
    "pros": 7326,
    "population": 144226,
    "superficie": 5725.98,
    "densite": 508,
    "rank": 17
  },
  {
    "code": "24",
    "name": "Dordogne",
    "region": "Nouvelle-Aquitaine",
    "pros": 20837,
    "population": 413730,
    "superficie": 9060.01,
    "densite": 503.6,
    "rank": 18
  },
  {
    "code": "58",
    "name": "Nièvre",
    "region": "Bourgogne-Franche-Comté",
    "pros": 9970,
    "population": 202417,
    "superficie": 6816.71,
    "densite": 492.5,
    "rank": 19
  },
  {
    "code": "73",
    "name": "Savoie",
    "region": "Auvergne-Rhône-Alpes",
    "pros": 21773,
    "population": 442468,
    "superficie": 6028.25,
    "densite": 492.1,
    "rank": 20
  },
  {
    "code": "39",
    "name": "Jura",
    "region": "Bourgogne-Franche-Comté",
    "pros": 12681,
    "population": 258555,
    "superficie": 4999.18,
    "densite": 490.5,
    "rank": 21
  },
  {
    "code": "07",
    "name": "Ardèche",
    "region": "Auvergne-Rhône-Alpes",
    "pros": 16131,
    "population": 331415,
    "superficie": 5528.64,
    "densite": 486.7,
    "rank": 22
  },
  {
    "code": "11",
    "name": "Aude",
    "region": "Occitanie",
    "pros": 18214,
    "population": 376028,
    "superficie": 6138.98,
    "densite": 484.4,
    "rank": 23
  },
  {
    "code": "16",
    "name": "Charente",
    "region": "Nouvelle-Aquitaine",
    "pros": 16863,
    "population": 350867,
    "superficie": 5955.99,
    "densite": 480.6,
    "rank": 24
  },
  {
    "code": "90",
    "name": "Territoire de Belfort",
    "region": "Bourgogne-Franche-Comté",
    "pros": 6708,
    "population": 139654,
    "superficie": 609.44,
    "densite": 480.3,
    "rank": 25
  },
  {
    "code": "81",
    "name": "Tarn",
    "region": "Occitanie",
    "pros": 18804,
    "population": 393572,
    "superficie": 5757.89,
    "densite": 477.8,
    "rank": 26
  },
  {
    "code": "18",
    "name": "Cher",
    "region": "Centre-Val de Loire",
    "pros": 13962,
    "population": 299573,
    "superficie": 7234.99,
    "densite": 466.1,
    "rank": 27
  },
  {
    "code": "70",
    "name": "Haute-Saône",
    "region": "Bourgogne-Franche-Comté",
    "pros": 10896,
    "population": 234296,
    "superficie": 5360.08,
    "densite": 465.1,
    "rank": 28
  },
  {
    "code": "10",
    "name": "Aube",
    "region": "Grand Est",
    "pros": 14456,
    "population": 311329,
    "superficie": 6004.16,
    "densite": 464.3,
    "rank": 29
  },
  {
    "code": "61",
    "name": "Orne",
    "region": "Normandie",
    "pros": 12774,
    "population": 276973,
    "superficie": 6103.38,
    "densite": 461.2,
    "rank": 30
  },
  {
    "code": "41",
    "name": "Loir-et-Cher",
    "region": "Centre-Val de Loire",
    "pros": 15048,
    "population": 328504,
    "superficie": 6343.44,
    "densite": 458.1,
    "rank": 31
  },
  {
    "code": "87",
    "name": "Haute-Vienne",
    "region": "Nouvelle-Aquitaine",
    "pros": 16998,
    "population": 371691,
    "superficie": 5520.13,
    "densite": 457.3,
    "rank": 32
  },
  {
    "code": "89",
    "name": "Yonne",
    "region": "Bourgogne-Franche-Comté",
    "pros": 15230,
    "population": 333385,
    "superficie": 7427.35,
    "densite": 456.8,
    "rank": 33
  },
  {
    "code": "03",
    "name": "Allier",
    "region": "Auvergne-Rhône-Alpes",
    "pros": 15271,
    "population": 334872,
    "superficie": 7340.11,
    "densite": 456,
    "rank": 34
  },
  {
    "code": "36",
    "name": "Indre",
    "region": "Centre-Val de Loire",
    "pros": 9788,
    "population": 217228,
    "superficie": 6790.63,
    "densite": 450.6,
    "rank": 35
  },
  {
    "code": "08",
    "name": "Ardennes",
    "region": "Grand Est",
    "pros": 11827,
    "population": 268859,
    "superficie": 5229.41,
    "densite": 439.9,
    "rank": 36
  },
  {
    "code": "55",
    "name": "Meuse",
    "region": "Grand Est",
    "pros": 8003,
    "population": 181919,
    "superficie": 6211.44,
    "densite": 439.9,
    "rank": 37
  },
  {
    "code": "66",
    "name": "Pyrénées-Orientales",
    "region": "Occitanie",
    "pros": 21180,
    "population": 487307,
    "superficie": 4116.02,
    "densite": 434.6,
    "rank": 38
  },
  {
    "code": "26",
    "name": "Drôme",
    "region": "Auvergne-Rhône-Alpes",
    "pros": 22085,
    "population": 519458,
    "superficie": 6529.95,
    "densite": 425.2,
    "rank": 39
  },
  {
    "code": "84",
    "name": "Vaucluse",
    "region": "Provence-Alpes-Côte d'Azur",
    "pros": 23592,
    "population": 564566,
    "superficie": 3567.26,
    "densite": 417.9,
    "rank": 40
  },
  {
    "code": "52",
    "name": "Haute-Marne",
    "region": "Grand Est",
    "pros": 7141,
    "population": 171042,
    "superficie": 6210.6,
    "densite": 417.5,
    "rank": 41
  },
  {
    "code": "88",
    "name": "Vosges",
    "region": "Grand Est",
    "pros": 15047,
    "population": 360673,
    "superficie": 5873.78,
    "densite": 417.2,
    "rank": 42
  },
  {
    "code": "28",
    "name": "Eure-et-Loir",
    "region": "Centre-Val de Loire",
    "pros": 17225,
    "population": 431277,
    "superficie": 5879.95,
    "densite": 399.4,
    "rank": 43
  },
  {
    "code": "53",
    "name": "Mayenne",
    "region": "Pays de la Loire",
    "pros": 12052,
    "population": 305933,
    "superficie": 5175.21,
    "densite": 393.9,
    "rank": 44
  },
  {
    "code": "21",
    "name": "Côte-d'Or",
    "region": "Bourgogne-Franche-Comté",
    "pros": 20530,
    "population": 535503,
    "superficie": 8763.21,
    "densite": 383.4,
    "rank": 45
  },
  {
    "code": "86",
    "name": "Vienne",
    "region": "Nouvelle-Aquitaine",
    "pros": 16683,
    "population": 439385,
    "superficie": 6990.44,
    "densite": 379.7,
    "rank": 46
  },
  {
    "code": "79",
    "name": "Deux-Sèvres",
    "region": "Nouvelle-Aquitaine",
    "pros": 14187,
    "population": 374587,
    "superficie": 5999.35,
    "densite": 378.7,
    "rank": 47
  },
  {
    "code": "71",
    "name": "Saône-et-Loire",
    "region": "Bourgogne-Franche-Comté",
    "pros": 20736,
    "population": 549288,
    "superficie": 8574.69,
    "densite": 377.5,
    "rank": 48
  },
  {
    "code": "25",
    "name": "Doubs",
    "region": "Bourgogne-Franche-Comté",
    "pros": 20210,
    "population": 547096,
    "superficie": 5233.64,
    "densite": 369.4,
    "rank": 49
  },
  {
    "code": "17",
    "name": "Charente-Maritime",
    "region": "Nouvelle-Aquitaine",
    "pros": 23689,
    "population": 661404,
    "superficie": 6863.75,
    "densite": 358.2,
    "rank": 50
  },
  {
    "code": "37",
    "name": "Indre-et-Loire",
    "region": "Centre-Val de Loire",
    "pros": 21786,
    "population": 612160,
    "superficie": 6126.7,
    "densite": 355.9,
    "rank": 51
  },
  {
    "code": "64",
    "name": "Pyrénées-Atlantiques",
    "region": "Nouvelle-Aquitaine",
    "pros": 24220,
    "population": 693027,
    "superficie": 7644.76,
    "densite": 349.5,
    "rank": 52
  },
  {
    "code": "27",
    "name": "Eure",
    "region": "Normandie",
    "pros": 20845,
    "population": 598934,
    "superficie": 6039.85,
    "densite": 348,
    "rank": 53
  },
  {
    "code": "63",
    "name": "Puy-de-Dôme",
    "region": "Auvergne-Rhône-Alpes",
    "pros": 22947,
    "population": 662285,
    "superficie": 7969.66,
    "densite": 346.5,
    "rank": 54
  },
  {
    "code": "22",
    "name": "Côtes-d'Armor",
    "region": "Bretagne",
    "pros": 20513,
    "population": 605917,
    "superficie": 6877.55,
    "densite": 338.5,
    "rank": 55
  },
  {
    "code": "51",
    "name": "Marne",
    "region": "Grand Est",
    "pros": 19101,
    "population": 565292,
    "superficie": 8161.58,
    "densite": 337.9,
    "rank": 56
  },
  {
    "code": "01",
    "name": "Ain",
    "region": "Auvergne-Rhône-Alpes",
    "pros": 22314,
    "population": 663202,
    "superficie": 5762.39,
    "densite": 336.5,
    "rank": 57
  },
  {
    "code": "02",
    "name": "Aisne",
    "region": "Hauts-de-France",
    "pros": 17722,
    "population": 527468,
    "superficie": 7369.12,
    "densite": 336,
    "rank": 58
  },
  {
    "code": "50",
    "name": "Manche",
    "region": "Normandie",
    "pros": 16368,
    "population": 495508,
    "superficie": 5938.02,
    "densite": 330.3,
    "rank": 59
  },
  {
    "code": "45",
    "name": "Loiret",
    "region": "Centre-Val de Loire",
    "pros": 22020,
    "population": 684561,
    "superficie": 6775.23,
    "densite": 321.7,
    "rank": 60
  },
  {
    "code": "30",
    "name": "Gard",
    "region": "Occitanie",
    "pros": 24327,
    "population": 756543,
    "superficie": 5852.77,
    "densite": 321.6,
    "rank": 61
  },
  {
    "code": "72",
    "name": "Sarthe",
    "region": "Pays de la Loire",
    "pros": 18176,
    "population": 566058,
    "superficie": 6205.99,
    "densite": 321.1,
    "rank": 62
  },
  {
    "code": "42",
    "name": "Loire",
    "region": "Auvergne-Rhône-Alpes",
    "pros": 24673,
    "population": 769029,
    "superficie": 4780.59,
    "densite": 320.8,
    "rank": 63
  },
  {
    "code": "80",
    "name": "Somme",
    "region": "Hauts-de-France",
    "pros": 17986,
    "population": 566252,
    "superficie": 6170.12,
    "densite": 317.6,
    "rank": 64
  },
  {
    "code": "54",
    "name": "Meurthe-et-Moselle",
    "region": "Grand Est",
    "pros": 22981,
    "population": 732486,
    "superficie": 5245.91,
    "densite": 313.7,
    "rank": 65
  },
  {
    "code": "14",
    "name": "Calvados",
    "region": "Normandie",
    "pros": 21852,
    "population": 700633,
    "superficie": 5539.18,
    "densite": 311.9,
    "rank": 66
  },
  {
    "code": "85",
    "name": "Vendée",
    "region": "Pays de la Loire",
    "pros": 20957,
    "population": 699459,
    "superficie": 6719.59,
    "densite": 299.6,
    "rank": 67
  },
  {
    "code": "74",
    "name": "Haute-Savoie",
    "region": "Auvergne-Rhône-Alpes",
    "pros": 24957,
    "population": 841482,
    "superficie": 4387.8,
    "densite": 296.6,
    "rank": 68
  },
  {
    "code": "68",
    "name": "Haut-Rhin",
    "region": "Grand Est",
    "pros": 22581,
    "population": 767083,
    "superficie": 3525.17,
    "densite": 294.4,
    "rank": 69
  },
  {
    "code": "56",
    "name": "Morbihan",
    "region": "Bretagne",
    "pros": 22528,
    "population": 768687,
    "superficie": 6822.64,
    "densite": 293.1,
    "rank": 70
  },
  {
    "code": "971",
    "name": "Guadeloupe",
    "region": "Guadeloupe",
    "pros": 10858,
    "population": 384315,
    "superficie": 1628.4,
    "densite": 282.5,
    "rank": 71
  },
  {
    "code": "49",
    "name": "Maine-et-Loire",
    "region": "Pays de la Loire",
    "pros": 22694,
    "population": 824743,
    "superficie": 7165.6,
    "densite": 275.2,
    "rank": 72
  },
  {
    "code": "60",
    "name": "Oise",
    "region": "Hauts-de-France",
    "pros": 22566,
    "population": 828838,
    "superficie": 5860.22,
    "densite": 272.3,
    "rank": 73
  },
  {
    "code": "06",
    "name": "Alpes-Maritimes",
    "region": "Provence-Alpes-Côte d'Azur",
    "pros": 29987,
    "population": 1103941,
    "superficie": 4298.58,
    "densite": 271.6,
    "rank": 74
  },
  {
    "code": "83",
    "name": "Var",
    "region": "Provence-Alpes-Côte d'Azur",
    "pros": 29661,
    "population": 1095337,
    "superficie": 5972.54,
    "densite": 270.8,
    "rank": 75
  },
  {
    "code": "29",
    "name": "Finistère",
    "region": "Bretagne",
    "pros": 23267,
    "population": 921638,
    "superficie": 6733,
    "densite": 252.5,
    "rank": 76
  },
  {
    "code": "972",
    "name": "Martinique",
    "region": "Martinique",
    "pros": 8955,
    "population": 360749,
    "superficie": 1128,
    "densite": 248.2,
    "rank": 77
  },
  {
    "code": "57",
    "name": "Moselle",
    "region": "Grand Est",
    "pros": 25226,
    "population": 1049942,
    "superficie": 6216.27,
    "densite": 240.3,
    "rank": 78
  },
  {
    "code": "34",
    "name": "Hérault",
    "region": "Occitanie",
    "pros": 28369,
    "population": 1201883,
    "superficie": 6101.01,
    "densite": 236,
    "rank": 79
  },
  {
    "code": "67",
    "name": "Bas-Rhin",
    "region": "Grand Est",
    "pros": 26703,
    "population": 1152662,
    "superficie": 4755.03,
    "densite": 231.7,
    "rank": 80
  },
  {
    "code": "38",
    "name": "Isère",
    "region": "Auvergne-Rhône-Alpes",
    "pros": 28968,
    "population": 1284948,
    "superficie": 7431.49,
    "densite": 225.4,
    "rank": 81
  },
  {
    "code": "95",
    "name": "Val-d'Oise",
    "region": "Île-de-France",
    "pros": 28165,
    "population": 1256607,
    "superficie": 1245.91,
    "densite": 224.1,
    "rank": 82
  },
  {
    "code": "35",
    "name": "Ille-et-Vilaine",
    "region": "Bretagne",
    "pros": 24297,
    "population": 1098325,
    "superficie": 6774.72,
    "densite": 221.2,
    "rank": 83
  },
  {
    "code": "91",
    "name": "Essonne",
    "region": "Île-de-France",
    "pros": 27876,
    "population": 1313768,
    "superficie": 1804.4,
    "densite": 212.2,
    "rank": 84
  },
  {
    "code": "76",
    "name": "Seine-Maritime",
    "region": "Normandie",
    "pros": 26090,
    "population": 1255918,
    "superficie": 6277.57,
    "densite": 207.7,
    "rank": 85
  },
  {
    "code": "31",
    "name": "Haute-Garonne",
    "region": "Occitanie",
    "pros": 29145,
    "population": 1434367,
    "superficie": 6309.34,
    "densite": 203.2,
    "rank": 86
  },
  {
    "code": "33",
    "name": "Gironde",
    "region": "Nouvelle-Aquitaine",
    "pros": 33117,
    "population": 1654970,
    "superficie": 10000.14,
    "densite": 200.1,
    "rank": 87
  },
  {
    "code": "77",
    "name": "Seine-et-Marne",
    "region": "Île-de-France",
    "pros": 28571,
    "population": 1438100,
    "superficie": 5915.29,
    "densite": 198.7,
    "rank": 88
  },
  {
    "code": "94",
    "name": "Val-de-Marne",
    "region": "Île-de-France",
    "pros": 27819,
    "population": 1415367,
    "superficie": 245.03,
    "densite": 196.5,
    "rank": 89
  },
  {
    "code": "973",
    "name": "Guyane",
    "region": "Guyane",
    "pros": 5461,
    "population": 286618,
    "superficie": 83533.9,
    "densite": 190.5,
    "rank": 90
  },
  {
    "code": "78",
    "name": "Yvelines",
    "region": "Île-de-France",
    "pros": 27723,
    "population": 1456365,
    "superficie": 2284.43,
    "densite": 190.4,
    "rank": 91
  },
  {
    "code": "44",
    "name": "Loire-Atlantique",
    "region": "Pays de la Loire",
    "pros": 27734,
    "population": 1457806,
    "superficie": 6815.38,
    "densite": 190.2,
    "rank": 92
  },
  {
    "code": "93",
    "name": "Seine-Saint-Denis",
    "region": "Île-de-France",
    "pros": 30776,
    "population": 1668670,
    "superficie": 236.2,
    "densite": 184.4,
    "rank": 93
  },
  {
    "code": "62",
    "name": "Pas-de-Calais",
    "region": "Hauts-de-France",
    "pros": 25536,
    "population": 1461441,
    "superficie": 6671.35,
    "densite": 174.7,
    "rank": 94
  },
  {
    "code": "69",
    "name": "Rhône",
    "region": "Auvergne-Rhône-Alpes",
    "pros": 32669,
    "population": 1893692,
    "superficie": 3249.12,
    "densite": 172.5,
    "rank": 95
  },
  {
    "code": "92",
    "name": "Hauts-de-Seine",
    "region": "Île-de-France",
    "pros": 28103,
    "population": 1635291,
    "superficie": 175.61,
    "densite": 171.9,
    "rank": 96
  },
  {
    "code": "974",
    "name": "La Réunion",
    "region": "La Réunion",
    "pros": 13844,
    "population": 871157,
    "superficie": 2503.72,
    "densite": 158.9,
    "rank": 97
  },
  {
    "code": "13",
    "name": "Bouches-du-Rhône",
    "region": "Provence-Alpes-Côte d'Azur",
    "pros": 31726,
    "population": 2056943,
    "superficie": 5087.49,
    "densite": 154.2,
    "rank": 98
  },
  {
    "code": "75",
    "name": "Paris",
    "region": "Île-de-France",
    "pros": 32056,
    "population": 2133111,
    "superficie": 105.4,
    "densite": 150.3,
    "rank": 99
  },
  {
    "code": "59",
    "name": "Nord",
    "region": "Hauts-de-France",
    "pros": 30771,
    "population": 2611293,
    "superficie": 5738.33,
    "densite": 117.8,
    "rank": 100
  }
];

export const BAROMETRE_META = {
  totalPros: 1921065,
  nbDepts: 100,
  popSource: "INSEE, population municipale 2021",
  prosSource: "Répertoire SIRENE (INSEE)",
  generatedAt: "2026-07-27",
};
