import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));

const REGLES: Record<string,{cat?:number;dans:RegExp;hors:RegExp}> = {
  "9609Z":{dans:/CHAT|CHIEN|ANIMA|CANIN|FELIN|TOUTOU|PATTE|PET ?SIT|AQUARI|EQUID|CHEVAL|NOUNOU/,
           hors:/TATOU|TATTOO|PIERCING|ASTROLOG|VOYAN|MEDIUM|MATRIMONIAL|GENEALOG|FUNER|COIFF|ESTHETIQ|ONGLE|BEAUTE|MASSAG|TOILETT|BIEN.?ETRE|SOPHRO|MAGNETI|HYPNO|CONCIERGERIE|RELOOK|TAROT|NATUROPATH|REFLEXOLOG|ENERGETIC/},
  "8899B":{dans:/ADMINISTRATIF|ECRIVAIN PUBLIC|PAPERASS/,
           hors:/SECOURS|SOLIDARIT|AMICALE|COMITE|TELETHON|CROIX ROUGE|SOU DES ECOLES|ENTRAIDE|CARITAT|BANQUE ALIMENTAIRE|UNRPA|SCOUT|PAROISS|MEDAILLE MILITAIRE|COMBATTANTS|CENTRE SOCIAL|FEDERATION|UNION |ASSOC/},
  "3811Z":{dans:/DEBARRAS|VIDE.?MAISON/,
           hors:/COMMUNE|COMMUNAUTE|SYNDICAT|VEOLIA|SUEZ|SITA|AGGLOMERATION|METROPOLE|REGIE|SMICTOM|SICTOM|SMITOM|CHIMIREC|URBASER|PAPREC|DERICHEBOURG|DECHET|COLLECTE|ENVIRONNEMENT|PROPRETE/},
  "3832Z":{dans:/DEBARRAS|VIDE.?MAISON|BROCANT/,
           hors:/RECYCL|METAL|FERRAILL|CASSE|VALORISATION|DECHET|PLASTIQ|COMMUNE|SYNDICAT|SUEZ|VEOLIA|PAPREC|DERICHEBOURG|ENVIRONNEMENT/},
  "9601B":{dans:/REPASSAG/,hors:/PRESSING|LAVERIE|BLANCHISSER|LAVECO|LAVANDIER|WASH|TEINTURER|LAV'|SEC /},
  "9601A":{dans:/REPASSAG/,hors:/PRESSING|LAVERIE|BLANCHISSER|LAVAGE|WASH|TEINTURER|LINGE/},
  "8559A":{dans:/SOUTIEN SCOLAIRE|AIDE AUX DEVOIRS/,
           hors:/FORMATION|CFA|ACADEM|CONSULTING|INSTITUT|CONSEIL|COACH|SECURITE|CACES|PERMIS|BUREAUTIQ|MANAGEMENT|PROFESSIONNEL|APPRENTISSAGE|GRETA|AFPA|COMPETENCE|BILAN/},
  "4339Z":{dans:/BRICOLAG|MULTISERVICE|MULTI.?SERVICE|HOMME TOUTES MAINS|PETITS TRAVAUX/,
           hors:/RENOVATION|BATIMENT|MACONNER|PEINTURE|PISCIN|CHARPENT|COUVERTURE|ISOLATION|PLATRER|CARRELAG|MENUISER|FACADE|TOITURE|BTP|CONSTRUCTION|AGENCEMENT|DECORATION/},
  "8122Z":{dans:/VITRE|VITRERIE|CARREAU/,
           hors:/INDUSTRIEL|PROPRETE|DEMOUSSAG|DECAPAG|GSF|ONET|ELIOR|DESAMIANT|HYGIENE|NETTOYAGE INDUSTRIEL|ASSAINISS/},
  "8891A":{dans:/GARDE D.ENFANT|BABY.?SIT/,
           hors:/COMMUNE|SYNDICAT|CRECHE|MULTI.?ACCUEIL|HALTE.?GARDER|PARENTS D.ELEVES|MAIRIE|CCAS|MAM|MAISON D.ASSISTANT|ASSOCIATION|CENTRE SOCIAL|PETITE ENFANCE/},
  "5320Z":{dans:/COURSES/,hors:/COURSIER|COLIS|POSTE|MESSAGER|TRANSPORT|EXPRESS|LOGISTI|DELIVER|DISTRIBUTION|LIVRAISON/},
  "8129A":{cat:40,dans:/PROPRETE|NETTOYAGE|CLEAN/,
           hors:/NUISIBLE|3D|DERATIS|DESINSECT|INSECTE|GUEPE|FRELON|TERMITE|RONGEUR|PUNAISE|AVIPUR|DESINFECT|HYGIENE|PARASIT/},
  "8899A":{dans:/HANDICAP|AUTIS|INCLUSION/,
           hors:/ENFANCE|ADOLESC|JEUNESSE|PROTECTION JUDICIAIRE|FOYER|MECS|PREVENTION|CENTRE SOCIAL|PERISCOLAIRE|LOISIRS|EDUCATIF|MINEUR/},
  "8121Z":{cat:19,dans:/MENAGE|MAISON|DOMICILE|HOME|FAMILY/,
           hors:/INDUSTRIEL|BUREAUX|COPROPRIET|TERTIAIRE|ASSAINISS|DESAMIANT|GSF|ONET|ELIOR/},
  "8810A":{dans:/DOMICILE|ADMR|SENIOR|AIDE|AUXILIAIRE|VIE/,hors:/CRECHE|ENFANCE|SCOLAIRE|FORMATION/},
  "4942Z":{dans:/DEMENAG|MOVER|TRANSPORT|GARDE.?MEUBLE/,hors:/COIFF|RESTAURANT|BOULANG|IMMOBILIER/},
  "9522Z":{dans:/DEPANN|REPARATION|ELECTRO|MENAGER|SERVICE/,hors:/COIFF|RESTAURANT|BOULANG|IMMOBILIER|TAXI/},
};

async function noms(naf:string,cat?:number){
  const out:string[]=[]; let off=0;
  while(out.length<2000){
    let ok=false;
    for(let essai=0;essai<3 && !ok;essai++){
      let q=sb.from("pros").select("name,forme_juridique").eq("naf_code",naf);
      if(cat)q=q.eq("category_id",cat);
      const {data,error}=await q.range(off,off+499);
      if(error){await sleep(3000);continue;}
      ok=true;
      if(!data||data.length===0)return out;
      // on ne garde que les SOCIETES : une personne physique s'appelle
      // "PRENOM NOM", son nom n'apprend rien sur son metier.
      for(const r of data as any[]) if(r.forme_juridique && r.forme_juridique!=="1000") out.push((r.name||"").toUpperCase());
      off+=data.length;
    }
    if(!ok){console.error(`  ${naf} lecture abandonnee a offset ${off}`);break;}
  }
  return out;
}

(async()=>{
  console.log("NAF\tCAT\tSOCIETES_LUES\tPREUVE_AUTRE_METIER\t%\tPREUVE_METIER_VISE\t%");
  for(const [naf,r] of Object.entries(REGLES)){
    const ns=await noms(naf,r.cat);
    if(ns.length===0){console.log(`${naf}\t${r.cat??"-"}\t0\t(lecture impossible)`);continue;}
    const hors=ns.filter(n=>r.hors.test(n)).length, dans=ns.filter(n=>r.dans.test(n)).length;
    console.log(`${naf}\t${r.cat??"-"}\t${ns.length}\t${hors}\t${((hors/ns.length)*100).toFixed(1)}\t${dans}\t${((dans/ns.length)*100).toFixed(1)}`);
  }
})();
