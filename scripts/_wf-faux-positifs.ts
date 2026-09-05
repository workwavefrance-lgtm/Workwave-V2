import { config } from "dotenv"; import path from "path"; import fs from "fs";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const OUVERTS = "etat_admin.is.null,etat_admin.neq.F";

// mots-cles NON ambigus. "hors" = preuve que la fiche est un AUTRE metier.
// "dans" = preuve qu'elle est bien le metier vise.
const REGLES: Record<string, { cat?: number; dans: RegExp; hors: RegExp }> = {
  "9609Z": { dans: /CHAT|CHIEN|ANIMA|CANIN|FELIN|TOUTOU|PATTE|NOUNOU|PET ?SIT|MIAOU|WOUF|AQUARI|EQUID|CHEVAL/,
             hors: /TATOU|TATTOO|PIERCING|ASTROLOG|VOYAN|MEDIUM|MATRIMONIAL|GENEALOG|FUNER|POMPES FUNEBRES|COIFF|ESTHETIQ|ONGLE|BEAUTE|MASSAG|SPA |TOILETT|BIEN.?ETRE|SOPHRO|MAGNETI|HYPNO|CONCIERGERIE|RELOOK|TAROT/ },
  "8899B": { dans: /ADMINISTRATIF|ECRIVAIN PUBLIC|PAPERASS|DEMARCHE/,
             hors: /SECOURS|SOLIDARIT|AMICALE|COMITE|TELETHON|CROIX ROUGE|RESTOS? DU C|SOU DES ECOLES|ENTRAIDE|CARITAT|BANQUE ALIMENTAIRE|UNRPA|SCOUT|PAROISS|MEDAILLE MILITAIRE|ANCIENS COMBATTANTS/ },
  "3811Z": { dans: /DEBARRAS|VIDE.?MAISON|VIDE.?GRENIER/,
             hors: /COMMUNE DE|COMMUNAUTE DE|COMMUNAUTE D|SYNDICAT|VEOLIA|SUEZ|SITA|AGGLOMERATION|GRAND POITIERS|METROPOLE|DEPARTEMENT|REGIE|SMICTOM|SICTOM|SMITOM|CHIMIREC|URBASER|PAPREC|DERICHEBOURG/ },
  "3832Z": { dans: /DEBARRAS|VIDE.?MAISON|BROCANT/,
             hors: /RECYCL|METAL|FERRAILL|CASSE AUTO|VALORISATION|DECHET|PLASTIQ|COMMUNE DE|COMMUNAUTE|SYNDICAT|SUEZ|VEOLIA|PAPREC|DERICHEBOURG/ },
  "9601B": { dans: /REPASSAG|REPASS/,
             hors: /PRESSING|LAVERIE|BLANCHISSER|LAV(AGE|ECO|ANDIER)|WASH|TEINTURER|NETTOYAGE A SEC/ },
  "9601A": { dans: /REPASSAG/,
             hors: /PRESSING|LAVERIE|BLANCHISSER|LAVAGE|WASH|TEINTURER|LINGE/ },
  "8559A": { dans: /SOUTIEN SCOLAIRE|AIDE AUX DEVOIRS|COURS PARTICULIER/,
             hors: /FORMATION|CFA|ACADEM|CONSULTING|INSTITUT|CONSEIL|COACH|SECURITE|CACES|PERMIS|BUREAUTIQ|MANAGEMENT|ENTREPRISE|PROFESSIONNEL|APPRENTISSAGE|GRETA|AFPA/ },
  "4339Z": { dans: /BRICOLAG|MULTISERVICE|MULTI.?SERVICE|HOMME TOUTES MAINS|PETITS TRAVAUX|DEPANNAG/,
             hors: /RENOVATION|BATIMENT|MACONNER|PEINTURE|PISCIN|CHARPENT|COUVERTURE|ISOLATION|PLATRER|CARRELAG|MENUISER|FACADE|TOITURE|BTP|CONSTRUCTION/ },
  "8122Z": { dans: /VITRE|VITRERIE|LAVE.?VITRE|CARREAU/,
             hors: /INDUSTRIEL|PROPRETE|DEMOUSSAG|DECAPAG|GSF |ONET|ELIOR|DESAMIANT|HYGIENE|MULTISERVICE/ },
  "8891A": { dans: /GARDE D.ENFANT|NOUNOU|BABY.?SIT/,
             hors: /COMMUNE DE|SYNDICAT|CRECHE|MULTI.?ACCUEIL|HALTE.?GARDER|PARENTS D.ELEVES|MAIRIE|CENTRE SOCIAL|CCAS|ASSOCIATION|MAM |LA MAM|MAISON D.ASSISTANT/ },
  "5320Z": { dans: /COURSES|LIVRAISON DE COURSES|DRIVE/,
             hors: /COURSIER|COLIS|POSTE|MESSAGER|TRANSPORT|EXPRESS|LOGISTI|DELIVER|UBER|DISTRIBUTION/ },
  "8129A": { cat: 40, dans: /PROPRETE|NETTOYAGE|CLEAN|NET /,
             hors: /NUISIBLE|3D\b|DERATIS|DESINSECT|INSECTE|GUEPE|FRELON|TERMITE|RONGEUR|PUNAISE|HYGIENE|AVIPUR|DESINFECT/ },
  "8899A": { dans: /HANDICAP|AUTIS|ADAPT|INCLUSION/,
             hors: /ENFANCE|ADOLESC|JEUNESSE|PROTECTION JUDICIAIRE|FOYER|MECS|PREVENTION SPECIALISEE|CENTRE SOCIAL|PERISCOLAIRE|LOISIRS/ },
};

async function noms(naf: string, cat?: number) {
  const out: string[] = []; let off = 0;
  while (out.length < 3000) {
    let q = sb.from("pros").select("name").eq("naf_code", naf).eq("is_active", true).is("deleted_at", null).or(OUVERTS);
    if (cat) q = q.eq("category_id", cat);
    const { data, error } = await q.range(off, off + 999);
    if (error) { console.error(`  lecture ${naf} : ${error.message}`); break; }
    if (!data || data.length === 0) break;
    out.push(...data.map((r: any) => (r.name || "").toUpperCase()));
    off += data.length;
  }
  return out;
}

(async () => {
  console.log("NAF\tN_NOMS\tPREUVE_AUTRE_METIER\t%\tPREUVE_BON_METIER\t%");
  for (const [naf, r] of Object.entries(REGLES)) {
    const ns = await noms(naf, r.cat);
    if (ns.length === 0) { console.log(`${naf}\t0\t-`); continue; }
    const hors = ns.filter(n => r.hors.test(n)).length;
    const dans = ns.filter(n => r.dans.test(n)).length;
    console.log(`${naf}${r.cat ? " (cat " + r.cat + ")" : ""}\t${ns.length}\t${hors}\t${((hors/ns.length)*100).toFixed(1)}\t${dans}\t${((dans/ns.length)*100).toFixed(1)}`);
  }
})();
