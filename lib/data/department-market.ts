// Marché immobilier agrégé au niveau DÉPARTEMENT à partir de commune_data
// (data.gouv.fr : DVF prix, FiLoSoFi revenus, LOVAC vacance). Généré le
// 2026-06-07 par scripts/build-department-market.ts.
// NE PAS éditer à la main. Pondérations : prix/revenu par population communale,
// taux de vacance = Σ vacants / Σ logements privés. « zéro chiffre inventé ».

export type DepartmentMarket = {
  prix_m2_moyen: number | null;
  revenu_median: number | null;
  taux_vacance: number | null;
  logements_vacants: number | null;
  nb_communes: number;
  dvf_annee: number | null;
  filosofi_annee: number | null;
  lovac_annee: number | null;
};

export const DEPARTMENT_MARKET: Record<string, DepartmentMarket> = {
  "10": {
    "prix_m2_moyen": 1620,
    "revenu_median": 21267,
    "taux_vacance": 13.9,
    "logements_vacants": 14428,
    "nb_communes": 390,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "11": {
    "prix_m2_moyen": 1922,
    "revenu_median": 20436,
    "taux_vacance": 11.8,
    "logements_vacants": 24883,
    "nb_communes": 384,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "12": {
    "prix_m2_moyen": 1698,
    "revenu_median": 21843,
    "taux_vacance": 14.8,
    "logements_vacants": 22229,
    "nb_communes": 282,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "13": {
    "prix_m2_moyen": 3838,
    "revenu_median": 22920,
    "taux_vacance": 11.7,
    "logements_vacants": 110540,
    "nb_communes": 135,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "14": {
    "prix_m2_moyen": 2590,
    "revenu_median": 22807,
    "taux_vacance": 9,
    "logements_vacants": 28604,
    "nb_communes": 519,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "15": {
    "prix_m2_moyen": 1454,
    "revenu_median": 21676,
    "taux_vacance": 13.8,
    "logements_vacants": 10416,
    "nb_communes": 229,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "16": {
    "prix_m2_moyen": 1526,
    "revenu_median": 21891,
    "taux_vacance": 13.2,
    "logements_vacants": 17811,
    "nb_communes": 354,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "17": {
    "prix_m2_moyen": 2918,
    "revenu_median": 22864,
    "taux_vacance": 9,
    "logements_vacants": 31571,
    "nb_communes": 455,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "18": {
    "prix_m2_moyen": 1360,
    "revenu_median": 22086,
    "taux_vacance": 13.7,
    "logements_vacants": 18061,
    "nb_communes": 279,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "19": {
    "prix_m2_moyen": 1569,
    "revenu_median": 22109,
    "taux_vacance": 15.3,
    "logements_vacants": 18496,
    "nb_communes": 265,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "21": {
    "prix_m2_moyen": 2314,
    "revenu_median": 23668,
    "taux_vacance": 11.2,
    "logements_vacants": 22323,
    "nb_communes": 613,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "22": {
    "prix_m2_moyen": 2152,
    "revenu_median": 22710,
    "taux_vacance": 9.9,
    "logements_vacants": 34045,
    "nb_communes": 343,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "23": {
    "prix_m2_moyen": 1061,
    "revenu_median": 20573,
    "taux_vacance": 17.1,
    "logements_vacants": 10130,
    "nb_communes": 245,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "24": {
    "prix_m2_moyen": 1754,
    "revenu_median": 21323,
    "taux_vacance": 14.3,
    "logements_vacants": 26241,
    "nb_communes": 488,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "25": {
    "prix_m2_moyen": 2054,
    "revenu_median": 24156,
    "taux_vacance": 11.3,
    "logements_vacants": 22525,
    "nb_communes": 515,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "26": {
    "prix_m2_moyen": 2357,
    "revenu_median": 22413,
    "taux_vacance": 11.2,
    "logements_vacants": 26622,
    "nb_communes": 317,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "27": {
    "prix_m2_moyen": 2000,
    "revenu_median": 22683,
    "taux_vacance": 10.2,
    "logements_vacants": 18770,
    "nb_communes": 581,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "28": {
    "prix_m2_moyen": 1972,
    "revenu_median": 23196,
    "taux_vacance": 10.6,
    "logements_vacants": 15461,
    "nb_communes": 357,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "29": {
    "prix_m2_moyen": 2287,
    "revenu_median": 23180,
    "taux_vacance": 9.8,
    "logements_vacants": 50741,
    "nb_communes": 275,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "30": {
    "prix_m2_moyen": 2521,
    "revenu_median": 21194,
    "taux_vacance": 11.1,
    "logements_vacants": 39753,
    "nb_communes": 342,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "31": {
    "prix_m2_moyen": 2932,
    "revenu_median": 24096,
    "taux_vacance": 10.4,
    "logements_vacants": 67381,
    "nb_communes": 530,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "32": {
    "prix_m2_moyen": 1704,
    "revenu_median": 22114,
    "taux_vacance": 14.5,
    "logements_vacants": 10156,
    "nb_communes": 411,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "33": {
    "prix_m2_moyen": 3435,
    "revenu_median": 24089,
    "taux_vacance": 9.8,
    "logements_vacants": 74266,
    "nb_communes": 528,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "34": {
    "prix_m2_moyen": 3216,
    "revenu_median": 21708,
    "taux_vacance": 10.4,
    "logements_vacants": 70353,
    "nb_communes": 331,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "35": {
    "prix_m2_moyen": 2883,
    "revenu_median": 23767,
    "taux_vacance": 9.3,
    "logements_vacants": 47812,
    "nb_communes": 332,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "36": {
    "prix_m2_moyen": 1196,
    "revenu_median": 21198,
    "taux_vacance": 14.3,
    "logements_vacants": 15431,
    "nb_communes": 238,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "37": {
    "prix_m2_moyen": 2395,
    "revenu_median": 23098,
    "taux_vacance": 10.2,
    "logements_vacants": 28095,
    "nb_communes": 272,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "38": {
    "prix_m2_moyen": 2728,
    "revenu_median": 24275,
    "taux_vacance": 11,
    "logements_vacants": 61749,
    "nb_communes": 501,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "39": {
    "prix_m2_moyen": 1779,
    "revenu_median": 23382,
    "taux_vacance": 13.1,
    "logements_vacants": 12816,
    "nb_communes": 428,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "40": {
    "prix_m2_moyen": 2865,
    "revenu_median": 22868,
    "taux_vacance": 10.1,
    "logements_vacants": 22270,
    "nb_communes": 322,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "41": {
    "prix_m2_moyen": 1665,
    "revenu_median": 22355,
    "taux_vacance": 10.8,
    "logements_vacants": 15808,
    "nb_communes": 261,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "42": {
    "prix_m2_moyen": 1817,
    "revenu_median": 21797,
    "taux_vacance": 12.9,
    "logements_vacants": 42781,
    "nb_communes": 319,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "43": {
    "prix_m2_moyen": 1694,
    "revenu_median": 22066,
    "taux_vacance": 14.2,
    "logements_vacants": 16582,
    "nb_communes": 243,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "44": {
    "prix_m2_moyen": 3117,
    "revenu_median": 24251,
    "taux_vacance": 7.9,
    "logements_vacants": 55857,
    "nb_communes": 207,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "45": {
    "prix_m2_moyen": 2053,
    "revenu_median": 22987,
    "taux_vacance": 10.3,
    "logements_vacants": 29569,
    "nb_communes": 321,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "46": {
    "prix_m2_moyen": 1722,
    "revenu_median": 21899,
    "taux_vacance": 14.5,
    "logements_vacants": 10860,
    "nb_communes": 300,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "47": {
    "prix_m2_moyen": 1636,
    "revenu_median": 20995,
    "taux_vacance": 16.1,
    "logements_vacants": 21970,
    "nb_communes": 313,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "48": {
    "prix_m2_moyen": 1792,
    "revenu_median": 21536,
    "taux_vacance": 13.1,
    "logements_vacants": 6111,
    "nb_communes": 136,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "49": {
    "prix_m2_moyen": 2267,
    "revenu_median": 22457,
    "taux_vacance": 8.7,
    "logements_vacants": 30267,
    "nb_communes": 176,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "50": {
    "prix_m2_moyen": 2043,
    "revenu_median": 22515,
    "taux_vacance": 10.2,
    "logements_vacants": 21781,
    "nb_communes": 435,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "51": {
    "prix_m2_moyen": 2137,
    "revenu_median": 22659,
    "taux_vacance": 13.1,
    "logements_vacants": 23558,
    "nb_communes": 558,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "52": {
    "prix_m2_moyen": 1152,
    "revenu_median": 21297,
    "taux_vacance": 14.1,
    "logements_vacants": 8351,
    "nb_communes": 343,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "53": {
    "prix_m2_moyen": 1657,
    "revenu_median": 22200,
    "taux_vacance": 10.8,
    "logements_vacants": 13940,
    "nb_communes": 240,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "54": {
    "prix_m2_moyen": 1925,
    "revenu_median": 22916,
    "taux_vacance": 11.4,
    "logements_vacants": 31258,
    "nb_communes": 546,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "55": {
    "prix_m2_moyen": 1218,
    "revenu_median": 21772,
    "taux_vacance": 14.9,
    "logements_vacants": 8520,
    "nb_communes": 416,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "56": {
    "prix_m2_moyen": 2840,
    "revenu_median": 23264,
    "taux_vacance": 8.8,
    "logements_vacants": 39325,
    "nb_communes": 249,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "57": {
    "prix_m2_moyen": null,
    "revenu_median": 23178,
    "taux_vacance": 11.6,
    "logements_vacants": 43085,
    "nb_communes": 664,
    "dvf_annee": null,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "58": {
    "prix_m2_moyen": 1186,
    "revenu_median": 21309,
    "taux_vacance": 15.8,
    "logements_vacants": 13966,
    "nb_communes": 297,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "59": {
    "prix_m2_moyen": 2182,
    "revenu_median": 21460,
    "taux_vacance": 10.2,
    "logements_vacants": 97434,
    "nb_communes": 645,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "60": {
    "prix_m2_moyen": 2304,
    "revenu_median": 23259,
    "taux_vacance": 10,
    "logements_vacants": 24101,
    "nb_communes": 672,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "61": {
    "prix_m2_moyen": 1457,
    "revenu_median": 21241,
    "taux_vacance": 13.2,
    "logements_vacants": 15092,
    "nb_communes": 370,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "62": {
    "prix_m2_moyen": 1806,
    "revenu_median": 20704,
    "taux_vacance": 9.2,
    "logements_vacants": 45834,
    "nb_communes": 871,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "63": {
    "prix_m2_moyen": 2016,
    "revenu_median": 22992,
    "taux_vacance": 13.9,
    "logements_vacants": 42690,
    "nb_communes": 458,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "64": {
    "prix_m2_moyen": 3319,
    "revenu_median": 23313,
    "taux_vacance": 10.5,
    "logements_vacants": 34867,
    "nb_communes": 516,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "65": {
    "prix_m2_moyen": 1745,
    "revenu_median": 21435,
    "taux_vacance": 14.4,
    "logements_vacants": 15684,
    "nb_communes": 375,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "66": {
    "prix_m2_moyen": 2413,
    "revenu_median": 20443,
    "taux_vacance": 11.4,
    "logements_vacants": 36939,
    "nb_communes": 214,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "67": {
    "prix_m2_moyen": null,
    "revenu_median": 23698,
    "taux_vacance": 10.2,
    "logements_vacants": 45279,
    "nb_communes": 512,
    "dvf_annee": null,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "68": {
    "prix_m2_moyen": null,
    "revenu_median": 24714,
    "taux_vacance": 12.2,
    "logements_vacants": 35365,
    "nb_communes": 363,
    "dvf_annee": null,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "69": {
    "prix_m2_moyen": 3721,
    "revenu_median": 24455,
    "taux_vacance": 9.4,
    "logements_vacants": 50983,
    "nb_communes": 265,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "70": {
    "prix_m2_moyen": 1339,
    "revenu_median": 21786,
    "taux_vacance": 13.4,
    "logements_vacants": 9663,
    "nb_communes": 496,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "71": {
    "prix_m2_moyen": 1594,
    "revenu_median": 22107,
    "taux_vacance": 12.9,
    "logements_vacants": 28811,
    "nb_communes": 549,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "72": {
    "prix_m2_moyen": 1697,
    "revenu_median": 22114,
    "taux_vacance": 9.7,
    "logements_vacants": 21955,
    "nb_communes": 348,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "73": {
    "prix_m2_moyen": 3543,
    "revenu_median": 24232,
    "taux_vacance": 11.1,
    "logements_vacants": 33974,
    "nb_communes": 272,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "74": {
    "prix_m2_moyen": 4480,
    "revenu_median": 29135,
    "taux_vacance": 10.2,
    "logements_vacants": 50662,
    "nb_communes": 279,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "75": {
    "prix_m2_moyen": 9674,
    "revenu_median": null,
    "taux_vacance": null,
    "logements_vacants": null,
    "nb_communes": 1,
    "dvf_annee": 2024,
    "filosofi_annee": null,
    "lovac_annee": null
  },
  "76": {
    "prix_m2_moyen": 2207,
    "revenu_median": 22383,
    "taux_vacance": 10.4,
    "logements_vacants": 46101,
    "nb_communes": 701,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "77": {
    "prix_m2_moyen": 3092,
    "revenu_median": 24587,
    "taux_vacance": 10.1,
    "logements_vacants": 47830,
    "nb_communes": 505,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "78": {
    "prix_m2_moyen": 4182,
    "revenu_median": 28691,
    "taux_vacance": 8.9,
    "logements_vacants": 44541,
    "nb_communes": 258,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "79": {
    "prix_m2_moyen": 1498,
    "revenu_median": 22289,
    "taux_vacance": 10,
    "logements_vacants": 15717,
    "nb_communes": 250,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "80": {
    "prix_m2_moyen": 1876,
    "revenu_median": 21482,
    "taux_vacance": 11.2,
    "logements_vacants": 20512,
    "nb_communes": 723,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "81": {
    "prix_m2_moyen": 1809,
    "revenu_median": 21728,
    "taux_vacance": 12.5,
    "logements_vacants": 20374,
    "nb_communes": 304,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "82": {
    "prix_m2_moyen": 1876,
    "revenu_median": 21480,
    "taux_vacance": 11.3,
    "logements_vacants": 12475,
    "nb_communes": 188,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "83": {
    "prix_m2_moyen": 4042,
    "revenu_median": 23108,
    "taux_vacance": 10.1,
    "logements_vacants": 71056,
    "nb_communes": 149,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "84": {
    "prix_m2_moyen": 2797,
    "revenu_median": 21307,
    "taux_vacance": 12.8,
    "logements_vacants": 34991,
    "nb_communes": 148,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "85": {
    "prix_m2_moyen": 2476,
    "revenu_median": 22831,
    "taux_vacance": 6.7,
    "logements_vacants": 28407,
    "nb_communes": 253,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "86": {
    "prix_m2_moyen": 1679,
    "revenu_median": 22055,
    "taux_vacance": 11.3,
    "logements_vacants": 22826,
    "nb_communes": 264,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "87": {
    "prix_m2_moyen": 1606,
    "revenu_median": 21976,
    "taux_vacance": 13.3,
    "logements_vacants": 22913,
    "nb_communes": 193,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "88": {
    "prix_m2_moyen": 1499,
    "revenu_median": 21485,
    "taux_vacance": 13.3,
    "logements_vacants": 19982,
    "nb_communes": 458,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "89": {
    "prix_m2_moyen": 1502,
    "revenu_median": 21774,
    "taux_vacance": 12.9,
    "logements_vacants": 16666,
    "nb_communes": 406,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "90": {
    "prix_m2_moyen": 1593,
    "revenu_median": 22601,
    "taux_vacance": 13.1,
    "logements_vacants": 6578,
    "nb_communes": 99,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "91": {
    "prix_m2_moyen": 3256,
    "revenu_median": 25201,
    "taux_vacance": 9.2,
    "logements_vacants": 41761,
    "nb_communes": 193,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "92": {
    "prix_m2_moyen": 6483,
    "revenu_median": 30387,
    "taux_vacance": 11.8,
    "logements_vacants": 75394,
    "nb_communes": 36,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "93": {
    "prix_m2_moyen": 4104,
    "revenu_median": 19342,
    "taux_vacance": 13.8,
    "logements_vacants": 67938,
    "nb_communes": 39,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "94": {
    "prix_m2_moyen": 4864,
    "revenu_median": 24771,
    "taux_vacance": 11.6,
    "logements_vacants": 59166,
    "nb_communes": 47,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "95": {
    "prix_m2_moyen": 3453,
    "revenu_median": 23486,
    "taux_vacance": 9.8,
    "logements_vacants": 39246,
    "nb_communes": 178,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "971": {
    "prix_m2_moyen": null,
    "revenu_median": null,
    "taux_vacance": 19.9,
    "logements_vacants": 39503,
    "nb_communes": 30,
    "dvf_annee": null,
    "filosofi_annee": null,
    "lovac_annee": 2024
  },
  "972": {
    "prix_m2_moyen": null,
    "revenu_median": 19997,
    "taux_vacance": 19.3,
    "logements_vacants": 38263,
    "nb_communes": 34,
    "dvf_annee": null,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "973": {
    "prix_m2_moyen": null,
    "revenu_median": null,
    "taux_vacance": 22.1,
    "logements_vacants": 16128,
    "nb_communes": 19,
    "dvf_annee": null,
    "filosofi_annee": null,
    "lovac_annee": 2024
  },
  "974": {
    "prix_m2_moyen": null,
    "revenu_median": 17292,
    "taux_vacance": 11.2,
    "logements_vacants": 36125,
    "nb_communes": 24,
    "dvf_annee": null,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "976": {
    "prix_m2_moyen": null,
    "revenu_median": null,
    "taux_vacance": 46,
    "logements_vacants": 13961,
    "nb_communes": 17,
    "dvf_annee": null,
    "filosofi_annee": null,
    "lovac_annee": 2024
  },
  "01": {
    "prix_m2_moyen": 2789,
    "revenu_median": 26265,
    "taux_vacance": 10.9,
    "logements_vacants": 29736,
    "nb_communes": 388,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "02": {
    "prix_m2_moyen": 1373,
    "revenu_median": 20720,
    "taux_vacance": 12.5,
    "logements_vacants": 18944,
    "nb_communes": 739,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "03": {
    "prix_m2_moyen": 1350,
    "revenu_median": 21425,
    "taux_vacance": 15.7,
    "logements_vacants": 26340,
    "nb_communes": 315,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "04": {
    "prix_m2_moyen": 2362,
    "revenu_median": 21793,
    "taux_vacance": 14.5,
    "logements_vacants": 15492,
    "nb_communes": 182,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "05": {
    "prix_m2_moyen": 2744,
    "revenu_median": 22028,
    "taux_vacance": 10.6,
    "logements_vacants": 12110,
    "nb_communes": 150,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "06": {
    "prix_m2_moyen": 5053,
    "revenu_median": 23508,
    "taux_vacance": 10.7,
    "logements_vacants": 81596,
    "nb_communes": 157,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "07": {
    "prix_m2_moyen": 2142,
    "revenu_median": 21890,
    "taux_vacance": 15.1,
    "logements_vacants": 26029,
    "nb_communes": 327,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "08": {
    "prix_m2_moyen": 1363,
    "revenu_median": 20645,
    "taux_vacance": 14.2,
    "logements_vacants": 12494,
    "nb_communes": 394,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "09": {
    "prix_m2_moyen": 1628,
    "revenu_median": 20771,
    "taux_vacance": 12.2,
    "logements_vacants": 8936,
    "nb_communes": 274,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "2A": {
    "prix_m2_moyen": 4307,
    "revenu_median": 23492,
    "taux_vacance": 14.4,
    "logements_vacants": 13138,
    "nb_communes": 108,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  },
  "2B": {
    "prix_m2_moyen": 3188,
    "revenu_median": 21465,
    "taux_vacance": 15.3,
    "logements_vacants": 13792,
    "nb_communes": 183,
    "dvf_annee": 2024,
    "filosofi_annee": 2021,
    "lovac_annee": 2024
  }
};
