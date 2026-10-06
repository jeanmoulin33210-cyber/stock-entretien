const STORAGE_KEY='jm_test_culinaire_param_v2';
const ARCHIVE_STORAGE_KEY='jm_test_culinaire_archives_v1';
const CUSTOM_TEMPLATE_STORAGE_KEY='jm_test_culinaire_custom_templates_v1';
const PERSONAL_MARKET_STORAGE_KEY='jm_test_culinaire_market2026_personal_v1';
const PREPARED_JURY_STORAGE_KEY='jm_test_culinaire_prepared_v97';
const SAMPLE_MASTER_STORAGE_KEY='jm_test_culinaire_sample_master_v1';
const SAMPLE_MASTER_META_STORAGE_KEY='jm_test_culinaire_sample_master_meta_v1';
const SAMPLE_PRODUCTS_STORAGE_KEY='jm_test_culinaire_sample_products_v1';
const SAMPLE_LOT_HISTORY_STORAGE_KEY='jm_test_culinaire_sample_lot_history_v178';
const PALETTE=['#e5862f','#2f8f5b','#7d5ab5','#2e7cae','#c95366','#8a6b37','#3a8e91','#9b5f9b'];
const QUESTIONS=[
 {title:'Par rapport à la couleur que vous jugez idéale, où se situe le produit testé ?',weights:[0,3,6,10,6,3,0],labels:['Trop pâle','','','Parfait','','','Trop foncée']},
 {title:'Par rapport à la texture que vous jugez idéale, où se situe le produit testé ?',weights:[0,3,6,10,6,3,0],labels:['Trop ferme','','','Parfait','','','Trop mou / fondant']},
 {title:"Pour vous, quel est l’aspect visuel idéal ?",weights:[0,3,6,10,6,3,0],labels:['Très insuffisant','','','Idéal','','','Très excessif']},
 {title:"Pour vous, quelle est l’odeur idéale ?",weights:[0,3,6,10,6,3,0],labels:['Trop forte','','','Parfait','','','Trop faible']},
 {title:'Pour vous, quel est le goût idéal ?',weights:[0,2.5,5,7.5,12.5,25],labels:['Immangeable','Insuffisant','Acceptable','Bon','Très bon','Excellent']}

];
const CRITERION_LIBRARY={
  couleur:{short:'Couleur',title:'Par rapport à la couleur que vous jugez idéale, où se situe le produit testé ?',labels10:['Trop pâle','','','Parfait','','','Trop foncée']},
  texture:{short:'Texture',title:'Par rapport à la texture que vous jugez idéale, où se situe le produit testé ?',labels10:['Trop ferme','','','Parfait','','','Trop mou / fondant']},
  aspect:{short:'Aspect visuel',title:'Pour vous, quel est l’aspect visuel idéal ?',labels10:['Très insuffisant','','','Idéal','','','Très excessif']},
  odeur:{short:'Odeur',title:'Pour vous, quelle est l’odeur idéale ?',labels10:['Trop forte','','','Parfait','','','Trop faible']},
  gout:{short:'Goût',title:'Pour vous, quel est le goût idéal ?',labels10:['Très mauvais','','','Idéal','','','Trop marqué'],labels25:['Immangeable','Insuffisant','Acceptable','Bon','Très bon','Excellent']},
  tendrete:{short:'Tendreté',title:'Comment jugez-vous la tendreté du produit ?',labels10:['Trop ferme','','','Idéale','','','Trop tendre']},
  jutosite:{short:'Jutosité',title:'Comment jugez-vous la jutosité du produit ?',labels10:['Trop sec','','','Idéale','','','Trop juteux']},
  tenue:{short:'Tenue à la cuisson',title:'Comment jugez-vous la tenue du produit après cuisson ou préparation ?',labels10:['Très mauvaise','','','Idéale','','','Trop ferme']},
  calibre:{short:'Calibre / régularité',title:'Comment jugez-vous le calibre et la régularité du produit ?',labels10:['Très irrégulier','','','Idéal','','','Trop uniforme']},
  fermete:{short:'Fermeté',title:'Comment jugez-vous la fermeté du produit ?',labels10:['Trop mou','','','Idéale','','','Trop ferme']},
  arome:{short:'Parfum / arôme',title:'Comment jugez-vous le parfum ou l’arôme du produit ?',labels10:['Trop faible','','','Idéal','','','Trop fort']},
  sucre:{short:'Équilibre sucré',title:'Comment jugez-vous l’équilibre sucré du produit ?',labels10:['Pas assez sucré','','','Idéal','','','Trop sucré']},
  assaisonnement:{short:'Assaisonnement',title:'Comment jugez-vous l’assaisonnement du produit ?',labels10:['Pas assez assaisonné','','','Idéal','','','Trop assaisonné']},
  onctuosite:{short:'Onctuosité',title:'Comment jugez-vous l’onctuosité du produit ?',labels10:['Trop fluide','','','Idéale','','','Trop épaisse']},
  croquant:{short:'Croquant',title:'Comment jugez-vous le croquant du produit ?',labels10:['Pas assez croquant','','','Idéal','','','Trop croquant']},
  acidite:{short:'Acidité',title:'Comment jugez-vous l’acidité du produit ?',labels10:['Pas assez acide','','','Idéale','','','Trop acide']},
  autre:{short:'Autre',title:'Comment jugez-vous ce critère ?',labels10:['Très insuffisant','','','Idéal','','','Très excessif']}
};
const DEFAULT_CRITERIA_KEYS=['couleur','texture','aspect','odeur','gout'];
const GENERIC_25_LABELS=['Très insuffisant','Insuffisant','Acceptable','Bon','Très bon','Excellent'];
function defaultCriteria(){return DEFAULT_CRITERIA_KEYS.map(key=>({key,custom:''}))}
function normalizeCriteria(list){
  const src=Array.isArray(list)?list:[];
  return Array.from({length:5},(_,i)=>{
    const raw=src[i];
    if(typeof raw==='string')return CRITERION_LIBRARY[raw]?{key:raw,custom:''}:{key:'autre',custom:raw};
    const key=CRITERION_LIBRARY[raw?.key]?raw.key:DEFAULT_CRITERIA_KEYS[i];
    return{key,custom:String(raw?.custom||'').trim()}
  })
}
function criterionQuestion(selection,qi){
  const sel=selection||{key:DEFAULT_CRITERIA_KEYS[qi],custom:''};
  const def=CRITERION_LIBRARY[sel.key]||CRITERION_LIBRARY.autre;
  const custom=String(sel.custom||'').trim();
  const short=sel.key==='autre'&&custom?custom:def.short;
  const title=sel.key==='autre'&&custom?`Comment jugez-vous : ${custom} ?`:def.title;
  const isMain=qi===4;
  return{
    key:sel.key,short,title,
    weights:isMain?[0,2.5,5,7.5,12.5,25]:[0,3,6,10,6,3,0],
    labels:isMain?(def.labels25||GENERIC_25_LABELS):(def.labels10||CRITERION_LIBRARY.autre.labels10)
  }
}
function criteriaForProduct(product,cfg=state?.config){
  return normalizeCriteria(product?.criteria||cfg?.criteria);
}
function juryQuestions(cfg=state?.config,product=null){
  const criteria=product?criteriaForProduct(product,cfg):normalizeCriteria(cfg?.criteria);
  return criteria.map((sel,qi)=>criterionQuestion(sel,qi));
}
function criterionShortsForConfig(cfg=state?.config,product=null){
  if(product)return juryQuestions(cfg,product).map(q=>q.short);
  const products=Array.isArray(cfg?.products)?cfg.products:[];
  if(products.length){
    const lists=products.map(p=>juryQuestions(cfg,p).map(q=>q.short));
    return Array.from({length:5},(_,qi)=>{
      const seen=[...new Set(lists.map(x=>x[qi]).filter(Boolean))];
      return seen.length===1?seen[0]:seen.length>1?`Critère ${qi+1} (variable)`:`Critère ${qi+1}`;
    });
  }
  return juryQuestions(cfg).map(q=>q.short);
}
const MARKET_2026_LOTS=[

 {lot:'12',family:'SURGELÉS',title:'LÉGUMES SURGELÉS CRUS, BLANCHIS ET HERBES AROMATIQUES',awarded:'ACHILLE BERTRAND',expiry:'31/12/2027'},
 {lot:'13',family:'SURGELÉS',title:'PRODUITS DE POMMES DE TERRE PRÉFRITES SURGELÉES ET POÊLÉES DE LÉGUMES',awarded:'POMONA PASSION FROID',expiry:'31/12/2027'},
 {lot:'14',family:'SURGELÉS',title:'PRODUITS DE LA MER SURGELÉS PRÉFRITS OU CUITS À CŒUR (+ catalogue)',awarded:'SYSCO BASE',expiry:'31/12/2027'},
 {lot:'15',family:'SURGELÉS',title:'AUTRES PRODUITS DE LA MER SURGELÉS (+ catalogue)',awarded:'SYSCO',expiry:'31/12/2027'},
 {lot:'16',family:'SURGELÉS',title:'VOLAILLES SURGELÉES (+ catalogue)',awarded:'POMONA PASSION FROID',expiry:'31/12/2027'},
 {lot:'17',family:'SURGELÉS',title:'VIANDES SURGELÉES (+ catalogue)',awarded:'SIRF VARIANTE',expiry:'31/12/2027'},
 {lot:'18',family:'SURGELÉS',title:'DESSERTS GLACÉS',awarded:'PRO A PRO',expiry:'31/12/2027'},
 {lot:'19',family:'SURGELÉS',title:'ENTRÉES CHAUDES SURGELÉES',awarded:'SYSCO',expiry:'31/12/2027'},
 {lot:'20',family:'SURGELÉS',title:'PÂTISSERIES SURGELÉES',awarded:'POMONA PASSION FROID',expiry:'31/12/2027'},
 {lot:'21',family:'SURGELÉS',title:'SURGELÉS BIOLOGIQUES',awarded:'PRO A PRO',expiry:'31/12/2027'},
 {lot:'22',family:'SURGELÉS',title:'PRODUITS SURGELÉS VÉGÉTARIENS BIOLOGIQUES',awarded:'LODIFRAIS',expiry:'31/12/2027'},
 {lot:'23',family:'SURGELÉS',title:'PRODUITS SURGELÉS VÉGÉTARIENS CONVENTIONNELS',awarded:'POMONA PASSION FROID',expiry:'31/12/2027'},
 {lot:'24',family:'VOLAILLES FRAÎCHES',title:'POULETS, POULES FRAIS CERTIFIÉS ET LABEL ROUGE',awarded:'ESTIVEAU',expiry:'31/12/2028'},
 {lot:'25',family:'VOLAILLES FRAÎCHES',title:'LAPIN, PINTADES, CANARD FRAIS ET DINDE FRAÎCHE',awarded:'ESTIVEAU',expiry:'31/12/2028'},
 {lot:'26',family:'VOLAILLES FRAÎCHES',title:'VOLAILLES BIOLOGIQUES',awarded:"BLASON D'OR",expiry:'31/12/2028'},
 {lot:'43',family:'VIANDES FRAÎCHES',title:'VIANDE FRAÎCHE DE GROS BOVINS BIOLOGIQUE OU CONVERSION BIOLOGIQUE',awarded:'MBSO',expiry:'31/12/2028'},
 {lot:'44',family:'VIANDES FRAÎCHES',title:'VIANDE FRAÎCHE DE VEAU BIOLOGIQUE OU CONVERSION BIOLOGIQUE',awarded:'MBSO',expiry:'31/12/2028'},
 {lot:'45',family:'VIANDES FRAÎCHES',title:'VIANDE FRAÎCHE DE PORC BIOLOGIQUE OU CONVERSION BIOLOGIQUE',awarded:'MBSO',expiry:'31/12/2028'},
 {lot:'46-49',family:'VIANDES FRAÎCHES',title:'VIANDE FRAÎCHE CONVENTIONNELLE DE GROS BOVINS — SECTEURS GÉO N°1, 2, 3 ET 4',awarded:'LSVLOT',expiry:'31/12/2028',note:'Le document source regroupe les lots 46 à 49 sur une même ligne.'},
 {lot:'50',family:'VIANDES FRAÎCHES',title:'VIANDE FRAÎCHE CONVENTIONNELLE DE VEAU',awarded:'ACHILLE BERTRAND',expiry:'31/12/2028'},
 {lot:'51',family:'VIANDES FRAÎCHES',title:'VIANDE FRAÎCHE CONVENTIONNELLE DE PORC',awarded:'MASSONNIERE',expiry:'31/12/2028'},
 {lot:'52',family:'VIANDES FRAÎCHES',title:"VIANDE FRAÎCHE CONVENTIONNELLE D'AGNEAU",awarded:'LSVLOT',expiry:'31/12/2028'},
 {lot:'53',family:'VIANDES FRAÎCHES',title:'VIANDE FRAÎCHE CONVENTIONNELLE DE MOUTON',awarded:'GROUPE BIGARD',expiry:'31/12/2028'}
];
const $=s=>document.querySelector(s);
const demoConfig={lotName:'Lot 12 — Légumes surgelés',subtitle:'Légumes surgelés crus',criteria:defaultCriteria(),testerCount:8,testerNames:Array.from({length:8},(_,i)=>`Testeur ${i+1}`),products:[
 {id:'p_carottes',code:'01',name:'CAROTTES RONDELLES',color:PALETTE[0],criteria:defaultCriteria(),samples:[{id:'22',supplier:'TRANSGOURMET'},{id:'23',supplier:'ACHILLE'},{id:'24',supplier:'PRO PRO'},{id:'25',supplier:'PASSION'},{id:'26',supplier:'SYSCO BASE'},{id:'27',supplier:'SYSCO VARIANTE'},{id:'28',supplier:'SIRF BASE'},{id:'29',supplier:'SIRF VARIANTE'}]},
 {id:'p_haricots',code:'02',name:'HARICOTS VERTS EXTRA FINS',color:PALETTE[1],criteria:defaultCriteria(),samples:[{id:'105',supplier:'TRANSGOURMET'},{id:'106',supplier:'ACHILLE'},{id:'107',supplier:'PRO PRO'},{id:'108',supplier:'PASSION'},{id:'109',supplier:'SYSCO BASE'},{id:'110',supplier:'SYSCO VARIANTE'},{id:'111',supplier:'SIRF BASE'},{id:'112',supplier:'SIRF VARIANTE'}]},
 {id:'p_printaniere',code:'03',name:'PRINTANIÈRE DE LÉGUMES',color:PALETTE[2],criteria:defaultCriteria(),samples:[{id:'300',supplier:'TRANSGOURMET'},{id:'301',supplier:'ACHILLE'},{id:'302',supplier:'PRO PRO'},{id:'303',supplier:'PASSION'},{id:'304',supplier:'SYSCO BASE'},{id:'305',supplier:'SYSCO VARIANTE'},{id:'306',supplier:'SIRF BASE'},{id:'307',supplier:'SIRF VARIANTE'}]}
]};
function deepClone(o){return JSON.parse(JSON.stringify(o))}
function makeInitialState(config=demoConfig){const cfg=deepClone(config);cfg.criteria=normalizeCriteria(cfg.criteria);cfg.products=(cfg.products||[]).map((p,i)=>({...p,criteria:normalizeCriteria(p.criteria||cfg.criteria),color:p.color||PALETTE[i%PALETTE.length]}));if(cfg.products[0])cfg.criteria=deepClone(cfg.products[0].criteria);const testers={};for(let i=1;i<=cfg.testerCount;i++)testers[i]={name:cfg.testerNames?.[i-1]||`Testeur ${i}`,answers:{},validatedAt:null};return{version:4,config:cfg,testers,updatedAt:null}}
function loadState(){try{const x=JSON.parse(localStorage.getItem(STORAGE_KEY));if(x?.config?._emptyAfterReset===true)return x;if(x?.config?.products?.length){x.config.criteria=normalizeCriteria(x.config.criteria);x.config.products=x.config.products.map((p,i)=>({...p,criteria:normalizeCriteria(p.criteria||x.config.criteria),color:p.color||PALETTE[i%PALETTE.length]}));if(x.config.products[0])x.config.criteria=deepClone(x.config.products[0].criteria);return x}}catch(e){}return makeInitialState()}
let state=loadState();let draftConfig=null;let pendingMarketLot='';let currentTester=1;let currentProduct=state.config.products[0]?.id||'';let currentSample=state.config.products[0]?.samples[0]?.id||'';let adminProduct=currentProduct;let selectedAdminSample='';
let testerPreviewMode=false;
let testerPreviewBackup=null;
let testerPreviewWasGuestMode=false;
const QUESTION_SHORT=['Couleur','Texture','Aspect visuel','Odeur','Goût']; // compatibilité anciennes données
const QUICK_META_PREFIX='__TC_QUICK_V39__:';
const QUICK_META_PREFIX_LEGACY='__TC_QUICK_V37__:';
const QUICK_COMMENT_PROFILES={
  generic:{positive:[],negative:[]},
  legumes:{positive:[],negative:[]},
  viande:{positive:[],negative:[]},
  poisson:{positive:[],negative:[]},
  dessert:{positive:[],negative:[]}
};
function quickCommentProfileFor(product){return QUICK_COMMENT_PROFILES.generic}

function criterionQuickOptions(qi,product,q=null){
  const name=String(product?.name||'').toLowerCase();
  const criterion=String(q?.short||criterionShortsForConfig(state?.config,product)[qi]||'').toLowerCase();
  let out={positive:['Critère satisfaisant'],negative:['À améliorer']};
  if(criterion.includes('couleur'))out={positive:['Couleur naturelle','Couleur appétissante'],negative:['Trop pâle','Trop foncé','Couleur peu naturelle']};
  else if(criterion.includes('texture'))out={positive:['Texture agréable','Bonne consistance'],negative:['Trop mou','Trop dur','Trop sec','Trop humide']};
  else if(criterion.includes('aspect'))out={positive:['Bel aspect','Bonne tenue'],negative:['Aspect peu appétissant','Morceaux irréguliers','Mauvaise tenue']};
  else if(criterion.includes('odeur'))out={positive:['Bonne odeur','Odeur agréable'],negative:['Odeur trop forte','Odeur désagréable','Peu d’odeur']};
  else if(criterion.includes('goût')||criterion.includes('gout'))out={positive:['Bon goût','Goût équilibré'],negative:['Trop fade','Trop salé','Trop sucré','Goût trop fort','Arrière-goût']};
  else if(criterion.includes('tendret'))out={positive:['Tendre','Bonne tendreté'],negative:['Trop ferme','Trop mou','Nerveux']};
  else if(criterion.includes('jutos'))out={positive:['Juteux','Bonne jutosité'],negative:['Trop sec','Trop juteux']};
  else if(criterion.includes('tenue'))out={positive:['Bonne tenue','Se tient bien'],negative:['Se défait','Mauvaise tenue','Trop ferme']};
  else if(criterion.includes('calibre')||criterion.includes('régular')||criterion.includes('regular'))out={positive:['Calibre régulier','Morceaux réguliers'],negative:['Calibre irrégulier','Morceaux irréguliers']};
  else if(criterion.includes('fermet'))out={positive:['Bonne fermeté','Fermeté agréable'],negative:['Trop mou','Trop ferme']};
  else if(criterion.includes('parfum')||criterion.includes('arôme')||criterion.includes('arome'))out={positive:['Arôme agréable','Parfum équilibré'],negative:['Arôme trop faible','Arôme trop fort','Parfum désagréable']};
  else if(criterion.includes('sucr'))out={positive:['Sucre bien équilibré'],negative:['Trop sucré','Pas assez sucré']};
  else if(criterion.includes('assaisonn'))out={positive:['Bien assaisonné'],negative:['Trop salé','Pas assez assaisonné','Trop assaisonné']};
  else if(criterion.includes('onctu'))out={positive:['Onctueux','Bonne consistance'],negative:['Trop liquide','Trop épais']};
  else if(criterion.includes('croquant'))out={positive:['Bon croquant'],negative:['Pas assez croquant','Trop croquant']};
  else if(criterion.includes('acid'))out={positive:['Acidité équilibrée'],negative:['Trop acide','Pas assez acide']};
  else out={positive:['Très satisfaisant','Satisfaisant'],negative:['À améliorer','Insuffisant']};
  out={positive:[...out.positive],negative:[...out.negative]};
  if(/yaourt|yogourt|lait|fromage|crème|creme/.test(name)){
    if(criterion.includes('texture')||criterion.includes('onctu')){out.positive.push('Crémeux');out.negative.push('Trop liquide','Trop épais')}
    if(criterion.includes('goût')||criterion.includes('gout'))out.negative.push('Trop acide','Pas assez sucré');
  }
  if(/légume|legume|haricot|carotte|chou|courget|brocoli|poireau|épinard|epinard/.test(name)){
    if(criterion.includes('texture'))out.negative.push('Trop fibreux');
    if(criterion.includes('goût')||criterion.includes('gout'))out.negative.push('Goût végétal trop fort');
  }
  if(/poisson|saumon|cabillaud|merlu|thon|truite|crevette/.test(name)){
    if(criterion.includes('texture')||criterion.includes('fermet'))out.positive.push('Chair ferme');
    if(criterion.includes('odeur'))out.negative.push('Odeur de poisson trop forte');
  }
  if(/boeuf|bœuf|veau|porc|agneau|poulet|volaille|dinde|canard|viande/.test(name)){
    if(criterion.includes('texture')||criterion.includes('tendret')){out.positive.push('Tendre','Juteux');out.negative.push('Trop ferme')}
    if(criterion.includes('goût')||criterion.includes('gout'))out.negative.push('Trop gras');
  }
  out.positive=[...new Set(out.positive)];out.negative=[...new Set(out.negative)];return out;
}
function getQuickMap(a){
  const raw=a?.remarks?.[QUESTIONS.length];
  if(typeof raw!=='string'||!raw)return{};
  if(raw.startsWith(QUICK_META_PREFIX)){
    try{
      const obj=JSON.parse(raw.slice(QUICK_META_PREFIX.length));
      return obj&&typeof obj==='object'&&!Array.isArray(obj)?obj:{}
    }catch(e){return{}}
  }
  if(raw.startsWith(QUICK_META_PREFIX_LEGACY)){
    try{
      const arr=JSON.parse(raw.slice(QUICK_META_PREFIX_LEGACY.length));
      return Array.isArray(arr)&&arr.length?{legacy:arr.map(String)}:{}
    }catch(e){return{}}
  }
  return{}
}
function getQuickTags(a,qi=null){
  const map=getQuickMap(a);
  if(qi==null)return Object.values(map).flat().map(String).filter(Boolean);
  return Array.isArray(map[String(qi)])?map[String(qi)].map(String).filter(Boolean):[]
}
function setCriterionQuickTags(a,qi,tags){
  if(!Array.isArray(a.remarks))a.remarks=[];
  while(a.remarks.length<QUESTIONS.length)a.remarks.push('');
  const map=getQuickMap(a),clean=[...new Set((tags||[]).map(x=>String(x).trim()).filter(Boolean))];
  if(clean.length)map[String(qi)]=clean;else delete map[String(qi)];
  a.remarks[QUESTIONS.length]=Object.keys(map).length?QUICK_META_PREFIX+JSON.stringify(map):'';
}
function cleanRemarkParts(txt){
  return String(txt||'')
    .split(/\s*[·•]\s*|\s*;\s*/)
    .map(x=>x.trim())
    .filter(Boolean);
}
function rebuildRemark(parts){
  return [...new Set((parts||[]).map(x=>String(x).trim()).filter(Boolean))].join(' · ');
}
function manualRemarkText(a,qi){
  const raw=String(a?.remarks?.[qi]||'').trim();
  if(!raw)return '';

  const quick=getQuickTags(a,qi).map(x=>String(x).trim()).filter(Boolean);
  if(!quick.length)return raw;

  const quickLower=new Set(quick.map(x=>x.toLocaleLowerCase('fr')));
  const parts=cleanRemarkParts(raw).filter(part=>!quickLower.has(String(part).toLocaleLowerCase('fr')));
  return rebuildRemark(parts);
}

function toggleCriterionQuickTag(a,qi,tag){
  const tags=getQuickTags(a,qi),i=tags.indexOf(tag);
  const adding=i<0;
  if(adding)tags.push(tag);else tags.splice(i,1);
  setCriterionQuickTags(a,qi,tags);

  const parts=cleanRemarkParts(a.remarks?.[qi]||'');
  const exactIndex=parts.findIndex(x=>x.toLocaleLowerCase('fr')===String(tag).toLocaleLowerCase('fr'));

  if(adding){
    if(exactIndex<0)parts.push(tag);
  }else{
    if(exactIndex>=0)parts.splice(exactIndex,1);
  }

  a.remarks[qi]=rebuildRemark(parts);
}
function sampleQuickTagStats(p,s,st=state){
  const counts=new Map();
  for(let t=1;t<=Number(st?.config?.testerCount||0);t++){
    const a=st?.testers?.[t]?.answers?.[`${p.id}__${s.id}`];
    for(let qi=0;qi<QUESTIONS.length;qi++){
      getQuickTags(a,qi).forEach(tag=>{
        const label=`${criterionShortsForConfig(st?.config,p)[qi]||`Critère ${qi+1}`} · ${tag}`;
        counts.set(label,(counts.get(label)||0)+1)
      })
    }
  }
  return [...counts.entries()].map(([tag,count])=>({tag,count})).sort((a,b)=>b.count-a.count||a.tag.localeCompare(b.tag,'fr'));
}

function collectQuickTagStats(){
  const counts=new Map();
  for(let t=1;t<=state.config.testerCount;t++){
    for(const p of state.config.products){
      if(adminProduct!=='overall'&&adminProduct!==p.id)continue;
      for(const s of p.samples||[]){
        const a=state.testers[t]?.answers?.[sampleKey(p.id,s.id)];
        for(let qi=0;qi<QUESTIONS.length;qi++){
          getQuickTags(a,qi).forEach(tag=>{
            const label=`${criterionShortsForConfig(state.config,p)[qi]||`Critère ${qi+1}`} · ${tag}`;
            counts.set(label,(counts.get(label)||0)+1)
          })
        }
      }
    }
  }
  return [...counts.entries()].map(([tag,count])=>({tag,count})).sort((a,b)=>b.count-a.count||a.tag.localeCompare(b.tag,'fr'));
}

function saveState(){
  state.updatedAt=new Date().toISOString();
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));

  /* V118 : conserver en permanence le dernier état de chaque jury actif ou préparé.
     Cela permet de passer d'un jury à l'autre sans perdre celui qui est déjà en cours. */
  try{
    if(state?.config?._preparedId && !isJuryClosed()){
      upsertPreparedJury(state);
    }
  }catch(e){}
}

const PREPARED_DEDUPE_BACKUP_V238='jm_tc_prepared_dedupe_backup_v238';

function preparedNormalizeV238(v){
  return String(v||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
}
function preparedLogicalKeyV238(st){
  const cfg=st?.config||{};
  const lot=preparedNormalizeV238(cfg.lotName||cfg.lotNumber||cfg.lotTitle||'');
  if(!lot)return '';
  const products=(Array.isArray(cfg.products)?cfg.products:[]).map(p=>{
    const name=preparedNormalizeV238(p?.name||'');
    const suppliers=(Array.isArray(p?.samples)?p.samples:[])
      .map(s=>preparedNormalizeV238(s?.supplier||'')).filter(Boolean).sort().join(',');
    return name+'['+suppliers+']';
  }).filter(Boolean).sort().join('|');
  const suppliers=(Array.isArray(cfg.supplierNames)?cfg.supplierNames:[])
    .map(preparedNormalizeV238).filter(Boolean).sort().join('|');
  return [lot,products,suppliers,Number(cfg.testerCount||0)].join('::');
}
function preparedProgressScoreV238(rec){
  const st=rec?.state||{},cfg=st.config||{};
  let score=0;
  if(cfg?.juryClose?.closedAt)score+=900000000;
  else if(cfg?.juryLaunch?.openedAt)score+=600000000;
  if(cfg?._shareSessionId||cfg?.shareSessionId)score+=50000000;
  if(Array.isArray(cfg?.receptions))score+=cfg.receptions.filter(r=>r?.validatedAt).length*1000000;
  try{
    if(typeof productSheetsProgress==='function'){
      const p=productSheetsProgress(st)||{};
      score+=Number(p.filled||0)*100000;
    }
  }catch(e){}
  for(const t of Object.values(st?.testers||{})){
    if(t?.validatedAt)score+=10000;
    score+=Object.values(t?.answers||{}).filter(a=>Array.isArray(a?.choices)&&a.choices.some(v=>v!==null&&v!==undefined)).length*100;
  }
  const at=Date.parse(rec?.savedAt||cfg?._preparedAt||'')||0;
  score+=Math.min(99999999,Math.floor(at/100000));
  return score;
}
function dedupePreparedJurysV238(rows){
  const src=Array.isArray(rows)?rows.filter(r=>r&&r.state&&r.state.config):[];
  const byKey=new Map(),withoutKey=[];
  for(const rec of src){
    const key=preparedLogicalKeyV238(rec.state);
    if(!key){withoutKey.push(rec);continue;}
    const old=byKey.get(key);
    if(!old||preparedProgressScoreV238(rec)>preparedProgressScoreV238(old))byKey.set(key,rec);
  }
  return [...byKey.values(),...withoutKey]
    .sort((a,b)=>String(b?.savedAt||'').localeCompare(String(a?.savedAt||'')));
}
function rawSupplierNamesV263(cfg){
  const out=[],seen=new Set();
  const add=v=>{
    const raw=String(v||'').trim();
    if(!raw)return;
    const key=raw.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    if(seen.has(key))return;
    seen.add(key);out.push(raw);
  };

  (Array.isArray(cfg?.supplierNames)?cfg.supplierNames:[]).forEach(add);

  (Array.isArray(cfg?.products)?cfg.products:[]).forEach(p=>
    (Array.isArray(p?.samples)?p.samples:[]).forEach(s=>add(s?.supplier))
  );

  /* V263 — les fiches produits gardent leur fournisseur même si la liste
     générale ou l'échantillon a été perdu lors d'une reprise cloud. */
  const sheets=cfg?.productSheets&&typeof cfg.productSheets==='object'
    ?Object.values(cfg.productSheets):[];
  sheets.forEach(r=>{
    add(r?.supplier);
    add(r?.receptionSupplier);
  });

  (Array.isArray(cfg?.receptions)?cfg.receptions:[]).forEach(r=>add(r?.supplier));
  return out;
}

function healSampleSuppliersFromProductSheetsV263(cfg){
  if(!cfg||typeof cfg!=='object'||!cfg.productSheets||typeof cfg.productSheets!=='object')return false;
  let changed=false;
  const products=Array.isArray(cfg.products)?cfg.products:[];

  for(const rec of Object.values(cfg.productSheets)){
    const supplier=String(rec?.supplier||rec?.receptionSupplier||'').trim();
    if(!supplier)continue;

    let p=products.find(x=>String(x?.id||'')===String(rec?.productId||''));
    if(!p&&products.length===1)p=products[0];
    if(!p)continue;

    const samples=Array.isArray(p.samples)?p.samples:[];
    const sm=samples.find(x=>String(x?.id||'')===String(rec?.sampleId||''));
    if(sm&&!String(sm.supplier||'').trim()){
      sm.supplier=supplier;
      changed=true;
    }
  }
  return changed;
}

function supplierNamesFromConfigV252(cfg){
  const out=[],seen=new Set();
  const add=v=>{
    const raw=String(v||'').trim();
    if(!raw)return;
    const key=raw.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    if(seen.has(key))return;
    seen.add(key);out.push(raw);
  };

  rawSupplierNamesV263(cfg).forEach(add);

  if(!out.length && typeof recoverSupplierNamesFromBackupsV263==='function'){
    try{recoverSupplierNamesFromBackupsV263(cfg).forEach(add)}catch(e){}
  }
  return out;
}

function healSupplierNamesV252(cfg){
  if(!cfg||typeof cfg!=='object')return false;
  let changed=false;

  try{
    if(healSampleSuppliersFromProductSheetsV263(cfg))changed=true;
  }catch(e){}

  const names=supplierNamesFromConfigV252(cfg);
  if(!names.length)return changed;

  const old=(Array.isArray(cfg.supplierNames)?cfg.supplierNames:[])
    .map(x=>String(x||'').trim()).filter(Boolean);
  const same=old.length===names.length && old.every((x,i)=>x===names[i]);

  if(!same){
    cfg.supplierNames=names;
    changed=true;
  }
  if(Number(cfg.supplierResponseCount||0)!==names.length){
    cfg.supplierResponseCount=names.length;
    changed=true;
  }
  return changed;
}

function loadPreparedJurys(){
  try{
    const raw=JSON.parse(localStorage.getItem(PREPARED_JURY_STORAGE_KEY)||'[]');
    const rows=Array.isArray(raw)?raw:[];
    const clean=dedupePreparedJurysV238(rows);
    let supplierRepair=false;
    for(const rec of clean){
      try{if(healSupplierNamesV252(rec?.state?.config))supplierRepair=true}catch(e){}
    }
    if(clean.length!==rows.length || supplierRepair){
      try{
        if(!localStorage.getItem(PREPARED_DEDUPE_BACKUP_V238)){
          localStorage.setItem(PREPARED_DEDUPE_BACKUP_V238,JSON.stringify({
            createdAt:new Date().toISOString(),
            rows
          }));
        }
        localStorage.setItem(PREPARED_JURY_STORAGE_KEY,JSON.stringify(clean));
      }catch(e){console.warn('Sauvegarde nettoyage doublons non bloquante',e)}
    }
    return clean;
  }catch(e){return[]}
}
function savePreparedJurys(rows){
  const clean=dedupePreparedJurysV238(Array.isArray(rows)?rows:[]);
  localStorage.setItem(PREPARED_JURY_STORAGE_KEY,JSON.stringify(clean));
}
function upsertPreparedJury(st=state){
  if(!st?.config)return null;
  let id=st.config._preparedId||uid('prepared');
  st.config._preparedId=id;
  st.config._preparedAt=st.config._preparedAt||new Date().toISOString();

  const rows=loadPreparedJurys();
  let i=rows.findIndex(x=>String(x.id)===String(id));

  /* V238 : si le même lot a reçu accidentellement un nouvel identifiant,
     réutiliser la fiche existante au lieu de créer un doublon. */
  if(i<0){
    const logical=preparedLogicalKeyV238(st);
    if(logical){
      i=rows.findIndex(x=>preparedLogicalKeyV238(x?.state)===logical);
      if(i>=0){
        id=String(rows[i].id||id);
        st.config._preparedId=id;
      }
    }
  }

  const rec={
    id,
    savedAt:new Date().toISOString(),
    name:st.config.lotName||'Jury préparé',
    state:deepClone(st)
  };

  if(i>=0)rows[i]=rec;
  else rows.unshift(rec);
  savePreparedJurys(rows.slice(0,30));
  return id;
}
function removePreparedJury(id){
  if(!id)return;
  savePreparedJurys(loadPreparedJurys().filter(x=>String(x.id)!==String(id)));
}
function blankActiveStateV238(){
  const security=state?.config?.security?deepClone(state.config.security):null;
  const cfg={
    _emptyAfterReset:true,
    _juryInstanceId:uid('jury'),
    lotName:'',lotNumber:'',lotTitle:'',subtitle:'',
    supplierNames:[],supplierResponseCount:0,
    receptions:[],receptionEstablishment:'',
    criteria:defaultCriteria(),
    testerCount:6,
    testerNames:Array.from({length:6},(_,i)=>`Testeur ${i+1}`),
    products:[],
    security
  };
  return makeInitialState(cfg);
}
function setActiveStateAfterPreparedDeleteV238(remaining){
  const rows=Array.isArray(remaining)?remaining:[];
  if(rows.length){
    state=deepClone(rows[0].state);
    if(!state.config._preparedId)state.config._preparedId=rows[0].id;
  }else{
    state=blankActiveStateV238();
  }
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  currentTester=1;
  currentProduct=state.config.products?.[0]?.id||'';
  currentSample=state.config.products?.[0]?.samples?.[0]?.id||'';
  adminProduct=currentProduct;
  selectedAdminSample='';
}
async function deletePreparedJuryV238(id){
  const rows=loadPreparedJurys();
  const rec=rows.find(x=>String(x.id)===String(id));
  if(!rec)return;
  const name=rec?.state?.config?.lotName||rec?.name||'ce jury';
  if(!confirm(`Supprimer « ${name} » des jurys actifs ?\n\nLes archives ne seront pas touchées.`))return;

  const remaining=rows.filter(x=>String(x.id)!==String(id));
  savePreparedJurys(remaining);

  if(String(state?.config?._preparedId||'')===String(id)){
    try{
      if(typeof disconnectCloud==='function')await disconnectCloud();
    }catch(e){}
    setActiveStateAfterPreparedDeleteV238(remaining);
  }

  toast('Jury actif supprimé ✓');
  if(remaining.length)renderJuryChooser();
  else renderHome();
}
async function clearPreparedJurysV238(){
  const rows=loadPreparedJurys();
  if(!rows.length){alert('Aucun jury actif à supprimer.');return;}
  if(!confirm(
    `Supprimer les ${rows.length} jury${rows.length>1?'s':''} actif${rows.length>1?'s':''} ?\n\n`+
    'Cela remettra les compteurs Réception chauffeur et Fiches à compléter à zéro.\n'+
    'Les archives et les modèles ne seront pas touchés.'
  ))return;

  try{
    localStorage.setItem('jm_tc_active_juries_backup_v238',JSON.stringify({
      createdAt:new Date().toISOString(),
      rows
    }));
  }catch(e){}

  savePreparedJurys([]);
  try{
    if(typeof disconnectCloud==='function')await disconnectCloud();
  }catch(e){}
  setActiveStateAfterPreparedDeleteV238([]);
  toast('Jurys actifs supprimés ✓');
  renderHome();
}
window.deletePreparedJuryV238=deletePreparedJuryV238;
window.clearPreparedJurysV238=clearPreparedJurysV238;
function ensureCurrentPrepSaved(){
  if(!state?.config||currentJuryPhase()!=='prep')return;
  if(!state.updatedAt)return; // ne transforme pas le jeu de démonstration initial en vrai jury
  if(!String(state.config.lotName||'').trim())return;
  upsertPreparedJury(state);
  saveState();
}
function preparedJuryMeta(st){
  const cfg=st?.config||{};
  const products=cfg.products||[];
  const samples=products.reduce((n,p)=>n+(p.samples||[]).length,0);
  return {products:products.length,samples,testers:Number(cfg.testerCount||0)};
}
function activatePreparedJury(id,mode='launch'){
  /* Sauvegarder le jury actuellement affiché avant de changer. */
  try{
    if(state?.config?._preparedId && !isJuryClosed()){
      saveState();
    }
  }catch(e){}

  const rec=loadPreparedJurys().find(x=>String(x.id)===String(id));
  if(!rec?.state){
    alert('Ce jury est introuvable. Revenez à l’accueil puis réessayez.');
    return;
  }

  state=deepClone(rec.state);
  if(!state.config)state.config={};
  if(!state.config._preparedId)state.config._preparedId=rec.id;

  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));

  currentTester=1;
  currentProduct=state.config.products?.[0]?.id||'';
  currentSample=state.config.products?.[0]?.samples?.[0]?.id||'';
  adminProduct=currentProduct;
  selectedAdminSample='';

  const running=!!state.config?.juryLaunch?.openedAt && !state.config?.juryClose?.closedAt;

  if(mode==='edit' && !running){
    openConfig();
    return;
  }

  if(running){
    /* V120 : ouvrir le jury immédiatement. La reconnexion cloud ne doit jamais
       bloquer le changement de jury sur téléphone/tablette. */
    renderJuryView();
    toast(`Jury « ${state.config.lotName||rec.name||'Jury'} » ouvert`);

    if(typeof ensurePreparedShareConnected==='function'){
      Promise.resolve()
        .then(()=>ensurePreparedShareConnected())
        .then(()=>{
          try{renderJuryView()}catch(e){}
        })
        .catch(e=>{
          console.error(e);
          toast('Jury ouvert — connexion téléphones à vérifier');
        });
    }
    return;
  }

  renderLaunchView();
}
function renderJuryChooser(){
  updateHeader();
  showView('juryChooserView');
  $('#headerTitle').textContent='Choisir un jury';
  $('#headerSub').textContent='Mes jurys';

  const list=$('#juryChooserList');
  if(!list)return;

  const rows=loadPreparedJurys()
    .filter(rec=>rec?.state?.config && !rec.state.config?.juryClose?.closedAt)
    .sort((a,b)=>String(b.savedAt||'').localeCompare(String(a.savedAt||'')));

  if(!rows.length){
    list.innerHTML=`
      <div class="panel empty" style="grid-column:1/-1">
        Aucun jury préparé ou en cours.
      </div>`;
    return;
  }

  const currentId=String(state?.config?._preparedId||'');

  list.innerHTML=rows.map(rec=>{
    try{
      const st=rec.state||{},cfg=st.config||{},meta=preparedJuryMeta(st);
      const running=!!cfg.juryLaunch?.openedAt&&!cfg.juryClose?.closedAt;
      let phonesReady=false;
      try{phonesReady=phoneSharePrepared(cfg)}catch(e){phonesReady=!!cfg._shareSessionId}
      const current=String(rec.id)===currentId;

      const phonesRefresh=phoneShareNeedsRefresh(cfg);
      const statusText=running
        ?'● Jury en cours'
        :phonesReady
          ?'✓ Prêt à lancer'
          :phonesRefresh
            ?'↻ Recharger les téléphones'
            :'📱 Téléphones à préparer';

      const statusClass=running?'running':phonesReady?'ready':phonesRefresh?'refresh':'waiting';

      let buttons='';
      if(running){
        buttons=`<button type="button" class="btn btn-primary" onclick="activatePreparedJury('${escapeHtml(String(rec.id))}','resume')">▶ ${current?'Reprendre ce jury':'Ouvrir ce jury'}</button>`;
      }else if(phonesReady){
        buttons=`<button type="button" class="btn btn-primary" onclick="activatePreparedJury('${escapeHtml(String(rec.id))}','launch')">▶ Continuer vers le lancement</button>`;
      }else{
        buttons=`<button type="button" class="btn btn-primary" onclick="activatePreparedJury('${escapeHtml(String(rec.id))}','launch')">${phonesRefresh?'↻ Vérifier les téléphones':'📱 Préparer les téléphones'}</button>`;
      }

      return `<article class="panel jury-choice-card ${current?'current':''}">
        <h3>${escapeHtml(cfg.lotName||rec.name||'Jury')}</h3>
        ${cfg.subtitle?`<p>${escapeHtml(cfg.subtitle)}</p>`:''}
        <span class="jury-choice-state ${statusClass}">${statusText}</span>
        <div class="jury-choice-meta">
          <span>${meta.products} produit${meta.products>1?'s':''}</span>
          <span>${meta.samples} échantillon${meta.samples>1?'s':''}</span>
          <span>${meta.testers} testeur${meta.testers>1?'s':''}</span>
        </div>
        <div class="jury-choice-actions">
          ${buttons}
          <button type="button" class="btn btn-ghost jury-delete-active-v238" onclick="deletePreparedJuryV238('${escapeHtml(String(rec.id))}')">🗑️ Supprimer ce jury actif</button>
        </div>
      </article>`;
    }catch(e){
      console.error(e);
      return '';
    }
  }).join('');
}
function scrollToPreparedJurys(){
  const box=$('#preparedJuriesHome');
  if(box&&!box.hidden){
    box.scrollIntoView({behavior:'smooth',block:'start'});
    toast('Choisissez le lot que vous voulez lancer.');
  }
}
function renderPreparedHome(){
  const section=$('#preparedJuriesHome'),list=$('#preparedHomeList'),count=$('#preparedHomeCount');
  if(!section||!list||!count)return;

  const rows=loadPreparedJurys().filter(rec=>!rec?.state?.config?.juryClose?.closedAt);
  section.hidden=!rows.length;
  count.textContent=rows.length;

  if(!rows.length){
    list.innerHTML='';
    return
  }

  const currentId=state?.config?._preparedId||'';

  list.innerHTML=rows.map(rec=>{
    const st=rec.state||{},cfg=st.config||{},meta=preparedJuryMeta(st);
    const title=escapeHtml(cfg.lotName||rec.name||'Jury');
    const subtitle=escapeHtml(cfg.subtitle||'');
    const phonesReady=phoneSharePrepared(cfg);
    const running=!!cfg.juryLaunch?.openedAt && !cfg.juryClose?.closedAt;
    const current=String(rec.id)===String(currentId);

    const status=running
      ?'● Jury en cours'
      :phonesReady
        ?'✓ Téléphones prêts'
        :'📱 Téléphones à préparer';

    const actions=running
      ?`<button class="btn btn-primary" data-prepared-resume="${escapeHtml(rec.id)}">${current?'▶ Reprendre ce jury':'▶ Ouvrir ce jury'}</button>`
      :`<button class="btn btn-secondary" data-prepared-edit="${escapeHtml(rec.id)}">Modifier</button>
        <button class="btn btn-primary" data-prepared-launch="${escapeHtml(rec.id)}" ${phonesReady?'':'disabled'}>▶ Lancer ce jury</button>`;

    return `<article class="prepared-jury-card ${current?'current-jury-card':''}">
      <div class="prepared-top">
        <div>
          <h3>${title}</h3>
          ${subtitle?`<p>${subtitle}</p>`:''}
        </div>
        <span class="prepared-ready">${status}</span>
      </div>
      <div class="prepared-jury-meta">
        <span>${meta.products} produit${meta.products>1?'s':''}</span>
        <span>${meta.samples} échantillon${meta.samples>1?'s':''}</span>
        <span>${meta.testers} testeur${meta.testers>1?'s':''}</span>
      </div>
      <div class="prepared-jury-actions">
        ${actions}
      </div>
    </article>`;
  }).join('');

  list.querySelectorAll('[data-prepared-edit]').forEach(
    b=>b.onclick=()=>activatePreparedJury(b.dataset.preparedEdit,'edit')
  );
  list.querySelectorAll('[data-prepared-launch]').forEach(
    b=>b.onclick=()=>activatePreparedJury(b.dataset.preparedLaunch,'launch')
  );
  list.querySelectorAll('[data-prepared-resume]').forEach(
    b=>b.onclick=()=>activatePreparedJury(b.dataset.preparedResume,'resume')
  );
}
function showView(id){
  if(id!=='projectionView'&&typeof stopProjectionMode==='function')stopProjectionMode(false);
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  $('#'+id).classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
}
function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function fmt(n){return Number(n||0).toLocaleString('fr-FR',{maximumFractionDigits:1})}
function uid(prefix='p'){return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`}
function totalSamples(){return state.config.products.reduce((a,p)=>a+p.samples.length,0)}
function validKeys(cfg=state.config){const s=new Set();cfg.products.forEach(p=>p.samples.forEach(x=>s.add(`${p.id}__${x.id}`)));return s}
function getProduct(id){return state.config.products.find(p=>p.id===id)}
function sampleKey(pid,sid){return `${pid}__${sid}`}
function ensureAnswer(t,pid,sid){const tdata=state.testers[t];const k=sampleKey(pid,sid);if(!tdata.answers[k])tdata.answers[k]={choices:Array(QUESTIONS.length).fill(null),remarks:Array(QUESTIONS.length).fill('')};const a=tdata.answers[k];if(!Array.isArray(a.choices))a.choices=Array(QUESTIONS.length).fill(null);while(a.choices.length<QUESTIONS.length)a.choices.push(null);if(!Array.isArray(a.remarks))a.remarks=Array(QUESTIONS.length).fill('');while(a.remarks.length<QUESTIONS.length)a.remarks.push('');return a}
function complete(a){return !!a&&a.choices.length===QUESTIONS.length&&a.choices.every(x=>x!==null&&x!==undefined)}
function calcScore(a){return a.choices.reduce((sum,idx,q)=>sum+(idx==null?0:QUESTIONS[q].weights[idx]),0)}
function testerCompleted(t){let n=0;state.config.products.forEach(p=>p.samples.forEach(s=>{const a=state.testers[t]?.answers[sampleKey(p.id,s.id)];if(complete(a))n++}));return n}
function testerValidated(t){return !!state.testers[t]?.validatedAt}
function validatedCount(){let n=0;for(let t=1;t<=state.config.testerCount;t++)if(testerValidated(t))n++;return n}
function formatValidationDate(v){if(!v)return '';try{return new Date(v).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}catch(e){return ''}}
function firstIncompleteSample(t){for(const p of state.config.products)for(const sm of p.samples){const a=state.testers[t]?.answers[sampleKey(p.id,sm.id)];if(!complete(a))return{pid:p.id,sid:sm.id}}return null}
function validateTesterFinal(t=currentTester){if(testerMustWaitForLaunch()){alert('Le jury n’est pas encore lancé. Attendez que le responsable du jury ouvre la dégustation.');renderSample();return}if(isJuryClosed()){alert('Le jury est fermé. Aucune modification n’est possible.');return}const total=totalSamples(),done=testerCompleted(t);if(total===0)return;if(done!==total){const miss=firstIncompleteSample(t);alert(`Votre test n’est pas terminé : ${done}/${total} échantillons sont complets.`);if(miss){currentTester=t;currentProduct=miss.pid;currentSample=miss.sid;renderTesterSelectors();renderSample();setTimeout(()=>document.querySelector('.question-card.missing')?.scrollIntoView({behavior:'smooth',block:'center'}),100)}return}if(testerValidated(t)){toast('Ce test est déjà validé et verrouillé.');return}state.testers[t].validatedAt=new Date().toISOString();saveState();renderSample();toast('Test validé ✓')}
function unlockTester(t){if(isJuryClosed()){alert('Le jury est fermé. Les tests sont définitivement verrouillés.');return}if(!testerValidated(t))return;if(!confirm(`Déverrouiller ${state.testers[t]?.name||`Testeur ${t}`} ?\n\nSes notes pourront de nouveau être modifiées.`))return;state.testers[t].validatedAt=null;saveState();if(document.getElementById('juryView')?.classList.contains('active'))renderJuryView();if(document.getElementById('adminView')?.classList.contains('active'))renderAdmin();toast('Testeur déverrouillé')}
function totalCompleted(){let n=0;for(let t=1;t<=state.config.testerCount;t++)n+=testerCompleted(t);return n}
function toast(msg){const x=$('#toast');x.textContent=msg;x.classList.add('show');clearTimeout(x._t);x._t=setTimeout(()=>x.classList.remove('show'),1800)}
function lotDisplayParts(){const cfg=state.config;const raw=String(cfg.lotName||'').trim();const m=raw.match(/^lot\s*([0-9]+(?:\s*[àa-]\s*[0-9]+)?|[0-9]+(?:-[0-9]+)?)/i);if(m){return{title:`LOT ${m[1].toUpperCase()}`,subtitle:cfg.subtitle||raw.slice(m[0].length).replace(/^[\s—–-]+/,'').trim()||'Jury Marchés'}}return{title:raw||'Tests culinaires',subtitle:cfg.subtitle||'Jury Marchés • Tests culinaires'}}
function juryMetrics(){const total=totalSamples(),max=state.config.testerCount*total,done=totalCompleted(),finished=Array.from({length:state.config.testerCount},(_,i)=>i+1).filter(t=>testerCompleted(t)===total&&total>0).length,validated=validatedCount(),pct=max?Math.round(done/max*100):0;return{total,max,done,finished,validated,pct,remaining:Math.max(0,max-done)}}
function updateHeader(){const p=lotDisplayParts();$('#headerTitle').textContent=p.title;$('#headerSub').textContent=p.subtitle}

function currentJuryPhase(){
  if(isJuryClosed())return 'done';
  /* Une réponse enregistrée avant l’ouverture officielle ne doit jamais faire
     passer le jury en « en cours ». Seul le bouton « Lancer ce jury » ouvre la dégustation. */
  if(isJuryOfficiallyOpen())return 'run';
  return 'prep';
}
function juryCardMeta(st=state){
  const cfg=st.config||{};
  const products=cfg.products||[];
  const samples=products.reduce((n,p)=>n+(p.samples||[]).length,0);
  return{products:products.length,samples,testers:Number(cfg.testerCount||0)};
}
function renderCurrentDashboardCard(phase){
  const cfg=state.config||{},m=juryMetrics(),meta=juryCardMeta(state),parts=lotDisplayParts();
  const opened=isJuryOfficiallyOpen(),closed=isJuryClosed();
  const statusText=phase==='prep'?'À préparer':phase==='run'?'En cours':'Fermé';
  const badge=`<span class="jury-mini-badge ${phase}">${statusText}</span>`;
  let detail='';
  if(phase==='prep')detail='Paramétrage prêt à être contrôlé avant ouverture.';
  else if(phase==='run')detail=`${m.done}/${m.max||0} fiche${m.max>1?'s':''} complète${m.done>1?'s':''} · ${m.validated}/${cfg.testerCount} validation${cfg.testerCount>1?'s':''}.`;
  else detail=`Fermé le ${escapeHtml(fmtCloseDate(juryCloseInfo().closedAt))}.`;
  let actions='';
  if(phase==='prep')actions=`<button class="btn btn-secondary" data-dash-action="edit">Modifier</button><button class="btn btn-primary" data-dash-action="open">Contrôler et lancer</button>`;
  else if(phase==='run')actions=`<button class="btn btn-primary" data-dash-action="live">Mode jour du jury</button><button class="btn btn-secondary" data-dash-action="results">Résultats</button>`;
  else actions=`<button class="btn btn-primary" data-dash-action="results">Résultats</button><button class="btn btn-secondary" data-dash-action="closure">Clôture</button>`;
  return `<article class="jury-mini-card">
    <div class="top"><div><div class="eyebrow">Jury actuel${opened&&!closed?' · ouvert':''}</div><h4>${escapeHtml(parts.title||cfg.lotName||'Jury')}</h4><p>${escapeHtml(parts.subtitle||cfg.subtitle||'')}</p></div>${badge}</div>
    <div class="jury-mini-meta"><span>${meta.products} produit${meta.products>1?'s':''}</span><span>${meta.samples} échantillon${meta.samples>1?'s':''}</span><span>${meta.testers} testeur${meta.testers>1?'s':''}</span></div>
    ${phase==='run'?`<div class="jury-mini-progress"><span style="width:${m.pct}%"></span></div>`:''}
    <p style="margin-top:7px">${detail}</p>
    <div class="jury-mini-actions">${actions}</div>
  </article>`;
}
function renderPreparedDashboardCard(rec){
  const st=rec.state||{},cfg=st.config||{},meta=preparedJuryMeta(st),phonesReady=phoneSharePrepared(cfg),phonesRefresh=phoneShareNeedsRefresh(cfg);
  const running=!!cfg.juryLaunch?.openedAt&&!cfg.juryClose?.closedAt;
  return `<article class="jury-mini-card">
    <div class="top">
      <div>
        <div class="eyebrow">${running?'Jury en cours':'Jury préparé'}</div>
        <h4>${escapeHtml(cfg.lotName||rec.name||'Jury')}</h4>
        <p>${escapeHtml(cfg.subtitle||'')}</p>
      </div>
      <span class="jury-mini-badge ${phonesRefresh?'refresh':'prep'}">${running?'En cours':phonesReady?'Téléphones prêts':phonesRefresh?'↻ Recharger les téléphones':'À préparer'}</span>
    </div>
    <div class="jury-mini-meta">
      <span>${meta.products} produit${meta.products>1?'s':''}</span>
      <span>${meta.samples} échantillon${meta.samples>1?'s':''}</span>
      <span>${meta.testers} testeur${meta.testers>1?'s':''}</span>
    </div>
    <div class="jury-mini-actions">
      ${running
        ?`<button class="btn btn-primary" data-prepared-resume="${escapeHtml(rec.id)}">Reprendre</button>`
        :`<button class="btn btn-secondary" data-prepared-edit="${escapeHtml(rec.id)}">Modifier</button><button class="btn btn-primary" data-prepared-launch="${escapeHtml(rec.id)}" ${phonesReady?'':'disabled'}>Lancer</button>`}
    </div>
  </article>`;
}

function renderArchiveDashboardCard(rec){
  const st=rec.state||{},cfg=st.config||{},meta=juryCardMeta(st);
  const date=formatArchiveDate(rec.archivedAt);
  const p=String(cfg.lotName||'Jury archivé');
  return `<article class="jury-mini-card">
    <div class="top"><div><div class="eyebrow">Archivé le ${escapeHtml(date)}</div><h4>${escapeHtml(p)}</h4><p>${escapeHtml(cfg.subtitle||'')}</p></div><span class="jury-mini-badge done">Archivé</span></div>
    <div class="jury-mini-meta"><span>${meta.products} produit${meta.products>1?'s':''}</span><span>${meta.samples} échantillon${meta.samples>1?'s':''}</span><span>${meta.testers} testeur${meta.testers>1?'s':''}</span></div>
    <div class="jury-mini-actions"><button class="btn btn-primary" data-dash-archive-dossier="${escapeHtml(rec.id)}">Dossier</button><button class="btn btn-secondary" data-dash-archive-summary="${escapeHtml(rec.id)}">Synthèse</button><button class="btn btn-secondary" data-dash-archive-report="${escapeHtml(rec.id)}">Rapport</button><button class="btn btn-secondary" data-dash-archive-minutes="${escapeHtml(rec.id)}">PV</button><button class="btn btn-secondary" data-dash-archive-copy="${escapeHtml(rec.id)}">Créer à partir de ce jury</button></div>
  </article>`;
}
function preserveClosedJuryBeforeNew(){
  if(!isJuryClosed())return null;
  try{
    if(typeof createRecoverySnapshot==='function')createRecoverySnapshot('milestone','Avant création d’un nouveau jury',true);
  }catch(e){}
  try{
    const now=new Date().toISOString();
    const current=deepClone(state);
    const previous=current?.config?._archive||{};
    const id=previous.archiveId||((typeof crypto!=='undefined'&&crypto.randomUUID)?crypto.randomUUID():`archive_${Date.now()}`);
    if(current.config){
      current.config._archive={
        ...previous,
        archiveId:id,
        archivedAt:previous.archivedAt||now,
        cloudSessionId:(typeof cloudCfg!=='undefined'&&cloudCfg.sessionId)?cloudCfg.sessionId:(previous.cloudSessionId||null),
        autoPreservedBeforeNew:true
      };
    }
    const rec={id,archivedAt:current.config?._archive?.archivedAt||now,cloudSessionId:current.config?._archive?.cloudSessionId||null,state:current};
    const list=loadArchives();
    const i=list.findIndex(x=>x.id===id);
    if(i>=0)list[i]=rec;else list.unshift(rec);
    saveArchives(list.slice(0,100));
    return id;
  }catch(e){
    console.warn('Conservation du jury fermé impossible',e);
    return null;
  }
}
function showBothCreationMethods(){
  const wrap=$('#creationMethods');
  const market=$('#marketMethodCard');
  const blank=$('#blankMethodCard');
  if(wrap)wrap.classList.remove('one-selected');
  if(market)market.classList.remove('method-card-hidden');
  if(blank)blank.classList.remove('method-card-hidden');
}
function keepOnlyCreationMethod(method){
  const wrap=$('#creationMethods');
  const market=$('#marketMethodCard');
  const blank=$('#blankMethodCard');
  if(!wrap||!market||!blank)return;
  wrap.classList.add('one-selected');
  if(method==='market'){
    market.classList.remove('method-card-hidden');
    blank.classList.add('method-card-hidden');
  }else if(method==='blank'){
    blank.classList.remove('method-card-hidden');
    market.classList.add('method-card-hidden');
  }
}

function cleanSampleMaster(rows){
  const src=Array.isArray(rows)?rows:[];
  const seen=new Set();
  return src.map(s=>({
    id:String(s?.id||'').trim(),
    supplier:String(s?.supplier||'').trim()
  })).filter(s=>{
    if(!s.id&&!s.supplier)return false;
    const key=s.id.toLocaleLowerCase('fr-FR');
    if(s.id&&seen.has(key))return false;
    if(s.id)seen.add(key);
    return true;
  });
}
function cleanSampleMasterMeta(meta){
  meta=meta&&typeof meta==='object'?meta:{};
  const supplierNames=(Array.isArray(meta.supplierNames)?meta.supplierNames:[])
    .map(x=>String(x||'').trim()).filter(Boolean);
  const legacyCount=Math.max(0,parseInt(meta.supplierResponseCount||0,10)||0);
  const supplierResponseCount=supplierNames.length||legacyCount;
  return {
    lotNumber:String(meta.lotNumber||'').trim().replace(/^lot\s*/i,''),
    lotTitle:String(meta.lotTitle||'').trim(),
    productName:String(meta.productName||'').trim(),
    supplierNames,
    supplierResponseCount
  };
}
function loadSampleMasterMeta(){
  try{return cleanSampleMasterMeta(JSON.parse(localStorage.getItem(SAMPLE_MASTER_META_STORAGE_KEY)||'{}'))}
  catch(e){return{lotNumber:'',lotTitle:'',productName:'',supplierNames:[],supplierResponseCount:0}}
}
function saveSampleMasterMeta(meta){
  const clean=cleanSampleMasterMeta(meta);
  localStorage.setItem(SAMPLE_MASTER_META_STORAGE_KEY,JSON.stringify(clean));
  return clean;
}
function lotNameFromSampleMeta(meta){
  const m=cleanSampleMasterMeta(meta);
  if(m.lotNumber&&m.lotTitle)return `Lot ${m.lotNumber} — ${m.lotTitle}`;
  if(m.lotNumber)return `Lot ${m.lotNumber}`;
  return m.lotTitle||'';
}
function deriveSampleMetaFromConfig(cfg){
  const supplierNames=Array.isArray(cfg?.supplierNames)?cfg.supplierNames:[];
  const direct=cleanSampleMasterMeta({lotNumber:cfg?.lotNumber,lotTitle:cfg?.lotTitle,productName:cfg?.products?.[0]?.name||'',supplierNames,supplierResponseCount:cfg?.supplierResponseCount||0});
  if(direct.lotNumber||direct.lotTitle)return direct;
  const raw=String(cfg?.lotName||'').trim();
  const m=raw.match(/^lot\s*([^—–-]+?)\s*[—–-]\s*(.+)$/i);
  if(m)return cleanSampleMasterMeta({lotNumber:m[1],lotTitle:m[2],productName:cfg?.products?.[0]?.name||'',supplierNames,supplierResponseCount:cfg?.supplierResponseCount||0});
  const n=raw.match(/^lot\s*(.+)$/i);
  return n?cleanSampleMasterMeta({lotNumber:n[1],lotTitle:'',productName:cfg?.products?.[0]?.name||'',supplierNames,supplierResponseCount:cfg?.supplierResponseCount||0}):cleanSampleMasterMeta({lotNumber:'',lotTitle:'',productName:cfg?.products?.[0]?.name||'',supplierNames,supplierResponseCount:cfg?.supplierResponseCount||0});
}
function updateSampleLotPreview(){
  const num=$('#sampleLotNumber')?.value||'';
  const title=$('#sampleLotTitle')?.value||'';
  const text=lotNameFromSampleMeta({lotNumber:num,lotTitle:title});
  const el=$('#sampleLotPreview');
  if(el){
    const count=(Array.isArray(sampleProductsSetupDraft)?sampleProductsSetupDraft:[]).filter(p=>String(p?.name||'').trim()).length;
    const suppliers=(Array.isArray(sampleSuppliersSetupDraft)?sampleSuppliersSetupDraft:[]).filter(x=>String(x||'').trim()).length;
    el.innerHTML=`Intitulé du jury : <strong>${escapeHtml(text||'à compléter')}</strong>${count?`<br>${count} produit${count>1?'s':''} préparé${count>1?'s':''}`:''}${suppliers?` · ${suppliers} fournisseur${suppliers>1?'s':''} ayant répondu`:''}`;
  }
}

function loadSampleMaster(){
  try{
    const rows=JSON.parse(localStorage.getItem(SAMPLE_MASTER_STORAGE_KEY)||'[]');
    return cleanSampleMaster(rows);
  }catch(e){return[]}
}
function saveSampleMaster(rows){
  const clean=cleanSampleMaster(rows);
  localStorage.setItem(SAMPLE_MASTER_STORAGE_KEY,JSON.stringify(clean));
  return clean;
}
function cleanSampleProducts(list){
  const src=Array.isArray(list)?list:[];
  return src.map((p,i)=>{
    const samples=cleanSampleMaster((Array.isArray(p?.samples)?p.samples:[]).map(s=>({id:s?.id||'',supplier:''})))
      .filter(s=>s.id).map(s=>({id:s.id,supplier:''}));
    return {name:String(p?.name||'').trim(),samples:samples.length?samples:[{id:'',supplier:''}]};
  }).filter(p=>p.name||p.samples.some(s=>String(s.id||'').trim()));
}
function loadSampleProducts(){
  try{
    const saved=cleanSampleProducts(JSON.parse(localStorage.getItem(SAMPLE_PRODUCTS_STORAGE_KEY)||'[]'));
    if(saved.length)return saved;
  }catch(e){}
  const meta=loadSampleMasterMeta();
  const oldSamples=loadSampleMaster().filter(s=>s.id).map(s=>({id:s.id,supplier:''}));
  if(meta.productName||oldSamples.length)return [{name:meta.productName||'',samples:oldSamples.length?oldSamples:[{id:'',supplier:''}]}];
  return [{name:'',samples:[{id:'',supplier:''}]}];
}
function saveSampleProducts(list){
  const clean=cleanSampleProducts(list);
  localStorage.setItem(SAMPLE_PRODUCTS_STORAGE_KEY,JSON.stringify(clean));
  return clean;
}
function loadSampleLotHistory(){
  try{
    const rows=JSON.parse(localStorage.getItem(SAMPLE_LOT_HISTORY_STORAGE_KEY)||'[]');
    return Array.isArray(rows)?rows:[];
  }catch(e){return[]}
}
function saveSampleLotHistory(rows){
  localStorage.setItem(SAMPLE_LOT_HISTORY_STORAGE_KEY,JSON.stringify(Array.isArray(rows)?rows.slice(0,40):[]));
}
function sampleLotSnapshotSignature(meta,products){
  const cleanMeta=cleanSampleMasterMeta(meta);
  const lot=String(lotNameFromSampleMeta(cleanMeta)||'').toLowerCase();
  const list=Array.isArray(products)?products:[];
  const prods=list.map(p=>String(p?.name||'').trim().toLowerCase()).filter(Boolean).join('|');
  const suppliers=(Array.isArray(cleanMeta.supplierNames)?cleanMeta.supplierNames:[])
    .map(x=>String(x||'').trim().toLowerCase()).filter(Boolean).sort().join('|');
  return `${lot}::${prods}::${suppliers}`;
}
function saveSampleLotSnapshot(meta,products){
  const cleanMeta=cleanSampleMasterMeta(meta);
  const cleanProducts=cleanSampleProducts(products);
  const lotName=lotNameFromSampleMeta(cleanMeta);
  if(!lotName || !cleanProducts.length)return null;

  const signature=sampleLotSnapshotSignature(cleanMeta,cleanProducts);
  const rows=loadSampleLotHistory();
  const existing=rows.find(x=>x.signature===signature);
  const rec={
    id:existing?.id||uid('samplelot'),
    savedAt:new Date().toISOString(),
    lotName,
    meta:deepClone(cleanMeta),
    products:deepClone(cleanProducts),
    signature
  };
  const filtered=rows.filter(x=>x.id!==rec.id && x.signature!==signature);
  filtered.unshift(rec);
  saveSampleLotHistory(filtered);
  return rec;
}
function restoreSampleLotSnapshot(rec){
  if(!rec?.meta||!Array.isArray(rec?.products))return false;
  saveSampleMasterMeta(rec.meta);
  const products=saveSampleProducts(rec.products);
  saveSampleMaster((products[0]?.samples||[]).map(s=>({id:s.id,supplier:''})));
  return true;
}
function masterSamplesForNewProduct(){
  const products=loadSampleProducts();
  const rows=products?.[0]?.samples||loadSampleMaster();
  return rows?.length?rows.map(s=>({id:String(s?.id||'').trim(),supplier:''})):[{id:'',supplier:''}];
}
function samplesForAddedProduct(){
  const first=Array.isArray(draftConfig?.products?.[0]?.samples)?draftConfig.products[0].samples:[];
  const rows=first.map(s=>({id:String(s?.id||'').trim(),supplier:String(s?.supplier||'').trim()})).filter(s=>s.id||s.supplier);
  return rows.length?rows.map(s=>({...s})):sampleRowsFromSuppliers(draftConfig?.supplierNames||loadSampleMasterMeta()?.supplierNames||[]);
}
function sampleRowsFromSuppliers(list){
  const names=(Array.isArray(list)?list:[]).map(x=>String(x||'').trim()).filter(Boolean);
  return names.length?names.map(name=>({id:'',supplier:name})):[{id:'',supplier:''}];
}
/* V157 — fournisseurs repris automatiquement ; bouton « Ajouter un échantillon » supprimé.
   V156 — chaque produit reprend automatiquement tous les fournisseurs saisis au départ.
   On conserve les numéros d'échantillons déjà tapés quand ils existent. */
function rowsForAllSuppliers(existing,list){
  const names=(Array.isArray(list)?list:[]).map(x=>String(x||'').trim()).filter(Boolean);
  const old=Array.isArray(existing)?existing:[];
  if(!names.length)return old.length?old:[{id:'',supplier:''}];
  const used=new Set();
  const rows=names.map((name,i)=>{
    let idx=old.findIndex((r,j)=>!used.has(j)&&String(r?.supplier||'').trim().toLowerCase()===name.toLowerCase());
    if(idx<0 && old[i] && !used.has(i))idx=i;
    if(idx>=0)used.add(idx);
    const prev=idx>=0?old[idx]:null;
    return {id:String(prev?.id||'').trim(),supplier:name};
  });
  /* Conserver d'éventuelles lignes supplémentaires ajoutées manuellement. */
  old.forEach((r,j)=>{
    if(used.has(j))return;
    const id=String(r?.id||'').trim(),supplier=String(r?.supplier||'').trim();
    if(id||supplier)rows.push({id,supplier});
  });
  return rows;
}
function samplesHaveContent(list){
  return (Array.isArray(list)?list:[]).some(s=>String(s?.id||'').trim()||String(s?.supplier||'').trim());
}
let sampleSuppliersSetupDraft=[];
function renderSampleSuppliersSetup(){
  const box=$('#sampleSuppliersSetup');if(!box)return;
  if(!Array.isArray(sampleSuppliersSetupDraft)||!sampleSuppliersSetupDraft.length)sampleSuppliersSetupDraft=[''];
  box.innerHTML=sampleSuppliersSetupDraft.map((name,i)=>`
    <div class="sample-supplier-row">
      <div class="field">
        <label>Fournisseur n°${i+1}</label>
        <input data-setup-supplier-name="${i}" value="${escapeHtml(name||'')}" placeholder="Ex. PASSIONFROID" autocomplete="off">
      </div>
      ${i>0?`<button class="btn btn-danger btn-small" type="button" data-remove-setup-supplier="${i}" title="Supprimer ce fournisseur">×</button>`:'<span></span>'}
    </div>`).join('');
  box.querySelectorAll('[data-setup-supplier-name]').forEach(inp=>inp.oninput=e=>{
    sampleSuppliersSetupDraft[Number(e.target.dataset.setupSupplierName)]=e.target.value;
    updateSampleLotPreview();
    const n=sampleSuppliersSetupDraft.filter(x=>String(x||'').trim()).length;
    const note=$('#sampleSupplierCountNote');if(note)note.textContent=n?`${n} fournisseur${n>1?'s':''} renseigné${n>1?'s':''}`:'Aucun fournisseur renseigné';
  });
  box.querySelectorAll('[data-remove-setup-supplier]').forEach(btn=>btn.onclick=e=>{
    sampleSuppliersSetupDraft.splice(Number(e.currentTarget.dataset.removeSetupSupplier),1);
    if(!sampleSuppliersSetupDraft.length)sampleSuppliersSetupDraft=[''];
    renderSampleSuppliersSetup();updateSampleLotPreview();
  });
  const n=sampleSuppliersSetupDraft.filter(x=>String(x||'').trim()).length;
  const note=$('#sampleSupplierCountNote');if(note)note.textContent=n?`${n} fournisseur${n>1?'s':''} renseigné${n>1?'s':''}`:'Aucun fournisseur renseigné';
}
function addSetupSupplier(){
  sampleSuppliersSetupDraft.push('');
  renderSampleSuppliersSetup();
  requestAnimationFrame(()=>{
    const inputs=document.querySelectorAll('#sampleSuppliersSetup [data-setup-supplier-name]');
    const last=inputs[inputs.length-1];last?.focus();last?.scrollIntoView({behavior:'smooth',block:'center'});
  });
}
let sampleProductsSetupDraft=[];
function renderSampleProductsSetup(){
  const box=$('#sampleProductsSetup');if(!box)return;
  if(!Array.isArray(sampleProductsSetupDraft)||!sampleProductsSetupDraft.length){
    sampleProductsSetupDraft=[{name:'',samples:[]}];
  }
  box.innerHTML=sampleProductsSetupDraft.map((p,pi)=>`
    <section class="panel sample-product-card" data-sample-product-card="${pi}">
      <div class="sample-product-head">
        <div class="sample-product-title">Produit n°${pi+1}</div>
        ${pi>0?`<button class="btn btn-danger btn-small" type="button" data-remove-setup-product="${pi}">Supprimer le produit</button>`:''}
      </div>
      <div class="field">
        <label>Nom du produit</label>
        <input data-setup-product-name="${pi}" value="${escapeHtml(p.name||'')}" placeholder="Ex. Haricots verts extra-fins surgelés" autocomplete="off">
      </div>
    </section>`).join('');

  box.querySelectorAll('[data-setup-product-name]').forEach(inp=>inp.oninput=e=>{
    sampleProductsSetupDraft[Number(e.target.dataset.setupProductName)].name=e.target.value;
    updateSampleLotPreview();
  });
  box.querySelectorAll('[data-remove-setup-product]').forEach(btn=>btn.onclick=e=>{
    const pi=Number(e.currentTarget.dataset.removeSetupProduct);
    sampleProductsSetupDraft.splice(pi,1);
    if(!sampleProductsSetupDraft.length)sampleProductsSetupDraft=[{name:'',samples:[]}];
    renderSampleProductsSetup();
    updateSampleLotPreview();
  });
  updateSampleLotPreview();
}
function addSetupProduct(){
  sampleProductsSetupDraft.push({name:'',samples:[]});
  renderSampleProductsSetup();
  requestAnimationFrame(()=>{
    const cards=document.querySelectorAll('#sampleProductsSetup [data-sample-product-card]');
    const last=cards[cards.length-1];
    last?.querySelector('[data-setup-product-name]')?.focus();
    last?.scrollIntoView({behavior:'smooth',block:'center'});
  });
}
function openSampleSetup(){
  /* V159 : « Choix des échantillons » sert à créer un NOUVEAU lot.
     Le formulaire repart donc vierge à chaque nouvelle ouverture depuis l’accueil.
     Cela ne touche pas au jury déjà enregistré : ses données restent dans draftConfig/state. */
  sampleProductsSetupDraft=[{name:'',samples:[]}];
  sampleSuppliersSetupDraft=[''];
  showView('sampleSetupView');
  $('#headerTitle').textContent='Choix des échantillons';
  $('#headerSub').textContent='Nouveau lot · saisie vierge';
  const num=$('#sampleLotNumber'),title=$('#sampleLotTitle');
  if(num){num.value='';num.oninput=updateSampleLotPreview;}
  if(title){title.value='';title.oninput=updateSampleLotPreview;}
  renderSampleProductsSetup();
  renderSampleSuppliersSetup();
  updateSampleLotPreview();
  requestAnimationFrame(()=>num?.focus());
}
function commitSampleMaster({continueToJury=false}={}){
  const supplierNames=(Array.isArray(sampleSuppliersSetupDraft)?sampleSuppliersSetupDraft:[]).map(x=>String(x||'').trim());
  const meta=cleanSampleMasterMeta({lotNumber:$('#sampleLotNumber')?.value,lotTitle:$('#sampleLotTitle')?.value,productName:sampleProductsSetupDraft?.[0]?.name||'',supplierNames});
  if(!meta.lotNumber){alert('Indiquez le numéro du lot avant de continuer.');$('#sampleLotNumber')?.focus();return false;}
  if(!meta.lotTitle){alert('Indiquez le nom du lot avant de continuer.');$('#sampleLotTitle')?.focus();return false;}
  const missingSupplier=supplierNames.findIndex(x=>!x);
  if(missingSupplier>=0){alert(`Indiquez le nom du Fournisseur n°${missingSupplier+1}.`);document.querySelector(`[data-setup-supplier-name="${missingSupplier}"]`)?.focus();return false;}
  if(!meta.supplierNames.length){alert('Ajoutez au moins un fournisseur ayant répondu à l’offre pour ce lot.');$('#sampleAddSupplierBtn')?.focus();return false;}
  if(!Array.isArray(sampleProductsSetupDraft)||!sampleProductsSetupDraft.length){alert('Ajoutez au moins un produit.');return false;}
  for(let pi=0;pi<sampleProductsSetupDraft.length;pi++){
    const p=sampleProductsSetupDraft[pi];
    if(!String(p?.name||'').trim()){
      alert(`Indiquez le nom du Produit n°${pi+1}.`);
      document.querySelector(`[data-setup-product-name="${pi}"]`)?.focus();return false;
    }
  }
  /* V252 — un nouveau lot valide met fin au mode "lots remis à zéro". */
  try{localStorage.removeItem('jm_tc_lots_clean_mode_v207')}catch(e){}
  const products=saveSampleProducts(sampleProductsSetupDraft);
  const firstName=products[0]?.name||'';
  const savedMeta=saveSampleMasterMeta({...meta,productName:firstName});
  saveSampleMaster((products[0]?.samples||[]).map(s=>({id:s.id,supplier:''})));
  saveSampleLotSnapshot(savedMeta,products);
  sampleProductsSetupDraft=products.map(p=>({name:p.name,samples:p.samples.map(s=>({id:s.id,supplier:''}))}));
  toast('Lot enregistré ✓ · il restera disponible dans « Préparer le jury »');

  if(draftConfig){
    draftConfig.lotNumber=meta.lotNumber;
    draftConfig.lotTitle=meta.lotTitle;
    draftConfig.supplierNames=[...meta.supplierNames];
    draftConfig.supplierResponseCount=meta.supplierNames.length;
    draftConfig.lotName=lotNameFromSampleMeta(meta);
    draftConfig.products=products.map((p,i)=>{
      const old=draftConfig.products?.[i]||{};
      return {
        id:old.id||uid('p'),
        code:old.code||String(i+1).padStart(2,'0'),
        name:p.name,
        color:old.color||PALETTE[i%PALETTE.length],
        criteria:normalizeCriteria(old.criteria||defaultCriteria()),
        samples:rowsForAllSuppliers(old.samples,meta.supplierNames)
      };
    });
    if(draftConfig.products[0])draftConfig.criteria=deepClone(draftConfig.products[0].criteria);
  }
  if(continueToJury)startBlankJuryFromMaster();else renderHome();
  return true;
}
function startBlankJuryFromMaster(){
  dashboardNewJury();
  const meta=loadSampleMasterMeta();
  const chosenProducts=loadSampleProducts();
  if(draftConfig){
    draftConfig.lotNumber=meta.lotNumber||'';
    draftConfig.lotTitle=meta.lotTitle||'';
    draftConfig.lotName=lotNameFromSampleMeta(meta);
    draftConfig.supplierNames=[...(meta.supplierNames||[])];
    draftConfig.supplierResponseCount=draftConfig.supplierNames.length;
    draftConfig.products=chosenProducts.map((p,i)=>{
      const old=draftConfig.products?.[i]||{};
      return {
        id:old.id||uid('p'),
        code:old.code||String(i+1).padStart(2,'0'),
        name:String(p.name||'').trim(),
        color:old.color||PALETTE[i%PALETTE.length],
        criteria:normalizeCriteria(old.criteria||defaultCriteria()),
        samples:rowsForAllSuppliers(old.samples,meta.supplierNames)
      };
    });
    if(draftConfig.products[0])draftConfig.criteria=deepClone(draftConfig.products[0].criteria);
    renderConfig();
  }
  const intro=document.querySelector('#configView .creation-choice-intro');
  const methods=$('#creationMethods');
  if(intro)intro.style.display='none';
  if(methods)methods.style.display='none';
  const heroTitle=document.querySelector('#configView .config-start-hero h2');
  if(heroTitle)heroTitle.textContent='Préparer le jury';
  $('#headerTitle').textContent='Préparer le jury';
  $('#headerSub').textContent='Produits et fournisseurs déjà repris · Saisissez les numéros d’échantillons, puis réglez les questions et les testeurs';
  requestAnimationFrame(()=>document.querySelector('#productsConfig')?.scrollIntoView({behavior:'smooth',block:'start'}));
}


/* ===== V164 — Réception numérique des échantillons ===== */
let receptionEditingIndex=-1;
let receptionDraft=null;

function receptionConfig(){
  return draftConfig||state?.config||null;
}
function receptionList(cfg=receptionConfig()){
  if(!cfg)return[];
  if(!Array.isArray(cfg.receptions))cfg.receptions=[];
  return cfg.receptions;
}


function receptionSupplierNames(cfg=receptionConfig()){
  if(!cfg||typeof cfg!=='object')return[];
  const names=[];
  const configured=Array.isArray(cfg.supplierNames)?cfg.supplierNames:[];
  for(const x of configured){
    const n=String(x||'').trim();
    if(n)names.push(n);
  }
  const products=Array.isArray(cfg.products)?cfg.products:[];
  for(const p of products){
    const samples=Array.isArray(p?.samples)?p.samples:[];
    for(const sm of samples){
      const n=String(sm?.supplier||'').trim();
      if(n)names.push(n);
    }
  }
  return [...new Set(names)];
}

function supplierBackupMatchV263(target,source){
  if(!target||!source)return false;

  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

  const lotNo=cfg=>{
    const vals=[cfg?.lotNumber,cfg?.lotName,cfg?.lotTitle,cfg?.marketRef?.lot]
      .map(v=>String(v||'').trim()).filter(Boolean);
    for(const raw of vals){
      const m=raw.match(/(?:^|\blot\s*)0*([0-9]{1,5})(?:\b|$)/i)||
        raw.match(/\b0*([0-9]{1,5})\b/);
      if(m)return String(Number(m[1]));
    }
    return '';
  };

  const tn=lotNo(target),sn=lotNo(source);
  if(tn&&sn&&tn!==sn)return false;
  if(tn&&sn&&tn===sn)return true;

  const tl=norm(target.lotName||target.lotTitle||'');
  const sl=norm(source.lotName||source.lotTitle||'');
  if(tl&&sl&&tl===sl)return true;

  const tp=new Set((Array.isArray(target.products)?target.products:[]).map(p=>norm(p?.name||'')).filter(Boolean));
  const sp=new Set((Array.isArray(source.products)?source.products:[]).map(p=>norm(p?.name||'')).filter(Boolean));
  let overlap=0;
  for(const p of tp)if(sp.has(p))overlap++;
  return overlap>0 && overlap===Math.min(tp.size,sp.size);
}

function recoverSupplierNamesFromBackupsV263(cfg){
  const states=[];
  const push=st=>{if(st?.config)states.push(st.config)};

  try{
    const qr=JSON.parse(localStorage.getItem('jm_tc_qr_repair_backup_v251')||'null');
    push(qr?.state);
  }catch(e){}
  try{
    const recovery=JSON.parse(localStorage.getItem('jm_test_culinaire_recovery_v29')||'[]');
    (Array.isArray(recovery)?recovery:[]).forEach(s=>push(s?.state));
  }catch(e){}
  try{
    const a=JSON.parse(localStorage.getItem('jm_tc_active_juries_backup_v238')||'null');
    (Array.isArray(a?.rows)?a.rows:[]).forEach(r=>push(r?.state));
  }catch(e){}
  try{
    const d=JSON.parse(localStorage.getItem('jm_tc_prepared_dedupe_backup_v238')||'null');
    (Array.isArray(d?.rows)?d.rows:[]).forEach(r=>push(r?.state));
  }catch(e){}
  try{
    const reset=JSON.parse(localStorage.getItem('jm_tc_lots_reset_backup_v207')||'null');
    const raw=reset?.items?.['jm_test_culinaire_prepared_v97'];
    const rows=raw?JSON.parse(raw):[];
    (Array.isArray(rows)?rows:[]).forEach(r=>push(r?.state));
  }catch(e){}

  const out=[],seen=new Set();
  const add=v=>{
    const raw=String(v||'').trim();
    if(!raw)return;
    const key=raw.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    if(seen.has(key))return;
    seen.add(key);out.push(raw);
  };

  for(const source of states){
    if(!supplierBackupMatchV263(cfg,source))continue;
    rawSupplierNamesV263(source).forEach(add);
  }

  /* V263 — source prioritaire supplémentaire : "Choix des échantillons".
     Les noms des fournisseurs sont conservés séparément dans les métadonnées
     du lot, même quand les échantillons ont perdu leur champ supplier. */
  try{
    const meta=loadSampleMasterMeta();
    const pseudo={
      lotNumber:meta?.lotNumber||'',
      lotTitle:meta?.lotTitle||'',
      lotName:lotNameFromSampleMeta(meta),
      supplierNames:Array.isArray(meta?.supplierNames)?meta.supplierNames:[],
      products:loadSampleProducts()
    };
    if(supplierBackupMatchV263(cfg,pseudo)){
      (meta?.supplierNames||[]).forEach(add);
    }
  }catch(e){}

  /* Historique des lots créés dans "Choix des échantillons". */
  try{
    for(const rec of loadSampleLotHistory()){
      const meta=rec?.meta||{};
      const pseudo={
        lotNumber:meta.lotNumber||'',
        lotTitle:meta.lotTitle||'',
        lotName:rec?.lotName||lotNameFromSampleMeta(meta),
        supplierNames:Array.isArray(meta.supplierNames)?meta.supplierNames:[],
        products:Array.isArray(rec?.products)?rec.products:[]
      };
      if(!supplierBackupMatchV263(cfg,pseudo))continue;
      (meta.supplierNames||[]).forEach(add);
    }
  }catch(e){}

  return out;
}

function addManualReceptionSupplierV263(cfg,name){
  if(!cfg||typeof cfg!=='object')return '';
  const clean=String(name||'').trim();
  if(!clean)return '';

  const list=(Array.isArray(cfg.supplierNames)?cfg.supplierNames:[])
    .map(x=>String(x||'').trim()).filter(Boolean);
  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  if(!list.some(x=>norm(x)===norm(clean)))list.push(clean);

  cfg.supplierNames=list;
  cfg.supplierResponseCount=list.length;

  try{
    if(cfg===state?.config){
      localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
      if(typeof upsertPreparedJury==='function'&&!state.config?.juryClose?.closedAt){
        upsertPreparedJury(state);
      }
    }
  }catch(e){}

  return clean;
}

function receptionConfiguredSupplierNames(cfg=receptionConfig()){
  if(!cfg||typeof cfg!=='object')return[];

  try{healSupplierNamesV252(cfg)}catch(e){}

  const names=supplierNamesFromConfigV252(cfg);
  return [...new Set(names.map(x=>String(x||'').trim()).filter(Boolean))];
}

function blankReceptionRecordAfterSave(cfg=receptionConfig()){
  const products=cfg?.products||[];
  return{
    id:uid('reception'),
    establishment:'',
    date:'',
    time:'',
    supplier:'',
    vehicleTemp:'',
    driverName:'',
    receiverName:'',
    lines:products.map((p,i)=>({
      productId:p.id||'',
      productName:String(p.name||`Produit ${i+1}`),
      received:true,
      productTemp:'',
      interiorTemp:'',
      dlc:'',
      packaging:'',
      decision:'',
      observations:''
    })),
    driverSignature:'',
    validatedAt:null
  };
}

function receptionTemperatureOptions(selected=''){
  const values=[];
  for(let t=8;t>=-20;t--)values.push(t);
  return '<option value="">— Choisir —</option>'+
    values.map(t=>{
      const label=t>0?`+${t} °C`:`${t} °C`;
      return `<option value="${t}" ${String(selected)===String(t)?'selected':''}>${label}</option>`;
    }).join('');
}

function receptionNowTime(){
  const d=new Date(),hh=String(d.getHours()).padStart(2,'0'),mm=String(d.getMinutes()).padStart(2,'0');
  return `${hh}:${mm}`;
}
function newReceptionRecord(cfg=receptionConfig()){
  const products=cfg?.products||[];
  return{
    id:uid('reception'),
    establishment:String(cfg?.receptionEstablishment||''),
    date:todayIsoLocal(),
    time:receptionNowTime(),
    supplier:'',
    vehicleTemp:'',
    driverName:'',
    receiverName:'',
    lines:products.map((p,i)=>({
      productId:p.id||'',
      productName:String(p.name||`Produit ${i+1}`),
      received:true,
      productTemp:'',
      interiorTemp:'',
      dlc:'',
      packaging:'conforme',
      decision:'acceptation',
      observations:''
    })),
    driverSignature:'',
    validatedAt:null
  };
}
function normalizeReceptionRecord(rec,cfg=receptionConfig()){
  const base=newReceptionRecord(cfg);
  const incoming=rec&&typeof rec==='object'?rec:{};
  const byId=new Map((incoming.lines||[]).map(x=>[String(x.productId||x.productName||''),x]));
  base.id=incoming.id||base.id;
  base.establishment=Object.prototype.hasOwnProperty.call(incoming,'establishment')?String(incoming.establishment||''):base.establishment;
  base.date=String(incoming.date||base.date);
  base.time=String(incoming.time||base.time);
  base.supplier=String(incoming.supplier||'');
  base.vehicleTemp=String(incoming.vehicleTemp??'');
  base.driverName=String(incoming.driverName||'');
  base.receiverName=String(incoming.receiverName||'');
  base.driverSignature=String(incoming.driverSignature||'');
  base.validatedAt=incoming.validatedAt||null;
  base.lines=base.lines.map(line=>{
    const old=byId.get(String(line.productId||line.productName||''))||
      (incoming.lines||[]).find(x=>String(x.productName||'')===line.productName);
    return old?{...line,...old,productId:line.productId,productName:line.productName}:line;
  });
  return base;
}
function renderReceptionConfigStatus(){
  const el=$('#configReceptionStatus');
  if(!el||!draftConfig)return;
  const count=receptionList(draftConfig).length;
  el.textContent=count?`${count} réception${count>1?'s':''} enregistrée${count>1?'s':''} ✓`:'Aucune réception enregistrée';
  el.classList.toggle('ready',count>0);
}


function closeProductLotModalV174(){
  $('#productLotModalV174')?.classList.remove('show');
}
function productLotsV174(){
  if(localStorage.getItem('jm_tc_lots_clean_mode_v207'))return [];
  const rows=[],seen=new Set();
  const cfg=state?.config||{};
  try{healSupplierNamesV252(cfg)}catch(e){}
  const curId=String(cfg._preparedId||'__current__');

  if(cfg.products?.length && supplierNamesFromConfigV252(cfg).length){
    rows.push({
      id:curId,
      current:true,
      name:cfg.lotName||'Lot en cours',
      products:cfg.products.length,
      suppliers:(cfg.supplierNames||[]).filter(x=>String(x||'').trim()).length
    });
    seen.add(curId);
  }

  for(const rec of loadPreparedJurys()){
    const rcfg=rec?.state?.config||{};
    try{healSupplierNamesV252(rcfg)}catch(e){}
    if(!rcfg.products?.length || !supplierNamesFromConfigV252(rcfg).length)continue;
    const id=String(rec.id||rcfg._preparedId||'');
    if(!id||seen.has(id))continue;
    rows.push({
      id,
      current:false,
      name:rcfg.lotName||rec.name||'Lot préparé',
      products:rcfg.products.length,
      suppliers:(rcfg.supplierNames||[]).filter(x=>String(x||'').trim()).length
    });
    seen.add(id);
  }
  return rows;
}
function firstIncompleteProductSheetId(st=state){
  try{
    for(const p of st?.config?.products||[]){
      for(const sm of p.samples||[]){
        if(productSheetMissingFields(st,p,sm).length)return p.id;
      }
    }
  }catch(e){}
  return st?.config?.products?.[0]?.id||'';
}

function openProductLotV174(row){
  closeProductLotModalV174();

  if(row.current){
    /* V252 — ouvrir directement la fiche réellement manquante indiquée
       par l'accueil, sinon la première fiche incomplète. */
    activeProductSheetId=row.firstProductId||firstIncompleteProductSheetId(state);
    openProductSheets();
    if(row.firstSampleId){
      setTimeout(()=>{
        const box=$('#productSheetContent');
        const card=box?findProductSheetCard(box,row.firstSampleId):null;
        if(card)card.scrollIntoView({behavior:'smooth',block:'center'});
      },120);
    }
    return;
  }

  try{
    if(state?.config?._preparedId && !isJuryClosed())saveState();
  }catch(e){}

  const rec=loadPreparedJurys().find(x=>String(x.id)===String(row.id));
  if(!rec?.state){
    alert('Ce lot est introuvable.');
    return;
  }

  state=deepClone(rec.state);
  if(!state.config)state.config={};
  if(!state.config._preparedId)state.config._preparedId=rec.id;
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));

  currentTester=1;
  currentProduct=state.config.products?.[0]?.id||'';
  currentSample=state.config.products?.[0]?.samples?.[0]?.id||'';
  adminProduct=currentProduct;
  selectedAdminSample='';
  /* V252 — même logique pour un lot préparé rechargé depuis l’accueil. */
  activeProductSheetId=row.firstProductId||firstIncompleteProductSheetId(state);
  openProductSheets();
  if(row.firstSampleId){
    setTimeout(()=>{
      const box=$('#productSheetContent');
      const card=box?findProductSheetCard(box,row.firstSampleId):null;
      if(card)card.scrollIntoView({behavior:'smooth',block:'center'});
    },120);
  }
}
function openProductSheetsFromHomeV174(){
  const rows=productLotsV174();
  if(!rows.length){
    alert('Aucun lot contenant des produits n’est disponible.');
    return;
  }
  if(rows.length===1){
    openProductLotV174(rows[0]);
    return;
  }

  const modal=$('#productLotModalV174'),list=$('#productLotListV174');
  if(!modal||!list)return;

  list.innerHTML=rows.map(r=>`
    <button type="button" class="product-lot-choice-v174" data-product-lot-v174="${escapeHtml(r.id)}">
      <span>
        <strong>${escapeHtml(r.name)}</strong>
        <span>${r.products} produit${r.products>1?'s':''} · ${r.suppliers} fournisseur${r.suppliers>1?'s':''}${r.current?' · lot actuellement ouvert':''}</span>
      </span>
      <span style="font-size:18px;color:#4e819d">›</span>
    </button>`).join('');

  list.querySelectorAll('[data-product-lot-v174]').forEach(btn=>{
    btn.onclick=()=>{
      const row=rows.find(r=>String(r.id)===String(btn.dataset.productLotV174));
      if(row)openProductLotV174(row);
    };
  });

  modal.classList.add('show');
}


function receptionJuryKey(cfg=receptionConfig()){
  if(!cfg||typeof cfg!=='object')return '';
  return String(cfg._preparedId||cfg._juryInstanceId||cfg.juryInstanceId||cfg.lotName||'').trim();
}
function receptionNormV258(v){
  return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
}
function receptionLotNoV258(cfg){
  const values=[
    cfg?.lotNumber,cfg?.lotName,cfg?.lotTitle,cfg?.marketRef?.lot
  ].map(v=>String(v||'').trim()).filter(Boolean);
  for(const raw of values){
    const m=raw.match(/(?:^|\blot\s*)0*([0-9]{1,5})(?:\b|$)/i)||
      raw.match(/\b0*([0-9]{1,5})\b/);
    if(m)return String(Number(m[1]));
  }
  return '';
}
function receptionProductNamesV258(cfg){
  return new Set((Array.isArray(cfg?.products)?cfg.products:[])
    .map(p=>receptionNormV258(p?.name||'')).filter(Boolean));
}
function receptionSupplierSetV258(cfg){
  return new Set(receptionSupplierNames(cfg).map(receptionNormV258).filter(Boolean));
}
function receptionBusinessMatchScoreV258(target,source){
  if(!target||!source)return 0;
  let score=0;

  const tn=receptionLotNoV258(target),sn=receptionLotNoV258(source);
  if(tn&&sn){
    if(tn!==sn)return 0;
    score+=100;
  }else{
    const tl=receptionNormV258(target.lotName||target.lotTitle||'');
    const sl=receptionNormV258(source.lotName||source.lotTitle||'');
    if(tl&&sl&&tl===sl)score+=70;
  }

  const tp=receptionProductNamesV258(target),sp=receptionProductNamesV258(source);
  let productOverlap=0;
  for(const x of tp)if(sp.has(x))productOverlap++;
  if(productOverlap)score+=Math.min(50,productOverlap*15);

  const ts=receptionSupplierSetV258(target),ss=receptionSupplierSetV258(source);
  let supplierOverlap=0;
  for(const x of ts)if(ss.has(x))supplierOverlap++;
  if(supplierOverlap)score+=Math.min(40,supplierOverlap*15);

  return score;
}
function productSheetReceptionEvidenceV258(rec){
  if(!rec||typeof rec!=='object')return false;
  if(rec.receptionFound===true)return true;
  return [
    rec.receptionDate,rec.receptionTime,rec.receptionEstablishment,
    rec.receptionSupplier,rec.receptionVehicleTemp,rec.receptionDriverName,
    rec.receptionReceiverName,rec.receptionInteriorTemp,rec.receptionPackaging,
    rec.receptionDecision,rec.receptionObservations
  ].some(v=>String(v??'').trim());
}
function rebuildReceptionsFromProductSheetsV258(cfg){
  const store=cfg?.productSheets;
  if(!store||typeof store!=='object')return [];

  const groups=new Map();
  for(const p of (Array.isArray(cfg.products)?cfg.products:[])){
    for(const sm of (Array.isArray(p?.samples)?p.samples:[])){
      const rec=store[productSheetKey(p.id,sm.id)];
      if(!productSheetReceptionEvidenceV258(rec))continue;

      const supplier=String(rec.receptionSupplier||rec.supplier||sm.supplier||'').trim();
      if(!supplier)continue;
      const sk=receptionNormV258(supplier);
      if(!groups.has(sk))groups.set(sk,{supplier,records:[]});
      groups.get(sk).records.push({p,sm,rec});
    }
  }

  const out=[];
  for(const g of groups.values()){
    const first=g.records[0]?.rec||{};
    const date=String(first.receptionDate||'').trim();
    const time=String(first.receptionTime||'').trim();
    let validatedAt=new Date().toISOString();
    if(date){
      const d=new Date(date+(time?'T'+time:'T12:00'));
      if(Number.isFinite(d.getTime()))validatedAt=d.toISOString();
    }

    const lines=(Array.isArray(cfg.products)?cfg.products:[]).map(p=>{
      const hit=g.records.find(x=>String(x.p?.id)===String(p?.id));
      const r=hit?.rec||{};
      return{
        productId:p?.id||'',
        productName:String(p?.name||''),
        received:!!hit,
        productTemp:String(r.deliveryTemp??''),
        interiorTemp:String(r.receptionInteriorTemp??''),
        dlc:String(r.dlc||r.ddm||''),
        packaging:String(r.receptionPackaging||(
          r.packagingConformity==='non'?'non-conforme':
          r.packagingConformity?'conforme':''
        )),
        decision:String(r.receptionDecision||'acceptation'),
        observations:String(r.receptionObservations||'')
      };
    });

    out.push({
      id:uid('reception_recovered'),
      establishment:String(first.receptionEstablishment||cfg.receptionEstablishment||''),
      date:date||todayIsoLocal(),
      time:time||'',
      supplier:g.supplier,
      vehicleTemp:String(first.receptionVehicleTemp??''),
      driverName:String(first.receptionDriverName||''),
      receiverName:String(first.receptionReceiverName||''),
      lines,
      driverSignature:'',
      validatedAt,
      receptionJuryKey:receptionJuryKey(cfg),
      receptionSource:'recovered-from-product-sheets-v258',
      recoveredAt:new Date().toISOString()
    });
  }
  return out;
}
function receptionSameJuryV258(a,b){
  if(!a||!b)return false;
  const ai=String(a._juryInstanceId||a.juryInstanceId||a.juryLaunch?.instanceId||'').trim();
  const bi=String(b._juryInstanceId||b.juryInstanceId||b.juryLaunch?.instanceId||'').trim();
  if(ai&&bi&&ai===bi)return true;

  const ap=String(a._preparedId||'').trim(),bp=String(b._preparedId||'').trim();
  if(ap&&bp&&ap===bp)return true;

  /* V258 — après une réparation QR les identifiants techniques peuvent changer.
     On reconnaît aussi le jury par n° de lot + produits/fournisseurs. */
  return receptionBusinessMatchScoreV258(a,b)>=100;
}
function receptionRecordMatchesConfigV258(rec,cfg){
  if(!rec||!rec.validatedAt||!cfg)return false;

  const suppliers=receptionSupplierNames(cfg).map(receptionNormV258).filter(Boolean);
  const supplier=receptionNormV258(rec.supplier||'');
  if(suppliers.length && supplier && !suppliers.includes(supplier))return false;

  const currentProducts=new Set();
  for(const p of (Array.isArray(cfg.products)?cfg.products:[])){
    const id=receptionNormV258(p?.id||'');
    const name=receptionNormV258(p?.name||'');
    if(id)currentProducts.add('id:'+id);
    if(name)currentProducts.add('name:'+name);
  }

  const lines=Array.isArray(rec.lines)?rec.lines:[];
  if(!lines.length)return true;

  const overlap=lines.some(line=>{
    const id=receptionNormV258(line?.productId||'');
    const name=receptionNormV258(line?.productName||'');
    return (id&&currentProducts.has('id:'+id))||(name&&currentProducts.has('name:'+name));
  });
  return overlap||!currentProducts.size;
}
function receptionBackupStatesV258(){
  const out=[];
  const push=st=>{if(st?.config)out.push(st)};

  try{
    const qr=JSON.parse(localStorage.getItem('jm_tc_qr_repair_backup_v251')||'null');
    push(qr?.state);
  }catch(e){}
  try{
    const a=JSON.parse(localStorage.getItem('jm_tc_active_juries_backup_v238')||'null');
    (Array.isArray(a?.rows)?a.rows:[]).forEach(r=>push(r?.state));
  }catch(e){}
  try{
    const d=JSON.parse(localStorage.getItem('jm_tc_prepared_dedupe_backup_v238')||'null');
    (Array.isArray(d?.rows)?d.rows:[]).forEach(r=>push(r?.state));
  }catch(e){}
  try{
    const reset=JSON.parse(localStorage.getItem('jm_tc_lots_reset_backup_v207')||'null');
    const raw=reset?.items?.['jm_test_culinaire_prepared_v97'];
    const rows=raw?JSON.parse(raw):[];
    (Array.isArray(rows)?rows:[]).forEach(r=>push(r?.state));
  }catch(e){}
  try{
    const recovery=JSON.parse(localStorage.getItem('jm_test_culinaire_recovery_v29')||'[]');
    (Array.isArray(recovery)?recovery:[]).forEach(s=>push(s?.state));
  }catch(e){}
  return out;
}
function repairReceptionsForConfigV258(cfg){
  if(!cfg||typeof cfg!=='object')return false;

  if(!Array.isArray(cfg.receptions))cfg.receptions=[];
  const currentKey=receptionJuryKey(cfg);
  let changed=false;

  /* 1. Une réception validée déjà stockée dans CE lot reste valable même si
        l'identifiant technique du jury a changé pendant une réparation QR. */
  for(const rec of cfg.receptions){
    if(!receptionRecordMatchesConfigV258(rec,cfg))continue;
    if(currentKey&&String(rec.receptionJuryKey||'')!==currentKey){
      rec.receptionJuryKey=currentKey;
      changed=true;
    }
  }

  /* 2. Si aucune réception exploitable n'est présente, chercher la meilleure
        copie dans les sauvegardes locales du même jury. */
  let currentValid=cfg.receptions.filter(r=>receptionRecordMatchesConfigV258(r,cfg));
  if(!currentValid.length){
    let best=[],bestScore=0;
    for(const st of receptionBackupStatesV258()){
      const bcfg=st?.config;
      if(!bcfg)continue;
      const score=receptionBusinessMatchScoreV258(cfg,bcfg);
      if(score<70)continue;

      const vals=(Array.isArray(bcfg.receptions)?bcfg.receptions:[])
        .filter(r=>r&&r.validatedAt&&receptionRecordMatchesConfigV258(r,cfg));

      if(vals.length && (score>bestScore || (score===bestScore&&vals.length>best.length))){
        best=vals;
        bestScore=score;
      }
    }
    if(best.length){
      cfg.receptions=deepClone(best);
      for(const rec of cfg.receptions){
        if(currentKey)rec.receptionJuryKey=currentKey;
      }
      changed=true;
      currentValid=cfg.receptions.filter(r=>receptionRecordMatchesConfigV258(r,cfg));
    }
  }

  /* Dernier filet de sécurité : si les fiches produits contiennent encore
     les champs explicitement repris de la réception, reconstruire la réception
     à partir de ces données. Aucun faux enregistrement n'est créé sans preuve
     de réception dans les fiches. */
  if(!currentValid.length){
    const rebuilt=rebuildReceptionsFromProductSheetsV258(cfg);
    if(rebuilt.length){
      cfg.receptions=rebuilt;
      changed=true;
      currentValid=cfg.receptions.filter(r=>receptionRecordMatchesConfigV258(r,cfg));
    }
  }

  if(changed&&cfg===state?.config){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(e){}
    try{if(typeof upsertPreparedJury==='function'&&!state.config?.juryClose?.closedAt)upsertPreparedJury(state)}catch(e){}
    try{
      localStorage.setItem('jm_tc_reception_repair_v257',JSON.stringify({
        repairedAt:new Date().toISOString(),
        lot:cfg.lotName||'',
        count:currentValid.length
      }));
    }catch(e){}
  }
  return changed;
}
function receptionStatusForConfig(cfg){
  try{repairReceptionsForConfigV258(cfg)}catch(e){}

  const suppliers=receptionSupplierNames(cfg);
  const valid=(Array.isArray(cfg?.receptions)?cfg.receptions:[])
    .filter(r=>r&&r.validatedAt&&receptionRecordMatchesConfigV258(r,cfg));

  const received=new Set(valid.map(r=>receptionNormV258(r.supplier)).filter(Boolean));

  /* V289 — le suivi de réception se fait par fournisseur / fiche, et non
     uniquement par lot. Les compteurs peuvent donc afficher 1/5, 2/5, etc. */
  if(!suppliers.length){
    const done=received.size||valid.length;
    if(!done)return{key:'pending',label:'À réceptionner',done:0,total:0};
    return{key:'done',label:`${done} réception${done>1?'s':''} enregistrée${done>1?'s':''}`,done,total:done};
  }

  const total=suppliers.length;
  const done=suppliers.filter(name=>received.has(receptionNormV258(name))).length;

  if(done<=0)return{key:'pending',label:`À réceptionner · 0/${total}`,done:0,total};
  if(done>=total)return{key:'done',label:`Réceptions terminées · ${done}/${total}`,done,total};
  return{key:'partial',label:`Réception partielle · ${done}/${total}`,done,total};
}
function allReceptionLots(){
  if(localStorage.getItem('jm_tc_lots_clean_mode_v207'))return [];
  try{ensureCurrentPrepSaved()}catch(e){}

  /* Réception chauffeur : afficher les lots actifs sans masquer automatiquement
     un lot à cause d'anciennes données copiées. Une seule ligne par lot.
     Le statut est informatif : À réceptionner / Réception partielle / enregistrée. */
  const choices=[],seenIds=new Set(),seenLots=new Set();
  const lotKey=name=>String(name||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

  const currentCfg=state?.config||{};
  const currentId=String(currentCfg._preparedId||'__current__');

  if(currentCfg?.products?.length && !currentCfg?.juryClose?.closedAt && !currentCfg?._archive?.archivedAt){
    const currentLotName=currentCfg.lotName||'Lot en cours';
    choices.push({
      id:currentId,
      kind:'current',
      lotName:currentLotName,
      suppliers:receptionSupplierNames(currentCfg),
      products:(currentCfg.products||[]).length,
      savedAt:state?.updatedAt||'',
      receptionStatus:receptionStatusForConfig(currentCfg)
    });
    seenIds.add(currentId);
    const key=lotKey(currentLotName);
    if(key)seenLots.add(key);
  }

  const prepared=[...(loadPreparedJurys()||[])].sort((a,b)=>
    String(b?.savedAt||b?.state?.config?._preparedAt||'')
      .localeCompare(String(a?.savedAt||a?.state?.config?._preparedAt||''))
  );

  for(const rec of prepared){
    const cfg=rec?.state?.config||{};
    if(!cfg?.products?.length || cfg?.juryClose?.closedAt || cfg?._archive?.archivedAt)continue;
    const id=String(rec.id||cfg._preparedId||'');
    if(!id || seenIds.has(id))continue;

    const lotName=cfg.lotName||rec.name||'Lot préparé';
    const key=lotKey(lotName);
    if(key && seenLots.has(key))continue;

    choices.push({
      id,
      kind:'prepared',
      lotName,
      suppliers:receptionSupplierNames(cfg),
      products:(cfg.products||[]).length,
      savedAt:rec.savedAt||cfg._preparedAt||'',
      receptionStatus:receptionStatusForConfig(cfg)
    });
    seenIds.add(id);
    if(key)seenLots.add(key);
  }

  return choices.sort((a,b)=>{
    if(a.kind==='current'&&b.kind!=='current')return -1;
    if(b.kind==='current'&&a.kind!=='current')return 1;
    return String(b.savedAt||'').localeCompare(String(a.savedAt||''));
  });
}
function availableReceptionLots(){
  return allReceptionLots().filter(c=>(c?.receptionStatus?.key||'pending')!=='done');
}
function completedReceptionLots(){
  return allReceptionLots().filter(c=>(c?.receptionStatus?.key||'pending')==='done');
}
function receptionHistoryLots(){
  /* V289 — l’historique doit être consultable dès la première fiche validée,
     même si les autres fournisseurs du lot ne sont pas encore réceptionnés. */
  return allReceptionLots().filter(c=>Number(c?.receptionStatus?.done||0)>0);
}
function closeReceptionLotPicker(){
  $('#receptionLotModal')?.classList.remove('show');
}
function closeReceptionHistoryPicker(){
  $('#receptionHistoryModal')?.classList.remove('show');
}
function activateReceptionLot(choice){
  closeReceptionLotPicker();
  draftConfig=null;

  if(choice?.kind==='current'){
    openReceptionView(-1);
    return;
  }

  try{
    if(state?.config?._preparedId && !isJuryClosed())saveState();
  }catch(e){}

  const rec=loadPreparedJurys().find(x=>String(x.id)===String(choice?.id));
  if(!rec?.state){
    alert('Ce lot est introuvable. Revenez à l’accueil puis réessayez.');
    return;
  }

  state=deepClone(rec.state);
  if(!state.config)state.config={};
  if(!state.config._preparedId)state.config._preparedId=rec.id;
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));

  currentTester=1;
  currentProduct=state.config.products?.[0]?.id||'';
  currentSample=state.config.products?.[0]?.samples?.[0]?.id||'';
  adminProduct=currentProduct;
  selectedAdminSample='';

  openReceptionView(-1);
}
function showReceptionLotPicker(choices){
  const modal=$('#receptionLotModal'),list=$('#receptionLotList');
  if(!modal||!list)return;
  const intro=modal.querySelector('p');
  if(intro)intro.textContent=choices.length>1
    ?`${choices.length} lots sont disponibles. Sélectionnez celui correspondant au camion qui vient d’arriver.`
    :'1 lot est disponible. Touchez-le pour ouvrir la fiche de réception.';
  list.innerHTML=choices.length?choices.map((c,i)=>{
    const suppliers=c.suppliers?.length?`${c.suppliers.length} fournisseur${c.suppliers.length>1?'s':''}`:'Aucun fournisseur renseigné';
    const products=`${c.products} produit${c.products>1?'s':''}`;
    const rs=c.receptionStatus||{key:'pending',label:'À réceptionner'};
    return `<button type="button" class="reception-lot-choice ${c.kind==='current'?'current':''}" data-reception-lot="${escapeHtml(c.id)}">
      <span><strong>${escapeHtml(c.lotName)}</strong><span>${products} · ${suppliers}${c.kind==='current'?' · lot actuellement ouvert':''}</span><span style="display:block;margin-top:4px;font-size:11px;font-weight:900;color:${rs.key==='done'?'#137653':rs.key==='partial'?'#8b5b00':'#9a5b00'}">${escapeHtml(rs.label)}</span></span>
      <span class="lot-arrow">›</span>
    </button>`;
  }).join(''):'<div class="reception-lot-empty">Aucun lot disponible pour une réception.</div>';

  list.querySelectorAll('[data-reception-lot]').forEach(btn=>{
    btn.onclick=()=>{
      const choice=choices.find(c=>String(c.id)===String(btn.dataset.receptionLot));
      if(choice)activateReceptionLot(choice);
    };
  });
  modal.classList.add('show');
}
function latestValidatedReceptionIndex(cfg){
  const list=Array.isArray(cfg?.receptions)?cfg.receptions:[];
  const juryKey=receptionJuryKey(cfg);
  let best=-1,bestAt='';
  list.forEach((r,i)=>{
    if(!r?.validatedAt)return;
    if(juryKey && String(r.receptionJuryKey||'')!==juryKey)return;
    const at=String(r.validatedAt||'');
    if(best<0 || at>bestAt){best=i;bestAt=at;}
  });
  return best;
}
function activateReceptionHistoryLot(choice){
  closeReceptionHistoryPicker();
  draftConfig=null;

  if(choice?.kind==='current'){
    const idx=latestValidatedReceptionIndex(state?.config||{});
    if(idx<0){alert('Aucune fiche de réception enregistrée pour ce lot.');return;}
    openReceptionView(idx);
    return;
  }

  try{
    if(state?.config?._preparedId && !isJuryClosed())saveState();
  }catch(e){}

  const rec=loadPreparedJurys().find(x=>String(x.id)===String(choice?.id));
  if(!rec?.state){
    alert('Cette réception enregistrée est introuvable.');
    return;
  }

  state=deepClone(rec.state);
  if(!state.config)state.config={};
  if(!state.config._preparedId)state.config._preparedId=rec.id;
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));

  currentTester=1;
  currentProduct=state.config.products?.[0]?.id||'';
  currentSample=state.config.products?.[0]?.samples?.[0]?.id||'';
  adminProduct=currentProduct;
  selectedAdminSample='';

  const idx=latestValidatedReceptionIndex(state.config);
  if(idx<0){alert('Aucune fiche de réception enregistrée pour ce lot.');return;}
  openReceptionView(idx);
}
function showReceptionHistoryPicker(choices){
  const modal=$('#receptionHistoryModal'),list=$('#receptionHistoryList');
  if(!modal||!list)return;
  const intro=modal.querySelector('p');
  const totalSaved=choices.reduce((sum,c)=>sum+Number(c?.receptionStatus?.done||0),0);
  if(intro)intro.textContent=totalSaved
    ?`${totalSaved} fiche${totalSaved>1?'s':''} de réception enregistrée${totalSaved>1?'s':''}. Touchez un lot pour les consulter.`
    :'Aucune fiche de réception enregistrée pour le moment.';
  list.innerHTML=choices.length?choices.map(c=>{
    const suppliers=c.suppliers?.length?`${c.suppliers.length} fournisseur${c.suppliers.length>1?'s':''}`:'Aucun fournisseur renseigné';
    const products=`${c.products} produit${c.products>1?'s':''}`;
    const rs=c.receptionStatus||{done:0,total:0};
    const progress=Number(rs.total||0)>0?`${Number(rs.done||0)}/${Number(rs.total||0)}`:`${Number(rs.done||0)}`;
    return `<button type="button" class="reception-lot-choice" data-reception-history="${escapeHtml(c.id)}">
      <span><strong>${escapeHtml(c.lotName)}</strong><span>${products} · ${suppliers}</span><span style="display:block;margin-top:4px;font-size:11px;font-weight:900;color:#137653">✓ ${progress} réception${Number(rs.done||0)>1?'s':''} enregistrée${Number(rs.done||0)>1?'s':''}</span></span>
      <span class="lot-arrow">›</span>
    </button>`;
  }).join(''):'<div class="reception-lot-empty">Aucune réception enregistrée pour le moment.</div>';

  list.querySelectorAll('[data-reception-history]').forEach(btn=>{
    btn.onclick=()=>{
      const choice=choices.find(c=>String(c.id)===String(btn.dataset.receptionHistory));
      if(choice)activateReceptionHistoryLot(choice);
    };
  });
  modal.classList.add('show');
}
function openReceptionHistoryFromHome(){
  draftConfig=null;
  const choices=receptionHistoryLots();
  if(!choices.length){
    alert('Aucune fiche de réception enregistrée pour le moment.');
    return;
  }
  showReceptionHistoryPicker(choices);
}

function openReceptionFromHome(){
  draftConfig=null;
  const choices=availableReceptionLots();
  if(!choices.length){
    alert('Aucune réception en attente. Consultez « Réceptions enregistrées » pour l’historique.');
    return;
  }
  showReceptionLotPicker(choices);
}
function changeReceptionLot(){
  try{captureReceptionForm?.()}catch(e){}
  const choices=availableReceptionLots();
  if(!choices.length){
    alert('Aucun autre lot n’est disponible.');
    return;
  }
  showReceptionLotPicker(choices);
}
function renderHomeReceptionBadge(){
  const badge=$('#homeReceptionBadge');
  const historyBadge=$('#homeReceptionHistoryBadge');
  const lots=allReceptionLots();

  const progress=lots.reduce((acc,c)=>{
    const rs=c?.receptionStatus||{};
    acc.done+=Number(rs.done||0);
    acc.total+=Number(rs.total||0);
    return acc;
  },{done:0,total:0});

  if(badge){
    badge.textContent=progress.total?`${progress.done}/${progress.total}`:'0';
    badge.title=progress.total
      ?`${progress.done} réception${progress.done>1?'s':''} enregistrée${progress.done>1?'s':''} sur ${progress.total}`
      :'Aucune réception à effectuer';
  }

  if(historyBadge){
    historyBadge.textContent=String(progress.done);
    historyBadge.title=progress.done
      ?`${progress.done} fiche${progress.done>1?'s':''} de réception enregistrée${progress.done>1?'s':''}`
      :'Aucune fiche de réception enregistrée';
  }
}

function openReceptionView(index=-1){
  const cfg=receptionConfig();
  try{
    if(healSupplierNamesV252(cfg)&&cfg===state?.config){
      localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
      if(typeof upsertPreparedJury==='function'&&!state.config?.juryClose?.closedAt)upsertPreparedJury(state);
    }
  }catch(e){}
  if(!cfg?.products?.length){
    alert('Ajoutez d’abord au moins un produit dans le jury.');
    return;
  }
  receptionEditingIndex=Number.isInteger(index)?index:-1;
  receptionDraft=receptionEditingIndex>=0 && receptionList(cfg)[receptionEditingIndex]
    ?normalizeReceptionRecord(deepClone(receptionList(cfg)[receptionEditingIndex]),cfg)
    :newReceptionRecord(cfg);

  showView('receptionView');
  $('#headerTitle').textContent='Réception des échantillons';
  $('#headerSub').textContent=cfg.lotName||'Jury Marchés';
  $('#receptionLotSubtitle').textContent=`${cfg.lotName||'Lot'} · contrôle de la livraison et émargement du chauffeur`;

  renderReceptionForm();
}
function renderReceptionForm(){
  const cfg=receptionConfig();
  if(!cfg||!receptionDraft)return;
  try{healSupplierNamesV252(cfg)}catch(e){}
  receptionDraft=normalizeReceptionRecord(receptionDraft,cfg);

  $('#receptionEstablishment').value=receptionDraft.establishment||'';
  $('#receptionDate').value=receptionDraft.date||todayIsoLocal();
  $('#receptionTime').value=receptionDraft.time||receptionNowTime();
  $('#receptionVehicleTemp').innerHTML=receptionTemperatureOptions(receptionDraft.vehicleTemp??'');
  $('#receptionVehicleTemp').value=String(receptionDraft.vehicleTemp??'');
  $('#receptionDriverName').value=receptionDraft.driverName||'';
  $('#receptionReceiverName').value=receptionDraft.receiverName||'';

  const supplierInput=$('#receptionSupplier');
  const supplierManual=$('#receptionSupplierManual');
  const suppliers=receptionConfiguredSupplierNames(cfg);
  const selected=String(receptionDraft.supplier||'').trim();

  if(supplierInput && supplierManual){
    /* V263 — si aucun fournisseur n'est connu, ne pas afficher un menu vide :
       on propose directement une saisie texte. */
    if(!suppliers.length){
      supplierInput.style.display='none';
      supplierManual.style.display='';
      supplierManual.value=selected;
      supplierManual.onchange=()=>{
        const clean=addManualReceptionSupplierV263(cfg,supplierManual.value);
        receptionDraft.supplier=clean||String(supplierManual.value||'').trim();
      };
      supplierManual.onblur=()=>{
        const clean=String(supplierManual.value||'').trim();
        if(clean){
          receptionDraft.supplier=addManualReceptionSupplierV263(cfg,clean)||clean;
        }
      };
    }else{
      supplierInput.style.display='';
      supplierManual.style.display='none';
      supplierManual.value='';

      supplierInput.innerHTML=
        '<option value="">— Choisir le fournisseur —</option>'+
        suppliers.map(name=>`<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('')+
        '<option value="__manual_supplier_v260__">✏️ Saisir un fournisseur manuellement…</option>';

      if(selected && !suppliers.includes(selected)){
        supplierInput.insertAdjacentHTML('beforeend',
          `<option value="${escapeHtml(selected)}">${escapeHtml(selected)}</option>`);
      }

      if(selected){
        supplierInput.value=selected;
      }else if(suppliers.length===1){
        supplierInput.value=suppliers[0];
        receptionDraft.supplier=suppliers[0];
      }else{
        supplierInput.value='';
      }

      supplierInput.onchange=()=>{
        if(supplierInput.value!=='__manual_supplier_v260__'){
          receptionDraft.supplier=supplierInput.value||'';
          return;
        }
        const name=prompt('Nom du fournisseur :','');
        if(!String(name||'').trim()){
          supplierInput.value=receptionDraft.supplier||'';
          return;
        }
        const clean=addManualReceptionSupplierV263(cfg,name);
        if(!clean){
          supplierInput.value=receptionDraft.supplier||'';
          return;
        }
        receptionDraft.supplier=clean;
        renderReceptionForm();
        const refreshed=$('#receptionSupplier');
        if(refreshed)refreshed.value=clean;
      };
    }
  }

  const lines=$('#receptionLines');
  lines.innerHTML=receptionDraft.lines.map((line,i)=>`
    <article class="reception-line-card" data-reception-line="${i}">
      <div class="reception-line-head">
        <strong>${escapeHtml(line.productName||`Produit ${i+1}`)}</strong>
        <label style="display:flex;gap:6px;align-items:center;font-size:10px;font-weight:700">
          <input type="checkbox" data-rec-received="${i}" ${line.received!==false?'checked':''}> Produit reçu
        </label>
      </div>
      <div class="reception-line-grid">
        <div class="field"><label>T° produit (°C)</label><select data-rec-product-temp="${i}">${receptionTemperatureOptions(line.productTemp??'')}</select></div>
        <div class="field"><label>T° intérieur produit (°C)</label><select data-rec-interior-temp="${i}">${receptionTemperatureOptions(line.interiorTemp??'')}</select></div>
        <div class="field"><label>DLC / DDM <span style="color:#b42318">*</span></label><input type="date" data-rec-dlc="${i}" value="${escapeHtml(line.dlc||'')}" required></div>
        <div class="field"><label>État emballage</label><select data-rec-packaging="${i}"><option value="">— Choisir —</option><option value="conforme">Conforme</option><option value="non-conforme">Non conforme</option></select></div>
        <div class="field"><label>Décision</label><select data-rec-decision="${i}"><option value="">— Choisir —</option><option value="acceptation">Acceptation</option><option value="refus">Refus</option></select></div>
        <div class="field obs"><label>Observations</label><input data-rec-observations="${i}" value="${escapeHtml(line.observations||'')}" placeholder="Observation éventuelle"></div>
      </div>
    </article>`).join('');

  receptionDraft.lines.forEach((line,i)=>{
    const p=document.querySelector(`[data-rec-packaging="${i}"]`);if(p)p.value=line.packaging||'conforme';
    const d=document.querySelector(`[data-rec-decision="${i}"]`);if(d)d.value=line.decision||'acceptation';
  });

  setupSignatureCanvas('receptionSignature',receptionDraft.driverSignature||'');
  renderReceptionSavedList();
}
function captureReceptionForm(){
  const cfg=receptionConfig();
  if(!cfg||!receptionDraft)return null;
  receptionDraft.establishment=$('#receptionEstablishment').value.trim();
  receptionDraft.date=$('#receptionDate').value||'';
  receptionDraft.time=$('#receptionTime').value||'';
  const supplierSelect=$('#receptionSupplier');
  const supplierManual=$('#receptionSupplierManual');
  receptionDraft.supplier=(supplierManual&&supplierManual.style.display!=='none')
    ?String(supplierManual.value||'').trim()
    :String(supplierSelect?.value||'').trim();
  if(receptionDraft.supplier==='__manual_supplier_v260__')receptionDraft.supplier='';
  if(receptionDraft.supplier){
    try{receptionDraft.supplier=addManualReceptionSupplierV263(cfg,receptionDraft.supplier)||receptionDraft.supplier}catch(e){}
  }
  receptionDraft.vehicleTemp=String($('#receptionVehicleTemp').value??'').trim();
  receptionDraft.driverName=$('#receptionDriverName').value.trim();
  receptionDraft.receiverName=$('#receptionReceiverName').value.trim();
  receptionDraft.lines=receptionDraft.lines.map((line,i)=>({
    ...line,
    received:!!document.querySelector(`[data-rec-received="${i}"]`)?.checked,
    productTemp:String(document.querySelector(`[data-rec-product-temp="${i}"]`)?.value??'').trim(),
    interiorTemp:String(document.querySelector(`[data-rec-interior-temp="${i}"]`)?.value??'').trim(),
    dlc:document.querySelector(`[data-rec-dlc="${i}"]`)?.value||'',
    packaging:document.querySelector(`[data-rec-packaging="${i}"]`)?.value||'',
    decision:document.querySelector(`[data-rec-decision="${i}"]`)?.value||'',
    observations:document.querySelector(`[data-rec-observations="${i}"]`)?.value.trim()||''
  }));
  receptionDraft.driverSignature=signatureCanvasData('receptionSignature');
  return receptionDraft;
}
async function saveReceptionForm(){
  const cfg=receptionConfig(),rec=captureReceptionForm();
  if(!cfg||!rec)return;
  if(!rec.date){alert('Indiquez la date de réception.');$('#receptionDate')?.focus();return}
  if(!rec.supplier){alert('Choisissez le fournisseur.');$('#receptionSupplier')?.focus();return}
  if(!rec.lines.some(x=>x.received!==false)){alert('Cochez au moins un produit reçu.');return}

  // V210 : une réception ne peut plus être validée sans DLC / DDM
  // pour chacun des produits réellement reçus.
  const missingDlcIndex=rec.lines.findIndex(x=>x.received!==false && !String(x.dlc||'').trim());
  if(missingDlcIndex>=0){
    const line=rec.lines[missingDlcIndex]||{};
    alert(`Impossible de valider la réception.\n\nLa DLC / DDM est obligatoire pour le produit : ${line.productName||('Produit '+(missingDlcIndex+1))}.`);
    const target=document.querySelector(`[data-rec-dlc="${missingDlcIndex}"]`);
    if(target){
      target.focus();
      target.scrollIntoView({behavior:'smooth',block:'center'});
    }
    return;
  }

  if(!rec.driverSignature){alert('La signature du livreur est nécessaire pour émarger la réception.');return}

  rec.validatedAt=new Date().toISOString();
  rec.receptionJuryKey=receptionJuryKey(cfg);
  rec.receptionSource='reception-module';
  cfg.receptionEstablishment=rec.establishment||cfg.receptionEstablishment||'';
  const list=receptionList(cfg);
  if(receptionEditingIndex>=0 && list[receptionEditingIndex])list[receptionEditingIndex]=deepClone(rec);
  else{
    list.push(deepClone(rec));
    receptionEditingIndex=list.length-1;
  }

  if(cfg===state.config){
    saveState();
    if(typeof syncDirtyToCloud==='function'){try{await syncDirtyToCloud()}catch(e){}}
  }

  renderReceptionConfigStatus();

  /* V211 : après "Enregistrer et émarger", la réception est terminée.
     On prépare silencieusement une fiche neuve pour la prochaine réception,
     puis on revient automatiquement à l'accueil afin d'éviter toute
     modification involontaire d'une fiche déjà signée. */
  receptionEditingIndex=-1;
  receptionDraft=blankReceptionRecordAfterSave(cfg);
  renderHome();
  toast('Réception émargée et enregistrée ✓');
}
function renderReceptionSavedList(){
  const box=$('#receptionSavedList'),cfg=receptionConfig();
  if(!box||!cfg)return;
  try{repairReceptionsForConfigV258(cfg)}catch(e){}
  const list=receptionList(cfg);
  if(!list.length){
    box.innerHTML='<div class="empty-note">Aucune réception enregistrée pour ce lot.</div>';
    return;
  }
  box.innerHTML=list.map((r,i)=>{
    const received=(r.lines||[]).filter(x=>x.received!==false).length;
    const refus=(r.lines||[]).filter(x=>x.received!==false&&x.decision==='refus').length;
    return `<div class="reception-saved-item">
      <div><strong>${escapeHtml(r.supplier||'Fournisseur')} · ${escapeHtml(formatClosureDate(r.date))} ${escapeHtml(r.time||'')}</strong><span>${received} produit${received>1?'s':''} réceptionné${received>1?'s':''}${refus?` · ${refus} refus`:''}${r.driverSignature?' · signature enregistrée':''}</span></div>
      <div class="reception-saved-actions"><button class="btn btn-secondary btn-small" type="button" data-edit-reception="${i}">Modifier</button><button class="btn btn-danger btn-small" type="button" data-delete-reception="${i}">Supprimer</button></div>
    </div>`;
  }).join('');
  box.querySelectorAll('[data-edit-reception]').forEach(b=>b.onclick=()=>openReceptionView(Number(b.dataset.editReception)));
  box.querySelectorAll('[data-delete-reception]').forEach(b=>b.onclick=()=>{
    const i=Number(b.dataset.deleteReception);
    if(!confirm('Supprimer cette fiche de réception ?'))return;
    receptionList(cfg).splice(i,1);
    receptionEditingIndex=-1;
    receptionDraft=newReceptionRecord(cfg);
    renderReceptionForm();
    renderReceptionConfigStatus();
    if(cfg===state.config)saveState();
  });
}
function newReceptionForm(){
  receptionEditingIndex=-1;
  receptionDraft=newReceptionRecord(receptionConfig());
  renderReceptionForm();
  const s=$('#receptionSupplier'),m=$('#receptionSupplierManual');
  if(m&&m.style.display!=='none')m.focus();
  else s?.focus();
}

function receptionPaperData(){
  const cfg=receptionConfig()||state?.config||{};
  const products=(cfg.products||[]).map((p,i)=>String(p.name||`Produit ${i+1}`));
  while(products.length<10)products.push('');
  return{
    lotName:String(cfg.lotName||''),
    products:products.slice(0,14)
  };
}
function receptionPrintableHtml(){
  const d=receptionPaperData();
  const rows=d.products.map(name=>`<tr>
    <td></td><td></td><td class="prod">${escapeHtml(name)}</td>
    <td></td><td></td><td></td><td></td>
    <td></td><td></td><td></td><td></td>
  </tr>`).join('');
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Réception des échantillons</title>
  <style>
    @page{size:A4 landscape;margin:9mm}
    *{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111;margin:0}
    h1{text-align:center;font-size:17px;margin:0 0 8px}
    .meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:7px;font-size:10px}
    .box{border:1px solid #333;padding:5px;min-height:26px}.box b{font-size:9px}
    table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:8px}
    th,td{border:1px solid #222;padding:3px;text-align:center;height:24px;vertical-align:middle}
    th{background:#f1f1f1;font-size:7.5px}.prod{text-align:left;font-weight:600}
    .sign{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px}
    .sign>div{border:1px solid #333;min-height:55px;padding:5px;font-size:9px}
    .note{font-size:8px;margin-top:5px;color:#444}
    @media print{button{display:none}}
  </style></head><body>
    <h1>RELEVÉ DE RÉCEPTION DES ÉCHANTILLONS</h1>
    <div class="meta">
      <div class="box"><b>Établissement :</b></div>
      <div class="box"><b>Lot :</b> ${escapeHtml(d.lotName)}</div>
      <div class="box"><b>Fournisseur :</b></div>
      <div class="box"><b>Nom du livreur :</b></div>
      <div class="box"><b>Agent réceptionnaire :</b></div>
      <div class="box"><b>Date générale / heure :</b></div>
    </div>
    <table>
      <thead><tr>
        <th style="width:7%">Date</th><th style="width:6%">Heure</th><th style="width:17%">Dénomination du produit</th>
        <th style="width:7%">T° véhicule</th><th style="width:7%">T° produit</th><th style="width:8%">T° intérieur produit</th>
        <th style="width:10%">DLC / DDM</th><th style="width:9%">État emballage</th>
        <th style="width:7%">Acceptation</th><th style="width:6%">Refus</th><th style="width:16%">Observations</th>
      </tr></thead><tbody>${rows}</tbody>
    </table>
    <div class="sign">
      <div><b>Signature du livreur :</b></div>
      <div><b>Observations générales / réserves :</b></div>
    </div>
    <div class="note">DLC = Date limite de consommation. DDM = Date de durabilité minimale.</div>
  </body></html>`;
}
function printReceptionPaper(){
  const w=window.open('','_blank');
  if(!w){alert('Autorisez les fenêtres pop-up pour imprimer la fiche.');return}
  w.document.open();
  w.document.write(receptionPrintableHtml());
  w.document.close();
  setTimeout(()=>{try{w.focus();w.print()}catch(e){console.error(e)}},350);
}
async function downloadReceptionPaperPdf(){
  const JsPDF=window.jspdf?.jsPDF;
  if(!JsPDF){alert('Le module PDF n’est pas chargé. Vérifiez la connexion Internet puis réessayez.');return}
  const d=receptionPaperData();
  const doc=new JsPDF({orientation:'landscape',unit:'mm',format:'a4'});
  const W=297,H=210,m=8;
  let y=10;
  doc.setFont('helvetica','bold');doc.setFontSize(14);
  doc.text('RELEVE DE RECEPTION DES ECHANTILLONS',W/2,y,{align:'center'});
  y+=6;
  doc.setFontSize(8);doc.setFont('helvetica','normal');

  const metaH=12, colW=(W-2*m)/3;
  const metas=[
    ['Etablissement',''],['Lot',d.lotName],['Fournisseur',''],
    ['Nom du livreur',''],['Agent receptionnaire',''],['Date generale / heure','']
  ];
  metas.forEach((it,i)=>{
    const row=Math.floor(i/3),col=i%3,x=m+col*colW,yy=y+row*metaH;
    doc.rect(x,yy,colW,metaH);
    doc.setFont('helvetica','bold');doc.text(`${it[0]} :`,x+2,yy+4);
    doc.setFont('helvetica','normal');
    if(it[1])doc.text(doc.splitTextToSize(it[1],colW-26),x+24,yy+4);
  });
  y+=metaH*2+4;

  const headers=['Date','Heure','Produit','T veh.','T prod.','T int.','DLC / DDM','Emballage','Accept.','Refus','Observations'];
  const widths=[15,14,47,18,18,20,26,24,18,14,67];
  const rowH=9;
  let x=m;
  doc.setFont('helvetica','bold');doc.setFontSize(6.7);
  headers.forEach((h,i)=>{doc.setFillColor(242,242,242);doc.rect(x,y,widths[i],rowH,'FD');doc.text(h,x+widths[i]/2,y+5.5,{align:'center'});x+=widths[i]});
  y+=rowH;
  doc.setFont('helvetica','normal');doc.setFontSize(7);
  d.products.forEach(name=>{
    x=m;
    headers.forEach((_,i)=>{
      doc.rect(x,y,widths[i],rowH);
      if(i===2 && name){
        const lines=doc.splitTextToSize(name,widths[i]-3);
        doc.text(lines.slice(0,2),x+1.5,y+3.8);
      }
      x+=widths[i];
    });
    y+=rowH;
  });

  y+=4;
  const sigW=(W-2*m-5)/2;
  doc.rect(m,y,sigW,28);doc.rect(m+sigW+5,y,sigW,28);
  doc.setFont('helvetica','bold');doc.setFontSize(8);
  doc.text('Signature du livreur :',m+2,y+5);
  doc.text('Observations generales / reserves :',m+sigW+7,y+5);
  doc.setFont('helvetica','normal');doc.setFontSize(7);
  doc.text('DLC = Date limite de consommation. DDM = Date de durabilite minimale.',m,H-5);

  const lot=(typeof safePdfFileName==='function'?safePdfFileName(d.lotName||'lot'):(d.lotName||'lot').replace(/[^a-z0-9]+/gi,'-'));
  doc.save(`fiche-reception-chauffeur-${lot}.pdf`);
}

function closeReceptionView(){
  captureReceptionForm();
  if(draftConfig){
    showView('configView');
    $('#headerTitle').textContent='Préparer le jury';
    $('#headerSub').textContent='Questions, testeurs et validation';
    renderConfig();
    setTimeout(()=>$('#configReceptionStep')?.scrollIntoView({behavior:'smooth',block:'center'}),80);
  }else renderHome();
}




var prepareJuryV181Busy=false;
function prepareJuryFromHomeV181(evt){
  if(prepareJuryV181Busy)return false;
  prepareJuryV181Busy=true;
  try{
    if(evt && typeof evt.preventDefault==='function')evt.preventDefault();
    prepareJuryFromHomeV180(evt || null);
  }catch(err){
    console.error('Préparer le jury v181',err);
    alert('Impossible d’ouvrir la liste des jurys. Rechargez cette page dans Safari.');
  }
  setTimeout(function(){prepareJuryV181Busy=false;},500);
  return false;
}

function prepareJuryFromHomeV180(event){
  try{event?.preventDefault?.()}catch(e){}
  const modal=$('#prepareJuryModal');
  const list=$('#prepareJuryList');
  const intro=$('#prepareJuryModalText');

  if(!modal||!list){
    alert('La fenêtre « Préparer le jury » ne peut pas s’ouvrir. Rechargez la page.');
    return false;
  }

  // La fenêtre s'ouvre D'ABORD. Ainsi le bouton répond toujours.
  modal.classList.add('show');
  if(intro)intro.textContent='Choisissez le lot ou le jury que vous voulez préparer.';
  list.innerHTML='<div class="prepare-jury-empty-v180">Chargement des lots enregistrés…</div>';

  setTimeout(()=>{
    try{
      const items=[];
      const used=new Set();
      const preparedLogicalLots=new Set();

      const normalizeLotText=(v)=>String(v||'').trim().toLowerCase().replace(/\s+/g,' ');
      const logicalLotKey=(lotName,products)=>{
        const names=(Array.isArray(products)?products:[])
          .map(p=>normalizeLotText(typeof p==='string'?p:p?.name))
          .filter(Boolean)
          .sort();
        const lot=normalizeLotText(lotName);
        return lot ? `${lot}|${names.join('|')}` : '';
      };

      const addItem=(item)=>{
        if(!item||!item.id)return;
        const key=String(item.key||item.id);
        if(used.has(key))return;
        used.add(key);
        items.push(item);
      };

      // A. Jurys déjà préparés/enregistrés.
      let prepared=[];
      try{
        const raw=loadPreparedJurys();
        prepared=Array.isArray(raw)?raw:[];
      }catch(e){prepared=[]}

      for(const rec of prepared){
        try{
          const cfg=rec?.state?.config;
          if(!cfg||cfg?.juryClose?.closedAt)continue;
          const products=Array.isArray(cfg.products)?cfg.products:[];
          if(!products.length)continue;
          const id=String(rec.id||cfg._preparedId||'').trim();
          if(!id)continue;
          const suppliers=receptionSupplierNames(cfg);
          const phonesReady=phoneSharePrepared(cfg);
          const phonesRefresh=phoneShareNeedsRefresh(cfg);
          const logicalKey=logicalLotKey(String(cfg.lotName||rec.name||'Jury préparé'),products);
          if(logicalKey)preparedLogicalLots.add(logicalKey);
          addItem({
            id,
            key:`prepared:${id}`,
            kind:'prepared',
            lotName:String(cfg.lotName||rec.name||'Jury préparé'),
            products:products.length,
            suppliers:suppliers.length,
            status:cfg?.juryLaunch?.openedAt
              ?'Jury déjà lancé'
              :phonesRefresh
                ?'↻ Recharger les téléphones'
                :phonesReady
                  ?'✓ Téléphones prêts'
                  :'📱 Téléphones à préparer'
          });
        }catch(e){}
      }

      // B. Lots conservés depuis « Choix des échantillons ».
      let history=[];
      try{
        const raw=loadSampleLotHistory();
        history=Array.isArray(raw)?raw:[];
      }catch(e){history=[]}

      for(const rec of history){
        try{
          const products=Array.isArray(rec?.products)?rec.products:[];
          const meta=rec?.meta&&typeof rec.meta==='object'?rec.meta:{};
          const lotName=String(rec?.lotName||lotNameFromSampleMeta(meta)||'').trim();
          if(!lotName||!products.length)continue;

          const signature=String(rec?.signature||sampleLotSnapshotSignature(meta,products));
          const logicalKey=logicalLotKey(lotName,products);
          // Un même lot ne doit apparaître qu'une seule fois. Si un jury préparé
          // existe déjà pour exactement ce lot et ces produits, on garde l'état
          // le plus avancé (le jury préparé) et on masque le doublon "lot enregistré".
          if(logicalKey&&preparedLogicalLots.has(logicalKey))continue;
          addItem({
            id:String(rec.id||uid('samplelot')),
            key:`sample:${signature||rec.id}`,
            kind:'sampleLot',
            lotName,
            products:products.length,
            suppliers:(Array.isArray(meta.supplierNames)?meta.supplierNames:[]).filter(x=>String(x||'').trim()).length,
            status:'Lot enregistré — à préparer',
            snapshot:{...rec,meta,products}
          });
        }catch(e){}
      }

      // C. Compatibilité avec le dernier lot saisi dans les anciennes versions.
      try{
        const products=loadSampleProducts();
        const meta=loadSampleMasterMeta();
        const lotName=String(lotNameFromSampleMeta(meta)||'').trim();
        const usable=Array.isArray(products)?products.filter(p=>String(p?.name||'').trim()):[];
        if(lotName&&usable.length){
          const sig=sampleLotSnapshotSignature(meta,usable);
          const already=items.some(x=>{
            if(x.kind==='prepared')return String(x.lotName).trim().toLowerCase()===lotName.toLowerCase();
            return String(x.key||'').includes(sig);
          });
          if(!already){
            addItem({
              id:'__latest_v180__',
              key:`latest:${sig}`,
              kind:'latest',
              lotName,
              products:usable.length,
              suppliers:(Array.isArray(meta.supplierNames)?meta.supplierNames:[]).filter(x=>String(x||'').trim()).length,
              status:'Dernier lot saisi — à préparer',
              meta:deepClone(meta),
              sampleProducts:deepClone(usable)
            });
          }
        }
      }catch(e){}

      if(!items.length){
        if(intro)intro.textContent='Aucun lot enregistré à préparer.';
        list.innerHTML='<div class="prepare-jury-empty-v180">Aucun lot n’est encore disponible.<br>Créez d’abord un lot avec « 1. Choix des échantillons », puis enregistrez-le.</div>';
        return;
      }

      if(intro)intro.textContent=`${items.length} lot${items.length>1?'s':''} / jury${items.length>1?'s':''} disponible${items.length>1?'s':''}. Touchez celui que vous voulez préparer.`;

      list.innerHTML=items.map((c,i)=>`
        <button type="button" class="prepare-jury-choice ${(c.kind==='sampleLot'||c.kind==='latest')?'latest':''}" data-v180-prepare="${i}">
          <span>
            <strong>${escapeHtml(c.lotName)}</strong>
            <span>${c.products} produit${c.products>1?'s':''} · ${c.suppliers} fournisseur${c.suppliers>1?'s':''}</span>
            <span class="prepare-jury-status ${String(c.status||'').includes('Recharger')?'refresh':''}">${escapeHtml(c.status)}</span>
          </span>
          <span class="prepare-arrow">›</span>
        </button>`).join('');

      list.querySelectorAll('[data-v180-prepare]').forEach(btn=>{
        btn.onclick=()=>{
          const item=items[Number(btn.dataset.v180Prepare)];
          if(!item)return;
          closePrepareJuryChooser();

          try{
            if(item.kind==='prepared'){
              activatePreparedJury(item.id,'edit');
              return;
            }

            if(item.kind==='sampleLot'){
              if(!restoreSampleLotSnapshot(item.snapshot)){
                alert('Impossible de recharger ce lot.');
                return;
              }
              startBlankJuryFromMaster();
              return;
            }

            if(item.kind==='latest'){
              saveSampleLotSnapshot(item.meta,item.sampleProducts);
              restoreSampleLotSnapshot({meta:item.meta,products:item.sampleProducts});
              startBlankJuryFromMaster();
            }
          }catch(e){
            console.error(e);
            alert('Ce lot ne peut pas être ouvert. Essayez un autre lot ou recréez uniquement ce lot.');
          }
        };
      });
    }catch(e){
      console.error('Préparer le jury v180',e);
      if(intro)intro.textContent='Préparer le jury';
      list.innerHTML='<div class="prepare-jury-empty-v180">Une ancienne donnée empêche de lire certains lots. Les autres fonctions de l’application restent disponibles.</div>';
    }
  },0);

  return false;
}

function closePrepareJuryChooser(){
  $('#prepareJuryModal')?.classList.remove('show');
}
function prepareJurySignatureFromConfig(cfg){
  try{
    if(!cfg||typeof cfg!=='object')return'';
    const lot=String(cfg.lotName||'').trim().toLowerCase();
    const products=(Array.isArray(cfg.products)?cfg.products:[])
      .map(p=>String(p?.name||'').trim().toLowerCase()).filter(Boolean).join('|');
    const suppliers=receptionSupplierNames(cfg)
      .map(x=>String(x||'').trim().toLowerCase()).filter(Boolean).sort().join('|');
    return `${lot}::${products}::${suppliers}`;
  }catch(e){
    console.warn('Ancien jury ignoré pour la signature',e);
    return'';
  }
}
function prepareJuryLatestSampleChoice(){
  try{
    const products=loadSampleProducts();
    const meta=loadSampleMasterMeta();
    const usable=Array.isArray(products)?products:[];
    const ready=usable.length&&usable.some(p=>String(p?.name||'').trim());
    const lotName=lotNameFromSampleMeta(meta);
    const suppliers=(Array.isArray(meta.supplierNames)?meta.supplierNames:[])
      .map(x=>String(x||'').trim()).filter(Boolean);
    if(!ready||!String(lotName||'').trim()||!suppliers.length)return null;
    return{
      id:'__latest_sample_setup__',
      kind:'latest',
      lotName,
      products:usable.filter(p=>String(p?.name||'').trim()).length,
      suppliers:(Array.isArray(meta.supplierNames)?meta.supplierNames:[]).filter(x=>String(x||'').trim()).length,
      signature:sampleLotSnapshotSignature(meta,usable),
      meta:deepClone(meta),
      sampleProducts:deepClone(usable)
    };
  }catch(e){
    console.warn('Dernier lot non exploitable',e);
    return null;
  }
}
function prepareJuryChoices(){
  if(localStorage.getItem('jm_tc_lots_clean_mode_v207'))return [];
  try{ensureCurrentPrepSaved()}catch(e){console.warn('Sauvegarde du jury courant non bloquante',e)}

  const choices=[];
  const signatures=new Set();
  const currentId=String(state?.config?._preparedId||'');

  // Jurys déjà préparés. Un ancien enregistrement invalide est simplement ignoré.
  let prepared=[];
  try{
    const raw=loadPreparedJurys();
    prepared=(Array.isArray(raw)?raw:[])
      .filter(rec=>rec&&rec.state&&rec.state.config&&typeof rec.state.config==='object')
      .sort((a,b)=>String(b?.savedAt||'').localeCompare(String(a?.savedAt||'')));
  }catch(e){
    console.warn('Liste des jurys préparés illisible',e);
    prepared=[];
  }

  for(const rec of prepared){
    try{
      const cfg=rec.state.config||{};
      if(cfg?.juryClose?.closedAt)continue;
      try{healSupplierNamesV252(cfg)}catch(e){}
      const products=Array.isArray(cfg.products)?cfg.products:[];
      if(!products.length)continue;
      if(!supplierNamesFromConfigV252(cfg).length)continue;
      const id=String(rec.id||cfg._preparedId||'').trim();
      if(!id)continue;
      const signature=prepareJurySignatureFromConfig(cfg);
      choices.push({
        id,
        kind:'prepared',
        lotName:String(cfg.lotName||rec.name||'Jury préparé'),
        products:products.length,
        suppliers:receptionSupplierNames(cfg).length,
        current:id===currentId,
        running:!!cfg.juryLaunch?.openedAt&&!cfg.juryClose?.closedAt,
        signature
      });
      if(signature)signatures.add(signature);
    }catch(e){
      console.warn('Jury ancien ignoré',e);
    }
  }

  // Lots sauvegardés depuis « Choix des échantillons ».
  let history=[];
  try{
    const raw=loadSampleLotHistory();
    history=(Array.isArray(raw)?raw:[])
      .filter(rec=>rec&&typeof rec==='object')
      .sort((a,b)=>String(b?.savedAt||'').localeCompare(String(a?.savedAt||'')));
  }catch(e){
    console.warn('Historique des lots illisible',e);
    history=[];
  }

  for(const rec of history){
    try{
      const products=Array.isArray(rec.products)?rec.products:[];
      const meta=rec.meta&&typeof rec.meta==='object'?rec.meta:{};
      if(!products.length)continue;
      const historySuppliers=(Array.isArray(meta.supplierNames)?meta.supplierNames:[])
        .map(x=>String(x||'').trim()).filter(Boolean);
      if(!historySuppliers.length)continue;
      const lotName=String(rec.lotName||lotNameFromSampleMeta(meta)||'').trim();
      if(!lotName)continue;
      const id=String(rec.id||uid('samplelot')).trim();
      const signature=String(rec.signature||sampleLotSnapshotSignature(meta,products));
      if(signature&&signatures.has(signature))continue;
      choices.push({
        id,
        kind:'sampleLot',
        lotName,
        products:products.filter(p=>String(p?.name||'').trim()).length||products.length,
        suppliers:(Array.isArray(meta.supplierNames)?meta.supplierNames:[]).filter(x=>String(x||'').trim()).length,
        current:false,
        running:false,
        signature,
        snapshot:{...rec,id,meta,products}
      });
      if(signature)signatures.add(signature);
    }catch(e){
      console.warn('Lot ancien ignoré',e);
    }
  }

  // Compatibilité avec le dernier lot des anciennes versions.
  const latest=prepareJuryLatestSampleChoice();
  if(latest&&(!latest.signature||!signatures.has(latest.signature))){
    choices.unshift(latest);
  }

  return choices;
}
function activatePrepareJuryChoice(choice){
  closePrepareJuryChooser();
  if(!choice)return;

  try{
    if(choice.kind==='prepared'){
      activatePreparedJury(choice.id,'edit');
      return;
    }

    if(choice.kind==='sampleLot'){
      if(!restoreSampleLotSnapshot(choice.snapshot)){
        alert('Impossible de recharger ce lot.');
        return;
      }
      startBlankJuryFromMaster();
      return;
    }

    if(choice.kind==='latest'){
      try{saveSampleLotSnapshot(choice.meta,choice.sampleProducts)}catch(e){}
      if(!restoreSampleLotSnapshot({meta:choice.meta,products:choice.sampleProducts})){
        alert('Impossible de recharger ce lot.');
        return;
      }
      startBlankJuryFromMaster();
    }
  }catch(e){
    console.error('Ouverture du jury impossible',e);
    alert('Ce jury ne peut pas être ouvert car son ancien enregistrement est incomplet. Les autres jurys restent disponibles.');
  }
}
function showPrepareJuryChooser(choices){
  const modal=$('#prepareJuryModal'),list=$('#prepareJuryList');
  if(!modal||!list){
    alert('La fenêtre de choix du jury est indisponible. Rechargez la page.');
    return;
  }

  const safeChoices=Array.isArray(choices)?choices.filter(Boolean):[];
  const intro=$('#prepareJuryModalText');
  if(intro)intro.textContent=safeChoices.length>1
    ?`${safeChoices.length} jurys / lots sont disponibles. Touchez celui que vous voulez préparer.`
    :'1 jury / lot est disponible. Touchez-le pour le préparer.';

  list.innerHTML=safeChoices.map(c=>{
    const status=c.kind==='sampleLot'||c.kind==='latest'
      ?'Lot enregistré — préparation à terminer'
      :c.running
        ?'Jury déjà lancé'
        :c.current
          ?'Jury actuellement ouvert'
          :'Jury préparé et enregistré';

    return `<button type="button" class="prepare-jury-choice ${c.current?'current':''} ${(c.kind==='sampleLot'||c.kind==='latest')?'latest':''}" data-prepare-jury="${escapeHtml(String(c.id||''))}">
      <span>
        <strong>${escapeHtml(String(c.lotName||'Lot'))}</strong>
        <span>${Number(c.products||0)} produit${Number(c.products||0)>1?'s':''} · ${Number(c.suppliers||0)} fournisseur${Number(c.suppliers||0)>1?'s':''}</span>
        <span class="prepare-jury-status ${String(status||'').includes('Recharger')?'refresh':''}">${escapeHtml(status)}</span>
      </span>
      <span class="prepare-arrow">›</span>
    </button>`;
  }).join('');

  list.querySelectorAll('[data-prepare-jury]').forEach(btn=>{
    btn.onclick=()=>{
      const choice=safeChoices.find(c=>String(c.id)===String(btn.dataset.prepareJury));
      if(choice)activatePrepareJuryChoice(choice);
    };
  });

  modal.classList.add('show');
}
function prepareJuryFromHome(){
  const choices=prepareJuryChoices();

  if(!choices.length){
    alert('Aucun lot n’est encore enregistré à préparer.\n\nUtilisez d’abord « 1. Choix des échantillons », puis « Enregistrer et préparer le jury ».');
    return;
  }

  if(choices.length===1){
    activatePrepareJuryChoice(choices[0]);
    return;
  }

  showPrepareJuryChooser(choices);
}
function prepareJuryFromHomeSafe(event){
  try{
    event?.preventDefault?.();
    prepareJuryFromHome();
  }catch(e){
    console.error('Erreur Préparer le jury',e);
    // Dernier secours : essayer uniquement le dernier lot courant.
    try{
      const latest=prepareJuryLatestSampleChoice();
      if(latest){
        activatePrepareJuryChoice(latest);
        return;
      }
    }catch(err){}
    alert('Impossible d’ouvrir la préparation du jury avec les anciennes données enregistrées. Le reste de l’application reste utilisable.');
  }
}

function freshNewJuryDraft(){
  const meta=loadSampleMasterMeta();
  const setupProducts=loadSampleProducts();
  const products=(setupProducts.length?setupProducts:[{name:meta.productName||'',samples:masterSamplesForNewProduct()}]).map((p,i)=>({
    id:uid('p'),
    code:String(i+1).padStart(2,'0'),
    name:String(p.name||'').trim(),
    color:PALETTE[i%PALETTE.length],
    criteria:defaultCriteria(),
    samples:rowsForAllSuppliers([],meta.supplierNames||[])
  }));
  products.forEach(p=>{if(!p.samples.length)p.samples=[{id:'',supplier:''}]});
  return {
    _juryInstanceId:uid('jury'),
    lotName:lotNameFromSampleMeta(meta),
    lotNumber:meta.lotNumber||'',
    lotTitle:meta.lotTitle||'',
    supplierNames:[...(meta.supplierNames||[])],
    supplierResponseCount:(meta.supplierNames||[]).length||meta.supplierResponseCount||0,
    receptions:[],
    receptionEstablishment:'',
    subtitle:'',
    criteria:defaultCriteria(),
    testerCount:8,
    testerNames:Array.from({length:8},(_,i)=>`Testeur ${i+1}`),
    products,
    security:state.config?.security?deepClone(state.config.security):null
  };
}
function resetCreateJurySelection(){
  showBothCreationMethods();
  pendingMarketLot='';
  draftConfig=null;

  const market=$('#marketLotSelect');
  if(market)market.value='';

  const lotInput=$('#blankLotName');
  if(lotInput)lotInput.value='';

  const lotBox=$('#blankLotEntry');
  if(lotBox)lotBox.hidden=true;

  const blankBtn=$('#blankTestBtn');
  if(blankBtn){
    blankBtn.classList.remove('clicked');
    blankBtn.disabled=false;
    blankBtn.textContent='CRÉER UN JURY VIERGE';
  }

  const marketBtn=$('#useMarketLotBtn');
  if(marketBtn){
    marketBtn.classList.remove('clicked','prepared');
    marketBtn.disabled=true;
    marketBtn.textContent='CRÉER CE JURY';
  }
}
function cancelCreateJury(){
  resetCreateJurySelection();
  renderHome();
}
function dashboardNewJury(){
  const intro=document.querySelector('#configView .creation-choice-intro');
  const methods=$('#creationMethods');
  if(intro)intro.style.display='';
  if(methods)methods.style.display='';
  const heroTitle=document.querySelector('#configView .config-start-hero h2');
  if(heroTitle)heroTitle.textContent='Préparer le jury';
  /* V122 : sauvegarder le jury actuel avant d'en préparer un autre.
     Un jury déjà en cours reste accessible dans "Mes jurys". */
  try{
    if(state?.config?._preparedId && !isJuryClosed()){
      saveState();
      upsertPreparedJury(state);
    }else{
      ensureCurrentPrepSaved();
    }
  }catch(e){
    console.warn('Sauvegarde du jury actuel avant création',e);
  }

  if(isJuryClosed()){
    preserveClosedJuryBeforeNew();
  }

  pendingMarketLot='';
  draftConfig=freshNewJuryDraft();

  showView('configView');
  $('#headerTitle').textContent='Créer un jury';
  $('#headerSub').textContent='Préparation du test culinaire';

  renderConfig();
  showBothCreationMethods();

  const lotBox=$('#blankLotEntry');
  if(lotBox)lotBox.hidden=true;

  const lotInput=$('#blankLotName');
  if(lotInput)lotInput.value='';

  const blankBtn=$('#blankTestBtn');
  if(blankBtn){
    blankBtn.classList.remove('clicked');
    blankBtn.disabled=false;
    blankBtn.textContent='CRÉER UN JURY VIERGE';
  }

  const market=$('#marketLotSelect');
  if(market)market.value='';

  const marketBtn=$('#useMarketLotBtn');
  if(marketBtn){
    marketBtn.classList.remove('clicked','prepared');
    marketBtn.disabled=true;
    marketBtn.textContent='CRÉER CE JURY';
  }
}

function renderMyJuriesDashboard(){
  const prep=$('#prepLane'),run=$('#runLane'),done=$('#doneLane');
  if(!prep||!run||!done)return;
  const phase=currentJuryPhase();
  const prepared=loadPreparedJurys();
  const archives=loadArchives().sort((a,b)=>String(b.archivedAt||'').localeCompare(String(a.archivedAt||'')));
  const currentArchiveId=state.config?._archive?.archiveId||null;
  const recentArchives=archives.filter(a=>a.id!==currentArchiveId).slice(0,4);

  prep.innerHTML=prepared.length
    ?prepared.map(renderPreparedDashboardCard).join('')
    :`<div class="jury-create-card"><div class="plus">＋</div><strong>Créer un jury</strong><span>Préparez ici votre prochain lot.</span><button class="btn btn-ghost btn-small" data-dash-action="new">Créer un jury</button></div>`;

  run.innerHTML=phase==='run'
    ?renderCurrentDashboardCard('run')
    :'<div class="jury-empty">Aucun jury en cours.</div>';

  done.innerHTML='';
  if(phase==='done')done.innerHTML=renderCurrentDashboardCard('done');
  recentArchives.forEach(rec=>done.insertAdjacentHTML('beforeend',renderArchiveDashboardCard(rec)));
  if(phase!=='done'&&!recentArchives.length)done.innerHTML='<div class="jury-empty">Aucun jury fermé ou archivé.</div>';

  const prepCount=prepared.length,runCount=phase==='run'?1:0,doneCount=archives.length+(phase==='done'&&!currentArchiveId?1:0);
  $('#dashPrepCount').textContent=prepCount;$('#dashRunCount').textContent=runCount;$('#dashDoneCount').textContent=doneCount;
  $('#prepLaneCount').textContent=prepCount;$('#runLaneCount').textContent=runCount;$('#doneLaneCount').textContent=doneCount;

  document.querySelectorAll('[data-dash-action]').forEach(b=>b.onclick=()=>{
    const a=b.dataset.dashAction;
    if(a==='edit')openConfig();else if(a==='open')openJuryFlow();else if(a==='live')renderLiveDay();else if(a==='results')renderAdmin();else if(a==='closure')renderClosure();else if(a==='new')prepareJuryFromHome();
  });
  document.querySelectorAll('[data-prepared-edit]').forEach(b=>b.onclick=()=>activatePreparedJury(b.dataset.preparedEdit,'edit'));
  document.querySelectorAll('[data-prepared-launch]').forEach(b=>b.onclick=()=>activatePreparedJury(b.dataset.preparedLaunch,'launch'));
  document.querySelectorAll('[data-prepared-resume]').forEach(b=>b.onclick=()=>activatePreparedJury(b.dataset.preparedResume,'resume'));
  document.querySelectorAll('[data-dash-archive-dossier]').forEach(b=>b.onclick=()=>openArchiveDossier(b.dataset.dashArchiveDossier));
  document.querySelectorAll('[data-dash-archive-summary]').forEach(b=>b.onclick=()=>openArchiveSummary(b.dataset.dashArchiveSummary));
  document.querySelectorAll('[data-dash-archive-report]').forEach(b=>b.onclick=()=>openArchiveReport(b.dataset.dashArchiveReport));
  document.querySelectorAll('[data-dash-archive-minutes]').forEach(b=>b.onclick=()=>openArchiveMinutes(b.dataset.dashArchiveMinutes));
  document.querySelectorAll('[data-dash-archive-copy]').forEach(b=>b.onclick=()=>copyArchiveAsNew(b.dataset.dashArchiveCopy));
}

function renderHome(){ensureCurrentPrepSaved();updateHeader();showView('homeView');renderHomeReceptionBadge();const cfg=state.config,p=lotDisplayParts(),m=juryMetrics();$('#headerTitle').textContent='Tests culinaires';$('#headerSub').textContent='Groupe Marchés Nouvelle-Aquitaine';$('#homeTitle').textContent='Tests culinaires';$('#homeSubtitle').innerHTML='<strong>Groupe Marchés Nouvelle-Aquitaine</strong><br><span>Préparation, dégustation et suivi des jurys marchés</span>';const hc=$('#homeLotContext');if(hc)hc.textContent=p.title+(p.subtitle?` · ${p.subtitle}`:'');$('#homeMeta').innerHTML=`<span class="hero-chip">${cfg.products.length} produit${cfg.products.length>1?'s':''}</span><span class="hero-chip">${totalSamples()} échantillon${totalSamples()>1?'s':''}</span><span class="hero-chip">${cfg.testerCount} testeur${cfg.testerCount>1?'s':''}</span><span class="hero-chip">5 questions · 65 points</span>`;let status='Jury prêt',detail=' · Test à l’aveugle, fournisseurs masqués',progress='Aucune dégustation commencée';if(isJuryOfficiallyOpen()&&m.done>0&&m.done<m.max){status='Jury en cours';detail=` · ${m.finished}/${cfg.testerCount} testeur${cfg.testerCount>1?'s':''} complet${m.finished>1?'s':''}`;progress=`${m.done} fiche${m.done>1?'s':''} sur ${m.max} terminée${m.done>1?'s':''}`}else if(isJuryOfficiallyOpen()&&m.max>0&&m.done===m.max&&m.validated<cfg.testerCount){status='Validations en attente';detail=` · ${m.validated}/${cfg.testerCount} testeur${cfg.testerCount>1?'s':''} validé${m.validated>1?'s':''}`;progress='Toutes les dégustations sont complètes'}else if(isJuryOfficiallyOpen()&&m.max>0&&m.done===m.max&&m.validated===cfg.testerCount){status='Jury terminé';detail=' · Tous les tests sont validés et verrouillés';progress='Jury entièrement validé'}$('#homeJuryStatus').textContent=status;$('#homeJuryDetail').textContent=detail;$('#homeProgressTitle').textContent=progress;$('#homeProgressDetail').textContent=m.max?(m.remaining?`${m.remaining} fiche${m.remaining>1?'s':''} restante${m.remaining>1?'s':''}.`:`${m.validated}/${cfg.testerCount} validation${cfg.testerCount>1?'s':''} définitive${cfg.testerCount>1?'s':''}.`):'Aucun échantillon paramétré.';$('#homeProgressPct').textContent=`${m.pct} %`;const opened=isJuryOfficiallyOpen(),closed=isJuryClosed();if(closed){status='Jury fermé';detail=` · ${fmtCloseDate(juryCloseInfo().closedAt)}`;progress=state.config?._archive?.archivedAt?'Jury archivé':'Clôture administrative à terminer';$('#homeJuryStatus').textContent=status;$('#homeJuryDetail').textContent=detail;$('#homeProgressTitle').textContent=progress;}const fullyValidated=m.max>0&&m.done===m.max&&m.validated===cfg.testerCount;
const preparedCount=loadPreparedJurys().filter(r=>!r?.state?.config?.juryClose?.closedAt).length;
$('#juryBtnTitle').textContent=preparedCount>1
  ?'Choisir un jury'
  :preparedCount===1
    ?'Lancer le jury'
    :closed
      ?'Lancer un jury'
      :(opened||m.done)
        ?'Reprendre le jury'
        :'Lancer le jury';
$('#juryBtnSub').textContent='';
const ac=loadArchives().length;const ah=$('#archiveHomeCount');if(ah)ah.textContent=ac?`${ac} jury${ac>1?'s':''} archivé${ac>1?'s':''}`:'Aucun jury archivé';renderMyJuriesDashboard();renderPreparedHome()}


function juryCloseInfo(){return state.config?.juryClose||{}}
function isJuryClosed(){return !!juryCloseInfo().closedAt}
function juryReadyToClose(){
  const m=juryMetrics();
  return m.max>0&&m.done===m.max&&m.validated===state.config.testerCount;
}
function fmtCloseDate(v){
  if(!v)return '';
  try{return new Date(v).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}catch(e){return v}
}
async function closeJuryOfficially(options={}){
  const automatic=options?.automatic===true;
  if(isJuryClosed()){renderClosure();return}
  if(!juryReadyToClose()){
    if(!automatic)alert('Le jury ne peut être fermé que lorsque tous les testeurs ont terminé et validé leur test.');
    return;
  }
  if(!automatic){
    const ok=confirm('Fermer officiellement le jury ?\n\nAprès fermeture, tous les accès testeurs seront bloqués et aucune note ne pourra être modifiée. Vous passerez ensuite à la fiche de clôture, au rapport final puis à l’archivage.');
    if(!ok)return;
  }
  state.config.juryClose={
    closedAt:new Date().toISOString(),
    openedAt:state.config?.juryLaunch?.openedAt||null,
    mode:(typeof cloudReady!=='undefined'&&cloudReady)?'shared':'local',
    sessionId:(typeof cloudCfg!=='undefined'&&cloudCfg?.sessionId)?cloudCfg.sessionId:''
  };
  const c=ensureClosure();
  if(!c.date)c.date=todayIsoLocal();
  c.closedAt=state.config.juryClose.closedAt;
  state.config.closure=c;
  saveState();
  removePreparedJury(state.config?._preparedId);
  if(typeof syncDirtyToCloud==='function'){try{await syncDirtyToCloud()}catch(e){}}
  toast(automatic?'Jury terminé automatiquement ✓':'Jury fermé — accès testeurs verrouillés ✓');
  renderClosure();
}
function renderResultsWorkflow(){
  const box=$('#resultsWorkflow');if(!box)return;
  const m=juryMetrics(),closed=isJuryClosed(),closureReady=closureIsReady(),archived=!!state.config?._archive?.archivedAt;
  const steps=[
    {n:1,label:'Dégustations',done:m.max>0&&m.done===m.max,current:m.done<m.max},
    {n:2,label:'Validations',done:m.validated===state.config.testerCount&&state.config.testerCount>0,current:m.done===m.max&&m.validated<state.config.testerCount},
    {n:3,label:'Fermeture & clôture',done:closed&&closureReady,current:m.validated===state.config.testerCount&&(!closed||!closureReady)},
    {n:4,label:'Rapport & archive',done:archived,current:closed&&closureReady&&!archived}
  ];
  box.innerHTML=steps.map(s=>`<div class="workflow-step ${s.done?'done':s.current?'current':''}"><div class="n">${s.done?'✓':s.n}</div><strong>${escapeHtml(s.label)}</strong></div>`).join('');
}

function juryLaunchInfo(){return state.config?.juryLaunch||{}}
/* V160 — verrou d'ouverture lié à l'identité exacte du jury.
   Un ancien openedAt provenant d'une autre session/lot ne peut plus ouvrir un nouveau jury. */
function juryInstanceId(cfg=state.config){
  return String(cfg?._juryInstanceId||cfg?.juryInstanceId||'').trim();
}
function ensureJuryInstanceId(cfg=state.config){
  if(!cfg)return '';
  if(!juryInstanceId(cfg))cfg._juryInstanceId=uid('jury');
  return juryInstanceId(cfg);
}
function isJuryOfficiallyOpen(){
  const launch=juryLaunchInfo();
  const currentId=juryInstanceId(state.config);
  const launchId=String(launch?.instanceId||'').trim();
  /* V161 — verrou absolu : aucune compatibilité permissive.
     Sans identifiant du jury, sans identifiant de lancement identique, ou sans date
     de lancement officielle, le testeur reste bloqué. */
  if(!currentId||!launchId||!launch?.openedAt)return false;
  return launchId===currentId;
}
let testerLaunchWaitTimer=null;
function testerLinkRequested(){
  try{return new URLSearchParams(location.search).has('tester')}catch(e){return false}
}
function testerMustWaitForLaunch(){
  /* V162 — verrou global.
     Une vraie fiche testeur ne peut être ouverte par PERSONNE avant le lancement
     officiel du jury, y compris depuis le téléphone administrateur/propriétaire.
     Seul le mode explicite "Aperçu testeur" peut montrer la fiche avant lancement. */
  if(testerPreviewMode||isJuryClosed())return false;
  return !isJuryOfficiallyOpen();
}
function stopTesterLaunchWait(){
  if(testerLaunchWaitTimer){clearInterval(testerLaunchWaitTimer);testerLaunchWaitTimer=null}
}
async function refreshTesterLaunchState(){
  if(testerPreviewMode||!cloudReady||cloudRole!=='tester'||!cloudClient||!cloudCfg?.sessionId)return false;
  try{
    let openedAt='',instanceId='';

    /* Voie normale : configuration publique de la session. */
    const {data,error}=await cloudClient.rpc('test_culinaire_get_public_session',{p_session_id:cloudCfg.sessionId});
    if(!error){
      const row=Array.isArray(data)?data[0]:data;
      const remote=row?.public_config;
      const launch=remote?.juryLaunch||null;
      openedAt=String(launch?.openedAt||'');
      instanceId=String(launch?.instanceId||remote?.juryInstanceId||'').trim();
      if(remote?.juryClose?.closedAt)state.config.juryClose={closedAt:remote.juryClose.closedAt};
    }

    /* V220 : secours fiable par la table que le testeur lit déjà pour ses réponses. */
    if(!openedAt){
      const {data:markers,error:markerError}=await cloudClient
        .from('test_culinaire_reponses')
        .select('remarks,updated_at')
        .eq('session_id',cloudCfg.sessionId)
        .eq('tester_no',cloudTesterNo)
        .eq('product_id','__meta__')
        .eq('sample_id','__launch__')
        .limit(1);
      if(!markerError&&markers?.length){
        const remarks=Array.isArray(markers[0].remarks)?markers[0].remarks:[];
        openedAt=String(remarks[0]||markers[0].updated_at||'');
        instanceId=String(remarks[1]||'').trim();
      }
    }

    if(openedAt){
      if(instanceId){
        state.config.juryInstanceId=instanceId;
        state.config._juryInstanceId=instanceId;
      }else{
        instanceId=ensureJuryInstanceId(state.config);
      }
      state.config.juryLaunch={
        openedAt,
        instanceId,
        sessionId:String(state.config?._shareSessionId||state.config?.juryLaunch?.sessionId||cloudCfg?.sessionId||'')
      };
      originalSaveState();
      return true;
    }

    state.config.juryLaunch=null;
    originalSaveState();
    return false;
  }catch(e){
    return false;
  }
}

function startTesterLaunchWait(){
  if(testerLaunchWaitTimer||!testerMustWaitForLaunch())return;
  const check=async()=>{
    if(!testerMustWaitForLaunch()){stopTesterLaunchWait();return}
    if(cloudReady){
      try{
        if(cloudRole==='tester')await refreshTesterLaunchState();
        else if(typeof reloadCloudConfig==='function')await reloadCloudConfig();
      }catch(e){}
    }
    if(isJuryOfficiallyOpen()){
      stopTesterLaunchWait();
      renderTesterSelectors();
      renderSample();
      toast('Jury lancé ✓ — vous pouvez commencer');
    }
  };
  check();
  testerLaunchWaitTimer=setInterval(check,1000);
}
function renderTesterWaitingForLaunch(){
  showView('testerView');
  $('#testerSelect').value=currentTester;
  $('#testerSelect').disabled=true;
  $('#productSelect').disabled=true;
  $('#sampleSelect').disabled=true;
  $('#sampleHero').style.display='none';
  $('#questions').style.display='none';
  $('.sample-actions').style.display='none';
  const vp=$('#validationPanel');
  vp.className='panel tester-closed-screen';
  vp.innerHTML='<div class="lock">🔒</div><h2>Accès verrouillé</h2><p id="testerLaunchWaitText">Le jury n’a pas encore été lancé. Vous ne pouvez pas accéder aux produits, aux questions ni à la validation tant que le responsable n’a pas appuyé sur « Lancer ce jury ».</p><span class="date">L’accès se vérifie automatiquement toutes les secondes.</span><button class="btn btn-primary" id="testerCheckLaunchBtn" type="button" style="margin-top:14px">🔄 Vérifier maintenant</button>';
  const verifyBtn=$('#testerCheckLaunchBtn');
  if(verifyBtn)verifyBtn.onclick=async()=>{
    verifyBtn.disabled=true;
    verifyBtn.textContent='⏳ Vérification…';
    try{
      if(cloudRole==='tester')await refreshTesterLaunchState();
      else if(typeof reloadCloudConfig==='function')await reloadCloudConfig();
      if(isJuryOfficiallyOpen()){
        stopTesterLaunchWait();
        renderTesterSelectors();
        renderSample();
        toast('Jury lancé ✓ — vous pouvez commencer');
        return;
      }
      const txt=$('#testerLaunchWaitText');
      if(txt)txt.textContent='Le lancement n’est pas encore visible sur ce téléphone. Le contrôle automatique continue.';
    }catch(e){}
    verifyBtn.disabled=false;
    verifyBtn.textContent='🔄 Vérifier maintenant';
  };
  startTesterLaunchWait();
}
function fmtLaunchDate(v){
  if(!v)return '';
  try{return new Date(v).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}catch(e){return v}
}

function ensureTesterRosterConsistency(){
  const cfg=state?.config;
  if(!cfg)return;

  let n=Math.max(1,Math.min(20,Number(cfg.testerCount||0)));
  const names=Array.isArray(cfg.testerNames)?cfg.testerNames:[];
  const testerKeys=Object.keys(state.testers||{}).map(Number).filter(Number.isFinite);
  const maxKey=testerKeys.length?Math.max(...testerKeys):0;

  // Si une ancienne version avait enregistré les noms/cartes mais pas testerCount,
  // on récupère automatiquement la valeur la plus complète.
  n=Math.max(n,names.length,maxKey);
  n=Math.min(20,n);

  cfg.testerCount=n;
  cfg.testerNames=names.slice(0,n);
  while(cfg.testerNames.length<n)cfg.testerNames.push(`Testeur ${cfg.testerNames.length+1}`);

  state.testers=state.testers||{};
  for(let i=1;i<=n;i++){
    if(!state.testers[i])state.testers[i]={name:cfg.testerNames[i-1]||`Testeur ${i}`,answers:{},validatedAt:null};
    state.testers[i].name=cfg.testerNames[i-1]||state.testers[i].name||`Testeur ${i}`;
  }
  Object.keys(state.testers).forEach(k=>{if(Number(k)>n)delete state.testers[k]});
}

function phoneShareSignature(cfg){
  cfg=cfg||{};
  const payload={
    juryInstanceId:juryInstanceId(cfg),
    lotName:String(cfg.lotName||''),
    subtitle:String(cfg.subtitle||''),
    testerCount:Number(cfg.testerCount||0),
    testerNames:(cfg.testerNames||[]).slice(0,Number(cfg.testerCount||0)),
    products:(cfg.products||[]).map(p=>({
      id:p.id||'',
      code:p.code||'',
      name:p.name||'',
      criteria:normalizeCriteria(p.criteria||cfg.criteria),
      samples:(p.samples||[]).map(s=>({id:String(s.id||''),supplier:String(s.supplier||'')}))
    }))
  };
  return hashJson(payload)
}
function shareRecoveryNormV252(v){
  return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
}
function shareRecoveryConfigKeyV252(cfg){
  if(!cfg||typeof cfg!=='object')return '';
  const lot=shareRecoveryNormV252(cfg.lotName||cfg.lotNumber||cfg.lotTitle||'');
  const products=(Array.isArray(cfg.products)?cfg.products:[]).map(p=>{
    const name=shareRecoveryNormV252(p?.name||'');
    const samples=(Array.isArray(p?.samples)?p.samples:[])
      .map(s=>shareRecoveryNormV252(s?.id||'')).filter(Boolean).sort().join(',');
    return name+'['+samples+']';
  }).filter(Boolean).sort().join('|');
  return [lot,products,Number(cfg.testerCount||0)].join('::');
}
function shareRecoverySameJuryV252(a,b){
  if(!a||!b)return false;
  const ai=String(a?._juryInstanceId||a?.juryInstanceId||a?.juryLaunch?.instanceId||'').trim();
  const bi=String(b?._juryInstanceId||b?.juryInstanceId||b?.juryLaunch?.instanceId||'').trim();
  if(ai&&bi)return ai===bi;

  const ap=String(a?._preparedId||'').trim(),bp=String(b?._preparedId||'').trim();
  if(ap&&bp&&ap===bp)return true;

  const ak=shareRecoveryConfigKeyV252(a),bk=shareRecoveryConfigKeyV252(b);
  return !!ak&&ak===bk;
}
function shareRecoverySessionIdV252(cfg){
  return String(cfg?._shareSessionId||cfg?.juryLaunch?.sessionId||cfg?.shareSessionId||'').trim();
}
function shareRecoveryMergeV252(target,source,sid){
  if(!target||!sid)return false;
  let changed=false;

  target.security=target.security||{};
  const sourceCodes=source?.security?.testerCodes;
  const targetCodes=target?.security?.testerCodes;
  if(sourceCodes&&typeof sourceCodes==='object'&&(!targetCodes||!Object.keys(targetCodes).length)){
    target.security.testerCodes=deepClone(sourceCodes);
    changed=true;
  }

  if(String(target._shareSessionId||'')!==sid){
    target._shareSessionId=sid;changed=true;
  }
  if(target.juryLaunch?.openedAt&&String(target.juryLaunch?.sessionId||'')!==sid){
    target.juryLaunch={...(target.juryLaunch||{}),sessionId:sid};
    changed=true;
  }

  const sig=phoneShareSignature(target);
  if(target._phoneShareSignature!==sig){
    target._phoneShareSignature=sig;changed=true;
  }
  return changed;
}
function recoverRunningPhoneShareLocalV252(cfg=state.config){
  if(!cfg||!cfg.juryLaunch?.openedAt)return '';

  const direct=shareRecoverySessionIdV252(cfg);
  if(direct)return direct;

  const candidateConfigs=[];
  const pushConfig=x=>{
    const c=x?.state?.config||x?.config||x;
    if(c&&typeof c==='object')candidateConfigs.push(c);
  };

  try{loadPreparedJurys().forEach(pushConfig)}catch(e){}
  try{
    const raw=JSON.parse(localStorage.getItem(PREPARED_JURY_STORAGE_KEY)||'[]');
    (Array.isArray(raw)?raw:[]).forEach(pushConfig);
  }catch(e){}
  try{
    const backup=JSON.parse(localStorage.getItem(PREPARED_DEDUPE_BACKUP_V238)||'null');
    (Array.isArray(backup?.rows)?backup.rows:[]).forEach(pushConfig);
  }catch(e){}
  try{
    const reset=JSON.parse(localStorage.getItem('jm_tc_lots_reset_backup_v207')||'null');
    const preparedRaw=reset?.items?.[PREPARED_JURY_STORAGE_KEY];
    const rows=preparedRaw?JSON.parse(preparedRaw):[];
    (Array.isArray(rows)?rows:[]).forEach(pushConfig);
  }catch(e){}
  try{
    const stored=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    if(stored?.config)pushConfig(stored.config);
  }catch(e){}

  for(const source of candidateConfigs){
    if(!shareRecoverySameJuryV252(cfg,source))continue;
    const sid=shareRecoverySessionIdV252(source);
    if(!sid)continue;

    shareRecoveryMergeV252(cfg,source,sid);
    if(cfg===state.config){
      try{
        if(typeof originalSaveState==='function')originalSaveState();
        else localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
      }catch(e){}
      try{
        if(typeof upsertPreparedJury==='function'&&!state.config?.juryClose?.closedAt){
          upsertPreparedJury(state);
        }
      }catch(e){}
    }
    return sid;
  }
  return '';
}

function repairRunningPhoneShareMetadataV252(cfg=state.config){
  if(!cfg||!cfg.juryLaunch?.openedAt)return false;

  let sid=String(cfg._shareSessionId||cfg.juryLaunch?.sessionId||'').trim();

  if(!sid){
    try{sid=recoverRunningPhoneShareLocalV252(cfg)||''}catch(e){}
  }

  /* Si le jury est déjà reconnecté en administrateur, la session cloud courante
     est une source fiable pour restaurer l'identifiant manquant. */
  try{
    if(!sid && typeof cloudReady!=='undefined' && cloudReady &&
       typeof cloudRole!=='undefined' && cloudRole==='admin' &&
       typeof cloudCfg!=='undefined'){
      sid=String(cloudCfg?.sessionId||'').trim();
    }
  }catch(e){}

  if(!sid)return false;

  let changed=false;
  if(String(cfg._shareSessionId||'')!==sid){
    cfg._shareSessionId=sid;
    changed=true;
  }

  if(String(cfg.juryLaunch?.sessionId||'')!==sid){
    cfg.juryLaunch={...(cfg.juryLaunch||{}),sessionId:sid};
    changed=true;
  }

  const sig=phoneShareSignature(cfg);
  if(!cfg._phoneShareSignature){
    cfg._phoneShareSignature=sig;
    changed=true;
  }else if(cfg._phoneShareSignature!==sig){
    /* Une signature peut être recalculée sans risque uniquement si l'appareil
       est réellement connecté en administrateur à cette même session. */
    try{
      if(typeof cloudReady!=='undefined' && cloudReady &&
         typeof cloudRole!=='undefined' && cloudRole==='admin' &&
         typeof cloudCfg!=='undefined' && String(cloudCfg?.sessionId||'')===sid){
        cfg._phoneShareSignature=sig;
        changed=true;
      }
    }catch(e){}
  }

  if(changed && cfg===state.config){
    try{
      if(typeof originalSaveState==='function')originalSaveState();
      else localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
    }catch(e){}
    try{
      if(typeof upsertPreparedJury==='function'&&!state.config?.juryClose?.closedAt){
        upsertPreparedJury(state);
      }
    }catch(e){}
  }
  return changed;
}

function phoneSharePrepared(cfg=state.config){
  try{repairRunningPhoneShareMetadataV252(cfg)}catch(e){}
  return !!(
    cfg &&
    cfg._shareSessionId &&
    cfg._phoneShareSignature &&
    cfg._phoneShareSignature===phoneShareSignature(cfg)
  )
}
function phoneShareNeedsRefresh(cfg=state.config){
  return !!(
    cfg &&
    cfg._shareSessionId &&
    !phoneSharePrepared(cfg)
  )
}
function currentJuryShareSessionId(){
  try{recoverRunningPhoneShareLocalV252(state.config)}catch(e){}
  return String(state.config?._shareSessionId||state.config?.juryLaunch?.sessionId||'');
}
function launchShareReady(){
  const expected=currentJuryShareSessionId();
  return !!(
    phoneSharePrepared(state.config) &&
    expected &&
    typeof cloudReady!=='undefined' &&
    cloudReady &&
    typeof cloudRole!=='undefined' &&
    cloudRole==='admin' &&
    typeof cloudCfg!=='undefined' &&
    cloudCfg?.sessionId===expected
  );
}

function launchChecksData(){
  const cfg=state.config||{},products=cfg.products||[],total=totalSamples();
  const productsNamed=products.length>0&&products.every(p=>String(p.name||'').trim());
  const samplesComplete=products.length>0&&products.every(p=>(p.samples||[]).length>0&&(p.samples||[]).every(s=>String(s.id||'').trim()&&String(s.supplier||'').trim()));
  const testerOk=Number(cfg.testerCount||0)>0;
  const shared=phoneSharePrepared(cfg);
  const publicPage=/^https?:\/\//i.test(location.href);
  return[
    {key:'lot',level:String(cfg.lotName||'').trim()?'ok':'bad',title:'Lot identifié',detail:String(cfg.lotName||'').trim()||'Nom du lot manquant',required:true},
    {key:'products',level:productsNamed?'ok':'bad',title:'Produits renseignés',detail:productsNamed?`${products.length} produit${products.length>1?'s':''} nommé${products.length>1?'s':''}`:'Un nom de produit est manquant',required:true},
    {key:'samples',level:samplesComplete&&total>0?'ok':'bad',title:'Échantillons et fournisseurs',detail:samplesComplete&&total>0?`${total} échantillon${total>1?'s':''} avec correspondance fournisseur`:'Un numéro d’échantillon ou fournisseur est incomplet',required:true},
    {key:'testers',level:testerOk?'ok':'bad',title:'Testeurs',detail:testerOk?`${cfg.testerCount} testeur${cfg.testerCount>1?'s':''} prévu${cfg.testerCount>1?'s':''}`:'Aucun testeur paramétré',required:true},
    {key:'blind',level:'ok',title:'Test à l’aveugle',detail:'Les fournisseurs sont masqués sur les écrans testeurs',required:true},
    {key:'cloud',level:shared?'ok':'warn',title:'Téléphones préparés',detail:shared?'Accès et QR codes préparés':'Préparez les téléphones dans « Créer / Modifier le jury »',required:false},
    {key:'public',level:publicPage?'ok':'warn',title:'Adresse en ligne',detail:publicPage?'Application ouverte depuis une adresse web':'Fichier local : les liens multi-téléphones peuvent ne pas fonctionner',required:false}
  ];
}
function launchBlockingError(){
  const bad=launchChecksData().filter(x=>x.required&&x.level==='bad');
  return bad.length?bad.map(x=>x.title).join(', '):'';
}
function renderLaunchView(){
  ensureTesterRosterConsistency();
  updateHeader();showView('launchView');
  $('#headerTitle').textContent='Lancer le jury';$('#headerSub').textContent=state.config.lotName||'Jury Marchés';
  const p=lotDisplayParts(),cfg=state.config,m=juryMetrics(),checks=launchChecksData(),blocking=launchBlockingError(),opened=isJuryOfficiallyOpen();
  const phonesReady=phoneSharePrepared(cfg);

  $('#launchLotTitle').textContent=p.title;
  $('#launchLotSubtitle').textContent=p.subtitle||'';
  $('#launchSummary').innerHTML=`<span class="launch-chip">📦 ${cfg.products.length} produit${cfg.products.length>1?'s':''}</span><span class="launch-chip">🏷️ ${totalSamples()} échantillon${totalSamples()>1?'s':''}</span><span class="launch-chip">👥 ${cfg.testerCount} testeur${cfg.testerCount>1?'s':''}</span><span class="launch-chip">📱 ${phonesReady?'Téléphones prêts':'Téléphones à préparer'}</span>`;

  const stateTitle=$('#launchStateTitle'),stateDetail=$('#launchStateDetail');
  if(opened){
    stateTitle.textContent='Jury lancé ✓';
    stateDetail.textContent='Les testeurs peuvent commencer.';
  }else if(blocking){
    stateTitle.textContent='À corriger avant de lancer';
    stateDetail.textContent=`${blocking}. Cliquez sur « Modifier » pour corriger.`;
  }else if(!phonesReady){
    stateTitle.textContent='Téléphones à préparer';
    stateDetail.textContent='Cliquez sur « Modifier » puis terminez l’étape 6 « Préparer les téléphones ».';
  }else{
    stateTitle.textContent='Tout est prêt ✓';
    stateDetail.textContent='Les téléphones et les QR codes ont déjà été préparés. Vous pouvez lancer le jury.';
  }

  const cbox=$('#launchChecks');cbox.innerHTML='';
  checks.forEach(c=>{
    const d=document.createElement('div');d.className=`check-row ${c.level}`;
    d.innerHTML=`<div class="check-icon">${c.level==='ok'?'✓':c.level==='warn'?'!':'×'}</div><div><strong>${escapeHtml(c.title)}</strong><span>${escapeHtml(c.detail)}</span></div><div class="check-tag">${c.level==='ok'?'OK':c.level==='warn'?'À vérifier':'Bloquant'}</div>`;
    cbox.appendChild(d);
  });

  const pbox=$('#launchProducts');pbox.innerHTML='';
  cfg.products.forEach((prod,pi)=>{
    const d=document.createElement('div');d.className='launch-product';
    d.innerHTML=`<div class="launch-product-head"><strong>${escapeHtml(prod.name||`Produit ${pi+1}`)}</strong><span>${(prod.samples||[]).length} échantillon${(prod.samples||[]).length>1?'s':''}</span></div><div class="sample-mini-list">${(prod.samples||[]).map(s=>`<span class="sample-mini">N° ${escapeHtml(s.id)} · ${escapeHtml(s.supplier||'—')}</span>`).join('')}</div>`;
    pbox.appendChild(d);
  });

  renderLaunchLinks();

  const shareStep=$('#launchShareStep');
  if(shareStep)shareStep.style.display='';

  const shareHint=$('#launchShareHint');
  const shareState=$('#launchShareState');
  const cloudBtn=$('#launchCloudBtn');
  if(shareHint){
    shareHint.textContent=blocking
      ?'Corrigez d’abord le jury dans « Plus d’options > Modifier le jury ».'
      :phonesReady
        ?'Les accès testeurs sont prêts. Vous pouvez afficher les QR codes ou vérifier à nouveau les téléphones.'
        :'Préparez les accès testeurs ici. Ensuite le bouton « Lancer ce jury » se débloquera.';
  }
  if(shareState){
    shareState.textContent=phonesReady?'Prêt ✓':'À faire';
    shareState.classList.toggle('ready',phonesReady);
  }
  if(cloudBtn){
    cloudBtn.disabled=!!blocking||opened;
    cloudBtn.textContent=phonesReady?'↻ Vérifier les téléphones':'📱 Préparer les téléphones';
  }

  const btn=$('#officialLaunchBtn');
  const canLaunch=!blocking&&phonesReady&&!opened;
  btn.disabled=!canLaunch;
  btn.textContent=opened?'✓ Jury lancé':'▶ Lancer ce jury';

  const openStep=$('#launchOpenStep');
  if(openStep){
    openStep.classList.toggle('ready',canLaunch);
    openStep.classList.toggle('locked',!canLaunch&&!opened);
    const txt=openStep.querySelector('.launch-step-copy span');
    if(txt)txt.textContent=phonesReady
      ?'Les téléphones sont prêts. Vous pouvez ouvrir officiellement le jury.'
      :'Le lancement se débloquera dès que les téléphones seront préparés.';
  }
}
function renderLaunchLinks(){
  const box=$('#launchLinks'),note=$('#launchLinksNote'),qrBtn=$('#launchQrBtn');if(!box||!note)return;
  const testerCount=Math.max(1,Number(state.config?.testerCount||0));
  if(qrBtn)qrBtn.textContent=testerCount===1?'▦ QR code du testeur':`▦ QR codes des ${testerCount} testeurs`;
  box.innerHTML='';
  const shared=launchShareReady();
  if(!shared){
    box.innerHTML='<div class="empty" style="grid-column:1/-1">La session partagée n’est pas connectée sur cet appareil.</div>';
    note.textContent=`Préparez d’abord les accès pour ${testerCount} téléphone${testerCount>1?'s':''}.`;
    if(qrBtn)qrBtn.disabled=true;
    return;
  }
  if(qrBtn)qrBtn.disabled=false;
  for(let i=1;i<=state.config.testerCount;i++){
    const name=state.testers[i]?.name||`Testeur ${i}`;
    const d=document.createElement('div');d.className='launch-link';
    d.innerHTML=`<div><strong>${escapeHtml(name)}</strong><span>Accès individuel testeur ${i}</span></div><button class="btn btn-primary btn-small">Copier</button>`;
    d.querySelector('button').onclick=()=>copyText(shareUrl(i),`Lien ${name} copié`);
    box.appendChild(d);
  }
  note.textContent='Ouvrez les QR codes pour les afficher, les imprimer ou copier un lien individuel si nécessaire.';
}
async function copyAllTesterLinks(){
  if(!launchShareReady()){alert('Préparez d’abord le partage avec les téléphones.');return}
  const lines=[];
  for(let i=1;i<=state.config.testerCount;i++)lines.push(`${state.testers[i]?.name||`Testeur ${i}`} : ${shareUrl(i)}`);
  await copyText(lines.join('\n'),'Tous les liens testeurs ont été copiés');
}
async function publishOfficialLaunchToCloud(){
  if(!cloudReady||cloudRole!=='admin'||!cloudClient||!cloudCfg?.sessionId){
    throw new Error('La session partagée administrateur n’est pas connectée.');
  }

  const instanceId=ensureJuryInstanceId(state.config);
  const openedAt=state.config.juryLaunch?.openedAt;
  if(!openedAt)throw new Error('Le lancement local du jury est introuvable.');

  state.config.juryLaunch.instanceId=instanceId;
  state.config.juryLaunch.sessionId=cloudCfg.sessionId;

  /* V220 : deux preuves du lancement.
     1) public_config pour le fonctionnement normal,
     2) une ligne __launch__ par testeur dans la table des réponses.
     Cette seconde voie utilise exactement le canal que les téléphones savent déjà lire. */
  const {error}=await cloudClient
    .from('test_culinaire_sessions')
    .update({
      config:state.config,
      public_config:makePublicCloudConfig(state.config),
      updated_at:new Date().toISOString()
    })
    .eq('session_id',cloudCfg.sessionId);
  if(error)throw error;

  const launchRows=[];
  for(let t=1;t<=Number(state.config.testerCount||0);t++){
    launchRows.push({
      session_id:cloudCfg.sessionId,
      tester_no:t,
      product_id:'__meta__',
      sample_id:'__launch__',
      choices:[],
      remarks:[openedAt,instanceId],
      updated_at:new Date().toISOString()
    });
  }
  if(launchRows.length){
    const {error:markerError}=await cloudClient
      .from('test_culinaire_reponses')
      .upsert(launchRows,{onConflict:'session_id,tester_no,product_id,sample_id'});
    if(markerError)throw markerError;
  }

  lastCloudConfigHash=hashJson(state.config);
  return true;
}

async function officialLaunch(){
  const blocking=launchBlockingError();
  if(blocking){
    alert(`Impossible de lancer le jury : ${blocking}.`);
    return;
  }
  if(isJuryOfficiallyOpen()){
    const launchBtn=$('#officialLaunchBtn');
    try{
      if(launchBtn){
        launchBtn.disabled=true;
        launchBtn.textContent='⏳ Synchronisation des téléphones…';
      }
      await ensurePreparedShareConnected();
      await publishOfficialLaunchToCloud();
      toast('Jury synchronisé ✓ — téléphones déverrouillés');
      renderJuryView();
    }catch(e){
      if(launchBtn){
        launchBtn.disabled=false;
        launchBtn.textContent='▶ Synchroniser le jury';
      }
      alert(`Le jury est lancé sur cet appareil, mais les téléphones ne sont pas encore déverrouillés.\n\n${e?.message||e}\n\nRéessayez avec le bouton « Synchroniser le jury ».`);
    }
    return;
  }

  if(!phoneSharePrepared(state.config)){
    alert('Les téléphones doivent d’abord être préparés dans « Modifier le jury », étape 6.');
    return;
  }

  const launchBtn=$('#officialLaunchBtn');
  try{
    if(launchBtn){
      launchBtn.disabled=true;
      launchBtn.textContent='⏳ Ouverture du jury…';
    }
    await ensurePreparedShareConnected();
  }catch(e){
    if(launchBtn){
      launchBtn.disabled=false;
      launchBtn.textContent='▶ Lancer ce jury';
    }
    alert(`Impossible de reconnecter les téléphones. ${e?.message||e}`);
    return;
  }

  /* Toute réponse présente avant l’ouverture officielle est une réponse d’essai
     et ne doit pas entrer dans les résultats du jury. */
  const hasPrelaunchData=Object.values(state.testers||{}).some(t=>
    !!t?.validatedAt || Object.keys(t?.answers||{}).some(k=>{
      const a=t.answers[k];
      return !!a && ((a.choices||[]).some(v=>v!==null&&v!==undefined) || (a.remarks||[]).some(v=>String(v||'').trim()));
    })
  );
  if(hasPrelaunchData){
    try{
      if(cloudReady&&cloudRole==='admin'&&cloudClient&&cloudCfg.sessionId){
        const {error}=await cloudClient.from('test_culinaire_reponses').delete().eq('session_id',cloudCfg.sessionId);
        if(error)throw error;
      }
      Object.values(state.testers||{}).forEach(t=>{if(t){t.answers={};t.validatedAt=null}});
      if(typeof lastCloudAnswerHashes!=='undefined')lastCloudAnswerHashes=new Map();
    }catch(e){
      if(launchBtn){launchBtn.disabled=false;launchBtn.textContent='▶ Lancer ce jury'}
      alert(`Impossible d’effacer les réponses d’essai enregistrées avant le lancement. ${e?.message||e}`);
      return;
    }
  }

  const launchInstanceId=ensureJuryInstanceId(state.config);
  state.config.juryLaunch={
    openedAt:new Date().toISOString(),
    mode:'shared',
    sessionId:cloudCfg.sessionId,
    instanceId:launchInstanceId
  };
  originalSaveState();
  upsertPreparedJury(state);

  /* V218 — le lancement n'est validé qu'après lecture de confirmation
     de la même session côté serveur. Cela évite un faux « Jury lancé » local
     quand aucune ligne Supabase n'a réellement été mise à jour. */
  try{
    await publishOfficialLaunchToCloud();
  }catch(e){
    delete state.config.juryLaunch;
    originalSaveState();
    upsertPreparedJury(state);
    if(launchBtn){launchBtn.disabled=false;launchBtn.textContent='▶ Lancer ce jury'}
    alert(`Le jury n’a pas pu être ouvert sur les téléphones. ${e?.message||e}`);
    renderLaunchView();
    return;
  }

  toast('Jury lancé ✓ — téléphones déverrouillés');
  renderJuryView();
}
function openJuryFlow(){
  const prepared=loadPreparedJurys().filter(r=>!r?.state?.config?.juryClose?.closedAt);

  if(prepared.length>1){
    renderJuryChooser();
    return;
  }

  const m=juryMetrics();

  if(isJuryOfficiallyOpen()){
    renderJuryView();
    return;
  }
  if(m.done>0||m.validated>0){
    toast('Réponses d’essai détectées avant lancement — elles seront effacées au lancement');
  }

  if(prepared.length===1){
    const rec=prepared[0];
    const running=!!rec?.state?.config?.juryLaunch?.openedAt&&!rec?.state?.config?.juryClose?.closedAt;

    if(running){
      activatePreparedJury(rec.id,'resume');
    }else{
      activatePreparedJury(rec.id,'launch');
      if(!phoneSharePrepared(rec?.state?.config)){
        setTimeout(()=>toast('Étape 1 : préparez les téléphones.'),120);
      }
    }
    return;
  }

  if(isJuryClosed()){
    prepareJuryFromHome();
    return;
  }
  renderLaunchView();
}


let projectionRefreshTimer=null;
let projectionRotateTimer=null;
let projectionSlideIndex=0;
let projectionAutoRotate=true;
const PROJECTION_ROTATE_MS=8000;

function projectionSlidesAvailable(){
  const slides=['projectionSlideProgress','projectionSlideTesters'];
  /* Les classements ne sont jamais projetés pendant la dégustation.
     Ils n'apparaissent qu'après fermeture officielle du jury. */
  if(isJuryClosed())slides.push('projectionSlideResults');
  return slides;
}
function projectionTesterState(t,total){
  const done=testerCompleted(t);
  const validated=testerValidated(t);
  if(validated)return {label:'Terminé ✓',cls:'done'};
  if(total>0&&done>=total)return {label:'À valider',cls:'running'};
  if(done>0)return {label:'En cours',cls:'running'};
  return {label:'Pas commencé',cls:'waiting'};
}
function projectionProgressData(){
  const cfg=state.config;
  const totalTesters=Math.max(1,Number(cfg.testerCount||0));
  const totalSamplesCount=Math.max(1,totalSamples());
  let done=0,running=0,waiting=0;

  for(let t=1;t<=totalTesters;t++){
    const completed=testerCompleted(t);
    if(testerValidated(t))done++;
    else if(completed>0)running++;
    else waiting++;
  }

  const completedEvaluations=totalCompleted();
  const maxEvaluations=totalTesters*totalSamplesCount;
  const pct=maxEvaluations?Math.round(completedEvaluations/maxEvaluations*100):0;

  return {totalTesters,totalSamplesCount,done,running,waiting,completedEvaluations,maxEvaluations,pct};
}
function renderProjectionData(){
  if(!$('#projectionView')?.classList.contains('active'))return;

  const p=lotDisplayParts();
  const d=projectionProgressData();

  $('#projectionTitle').textContent=p.title||state.config.lotName||'Jury en cours';
  $('#projectionSubtitle').textContent=p.subtitle||state.config.subtitle||'';
  $('#projectionPercent').textContent=`${d.pct} %`;
  $('#projectionMainBar').style.width=`${d.pct}%`;
  $('#projectionDoneTesters').textContent=d.done;
  $('#projectionRunningTesters').textContent=d.running;
  $('#projectionWaitingTesters').textContent=d.waiting;

  const clock=$('#projectionClock');
  if(clock){
    clock.textContent=new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
  }

  const progressText=$('#projectionProgressText');
  const msg=$('#projectionMessage');

  if(d.done===d.totalTesters){
    progressText.textContent=
      d.done===1
        ?`1 testeur sur ${d.totalTesters} a terminé`
        :`${d.done} testeurs sur ${d.totalTesters} ont terminé`;
    msg.textContent=isJuryClosed()
      ?'Jury terminé — résultats définitifs disponibles.'
      :'Toutes les fiches sont terminées. Le jury peut maintenant être clôturé.';
  }else if(d.completedEvaluations===0){
    progressText.textContent=`0 fiche reçue sur ${d.maxEvaluations}`;
    msg.textContent='En attente des premières réponses.';
  }else{
    progressText.textContent=`${d.completedEvaluations} fiche${d.completedEvaluations>1?'s':''} reçue${d.completedEvaluations>1?'s':''} sur ${d.maxEvaluations}`;
    msg.textContent=d.running
      ?'Merci de poursuivre la dégustation et de valider votre fiche à la fin.'
      :'Merci de poursuivre la dégustation.';
  }

  const grid=$('#projectionTesterGrid');
  if(grid){
    grid.innerHTML='';
    for(let t=1;t<=d.totalTesters;t++){
      const st=projectionTesterState(t,d.totalSamplesCount);
      const completed=testerCompleted(t);
      const pct=d.totalSamplesCount?Math.round(completed/d.totalSamplesCount*100):0;
      grid.insertAdjacentHTML('beforeend',`
        <div class="projection-tester-card ${st.cls}">
          <strong>${escapeHtml(state.testers?.[t]?.name||`Testeur ${t}`)}</strong>
          <span>${st.label} · ${pct} %</span>
          <div class="projection-tester-progress" aria-label="Progression ${pct} %">
            <div class="projection-tester-progress-fill" style="width:${Math.max(0,Math.min(100,pct))}%"></div>
          </div>
        </div>`);
    }
  }

  const ranking=$('#projectionFinalRanking');
  if(ranking){
    if(isJuryClosed()){
      const rows=overallRanking().slice(0,8);
      ranking.innerHTML=rows.length
        ?rows.map((r,i)=>`
          <div class="projection-rank-row">
            <div class="n">${i+1}</div>
            <strong>${escapeHtml(r.supplier)}</strong>
            <div class="score">${r.count?fmt(supplierGlobalNote5(r.avg)):'—'} / 5</div>
          </div>`).join('')
        :'<div style="text-align:center;opacity:.7">Aucun résultat disponible.</div>';
    }else{
      ranking.innerHTML='';
    }
  }

  renderProjectionDots();
  setProjectionSlide(projectionSlideIndex,false);
}
function setProjectionSlide(index,restartTimer=true){
  const slides=projectionSlidesAvailable();
  if(!slides.length)return;
  projectionSlideIndex=((index%slides.length)+slides.length)%slides.length;

  ['projectionSlideProgress','projectionSlideTesters','projectionSlideResults'].forEach(id=>{
    $('#'+id)?.classList.remove('active');
  });
  $('#'+slides[projectionSlideIndex])?.classList.add('active');

  renderProjectionDots();
  if(restartTimer&&projectionAutoRotate)startProjectionRotateTimer();
}
function renderProjectionDots(){
  const dots=$('#projectionDots');
  if(!dots)return;
  const slides=projectionSlidesAvailable();

  if(projectionSlideIndex>=slides.length)projectionSlideIndex=0;

  dots.innerHTML=slides.map((_,i)=>
    `<button type="button" class="projection-dot ${i===projectionSlideIndex?'active':''}" data-projection-dot="${i}" aria-label="Écran ${i+1}"></button>`
  ).join('');

  dots.querySelectorAll('[data-projection-dot]').forEach(
    b=>b.onclick=()=>setProjectionSlide(Number(b.dataset.projectionDot))
  );
}
function startProjectionRotateTimer(){
  if(projectionRotateTimer){
    clearTimeout(projectionRotateTimer);
    projectionRotateTimer=null;
  }
  if(!projectionAutoRotate)return;

  projectionRotateTimer=setTimeout(()=>{
    projectionRotateTimer=null;

    if($('#projectionView')?.classList.contains('active') && projectionAutoRotate){
      setProjectionSlide(projectionSlideIndex+1,false);
      startProjectionRotateTimer();
    }
  },PROJECTION_ROTATE_MS);
}
function stopProjectionMode(exitFullscreenToo=false){
  document.body.classList.remove('projection-display');
  if(projectionRefreshTimer){
    clearInterval(projectionRefreshTimer);
    projectionRefreshTimer=null;
  }
  if(projectionRotateTimer){
    clearTimeout(projectionRotateTimer);
    projectionRotateTimer=null;
  }
  if(exitFullscreenToo && document.fullscreenElement){
    document.exitFullscreen?.().catch(()=>{});
  }
  document.body.classList.remove('projection-fullscreen');
}
function openProjectionView(){
  projectionSlideIndex=0;
  projectionAutoRotate=true;

  document.body.classList.add('projection-display');
  showView('projectionView');
  $('#headerTitle').textContent='Projection du jury';
  $('#headerSub').textContent=state.config.lotName||'Jury Marchés';

  renderProjectionData();

  if(projectionRefreshTimer)clearInterval(projectionRefreshTimer);
  projectionRefreshTimer=setInterval(renderProjectionData,3000);

  const pause=$('#projectionPauseBtn');
  if(pause)pause.textContent='⏸ Pause';
  const lbl=$('#projectionAutoLabel');
  if(lbl)lbl.textContent='Défilement automatique · 8 s';

  startProjectionRotateTimer();
}
function returnFromProjection(){
  stopProjectionMode(true);
  renderJuryView();
}
function toggleProjectionRotation(){
  projectionAutoRotate=!projectionAutoRotate;
  const btn=$('#projectionPauseBtn');

  if(projectionAutoRotate){
    if(btn)btn.textContent='⏸ Pause';
    const lbl=$('#projectionAutoLabel');
    if(lbl)lbl.textContent='Défilement automatique · 8 s';
    startProjectionRotateTimer();
    toast('Défilement automatique activé');
  }else{
    if(btn)btn.textContent='▶ Reprendre le défilement';
    const lbl=$('#projectionAutoLabel');
    if(lbl)lbl.textContent='Défilement en pause';
    if(projectionRotateTimer){
      clearTimeout(projectionRotateTimer);
      projectionRotateTimer=null;
    }
    toast('Défilement en pause');
  }
}
async function toggleProjectionFullscreen(){
  const shell=$('.projection-shell');
  try{
    if(!document.fullscreenElement){
      await (shell?.requestFullscreen?.()||document.documentElement.requestFullscreen?.());
      document.body.classList.add('projection-fullscreen');
    }else{
      await document.exitFullscreen?.();
      document.body.classList.remove('projection-fullscreen');
    }
  }catch(e){
    /* Certains navigateurs/tablettes bloquent le plein écran : la vue reste utilisable. */
    console.warn(e);
  }
}

async function openQrCodesFromJury(){
  const btn=$('#juryQrBtn');
  const oldText=btn?.textContent||'▦ QR codes';

  try{
    if(btn){
      btn.disabled=true;
      btn.textContent='⏳ QR codes…';
    }

    /* V252 — rechercher d'abord l'ancienne session dans toutes les sauvegardes
       locales du même jury. Aucun nouveau QR n'est créé ici. */
    try{recoverRunningPhoneShareLocalV252(state.config)}catch(e){}
    try{repairRunningPhoneShareMetadataV252(state.config)}catch(e){}

    if(!phoneSharePrepared(state.config) && typeof recoverRunningShareSessionFromCloudV252==='function'){
      await recoverRunningShareSessionFromCloudV252();
    }

    if(!phoneSharePrepared(state.config)){
      if(typeof createReplacementRunningQrSessionV252!=='function'){
        throw new Error('L’ancienne session QR de ce jury n’a pas pu être retrouvée.');
      }

      const ok=confirm(
        'L’ancienne session QR de ce jury est introuvable.\n\n'+
        'Créer de nouveaux QR codes de remplacement ?\n\n'+
        'Les réponses et validations actuellement visibles sur cet appareil seront conservées et recopiées. '+
        'Les anciens QR codes, s’ils existent encore, ne devront plus être utilisés.'
      );
      if(!ok)return;

      await createReplacementRunningQrSessionV252();
      renderQrCodes('juryView');
      return;
    }

    /* Même si un autre partage est encore ouvert dans le navigateur, reconnecter
       explicitement la session de CE jury avant d'afficher ses QR codes. */
    if(!launchShareReady()){
      await ensurePreparedShareConnected();
    }

    renderQrCodes('juryView');
  }catch(e){
    console.error(e);
    alert(`Impossible d’ouvrir les QR codes. ${e?.message||e}`);
  }finally{
    if(btn){
      btn.disabled=false;
      btn.textContent=oldText;
    }
  }
}

let runningJuryCloudSyncBusy=false;
let runningJuryCloudSyncAt=0;

async function ensureRunningJuryCloudSync(){
  if(runningJuryCloudSyncBusy)return;
  if(!isJuryOfficiallyOpen()||isJuryClosed())return;
  if(typeof guestTester!=='undefined'&&guestTester)return;

  const now=Date.now();
  if(now-runningJuryCloudSyncAt<5000)return;
  runningJuryCloudSyncAt=now;
  runningJuryCloudSyncBusy=true;

  try{
    if(!cloudReady||cloudRole!=='admin'){
      await ensurePreparedShareConnected();
    }
    await publishOfficialLaunchToCloud();
  }catch(e){
    console.warn('Synchronisation automatique du lancement impossible',e);
  }finally{
    runningJuryCloudSyncBusy=false;
  }
}

let automaticJuryCloseBusy=false;

async function autoCloseJuryIfReady(){
  if(automaticJuryCloseBusy||isJuryClosed()||!juryReadyToClose())return;
  automaticJuryCloseBusy=true;
  try{
    await closeJuryOfficially({automatic:true});
  }catch(e){
    console.error('Fermeture automatique du jury impossible',e);
  }finally{
    automaticJuryCloseBusy=false;
  }
}

function renderJuryView(){
  updateHeader();
  showView('juryView');

  /* V219 : un jury déjà marqué « en cours » se republie automatiquement
     vers les téléphones. Cela répare aussi les jurys lancés avant la correction V218. */
  setTimeout(()=>{try{ensureRunningJuryCloudSync()}catch(e){}},0);

  const cfg=state.config,p=lotDisplayParts(),m=juryMetrics();
  const totalTesters=Math.max(1,Number(cfg.testerCount||0));
  const completedTesters=Number(m.validated||0);
  const progressPct=Math.round((completedTesters/totalTesters)*100);

  $('#headerTitle').textContent='Jury en cours';
  $('#headerSub').textContent=cfg.lotName||'Jury Marchés';

  $('#juryLotTitle').textContent=p.title;
  $('#juryLotSubtitle').textContent=p.subtitle||'';

  /* Compatibilité avec les anciens éléments cachés. */
  $('#juryRing').style.setProperty('--pct',m.pct);
  $('#juryRingPct').textContent=`${m.pct}%`;
  $('#juryDoneTesters').textContent=`${m.validated}/${cfg.testerCount}`;
  $('#juryDoneEvaluations').textContent=m.done;
  $('#juryRemainingEvaluations').textContent=m.remaining;

  const progressText=$('#jurySimpleProgressText');
  const progressDetail=$('#jurySimpleProgressDetail');
  const progressBar=$('#jurySimpleProgressBar');

  progressText.textContent=
    `${completedTesters} testeur${completedTesters>1?'s':''} sur ${totalTesters} ${completedTesters>1?'ont':'a'} terminé`;
  progressBar.style.width=`${progressPct}%`;

  if(completedTesters===totalTesters){
    progressDetail.textContent='Tout le monde a terminé. Le jury se termine automatiquement.';
    setTimeout(()=>{try{autoCloseJuryIfReady()}catch(e){}},250);
  }else if(m.done===0){
    progressDetail.textContent='En attente des premières réponses.';
  }else{
    const remaining=totalTesters-completedTesters;
    progressDetail.textContent=
      `${remaining} testeur${remaining>1?'s':''} ${remaining>1?'doivent':'doit'} encore terminer.`;
  }

  const st=$('#juryLiveState'),txt=$('#juryLiveStateText');
  st.className='jury-simple-status';

  if(completedTesters===totalTesters){
    st.classList.add('done');
    txt.textContent='Tout le monde a terminé';
  }else if(m.done>0){
    txt.textContent='Jury en cours';
  }else{
    st.classList.add('waiting');
    txt.textContent='En attente des réponses';
  }

  const grid=$('#testerGrid');
  grid.innerHTML='';

  for(let i=1;i<=cfg.testerCount;i++){
    const done=testerCompleted(i);
    const total=m.total;
    const pct=total?Math.round(done/total*100):0;
    const validated=testerValidated(i);

    let status='Pas commencé';
    let cls='';
    if(validated){
      status='Terminé ✓';
      cls='validated';
    }else if(done>=total&&total>0){
      status='À valider';
      cls='done';
    }else if(done>0){
      status='En cours';
      cls='running';
    }

    const card=document.createElement('article');
    card.className=`panel jury-tester-card ${validated?'validated':''}`;
    card.innerHTML=`
      <div class="jury-tester-top">
        <div class="avatar">${i}</div>
        <div>
          <h3>${escapeHtml(state.testers[i]?.name||`Testeur ${i}`)}</h3>
          <div class="small">${done} sur ${total} dégustation${total>1?'s':''}</div>
        </div>
      </div>
      <span class="jury-tester-status ${cls}">${status}</span>
      <div class="progress"><span style="width:${pct}%"></span></div>
      <div class="jury-tester-foot">
        <strong>${pct} %</strong>
        <div class="jury-card-actions">
          ${validated?`<button class="btn btn-ghost btn-small jury-unlock" data-unlock-tester="${i}">Déverrouiller</button>`:done>=total&&total>0?`<button class="btn btn-primary btn-small jury-confirm-finished" data-confirm-finished-tester="${i}">✓ Confirmer terminé</button>`:''}
        </div>
      </div>`;

    grid.appendChild(card);
  }

  grid.querySelectorAll('[data-unlock-tester]').forEach(
    b=>b.onclick=()=>unlockTester(Number(b.dataset.unlockTester))
  );
  grid.querySelectorAll('[data-confirm-finished-tester]').forEach(
    b=>b.onclick=()=>{
      const t=Number(b.dataset.confirmFinishedTester);
      if(!t||testerValidated(t))return;
      if(testerCompleted(t)!==m.total||m.total<=0){
        alert('Ce testeur n’a pas encore terminé toutes ses dégustations.');
        return;
      }
      state.testers[t].validatedAt=new Date().toISOString();
      try{
        if(typeof setTesterValidationFallbackV278==='function'){
          setTesterValidationFallbackV278(t,state.testers[t].validatedAt);
        }
      }catch(e){}
      saveState();
      renderJuryView();
      if(document.getElementById('projectionView')?.classList.contains('active'))renderProjectionData();
      toast((state.testers[t]?.name||('Testeur '+t))+' confirmé terminé ✓');
    }
  );

  const sheetLinks=$('#juryTesterSheetLinks');
  if(sheetLinks){
    sheetLinks.innerHTML='';
    for(let i=1;i<=cfg.testerCount;i++){
      const b=document.createElement('button');
      b.className='btn btn-ghost btn-small';
      b.textContent=`Voir ${state.testers[i]?.name||`Testeur ${i}`}`;
      b.onclick=()=>openTester(i);
      sheetLinks.appendChild(b);
    }
  }

  const finishBtn=$('#juryFinishBtn');
  const ready=juryReadyToClose()&&!isJuryClosed();

  if(finishBtn){
    finishBtn.disabled=!ready;
    finishBtn.textContent=isJuryClosed()
      ?'✓ Jury terminé'
      :ready
        ?'🏁 Terminer le jury'
        :'🏁 Terminer le jury';
    finishBtn.title=ready
      ?'Passer à la fin du jury'
      :'Tous les testeurs doivent d’abord terminer et valider leur test';
  }

  /* Ancien bouton conservé uniquement pour compatibilité. */
  const closeBtn=$('#closeJuryBtn');
  if(closeBtn){
    closeBtn.disabled=!ready||isJuryClosed();
  }
}
function openConfig(){if(isJuryClosed()){dashboardNewJury();return}try{if(healSupplierNamesV252(state.config))saveState()}catch(e){}draftConfig=deepClone(state.config);try{healSupplierNamesV252(draftConfig)}catch(e){}pendingMarketLot='';showView('configView');$('#headerTitle').textContent='Préparer le jury';$('#headerSub').textContent='Questions, testeurs et validation';renderConfig()}
function renderConfig(){
  const c=draftConfig;
  c.criteria=normalizeCriteria(c.criteria);
  c.products=(c.products||[]).map((p,i)=>({
    ...p,
    criteria:normalizeCriteria(p.criteria||c.criteria),
    color:p.color||PALETTE[i%PALETTE.length]
  }));
  if(c.products[0])c.criteria=deepClone(c.products[0].criteria);
  $('#cfgLotName').value=c.lotName||'';
  $('#cfgSubtitle').value=c.subtitle||'';
  $('#cfgTesterCount').value=String(Math.max(1,Math.min(20,Number(c.testerCount||8))));
  syncTopDraft();
  renderMarketLibrary();
  renderCustomTemplateSelect();
  renderArchiveTemplateSelect();
  renderProductConfigs();
  renderConfigChoiceRecap();
  renderTesterNames();
  renderDraftSummary();
  renderArticlePrintStatus();
  renderConfigPhoneShare();
  renderReceptionConfigStatus();
}

function renderCriteriaConfig(){
  const box=$('#criteriaConfig');if(!box||!draftConfig)return;
  draftConfig.criteria=normalizeCriteria(draftConfig.criteria);
  const options=Object.entries(CRITERION_LIBRARY).map(([key,v])=>`<option value="${key}">${escapeHtml(key==='autre'?'Autre…':v.short)}</option>`).join('');
  box.innerHTML=draftConfig.criteria.map((sel,qi)=>{
    const q=criterionQuestion(sel,qi),isCustom=sel.key==='autre';
    return `<div class="criterion-config-row">
      <div class="criterion-config-number"><strong>Question ${qi+1}</strong><span>${qi===4?'25 points · critère principal':'10 points'}</span></div>
      <div class="field"><label>Critère</label><select data-criterion-select="${qi}">${options}</select></div>
      <div class="field criterion-custom-wrap ${isCustom?'visible':''}" data-criterion-custom-wrap="${qi}"><label>Votre question / critère</label><input data-criterion-custom="${qi}" value="${escapeHtml(sel.custom||'')}" placeholder="Ex. Persistance en bouche"></div>
      <div class="criteria-preview" style="grid-column:1/-1"><strong>Aperçu :</strong> ${escapeHtml(q.title)}</div>
    </div>`
  }).join('');
  box.querySelectorAll('[data-criterion-select]').forEach(sel=>{
    const qi=Number(sel.dataset.criterionSelect);sel.value=draftConfig.criteria[qi].key;
    sel.onchange=e=>{draftConfig.criteria[qi].key=e.target.value; if(e.target.value!=='autre')draftConfig.criteria[qi].custom=''; renderCriteriaConfig();renderDraftSummary()}
  });
  box.querySelectorAll('[data-criterion-custom]').forEach(inp=>inp.oninput=e=>{
    const qi=Number(e.target.dataset.criterionCustom);draftConfig.criteria[qi].custom=e.target.value;
    const row=e.target.closest('.criterion-config-row'),preview=row?.querySelector('.criteria-preview');
    if(preview)preview.innerHTML=`<strong>Aperçu :</strong> ${escapeHtml(criterionQuestion(draftConfig.criteria[qi],qi).title)}`;
    renderDraftSummary()
  });
}
function draftCounts(){
  const products=draftConfig?.products||[];
  const samples=products.reduce((n,p)=>n+(p.samples||[]).filter(s=>String(s.id||'').trim()||String(s.supplier||'').trim()).length,0);
  const completeSamples=products.reduce((n,p)=>n+(p.samples||[]).filter(s=>String(s.id||'').trim()&&String(s.supplier||'').trim()).length,0);
  const namedProducts=products.filter(p=>String(p.name||'').trim()).length;
  const criteriaReady=products.every(p=>normalizeCriteria(p.criteria||draftConfig?.criteria).every(x=>x.key!=='autre'||String(x.custom||'').trim()));
  return{products:products.length,samples,completeSamples,namedProducts,testers:Number(draftConfig?.testerCount||8),criteriaReady};
}
function renderDraftSummary(){
  const box=$('#draftSummary');if(!box)return;
  const c=draftCounts();
  const pending=marketLotIsPending();
  const selectedLot=String($('#marketLotSelect')?.value||'');
  const preparedLot=marketRefKey(draftConfig?.marketRef);
  const hasMarketLot=!!(selectedLot||preparedLot);
  const activeLot=selectedLot||preparedLot;
  const activeLotLabel=marketSelectionLabel(activeLot);
  const prepared=!!(activeLot && preparedLot===activeLot && !pending);
  const coherent=c.completeSamples===c.samples&&c.namedProducts===c.products&&c.samples>0&&c.criteriaReady;

  box.innerHTML=`<span class="draft-chip">📦 ${c.products} produit${c.products>1?'s':''}</span><span class="draft-chip">🏷️ ${c.samples} échantillon${c.samples>1?'s':''}</span><span class="draft-chip">❓ 5 questions</span><span class="draft-chip">👥 ${c.testers} testeur${c.testers>1?'s':''}</span><span class="draft-chip">${pending?'⚠️ Lot à préparer':prepared?`✅ ${escapeHtml(activeLotLabel)} préparé`:coherent?'✓ Paramétrage cohérent':'… À compléter'}</span>`;

  const fs=$('#configFooterSummary'),fd=$('#configFooterDetail');
  const footer=document.querySelector('.config-summary-bar');
  const saveBtn=$('#saveConfigBtn');

  if(fs&&fd){
    const ready=!pending&&c.products>0&&c.namedProducts===c.products&&c.samples>0&&c.completeSamples===c.samples&&c.criteriaReady;

    footer?.classList.toggle('market-pending',pending);
    footer?.classList.toggle('market-prepared',prepared);
    saveBtn?.classList.toggle('market-blocked',pending);

    if(saveBtn){
      const incomplete=!ready;
      const tplCheck=$('#saveAsCustomTemplateCheck');
      const tplOption=$('#saveAsTemplateOption');
      saveBtn.disabled=incomplete;
      saveBtn.title=pending
        ?'Préparez d’abord le lot sélectionné.'
        :incomplete
          ?'Complétez le produit, les échantillons et les fournisseurs avant d’enregistrer.'
          :'';
      if(tplCheck)tplCheck.disabled=incomplete;
      tplOption?.classList.toggle('disabled',incomplete);
    }

    if(pending){
      fs.textContent=`⚠️ ${activeLotLabel} sélectionné mais pas préparé`;
      fd.textContent='Remontez à « Marché 2026 » et cliquez sur le grand bouton orange « PRÉPARER ». ';
    }else if(prepared){
      fs.textContent=`✅ ${activeLotLabel} préparé`;
      fd.textContent=ready
        ? `Jury prêt à enregistrer · ${c.testers} testeur${c.testers>1?'s':''} · 5 questions par produit.`
        : `Le lot est bien préparé. Vous pouvez continuer les questions, produits et échantillons.`;
    }else{
      fs.textContent=ready?'Jury prêt à enregistrer':'⏳ Jury à compléter';
      fd.textContent=ready
        ? `${c.testers} testeur${c.testers>1?'s':''} · 5 questions par produit · les fournisseurs resteront cachés pendant le test.`
        : 'Complétez les questions, noms de produits, numéros d’échantillons et fournisseurs.';
    }
  }

  renderSupplierSuggestions();
  renderArticlePrintStatus();
  renderConfigPhoneShare();
}



function articleDisplayNumber(product,index){
  const raw=String(product?.code||'').trim();
  if(!raw)return String(index+1);

  /* Si le champ contient déjà "Article 14", on n'affiche que 14 en gros. */
  const simple=raw.match(/(?:article|art\.?)?\s*[:#-]?\s*(\d+[A-Za-z-]*)$/i);
  if(simple)return simple[1];

  return raw;
}
function renderArticlePrintStatus(){
  const detail=$('#configArticlePrintDetail');
  const btn=$('#configPrintArticlesBtn');
  if(!detail||!btn||!draftConfig)return;

  const articles=articleNumbersToPrint(draftConfig);
  const count=articles.length;

  detail.textContent=count
    ?`${count} numéro${count>1?'s':''} prêt${count>1?'s':''} à imprimer — jusqu’à 8 par feuille A4.`
    :'Renseignez les numéros d’échantillons à imprimer.';

  btn.disabled=count===0;
  const emailBtn=$('#configEmailArticlesBtn');
  if(emailBtn)emailBtn.disabled=count===0;
}
function articleNumbersToPrint(cfg=draftConfig){
  const out=[];

  (cfg?.products||[]).forEach((product,pi)=>{
    const samples=(product.samples||[])
      .map(s=>String(s?.id||'').trim())
      .filter(Boolean);

    if(samples.length){
      samples.forEach(num=>out.push({
        number:num,
        productName:String(product?.name||`Produit ${pi+1}`).trim()
      }));
    }else{
      const fallback=String(product?.code||'').trim();
      if(fallback){
        out.push({
          number:articleDisplayNumber(product,pi),
          productName:String(product?.name||`Produit ${pi+1}`).trim()
        });
      }
    }
  });

  return out;
}
function buildArticlePrintCards(){
  if(typeof syncTopDraft==='function')syncTopDraft();

  const articles=articleNumbersToPrint(draftConfig);
  if(!articles.length){
    throw new Error('Renseignez d’abord les numéros d’échantillons à imprimer.');
  }

  const cards=$('#articlePrintCards');
  $('#articlePrintLotTitle').textContent='Numéros des articles';
  $('#articlePrintLotSubtitle').textContent='';

  /* Strict minimum demandé : uniquement le numéro en très gros.
     Les autres champs restent dans le DOM pour compatibilité, mais sont masqués à l’impression. */
  cards.innerHTML=articles.map(item=>`
    <article class="article-print-card">
      <div class="article-print-label">ARTICLE</div>
      <div class="article-print-number">${escapeHtml(item.number)}</div>
      <div class="article-print-name">${escapeHtml(item.productName)}</div>
      <div class="article-print-lot"></div>
    </article>
  `).join('');

  return articles;
}
function printArticleNumbers(){
  try{
    buildArticlePrintCards();

    document.body.classList.remove('print-qr-all','print-single-qr');
    document.body.classList.add('print-articles');

    /* Android prépare parfois l'aperçu avec un léger retard. */
    requestAnimationFrame(()=>{
      requestAnimationFrame(()=>{
        setTimeout(()=>window.print(),180);
      });
    });
  }catch(e){
    console.error(e);
    alert(e?.message||String(e));
  }
}

async function buildArticleNumbersPdf(){
  if(typeof syncTopDraft==='function')syncTopDraft();

  const articles=articleNumbersToPrint(draftConfig);
  if(!articles.length){
    throw new Error('Renseignez d’abord les numéros d’échantillons à imprimer.');
  }

  const JsPDF=window.jspdf?.jsPDF;
  if(!JsPDF){
    throw new Error('Le module PDF n’est pas chargé. Vérifiez la connexion Internet puis réessayez.');
  }

  const doc=new JsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  const pageW=210, pageH=297;
  const marginX=12, marginY=12;
  const gapX=6, gapY=6;
  const cols=2, rows=4;
  const cardW=(pageW-(marginX*2)-gapX)/cols;
  const cardH=(pageH-(marginY*2)-(gapY*(rows-1)))/rows;
  const perPage=cols*rows;

  articles.forEach((item,index)=>{
    if(index>0 && index%perPage===0)doc.addPage();

    const local=index%perPage;
    const col=local%cols;
    const row=Math.floor(local/cols);
    const x=marginX+col*(cardW+gapX);
    const y=marginY+row*(cardH+gapY);

    doc.setDrawColor(0);
    doc.setLineWidth(.6);
    doc.roundedRect(x,y,cardW,cardH,3,3);

    doc.setTextColor(0);
    doc.setFont('helvetica','bold');
    doc.setFontSize(44);
    doc.text(String(item.number),x+cardW/2,y+cardH/2+5,{align:'center'});
  });

  const lot=safePdfFileName(draftConfig?.lotName||'jury');
  const filename=`numeros-articles-${lot}.pdf`;
  return {blob:doc.output('blob'),filename,count:articles.length};
}

async function emailArticleNumbersPdf(){
  const btn=$('#configEmailArticlesBtn');
  const old=btn?.textContent||'📧 Envoyer par email (PDF)';

  try{
    if(btn){
      btn.disabled=true;
      btn.textContent='⏳ Création du PDF…';
    }

    const {blob,filename,count}=await buildArticleNumbersPdf();
    const file=new File([blob],filename,{type:'application/pdf'});

    if(navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))){
      await navigator.share({
        title:'Numéros des articles',
        text:`${count} numéro${count>1?'s':''} à imprimer pour le jury.`,
        files:[file]
      });
      toast('PDF prêt à être envoyé ✓');
    }else{
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;
      a.download=filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),4000);
      alert('Le PDF a été téléchargé. Vous pouvez maintenant le joindre à votre e-mail.');
    }
  }catch(e){
    if(e?.name!=='AbortError'){
      console.error(e);
      alert(`Impossible de préparer le PDF. ${e?.message||e}`);
    }
  }finally{
    if(btn){
      btn.disabled=false;
      btn.textContent=old;
    }
  }
}

function configDraftIsReady(){
  if(!draftConfig)return false;
  const c=draftCounts();
  return !marketLotIsPending() &&
    c.products>0 &&
    c.namedProducts===c.products &&
    c.samples>0 &&
    c.completeSamples===c.samples &&
    c.criteriaReady
}
function renderConfigPhoneShare(){
  const status=$('#configPhoneStatus'),title=$('#configPhoneTitle'),detail=$('#configPhoneDetail');
  const prepBtn=$('#configPreparePhonesBtn'),qrBtn=$('#configQrBtn'),emailBtn=$('#configEmailQrPdfBtn');
  if(!status||!title||!detail||!prepBtn||!qrBtn||!emailBtn||!draftConfig)return;

  const ready=phoneSharePrepared(draftConfig);
  const hasOldSession=!!draftConfig._shareSessionId;
  const configReady=configDraftIsReady();

  status.classList.toggle('ready',ready);
  status.classList.toggle('changed',!ready&&hasOldSession);

  if(ready){
    $('#configPhoneIcon').textContent='✓';
    title.textContent='Téléphones prêts';
    detail.textContent=`Les ${Number(draftConfig.testerCount||0)} accès testeurs et leurs QR codes sont préparés.`;
    prepBtn.textContent='✓ Téléphones préparés';
    prepBtn.disabled=true;
    qrBtn.disabled=false;
    emailBtn.disabled=false;
  }else if(hasOldSession){
    $('#configPhoneIcon').textContent='↻';
    title.textContent='Configuration modifiée';
    detail.textContent='Le jury a été modifié. Préparez à nouveau les téléphones avant de revenir à l’accueil ou de lancer le jury.';
    prepBtn.textContent='↻ Préparer à nouveau';
    prepBtn.disabled=false;
    qrBtn.disabled=true;
    emailBtn.disabled=true;
    emailBtn.disabled=true;
  }else{
    $('#configPhoneIcon').textContent='📱';
    title.textContent='Téléphones à préparer';
    detail.textContent=configReady
      ?'Le jury est prêt. Créez maintenant les accès et les QR codes des testeurs.'
      :'Vous pouvez cliquer sur « Préparer les téléphones » : l’application vous indiquera précisément ce qu’il reste à compléter.';
    prepBtn.textContent='☁️ Préparer les téléphones';
    prepBtn.disabled=false;
    qrBtn.disabled=true;
  }
}
function commitDraftForPhonePreparation(){
  syncTopDraft();

  const requestedTesterCount=Math.max(1,Math.min(20,parseInt($('#cfgTesterCount')?.value,10)||1));
  draftConfig.testerCount=requestedTesterCount;

  while(draftConfig.testerNames.length<requestedTesterCount){
    draftConfig.testerNames.push(`Testeur ${draftConfig.testerNames.length+1}`);
  }
  draftConfig.testerNames=draftConfig.testerNames.slice(0,requestedTesterCount);

  const err=validateDraft();
  if(err)throw new Error(err);

  const oldTesters=deepClone(state.testers||{});
  const allowed=validKeys(draftConfig);
  const savedConfig=deepClone(draftConfig);

  /* Chaque jury préparé possède sa propre identité. Si un ancien statut de lancement
     a été recopié par erreur, il est invalidé tant qu'il ne correspond pas à ce jury. */
  ensureJuryInstanceId(savedConfig);
  if(savedConfig.juryLaunch?.openedAt && String(savedConfig.juryLaunch.instanceId||'')!==juryInstanceId(savedConfig)){
    delete savedConfig.juryLaunch;
    delete savedConfig.juryClose;
  }

  savedConfig.testerCount=requestedTesterCount;
  savedConfig.testerNames=savedConfig.testerNames.slice(0,requestedTesterCount);
  savedConfig._preparedId=savedConfig._preparedId||uid('prepared');
  savedConfig._preparedAt=savedConfig._preparedAt||new Date().toISOString();

  const newState=makeInitialState(savedConfig);

  for(let i=1;i<=requestedTesterCount;i++){
    const old=oldTesters[i]||{answers:{}};
    const answers={};
    Object.entries(old.answers||{}).forEach(([k,v])=>{
      if(allowed.has(k))answers[k]=v;
    });
    newState.testers[i].name=savedConfig.testerNames[i-1]||`Testeur ${i}`;
    newState.testers[i].answers=answers;
    newState.testers[i].validatedAt=null;
  }

  state=newState;
  saveState();
  upsertPreparedJury(state);

  currentTester=1;
  currentProduct=state.config.products[0]?.id||'';
  currentSample=state.config.products[0]?.samples?.[0]?.id||'';
  adminProduct=currentProduct;

  draftConfig=deepClone(state.config);
}
async function preparePhonesFromConfig(){
  const btn=$('#configPreparePhonesBtn');

  try{
    syncTopDraft();
    const err=validateDraft();
    if(err){
      alert(`Avant de préparer les téléphones : ${err}`);
      renderDraftSummary();
      return;
    }

    if(btn){
      btn.disabled=true;
      btn.textContent='⏳ Préparation des téléphones…';
    }

    commitDraftForPhonePreparation();
    await quickSharePhones('config');
  }catch(e){
    console.error(e);
    alert(`Préparation des téléphones impossible : ${e?.message||String(e)}`);
    renderConfigPhoneShare();
  }
}

function safePdfFileName(value){
  const base=String(value||'jury')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-zA-Z0-9_-]+/g,'-')
    .replace(/^-+|-+$/g,'')
    .slice(0,60);
  return base||'jury'
}
function qrDataUrlForLink(link){
  return new Promise((resolve,reject)=>{
    if(!window.QRCode){
      reject(new Error('La génération des QR codes n’est pas chargée.'));
      return
    }

    const host=document.createElement('div');
    host.style.position='fixed';
    host.style.left='-10000px';
    host.style.top='-10000px';
    host.style.width='320px';
    host.style.height='320px';
    host.style.background='#fff';
    document.body.appendChild(host);

    try{
      new QRCode(host,{
        text:link,
        width:300,
        height:300,
        correctLevel:QRCode.CorrectLevel.M
      });
    }catch(e){
      host.remove();
      reject(e);
      return
    }

    const finish=()=>{
      try{
        const canvas=host.querySelector('canvas');
        if(canvas){
          const data=canvas.toDataURL('image/png');
          host.remove();
          resolve(data);
          return
        }
        const img=host.querySelector('img');
        if(img?.src){
          const data=img.src;
          host.remove();
          resolve(data);
          return
        }
        host.remove();
        reject(new Error('QR code indisponible.'));
      }catch(e){
        host.remove();
        reject(e)
      }
    };

    setTimeout(finish,80);
  })
}
async function buildAllTesterQrPdf(){
  const jsPDFCtor=window.jspdf?.jsPDF;
  if(!jsPDFCtor)throw new Error('Le module PDF n’est pas chargé. Vérifiez la connexion Internet puis réessayez.');
  if(!phoneSharePrepared(state.config))throw new Error('Préparez d’abord les téléphones.');

  if(!launchShareReady())await ensurePreparedShareConnected();

  const doc=new jsPDFCtor({orientation:'portrait',unit:'mm',format:'a4'});
  const count=Math.max(1,Number(state.config?.testerCount||0));

  for(let i=1;i<=count;i++){
    if(i>1)doc.addPage();

    const qr=await qrDataUrlForLink(shareUrl(i));

    doc.setTextColor(0,0,0);
    doc.setFont('helvetica','bold');
    doc.setFontSize(28);
    doc.text(`Testeur ${i}`,105,50,{align:'center'});
    doc.addImage(qr,'PNG',65,68,80,80);
  }

  const lotName=state.config?.lotName||'jury';
  const filename=`QR-codes-${safePdfFileName(lotName)}.pdf`;
  const blob=doc.output('blob');
  return {blob,filename,count}
}
function qrShareLinksText(){
  const count=Math.max(1,Number(state.config?.testerCount||0));
  const lines=[];
  for(let i=1;i<=count;i++){
    const name=state.testers?.[i]?.name||state.config?.testerNames?.[i-1]||`Testeur ${i}`;
    lines.push(`${name} : ${shareUrl(i)}`);
  }
  return lines.join('\n');
}

async function prepareQrSharingContext(){
  if(!phoneSharePrepared(draftConfig))throw new Error('Préparez d’abord les téléphones.');

  /* Reprendre le jury réellement enregistré avant de partager ses accès. */
  if(state.config?._preparedId!==draftConfig?._preparedId){
    commitDraftForPhonePreparation();
  }

  if(!launchShareReady())await ensurePreparedShareConnected();
}

let qrSharePreparedBlob=null;
let qrSharePreparedObjectUrl='';

async function prepareQrSharePreview(){
  const img=$('#qrSharePreview');
  const stateNode=$('#qrSharePreviewState');
  if(stateNode)stateNode.textContent='Préparation des QR codes…';
  if(img)img.removeAttribute('src');

  try{
    await prepareQrSharingContext();
    const blob=await buildQrClipboardPng();
    qrSharePreparedBlob=blob;

    if(qrSharePreparedObjectUrl){
      try{URL.revokeObjectURL(qrSharePreparedObjectUrl)}catch(e){}
    }
    qrSharePreparedObjectUrl=URL.createObjectURL(blob);

    if(img)img.src=qrSharePreparedObjectUrl;
    if(stateNode)stateNode.textContent='QR codes prêts ✓';
  }catch(e){
    console.error(e);
    qrSharePreparedBlob=null;
    if(stateNode)stateNode.textContent='Impossible de préparer les QR codes.';
  }
}

function openQrShareModal(){
  if(!phoneSharePrepared(draftConfig)){
    alert('Préparez d’abord les téléphones.');
    return;
  }
  const modal=$('#qrShareModal');
  if(modal)modal.classList.add('show');
  prepareQrSharePreview();
}

function closeQrShareModal(){
  $('#qrShareModal')?.classList.remove('show');
}

function qrImageElement(dataUrl){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>resolve(img);
    img.onerror=()=>reject(new Error('Impossible de préparer l’image des QR codes.'));
    img.src=dataUrl;
  });
}

async function buildQrClipboardPng(){
  const count=Math.max(1,Number(state.config?.testerCount||0));
  const cols=Math.min(3,count);
  const rows=Math.ceil(count/cols);
  const cardW=360,cardH=430,pad=28;
  const canvas=document.createElement('canvas');
  canvas.width=cols*cardW;
  canvas.height=rows*cardH;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#ffffff';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#111111';
  ctx.textAlign='center';

  for(let i=1;i<=count;i++){
    const col=(i-1)%cols,row=Math.floor((i-1)/cols);
    const x=col*cardW,y=row*cardH;
    const name=state.testers?.[i]?.name||state.config?.testerNames?.[i-1]||`Testeur ${i}`;
    const qr=await qrDataUrlForLink(shareUrl(i));
    const img=await qrImageElement(qr);

    ctx.strokeStyle='#d7dde3';
    ctx.lineWidth=2;
    ctx.strokeRect(x+12,y+12,cardW-24,cardH-24);
    ctx.fillStyle='#111111';
    ctx.font='bold 28px Arial';
    ctx.fillText(`Testeur ${i}`,x+cardW/2,y+48);
    ctx.font='18px Arial';
    ctx.fillText(name,x+cardW/2,y+78);
    ctx.drawImage(img,x+pad+20,y+105,cardW-(pad+20)*2,cardW-(pad+20)*2);
  }

  return await new Promise((resolve,reject)=>{
    canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Impossible de créer l’image des QR codes.')),'image/png');
  });
}

async function copyQrSheetToClipboard(){
  if(!navigator.clipboard?.write || typeof ClipboardItem==='undefined')return false;
  try{
    const blob=await buildQrClipboardPng();
    await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);
    return true;
  }catch(e){
    console.warn('Copie QR dans le presse-papiers impossible',e);
    return false;
  }
}

async function qrShareCopyQrImage(){
  if(!qrSharePreparedBlob){
    alert('Les QR codes ne sont pas encore prêts. Attendez quelques secondes puis réessayez.');
    return;
  }
  if(!navigator.clipboard?.write || typeof ClipboardItem==='undefined'){
    alert('Chrome ne permet pas de copier l’image sur cet ordinateur. Utilisez « Télécharger l’image QR ».');
    return;
  }
  try{
    await navigator.clipboard.write([new ClipboardItem({'image/png':qrSharePreparedBlob})]);
    const b=$('#qrShareCopyImageBtn');
    if(b)b.textContent='✓ QR codes copiés — ouvrez Gmail';
    toast('QR codes copiés ✓');
  }catch(e){
    console.error(e);
    alert('La copie de l’image a été bloquée par Chrome. Utilisez « Télécharger l’image QR ».');
  }
}

function qrShareDownloadImage(){
  if(!qrSharePreparedBlob){
    alert('Les QR codes ne sont pas encore prêts. Attendez quelques secondes puis réessayez.');
    return;
  }
  const filename=`QR-codes-${safePdfFileName(state.config?.lotName||'jury')}.png`;
  const url=URL.createObjectURL(qrSharePreparedBlob);
  const a=document.createElement('a');
  a.href=url;a.download=filename;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
  toast('Image des QR codes téléchargée ✓');
}

async function qrShareOpenGmail(){
  try{
    await prepareQrSharingContext();
    const subject=`Accès testeurs — ${state.config?.lotName||'Jury culinaire'}`;
    const body=`Bonjour,\n\nVoici les accès individuels au jury ${state.config?.lotName||'Jury culinaire'}.\n\n${qrShareLinksText()}\n\nMerci d’utiliser uniquement le lien correspondant à votre numéro de testeur.\n\nCordialement`;
    const url='https://mail.google.com/mail/?view=cm&fs=1&su='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
    const w=window.open(url,'_blank');
    if(!w){
      alert('Chrome a bloqué l’ouverture de Gmail. Autorisez les fenêtres pop-up pour ce site puis réessayez.');
      return;
    }
    closeQrShareModal();
  }catch(e){
    console.error(e);
    alert(`Impossible d’ouvrir Gmail. ${e?.message||e}`);
  }
}
async function qrShareDownloadPdf(){
  const btn=$('#qrShareDownloadBtn');
  const old=btn?.textContent||'📄 Télécharger le PDF des QR codes';
  try{
    if(btn){btn.disabled=true;btn.textContent='⏳ Création du PDF…'}
    await prepareQrSharingContext();
    const {blob,filename}=await buildAllTesterQrPdf();
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download=filename;
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),5000);
    closeQrShareModal();
    toast('PDF des QR codes téléchargé ✓');
  }catch(e){
    console.error(e);
    alert(`Impossible de créer le PDF. ${e?.message||e}`);
  }finally{
    if(btn){btn.disabled=false;btn.textContent=old}
  }
}

async function qrShareCopyLinks(){
  try{
    await prepareQrSharingContext();
    await copyText(qrShareLinksText(),'Tous les liens testeurs ont été copiés ✓');
    closeQrShareModal();
  }catch(e){
    console.error(e);
    alert(`Impossible de copier les liens. ${e?.message||e}`);
  }
}

async function qrShareNativePdf(){
  const btn=$('#qrShareNativeBtn');
  const old=btn?.textContent||'📱 Partager le PDF';
  try{
    if(btn){btn.disabled=true;btn.textContent='⏳ Préparation…'}
    await prepareQrSharingContext();
    const {blob,filename,count}=await buildAllTesterQrPdf();
    const file=new File([blob],filename,{type:'application/pdf'});

    if(navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))){
      await navigator.share({
        title:`QR codes des testeurs — ${state.config?.lotName||'Jury'}`,
        text:`Voici les ${count} QR codes des testeurs.`,
        files:[file]
      });
      closeQrShareModal();
      toast('PDF partagé ✓');
    }else{
      alert('Le partage direct de fichiers n’est pas disponible sur cet appareil. Utilisez « Télécharger le PDF » ou « Ouvrir Gmail ».');
    }
  }catch(e){
    if(e?.name!=='AbortError'){
      console.error(e);
      alert(`Impossible de partager le PDF. ${e?.message||e}`);
    }
  }finally{
    if(btn){btn.disabled=false;btn.textContent=old}
  }
}

function sendQrPdfFromConfig(){
  openQrShareModal();
}

async function openConfigQrCodes(){
  if(!phoneSharePrepared(draftConfig)){
    alert('Préparez d’abord les téléphones.');
    return
  }

  /* Si un autre jury a été préparé entre-temps, reconnecter silencieusement
     la bonne session avant d’afficher les QR codes. */
  if(!launchShareReady()){
    try{
      await ensurePreparedShareConnected();
    }catch(e){
      alert(`Impossible de reconnecter les QR codes. ${e?.message||e}`);
      return
    }
  }
  renderQrCodes('configView')
}


function loadPersonalMarketLots(){
  try{
    const rows=JSON.parse(localStorage.getItem(PERSONAL_MARKET_STORAGE_KEY)||'[]');
    return Array.isArray(rows)?rows:[];
  }catch(e){return[]}
}
function savePersonalMarketLots(rows){
  localStorage.setItem(PERSONAL_MARKET_STORAGE_KEY,JSON.stringify(Array.isArray(rows)?rows:[]));
}
function marketRefKey(ref){
  if(ref?.personal&&ref?.personalId)return `personal:${ref.personalId}`;
  return String(ref?.lot||'');
}
function personalMarketByValue(value){
  const v=String(value||'');
  if(!v.startsWith('personal:'))return null;
  const id=v.slice('personal:'.length);
  return loadPersonalMarketLots().find(r=>r.id===id)||null;
}
function marketSelectionLabel(value){
  const v=String(value||'');
  const personal=personalMarketByValue(v);
  if(personal)return `Test personnalisé « ${personal.name||personal.config?.lotName||'Sans nom'} »`;
  return v?`Lot ${v}`:'';
}
function addSelectedCustomTemplateToMarket(){
  const templateId=$('#customTemplateSelect')?.value;
  if(!templateId){alert('Choisissez d’abord un test personnalisé.');return}
  const rec=loadCustomTemplates().find(r=>r.id===templateId);
  if(!rec?.config){alert('Test personnalisé introuvable.');return}

  const rows=loadPersonalMarketLots();
  const existing=rows.find(r=>r.sourceTemplateId===templateId);
  if(existing){
    alert(`« ${existing.name||rec.name} » est déjà ajouté au Marché 2026 dans la partie « Mes ajouts personnels ».`);
    updateCustomTemplateButtons();
    return;
  }

  const now=new Date().toISOString();
  const item={
    id:uid('mkp'),
    sourceTemplateId:templateId,
    name:rec.name||rec.config?.lotName||'Test personnalisé',
    createdAt:now,
    updatedAt:now,
    config:cleanConfigForCustomTemplate(rec.config)
  };
  rows.push(item);
  savePersonalMarketLots(rows);
  renderMarketLibrary();
  renderCustomTemplateSelect();
  $('#customTemplateSelect').value=templateId;
  updateCustomTemplateButtons();
  toast(`« ${item.name} » ajouté au Marché 2026 ✓`);
}

function loadCustomTemplates(){
  try{
    const rows=JSON.parse(localStorage.getItem(CUSTOM_TEMPLATE_STORAGE_KEY)||'[]');
    return Array.isArray(rows)?rows:[];
  }catch(e){return[]}
}
function saveCustomTemplates(rows){
  localStorage.setItem(CUSTOM_TEMPLATE_STORAGE_KEY,JSON.stringify(Array.isArray(rows)?rows:[]));
}
function customTemplateDate(v){
  if(!v)return '';
  try{return new Date(v).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'})}catch(e){return ''}
}
function renderCustomTemplateSelect(){
  const sel=$('#customTemplateSelect'),useBtn=$('#useCustomTemplateBtn'),delBtn=$('#deleteCustomTemplateBtn'),help=$('#customTemplateHelp');
  if(!sel)return;
  const current=sel.value;
  const rows=loadCustomTemplates().sort((a,b)=>String(b.updatedAt||b.createdAt||'').localeCompare(String(a.updatedAt||a.createdAt||'')));
  sel.innerHTML='<option value="">— Choisir un test personnalisé —</option>'+rows.map(r=>{
    const name=r.name||r.config?.lotName||'Test personnalisé';
    const date=customTemplateDate(r.updatedAt||r.createdAt);
    return `<option value="${escapeHtml(r.id)}">${escapeHtml(name)}${date?` · ${escapeHtml(date)}`:''}</option>`;
  }).join('');
  if(rows.some(r=>r.id===current))sel.value=current;
  const has=!!sel.value;
  if(useBtn)useBtn.disabled=!has;
  if(delBtn)delBtn.disabled=!has;
  updateCustomTemplateButtons();
  if(help)help.textContent=rows.length
    ? `${rows.length} test${rows.length>1?'s':''} personnalisé${rows.length>1?'s':''} enregistré${rows.length>1?'s':''}. Vous pouvez aussi en ajouter un à la liste Marché 2026.`
    : 'Enregistrez ici un test que vous avez créé pour le retrouver ensuite comme un modèle.';
}
function cleanConfigForCustomTemplate(cfg){
  const out=deepClone(cfg||{});
  delete out._archive;
  delete out.closure;
  delete out.juryLaunch;
  delete out.juryClose;
  delete out.security;
  delete out.marketRef;
  delete out.customTemplateRef;
  out.criteria=normalizeCriteria(out.criteria);
  out.products=(out.products||[]).map((p,i)=>({...p,criteria:normalizeCriteria(p.criteria||out.criteria),color:p.color||PALETTE[i%PALETTE.length]}));
  if(out.products[0])out.criteria=deepClone(out.products[0].criteria);
  return out;
}

function saveDraftAsCustomTemplateAfterJury(){
  const cfg=cleanConfigForCustomTemplate(draftConfig);
  const base=String(cfg.lotName||'Mon test').trim()||'Mon test';
  const rows=loadCustomTemplates();
  const lower=v=>String(v||'').toLocaleLowerCase('fr');
  let name=base,n=2;
  while(rows.some(r=>lower(r.name)===lower(name)))name=`${base} ${n++}`;
  const now=new Date().toISOString();
  rows.push({id:uid('tpl'),name,createdAt:now,updatedAt:now,config:cfg});
  saveCustomTemplates(rows);
  return name;
}

function saveCurrentDraftAsCustomTemplate(){
  const err=validateDraft();
  if(err){alert(`Avant d’ajouter ce test à « Mes tests », terminez son paramétrage.\n\n${err}`);return}
  let name=prompt('Nom du test à enregistrer dans « Mes tests » :',draftConfig.lotName||'Mon test');
  if(name===null)return;
  name=String(name||'').trim();
  if(!name){alert('Indiquez un nom pour ce test.');return}

  const rows=loadCustomTemplates();
  const same=rows.find(r=>String(r.name||'').toLocaleLowerCase('fr')===name.toLocaleLowerCase('fr'));
  let id=same?.id||uid('tpl');
  if(same&&!confirm(`Un test nommé « ${name} » existe déjà.\nVoulez-vous le remplacer ?`))return;

  const now=new Date().toISOString();
  const rec={
    id,
    name,
    createdAt:same?.createdAt||now,
    updatedAt:now,
    config:cleanConfigForCustomTemplate(draftConfig)
  };

  const next=rows.filter(r=>r.id!==id);
  next.push(rec);
  saveCustomTemplates(next);
  renderCustomTemplateSelect();
  $('#customTemplateSelect').value=id;
  $('#useCustomTemplateBtn').disabled=false;
  $('#deleteCustomTemplateBtn').disabled=false;
  $('#customTemplateHelp').textContent=`« ${name} » est maintenant dans Mes tests / lots personnalisés.`;
  toast('Test ajouté à Mes tests ✓');
}
function useCustomTemplate(){
  const id=$('#customTemplateSelect')?.value;
  if(!id){alert('Choisissez d’abord un test personnalisé.');return}
  const rec=loadCustomTemplates().find(r=>r.id===id);
  if(!rec?.config){alert('Test personnalisé introuvable.');return}

  const cfg=cleanConfigForCustomTemplate(rec.config);
  cfg.customTemplateRef={id:rec.id,name:rec.name||cfg.lotName||'Test personnalisé'};
  cfg.testerCount=Math.max(1,Number(cfg.testerCount||8));
  cfg.testerNames=Array.from({length:cfg.testerCount},(_,i)=>cfg.testerNames?.[i]||`Testeur ${i+1}`);

  pendingMarketLot='';
  draftConfig=cfg;
  renderConfig();
  $('#customTemplateSelect').value=id;
  $('#useCustomTemplateBtn').disabled=false;
  $('#deleteCustomTemplateBtn').disabled=false;
  toast(`Test « ${rec.name||cfg.lotName} » prêt à compléter ✓`);
}
function deleteCustomTemplate(){
  const id=$('#customTemplateSelect')?.value;
  if(!id)return;
  const rows=loadCustomTemplates();
  const rec=rows.find(r=>r.id===id);
  if(!rec)return;
  if(!confirm(`Supprimer « ${rec.name||'ce test'} » de Mes tests ?\n\nCela ne supprime pas vos jurys ni vos archives.`))return;
  saveCustomTemplates(rows.filter(r=>r.id!==id));
  renderCustomTemplateSelect();
  toast('Test personnalisé supprimé');
}
function updateCustomTemplateButtons(){
  const id=$('#customTemplateSelect')?.value||'';
  const has=!!id;
  const useBtn=$('#useCustomTemplateBtn');
  const delBtn=$('#deleteCustomTemplateBtn');
  const addBtn=$('#addCustomToMarketBtn');

  if(useBtn)useBtn.disabled=!has;
  if(delBtn)delBtn.disabled=!has;

  if(addBtn){
    const already=has&&loadPersonalMarketLots().some(r=>r.sourceTemplateId===id);
    addBtn.disabled=!has||already;
    addBtn.textContent=already?'✓ Déjà ajouté au Marché 2026':'➕ Ajouter au Marché 2026';
  }
}
function renderArchiveTemplateSelect(){
  const sel=$('#archiveTemplateSelect');if(!sel)return;
  const rows=loadArchives().sort((a,b)=>String(b.archivedAt||'').localeCompare(String(a.archivedAt||'')));
  sel.innerHTML='<option value="">— Choisir une archive —</option>'+rows.map(r=>`<option value="${escapeHtml(r.id)}">${escapeHtml(r.state?.config?.lotName||'Jury archivé')} · ${escapeHtml(formatArchiveDate(r.archivedAt))}</option>`).join('');
}
function useArchiveTemplate(){
  const id=$('#archiveTemplateSelect')?.value;if(!id){alert('Choisissez d’abord un jury archivé.');return}
  const rec=loadArchives().find(x=>x.id===id);if(!rec?.state?.config){alert('Archive introuvable.');return}
  const cfg=deepClone(rec.state.config);
  delete cfg._archive;delete cfg.closure;delete cfg.juryLaunch;delete cfg.juryClose;
  cfg.criteria=normalizeCriteria(cfg.criteria);cfg.products=(cfg.products||[]).map((p,i)=>({...p,criteria:normalizeCriteria(p.criteria||cfg.criteria),color:p.color||PALETTE[i%PALETTE.length]}));if(cfg.products[0])cfg.criteria=deepClone(cfg.products[0].criteria);cfg.testerNames=Array.from({length:Number(cfg.testerCount||8)},(_,i)=>cfg.testerNames?.[i]||`Testeur ${i+1}`);
  pendingMarketLot='';
  draftConfig=cfg;
  renderConfig();
  toast('Ancien paramétrage recopié — notes non reprises ✓');
}
function supplierSuggestions(){
  const set=new Set();
  (loadSampleMasterMeta()?.supplierNames||[]).forEach(v=>{v=String(v||'').trim();if(v)set.add(v)});
  (draftConfig?.supplierNames||[]).forEach(v=>{v=String(v||'').trim();if(v)set.add(v)});
  (draftConfig?.products||[]).forEach(p=>(p.samples||[]).forEach(s=>{const v=String(s.supplier||'').trim();if(v)set.add(v)}));
  loadArchives().forEach(r=>(r.state?.config?.products||[]).forEach(p=>(p.samples||[]).forEach(s=>{const v=String(s.supplier||'').trim();if(v)set.add(v)})));
  loadCustomTemplates().forEach(r=>(r.config?.products||[]).forEach(p=>(p.samples||[]).forEach(s=>{const v=String(s.supplier||'').trim();if(v)set.add(v)})));
  return [...set].sort((a,b)=>a.localeCompare(b,'fr'));
}
function renderConfigChoiceRecap(){
  const box=$('#configChoiceRecap');
  const pbox=$('#configRecapProducts');
  const sbox=$('#configRecapSuppliers');
  if(!box||!pbox||!sbox||!draftConfig)return;

  const lotNumber=String(draftConfig.lotNumber||'').trim();
  const lotTitle=String(draftConfig.lotTitle||'').trim();
  const lotNumberBox=$('#configRecapLotNumber');
  const lotNameBox=$('#configRecapLotNameV184');

  if(lotNumberBox)lotNumberBox.textContent=lotNumber||'—';
  if(lotNameBox)lotNameBox.textContent=lotTitle||String(draftConfig.lotName||'').replace(/^Lot\s*[^—-]+\s*[—-]?\s*/i,'').trim()||'—';

  const products=(draftConfig.products||[]).map(p=>String(p?.name||'').trim()).filter(Boolean);
  const suppliers=(draftConfig.supplierNames||[]).map(x=>String(x||'').trim()).filter(Boolean);
  box.hidden=!(lotNumber||lotTitle||products.length||suppliers.length);

  pbox.innerHTML=products.length
    ?products.map((x,i)=>`<span class="config-recap-chip">Produit ${i+1} · ${escapeHtml(x)}</span>`).join('')
    :'<span class="muted">Aucun produit renseigné</span>';

  sbox.innerHTML=suppliers.length
    ?suppliers.map(x=>`<span class="config-recap-chip">${escapeHtml(x)}</span>`).join('')
    :'<span class="muted">Aucun fournisseur renseigné</span>';
}
function renderSupplierSuggestions(){
  const dl=$('#supplierSuggestions');if(!dl)return;
  dl.innerHTML=supplierSuggestions().map(x=>`<option value="${escapeHtml(x)}"></option>`).join('');
}
function parseQuickSamples(raw){
  return String(raw||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(line=>{
    let parts=line.split(/\s*[;\t|]\s*/);
    if(parts.length<2)parts=line.split(/\s*=\s*/);
    if(parts.length<2)parts=line.split(/\s+-\s+/);
    return{id:String(parts.shift()||'').trim(),supplier:parts.join(' ').trim()};
  }).filter(x=>x.id||x.supplier);
}
function importQuickSamples(pi,mode){
  const ta=document.querySelector(`[data-quick-samples="${pi}"]`);if(!ta)return;
  const rows=parseQuickSamples(ta.value);
  if(!rows.length){alert('Collez au moins une ligne, par exemple : 22 ; Transgourmet');return}
  const bad=rows.find(x=>!x.id||!x.supplier);if(bad){alert('Chaque ligne doit contenir un numéro d’échantillon et un fournisseur.\\nExemple : 22 ; Transgourmet');return}
  if(mode==='replace')draftConfig.products[pi].samples=rows;
  else{
    const existing=draftConfig.products[pi].samples||[];
    const emptyOnly=existing.length===1&&!String(existing[0].id||'').trim()&&!String(existing[0].supplier||'').trim();
    draftConfig.products[pi].samples=(emptyOnly?[]:existing).concat(rows);
  }
  renderProductConfigs();renderDraftSummary();toast(`${rows.length} échantillon${rows.length>1?'s':''} ajouté${rows.length>1?'s':''} ✓`);
}
function reusePreviousProductSuppliers(pi){
  syncTopDraft();
  if(pi<=0)return;
  const prev=draftConfig.products[pi-1];
  const cur=draftConfig.products[pi];
  if(!prev||!cur)return;

  const previousSamples=(prev.samples||[]);
  const suppliers=previousSamples.map(s=>String(s.supplier||'').trim());

  if(!suppliers.some(Boolean)){
    alert(`Aucun fournisseur n’est encore renseigné dans le produit ${pi}.`);
    return;
  }

  const currentSamples=cur.samples||[];
  cur.samples=previousSamples.map((s,si)=>({
    id:String(currentSamples[si]?.id||''),
    supplier:String(s.supplier||'')
  }));

  if(!cur.samples.length)cur.samples=[{id:'',supplier:''}];

  renderProductConfigs();
  renderDraftSummary();

  requestAnimationFrame(()=>{
    const firstId=document.querySelector(`[data-s-id="${pi}:0"]`);
    if(firstId)firstId.focus();
  });

  toast(`Fournisseurs du produit ${pi} repris dans le produit ${pi+1}`);
}

function renderMarketLibrary(){
  const sel=$('#marketLotSelect'),info=$('#marketLotInfo');if(!sel||!info)return;
  const personal=loadPersonalMarketLots();

  const officialOptions=MARKET_2026_LOTS.map(x=>`<option value="${escapeHtml(x.lot)}">Lot ${escapeHtml(x.lot)} — ${escapeHtml(x.title)}</option>`).join('');
  const personalOptions=personal.map(x=>`<option class="personal-market-option" value="personal:${escapeHtml(x.id)}">⭐ PERSONNALISÉ — ${escapeHtml(x.name||x.config?.lotName||'Test sans nom')}</option>`).join('');

  sel.innerHTML='<option value="">— Choisir un lot —</option>'
    +`<optgroup label="Lots officiels du Marché 2026">${officialOptions}</optgroup>`
    +(personal.length?`<optgroup label="Mes ajouts personnels au Marché 2026">${personalOptions}</optgroup>`:'');

  const refKey=marketRefKey(draftConfig?.marketRef);
  const allValues=new Set([
    ...MARKET_2026_LOTS.map(x=>String(x.lot)),
    ...personal.map(x=>`personal:${x.id}`)
  ]);

  if(pendingMarketLot&&allValues.has(pendingMarketLot))sel.value=pendingMarketLot;
  else if(refKey&&allValues.has(refKey))sel.value=refKey;

  updateMarketLotInfo();
}
function marketLotIsPending(){
  const sel=$('#marketLotSelect');
  const selected=String(sel?.value||'');
  return !!(selected&&pendingMarketLot===selected);
}
function renderMarketPrepareState(){
  const sel=$('#marketLotSelect'),btn=$('#useMarketLotBtn'),stateBox=$('#marketPrepareState');
  const title=$('#marketPrepareTitle'),desc=$('#marketPrepareText');
  if(!sel||!btn||!stateBox||!title||!desc)return;

  const selected=String(sel.value||'');
  const prepared=selected&&marketRefKey(draftConfig?.marketRef)===selected&&!marketLotIsPending();
  const label=marketSelectionLabel(selected);

  stateBox.className='market-prepare-state';
  btn.classList.remove('prepared');

  if(!selected){
    stateBox.classList.add('neutral');
    title.textContent='Choisissez d’abord un lot';
    desc.textContent='Ensuite, une étape de préparation sera demandée.';
    btn.textContent='CRÉER CE JURY';
    btn.disabled=true;
    return;
  }

  if(prepared){
    stateBox.classList.add('done');
    title.textContent=`${label} préparé ✓`;
    desc.textContent='Vous pouvez continuer avec les questions, les produits et les échantillons.';
    btn.textContent='✓ JURY CRÉÉ';
    btn.classList.add('prepared');
    btn.disabled=true;
    return;
  }

  stateBox.classList.add('pending');
  title.textContent=`${label} sélectionné — encore une étape`;
  desc.textContent='Cliquez maintenant sur le grand bouton pour créer ce jury à partir du lot choisi.';
  btn.textContent=`CRÉER À PARTIR DE CE LOT`;
  btn.disabled=false;
}
function updateMarketLotInfo(){
  const sel=$('#marketLotSelect'),info=$('#marketLotInfo');if(!sel||!info)return;
  const selected=String(sel.value||'');
  const personal=personalMarketByValue(selected);
  const official=MARKET_2026_LOTS.find(v=>String(v.lot)===selected);

  if(selected&&marketRefKey(draftConfig?.marketRef)!==selected)pendingMarketLot=selected;
  if(!selected)pendingMarketLot='';

  if(personal){
    const cfg=personal.config||{};
    const productCount=(cfg.products||[]).length;
    const sampleCount=(cfg.products||[]).reduce((n,p)=>n+(p.samples||[]).length,0);
    info.innerHTML=`<strong>⭐ ${escapeHtml(personal.name||cfg.lotName||'Test personnalisé')}</strong>
      <div class="ref-row">
        <span class="market-personal-pill">PERSONNALISÉ</span>
        <span class="market-pill">${productCount} produit${productCount>1?'s':''}</span>
        <span class="market-pill">${sampleCount} échantillon${sampleCount>1?'s':''}</span>
      </div>
      <div style="margin-top:8px;color:#667085">Ajout personnel dans votre liste Marché 2026. Ce test n’est pas présenté comme un lot officiel du marché.</div>`;
    renderMarketPrepareState();
    renderDraftSummary();
    return;
  }

  if(!official){
    info.innerHTML='Sélectionnez un lot pour afficher sa référence interne.';
    renderMarketPrepareState();
    renderDraftSummary();
    return;
  }

  info.innerHTML=`<strong>Lot ${escapeHtml(official.lot)} — ${escapeHtml(official.title)}</strong><div class="ref-row"><span class="market-pill">${escapeHtml(official.family)}</span><span class="market-pill">Échéance ${escapeHtml(official.expiry)}</span><span class="market-pill">Attributaire 2026 : ${escapeHtml(official.awarded)}</span></div>${official.note?`<div style="margin-top:7px">${escapeHtml(official.note)}</div>`:''}<div style="margin-top:8px;color:#667085">Référence interne uniquement : l’attributaire n’est pas ajouté automatiquement aux échantillons du jury.</div>`;
  renderMarketPrepareState();
  renderDraftSummary();
}
function flashCreateButton(btn,activeText,callback){
  if(!btn){callback();return}
  const original=btn.textContent;
  btn.classList.add('clicked');
  if(activeText)btn.textContent=activeText;
  btn.disabled=true;
  setTimeout(()=>{ callback(); }, 120);
  setTimeout(()=>{
    if(document.body.contains(btn)){
      btn.classList.remove('clicked');
      if(btn.id==='blankTestBtn')btn.textContent=original;
      btn.disabled=false;
    }
  }, 400);
}

function prepareMarketLot(){
  const sel=$('#marketLotSelect');
  const selected=String(sel?.value||'');
  const personal=personalMarketByValue(selected);

  if(personal){
    const cfg=cleanConfigForCustomTemplate(personal.config);
    cfg.marketRef={
      lot:selected,
      personal:true,
      personalId:personal.id,
      title:personal.name||cfg.lotName||'Test personnalisé',
      family:'PERSONNALISÉ',
      awarded:'',
      expiry:''
    };
    cfg.testerCount=Math.max(1,Number(cfg.testerCount||8));
    cfg.testerNames=Array.from({length:cfg.testerCount},(_,i)=>cfg.testerNames?.[i]||`Testeur ${i+1}`);
    draftConfig=cfg;
    pendingMarketLot='';
    renderConfig();
    keepOnlyCreationMethod('market');
    toast(`Test personnalisé « ${personal.name||cfg.lotName} » préparé ✓`);
    return;
  }

  const x=MARKET_2026_LOTS.find(v=>String(v.lot)===selected);
  if(!x){alert('Choisissez d’abord un lot du marché 2026.');return}

  const testerCount=draftConfig?.testerCount||8;
  const testerNames=deepClone(draftConfig?.testerNames||Array.from({length:testerCount},(_,i)=>`Testeur ${i+1}`));

  draftConfig={
    lotName:`Lot ${x.lot} — ${titleCaseMarket(x.title)}`,
    subtitle:`${titleCaseMarket(x.family)} — marché 2026`,
    criteria:defaultCriteria(),
    testerCount,
    testerNames,
    marketRef:deepClone(x),
    products:[{id:uid('p'),code:'01',name:'',color:PALETTE[0],criteria:defaultCriteria(),samples:masterSamplesForNewProduct()}]
  };

  pendingMarketLot='';
  renderConfig();
  keepOnlyCreationMethod('market');
  toast(`Lot ${x.lot} préparé ✓`);
}
function titleCaseMarket(v){return String(v||'').toLocaleLowerCase('fr-FR').replace(/(^|[\s—–-])([a-zàâäéèêëîïôöùûüç])/g,(m,a,b)=>a+b.toLocaleUpperCase('fr-FR'))}

function syncTopDraft(){
  draftConfig.lotName=$('#cfgLotName').value.trim();
  draftConfig.subtitle=$('#cfgSubtitle').value.trim();

  const input=$('#cfgTesterCount');
  const n=Math.max(1,Math.min(20,parseInt(input?.value,10)||1));

  draftConfig.testerCount=n;
  draftConfig.testerNames=Array.isArray(draftConfig.testerNames)?draftConfig.testerNames:[];

  while(draftConfig.testerNames.length<n){
    draftConfig.testerNames.push(`Testeur ${draftConfig.testerNames.length+1}`);
  }
  draftConfig.testerNames=draftConfig.testerNames.slice(0,n);

  const help=$('#testerCountHelp');
  if(help)help.textContent=`✅ ${n} testeur${n>1?'s':''} sélectionné${n>1?'s':''}.`;
}
function renderTesterNames(){
  const box=$('#testerNamesConfig');if(!box)return;
  box.innerHTML='';
  const n=Math.max(1,Number(draftConfig?.testerCount||1));

  draftConfig.testerNames=Array.isArray(draftConfig.testerNames)?draftConfig.testerNames:[];
  while(draftConfig.testerNames.length<n)draftConfig.testerNames.push(`Testeur ${draftConfig.testerNames.length+1}`);
  draftConfig.testerNames=draftConfig.testerNames.slice(0,n);

  for(let i=0;i<n;i++){
    const d=document.createElement('div');
    d.className='field';
    d.innerHTML=`<label>Testeur ${i+1}</label><input data-tester-name="${i}" value="${escapeHtml(draftConfig.testerNames[i]||`Testeur ${i+1}`)}">`;
    box.appendChild(d);
  }

  box.querySelectorAll('[data-tester-name]').forEach(inp=>{
    inp.oninput=e=>{
      draftConfig.testerNames[Number(e.target.dataset.testerName)]=e.target.value;
    };
  });

  renderDraftSummary();
}
function renderProductConfigs(){
  const box=$('#productsConfig');box.innerHTML='';
  const options=Object.entries(CRITERION_LIBRARY).map(([key,v])=>`<option value="${key}">${escapeHtml(key==='autre'?'Autre…':v.short)}</option>`).join('');

  draftConfig.products.forEach((p,pi)=>{
    p.criteria=normalizeCriteria(p.criteria||draftConfig.criteria);
    /* Tous les produits (n°1, n°2, n°3…) reprennent la même liste de fournisseurs. */
    p.samples=rowsForAllSuppliers(p.samples,draftConfig?.supplierNames||[]);

    const group=document.createElement('section');
    group.className='product-config-group';
    group.dataset.productGroup=pi;

    const card=document.createElement('section');card.className='panel product-config';
    card.innerHTML=`<div class="product-config-head">
      <div class="product-index" style="background:${p.color||PALETTE[pi%PALETTE.length]}">${pi+1}</div>
      <div style="flex:1"><h3>Produit n°${pi+1}${String(p.name||'').trim()?` — ${escapeHtml(p.name)}`:''}</h3><span class="sample-count-pill">${(p.samples||[]).length} échantillon${(p.samples||[]).length>1?'s':''}</span></div>
      <div class="head-actions">
        ${pi>0?`<button class="btn btn-danger btn-small" data-remove-product="${pi}">Supprimer</button>`:''}
      </div>
    </div>
    <div class="product-fields">
      <div class="field"><label>Nom du produit / article</label><input data-p-name="${pi}" value="${escapeHtml(p.name||'')}" placeholder="Ex. Filet de colin"></div>
    </div>
    <div class="product-known-suppliers"><strong>Fournisseurs repris pour ce produit :</strong> ${(draftConfig?.supplierNames||[]).length?(draftConfig.supplierNames.map(x=>escapeHtml(x)).join(' · ')):'Aucun fournisseur enregistré'}</div>
    <div style="overflow:auto"><table class="sample-table"><thead><tr><th>N° échantillon à l’aveugle</th><th>Fournisseur repris</th><th></th></tr></thead><tbody>
      ${(p.samples||[]).map((s,si)=>`<tr><td><input data-s-id="${pi}:${si}" value="${escapeHtml(s.id)}" placeholder="Ex. 14"></td><td><input list="supplierSuggestions" data-s-supplier="${pi}:${si}" value="${escapeHtml(s.supplier)}" placeholder="Ex. PASSIONFROID"></td><td class="delete-cell"><button class="btn btn-danger btn-small" data-remove-sample="${pi}:${si}">×</button></td></tr>`).join('')}
    </tbody></table></div>
    `;
    group.appendChild(card);

    const questions=document.createElement('div');
    questions.className='product-questions-block';
    questions.innerHTML=`
      <div class="config-section-head product-question-head">
        <div><h2>2. Choisir les 5 questions pour le produit ${pi+1}</h2><p>Ces cinq questions seront utilisées uniquement pour ce produit. Les 4 premières valent 10 points chacune et la 5e vaut 25 points.</p></div>
      </div>
      <section class="panel config-card criteria-config-card product-criteria-card">
        <div class="criteria-config-note"><strong>Total : 65 points.</strong> Choisissez un critère proposé ou « Autre… » pour écrire votre propre question.</div>
        <div class="criteria-config-grid">
          ${p.criteria.map((sel,qi)=>{
            const q=criterionQuestion(sel,qi),isCustom=sel.key==='autre';
            return `<div class="criterion-config-row">
              <div class="criterion-config-number"><strong>Question ${qi+1}</strong><span>${qi===4?'25 points · critère principal':'10 points'}</span></div>
              <div class="field"><label>Critère</label><select data-p-criterion-select="${pi}:${qi}">${options}</select></div>
              <div class="field criterion-custom-wrap ${isCustom?'visible':''}" data-p-criterion-custom-wrap="${pi}:${qi}"><label>Votre question / critère</label><input data-p-criterion-custom="${pi}:${qi}" value="${escapeHtml(sel.custom||'')}" placeholder="Ex. Persistance en bouche"></div>
              <div class="criteria-preview" style="grid-column:1/-1"><strong>Aperçu :</strong> ${escapeHtml(q.title)}</div>
            </div>`
          }).join('')}
        </div>
      </section>`;
    group.appendChild(questions);
    box.appendChild(group);
  });

  box.querySelectorAll('[data-p-name]').forEach(e=>e.oninput=x=>{draftConfig.products[Number(x.target.dataset.pName)].name=x.target.value;renderDraftSummary()});
  box.querySelectorAll('[data-s-id]').forEach(e=>e.oninput=x=>{const [pi,si]=x.target.dataset.sId.split(':').map(Number);draftConfig.products[pi].samples[si].id=x.target.value;renderDraftSummary()});
  box.querySelectorAll('[data-s-supplier]').forEach(e=>e.oninput=x=>{const [pi,si]=x.target.dataset.sSupplier.split(':').map(Number);draftConfig.products[pi].samples[si].supplier=x.target.value;renderDraftSummary()});
  box.querySelectorAll('[data-add-sample]').forEach(e=>e.onclick=x=>{const pi=Number(x.currentTarget.dataset.addSample);draftConfig.products[pi].samples.push({id:'',supplier:''});renderProductConfigs();renderDraftSummary()});
  box.querySelectorAll('[data-remove-sample]').forEach(e=>e.onclick=x=>{const [pi,si]=x.currentTarget.dataset.removeSample.split(':').map(Number);draftConfig.products[pi].samples.splice(si,1);if(!draftConfig.products[pi].samples.length)draftConfig.products[pi].samples.push({id:'',supplier:''});renderProductConfigs();renderDraftSummary()});
  box.querySelectorAll('[data-remove-product]').forEach(e=>e.onclick=x=>{const pi=Number(x.currentTarget.dataset.removeProduct);if(draftConfig.products.length===1){alert('Conservez au moins un produit.');return}draftConfig.products.splice(pi,1);if(draftConfig.products[0])draftConfig.criteria=deepClone(normalizeCriteria(draftConfig.products[0].criteria));renderProductConfigs();renderDraftSummary()});
  box.querySelectorAll('[data-reuse-suppliers]').forEach(e=>e.onclick=x=>reusePreviousProductSuppliers(Number(x.currentTarget.dataset.reuseSuppliers)));

  box.querySelectorAll('[data-p-criterion-select]').forEach(sel=>{
    const [pi,qi]=sel.dataset.pCriterionSelect.split(':').map(Number);
    sel.value=draftConfig.products[pi].criteria[qi].key;
    sel.onchange=e=>{
      const item=draftConfig.products[pi].criteria[qi];
      item.key=e.target.value;
      if(item.key!=='autre')item.custom='';
      if(pi===0)draftConfig.criteria=deepClone(draftConfig.products[0].criteria);
      renderProductConfigs();renderDraftSummary();
    };
  });
  box.querySelectorAll('[data-p-criterion-custom]').forEach(inp=>inp.oninput=e=>{
    const [pi,qi]=e.target.dataset.pCriterionCustom.split(':').map(Number);
    draftConfig.products[pi].criteria[qi].custom=e.target.value;
    if(pi===0)draftConfig.criteria=deepClone(draftConfig.products[0].criteria);
    const row=e.target.closest('.criterion-config-row'),preview=row?.querySelector('.criteria-preview');
    if(preview)preview.innerHTML=`<strong>Aperçu :</strong> ${escapeHtml(criterionQuestion(draftConfig.products[pi].criteria[qi],qi).title)}`;
    renderDraftSummary();
  });

  const addBtn=$('#addProductBtn');
  const addHelp=$('#addProductHelp');
  const nextNo=draftConfig.products.length+1;
  if(addBtn)addBtn.textContent='+ Ajouter un produit';
  if(addHelp)addHelp.textContent=`Le prochain sera Produit n°${nextNo}, avec ses propres échantillons et ses 5 questions.`;
  renderDraftSummary();
}
function addProduct(){
  syncTopDraft();
  const i=draftConfig.products.length;
  draftConfig.products.push({
    id:uid('p'),
    code:String(i+1).padStart(2,'0'),
    name:'',
    color:PALETTE[i%PALETTE.length],
    criteria:defaultCriteria(),
    samples:samplesForAddedProduct()
  });
  renderProductConfigs();
  renderDraftSummary();
  requestAnimationFrame(()=>{
    const cards=document.querySelectorAll('#productsConfig .product-config');
    const last=cards[cards.length-1];
    if(last)last.scrollIntoView({behavior:'smooth',block:'nearest'});
  });
}
function showBlankLotEntry(){
  const box=$('#blankLotEntry'),input=$('#blankLotName'),btn=$('#blankTestBtn');
  if(!box)return;
  box.hidden=false;
  if(btn){
    btn.classList.add('clicked');
    btn.textContent='✓ JURY VIERGE SÉLECTIONNÉ';
  }
  setTimeout(()=>input?.focus(),60);
}
function makeBlankDraft(lotName=''){
  const cleanName=String(lotName||'').trim();
  if(!cleanName){
    alert('Tapez d’abord le nom ou le numéro du lot.');
    $('#blankLotName')?.focus();
    return;
  }
  pendingMarketLot='';
  draftConfig=freshNewJuryDraft();
  draftConfig.lotName=cleanName;
  renderConfig();
  keepOnlyCreationMethod('blank');
  const box=$('#blankLotEntry');
  if(box)box.hidden=true;
  toast(`Jury « ${cleanName} » prêt à compléter`);
}
function createBlankDraftFromName(){
  makeBlankDraft($('#blankLotName')?.value||'');
}
function validateDraft(){
  syncTopDraft();
  if(marketLotIsPending())return `Le lot ${$('#marketLotSelect')?.value||''} est sélectionné mais pas encore préparé. Cliquez d’abord sur « CRÉER À PARTIR DE CE LOT ». `;
  if(!draftConfig.lotName)return 'Indiquez le nom ou le numéro du lot.';
  if(!draftConfig.products.length)return 'Ajoutez au moins un produit.';

  draftConfig.products.forEach((p,i)=>{
    p.criteria=normalizeCriteria(p.criteria||draftConfig.criteria);
    p.name=(p.name||'').trim();
    p.code=(p.code||'').trim();
    p.color=p.color||PALETTE[i%PALETTE.length];
    p.samples=p.samples.map(s=>({id:String(s.id||'').trim(),supplier:String(s.supplier||'').trim()})).filter(s=>s.id||s.supplier);
  });
  if(draftConfig.products[0])draftConfig.criteria=deepClone(draftConfig.products[0].criteria);

  for(const [pi,p] of draftConfig.products.entries()){
    const missingCriterion=p.criteria.findIndex(x=>x.key==='autre'&&!String(x.custom||'').trim());
    if(missingCriterion>=0)return `Produit ${pi+1} : écrivez le critère personnalisé de la question ${missingCriterion+1}.`;
    if(!p.name)return `Indiquez le nom du produit ${pi+1}.`;
    if(!p.samples.length)return `Ajoutez au moins un échantillon pour ${p.name}.`;
    const ids=new Set();
    for(const s of p.samples){
      if(!s.id||!s.supplier)return `Complétez le numéro d’échantillon et le fournisseur pour ${p.name}.`;
      if(ids.has(s.id))return `Le numéro d’échantillon ${s.id} est en double dans ${p.name}.`;
      ids.add(s.id);
    }
  }
  return null;
}

function openConfigPreview(){
  syncTopDraft();
  const p=(draftConfig.products||[])[0]||{code:'01',name:'Produit à renseigner',color:PALETTE[0],samples:[{id:'—',supplier:''}]};
  const sample=(p.samples||[]).find(s=>String(s.id||'').trim())||(p.samples||[])[0]||{id:'—',supplier:''};
  const questions=juryQuestions(draftConfig,p);
  const lotName=String(draftConfig.lotName||'Nouveau jury').trim();
  const subtitle=String(draftConfig.subtitle||'').trim();

  const questionHtml=questions.map((q,qi)=>{
    const opts=criterionQuickOptions(qi,p,q);
    const tags=[...opts.positive.slice(0,3),...opts.negative.slice(0,4)];
    const scale=q.weights.map((w,idx)=>`
      <div class="config-preview-choice">
        <strong>${escapeHtml(fmt(w))}</strong>
        <span>${escapeHtml(q.labels[idx]||'')}</span>
      </div>`).join('');
    return `
      <section class="config-preview-question">
        <div class="config-preview-qhead">
          <div class="config-preview-qnum">${qi+1}</div>
          <div class="config-preview-qtitle">${escapeHtml(q.title)}</div>
          <div class="config-preview-qmax">/${qi===4?25:10} pts</div>
        </div>
        <div class="config-preview-scale ${q.weights.length===6?'six':''}">${scale}</div>
        <div class="config-preview-remark">Remarque — Facultatif…</div>
        <div class="config-preview-tags">${tags.map(tag=>`<span class="config-preview-tag">${escapeHtml(tag)}</span>`).join('')}</div>
      </section>`;
  }).join('');

  $('#configPreviewBody').innerHTML=`
    <div class="config-preview-blind">👁️ Test à l’aveugle · fournisseur non affiché</div>
    <div class="config-preview-sample" style="background:linear-gradient(135deg,${shade(p.color||PALETTE[0],-18)},${shade(p.color||PALETTE[0],12)})">
      <small>${escapeHtml(lotName)}${subtitle?` · ${escapeHtml(subtitle)}`:''}</small>
      <h2>Échantillon ${escapeHtml(String(sample.id||'—'))}</h2>
      <div class="preview-product">${escapeHtml(p.name||'Produit à renseigner')}</div>
    </div>
    ${questionHtml}
  `;
  $('#configPreviewModal').classList.add('show');
}
function closeConfigPreview(){
  $('#configPreviewModal').classList.remove('show');
}

function applyDraft(){
  syncTopDraft();

  const requestedTesterCount=Math.max(1,Math.min(20,parseInt($('#cfgTesterCount')?.value,10)||1));
  draftConfig.testerCount=requestedTesterCount;

  while(draftConfig.testerNames.length<requestedTesterCount){
    draftConfig.testerNames.push(`Testeur ${draftConfig.testerNames.length+1}`);
  }
  draftConfig.testerNames=draftConfig.testerNames.slice(0,requestedTesterCount);

  const err=validateDraft();
  if(err){alert(err);return}

  const oldTesters=deepClone(state.testers||{});
  const allowed=validKeys(draftConfig);

  const savedConfig=deepClone(draftConfig);
  savedConfig.testerCount=requestedTesterCount;
  savedConfig.testerNames=savedConfig.testerNames.slice(0,requestedTesterCount);
  savedConfig._preparedId=savedConfig._preparedId||uid('prepared');
  savedConfig._preparedAt=savedConfig._preparedAt||new Date().toISOString();

  // V55 : on reconstruit le jury à partir de la composition choisie.
  const newState=makeInitialState(savedConfig);

  for(let i=1;i<=requestedTesterCount;i++){
    const old=oldTesters[i]||{answers:{}};
    const answers={};
    Object.entries(old.answers||{}).forEach(([k,v])=>{
      if(allowed.has(k))answers[k]=v;
    });
    newState.testers[i].name=savedConfig.testerNames[i-1]||`Testeur ${i}`;
    newState.testers[i].answers=answers;
    newState.testers[i].validatedAt=null;
  }

  state=newState;

  // Double écriture locale volontaire : évite qu'un ancien nombre reste affiché.
  saveState();
  upsertPreparedJury(state);
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(e){}

  const savedCount=Number(state.config?.testerCount||0);
  if(savedCount!==requestedTesterCount){
    alert(`La modification du nombre de testeurs n’a pas pu être enregistrée correctement (${savedCount} au lieu de ${requestedTesterCount}).`);
    return;
  }

  currentTester=1;
  currentProduct=state.config.products[0].id;
  currentSample=state.config.products[0].samples[0].id;
  adminProduct=currentProduct;

  const phonesReady=phoneSharePrepared(state.config);

  if(!phonesReady){
    /* Le jury est bien enregistré, mais on ne renvoie pas l'utilisateur
       à l'accueil avec un jury impossible à lancer sans explication. */
    draftConfig=deepClone(state.config);
    renderConfig();

    setTimeout(()=>{
      alert(
        `Jury enregistré avec ${requestedTesterCount} testeur${requestedTesterCount>1?'s':''}.\n\n`+
        `Attention : les téléphones et les QR codes ne sont plus à jour.\n`+
        `Préparez maintenant les téléphones à l’étape 5 avant de revenir à l’accueil.`
      );
      $('#configPhonesStep')?.scrollIntoView({behavior:'smooth',block:'center'});
    },80);

    toast('Jury enregistré — téléphones à mettre à jour');
    return;
  }

  renderHome();
  toast(`Jury enregistré avec ${requestedTesterCount} testeur${requestedTesterCount>1?'s':''} ✓`);
}

function startTesterPreview(){
  if(!state?.config?.products?.length || !totalSamples()){
    alert('Il faut au moins un produit et un échantillon pour tester le mode testeur.');
    return;
  }
  if(testerPreviewMode)return;

  testerPreviewBackup=deepClone(state);
  testerPreviewWasGuestMode=document.body.classList.contains('guest-mode');
  testerPreviewMode=true;

  /* Copie jetable : les essais ne modifient jamais le vrai jury. */
  state=deepClone(testerPreviewBackup);
  if(state.testers?.[1]){
    state.testers[1].answers={};
    state.testers[1].validatedAt=null;
  }

  document.body.classList.add('tester-preview-mode','guest-mode');

  currentTester=1;
  currentProduct=state.config.products[0]?.id||'';
  currentSample=state.config.products[0]?.samples?.[0]?.id||'';

  openTester(1);
  $('#headerTitle').textContent='Testeur 1';
  $('#headerSub').textContent='Aperçu du mode testeur';
  toast('Mode essai testeur — aucune réponse ne sera enregistrée');
}

function exitTesterPreview(){
  if(!testerPreviewMode){
    renderJuryView();
    return;
  }

  if(testerPreviewBackup)state=deepClone(testerPreviewBackup);

  testerPreviewMode=false;
  testerPreviewBackup=null;
  document.body.classList.remove('tester-preview-mode');

  if(!testerPreviewWasGuestMode)document.body.classList.remove('guest-mode');
  testerPreviewWasGuestMode=false;

  currentTester=1;
  currentProduct=state.config.products?.[0]?.id||'';
  currentSample=state.config.products?.[0]?.samples?.[0]?.id||'';
  adminProduct=currentProduct;

  renderJuryView();
  toast('Retour au mode propriétaire');
}

function openTester(i){
  currentTester=i;
  /* V161 — le verrou est contrôlé AVANT l’accès aux produits et aux questions. */
  if(testerMustWaitForLaunch()){
    currentProduct=state.config.products?.[0]?.id||'';
    currentSample=state.config.products?.[0]?.samples?.[0]?.id||'';
    renderTesterWaitingForLaunch();
    $('#headerTitle').textContent=state.testers[i]?.name||`Testeur ${i}`;
    $('#headerSub').textContent='Accès verrouillé · jury non lancé';
    return
  }
  if(!state.config.products.length||!totalSamples()){alert('Paramétrez d’abord au moins un produit et un échantillon.');return}
  currentProduct=state.config.products[0].id;
  currentSample=state.config.products[0].samples[0].id;
  renderTesterSelectors();renderSample();showView('testerView');
  $('#headerTitle').textContent=state.testers[i]?.name||`Testeur ${i}`;
  $('#headerSub').textContent=state.config.lotName
}
function renderTesterSelectors(){const ts=$('#testerSelect');ts.innerHTML='';for(let i=1;i<=state.config.testerCount;i++){const o=document.createElement('option');o.value=i;o.textContent=state.testers[i]?.name||`Testeur ${i}`;ts.appendChild(o)}ts.value=currentTester;const ps=$('#productSelect');ps.innerHTML=state.config.products.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');ps.value=currentProduct;syncSampleSelector()}
function syncSampleSelector(){const p=getProduct(currentProduct);const ss=$('#sampleSelect');ss.innerHTML=(p?.samples||[]).map(s=>`<option value="${escapeHtml(s.id)}">Échantillon ${escapeHtml(s.id)}</option>`).join('');ss.value=currentSample}

function canPassToNextTester(){
  // Sur un téléphone testeur sécurisé, on ne doit jamais pouvoir ouvrir un autre testeur.
  return !(testerPreviewMode || guestTester || cloudRole==='tester');
}
function nextTesterNumber(){
  if(!canPassToNextTester())return null;
  const n=Math.max(1,Number(state?.config?.testerCount||1));
  return currentTester<n?currentTester+1:null;
}
function passToNextTester(){
  const next=nextTesterNumber();
  if(!next){renderHome();return}
  openTester(next);
  setTimeout(()=>toast(`${state.testers[next]?.name||`Testeur ${next}`} — prêt à commencer ✓`),120);
}


function testerYouthFace(idx,total){
  if(total!==7)return '';
  const faces=['😣','🙁','😕','🙂','😕','🙁','😣'];
  return faces[idx]||'🙂';
}
function testerYouthJarClass(idx,total){
  if(total!==7)return '';
  return [' jar-left',' jar-left-mid',' jar-near',' jar-center',' jar-right-near',' jar-right-mid',' jar-right'][idx]||'';
}
function updateTesterYouthUI(a){
  const welcome=$('#testerYouthWelcome');
  if(welcome)welcome.style.display='';

  const name=state.testers?.[currentTester]?.name||`Testeur ${currentTester}`;
  const nameNode=$('#testerYouthName');
  if(nameNode)nameNode.textContent=name;
  const avatar=$('#testerAvatar');
  if(avatar)avatar.textContent=`T${currentTester}`;

  const total=QUESTIONS.length||1;
  const done=(a?.choices||[]).filter(v=>v!==null&&v!==undefined).length;
  const count=$('#testerYouthProgressCount');
  const fill=$('#testerYouthProgressFill');
  const label=$('#testerYouthProgressText');

  if(count)count.textContent=`${done}/${total}`;
  if(fill)fill.style.width=`${Math.round(done/total*100)}%`;
  if(label)label.textContent=done===total?'Tout est rempli ✓':'Questions complétées';
}

function renderSample(){if(testerMustWaitForLaunch()){renderTesterWaitingForLaunch();return}stopTesterLaunchWait();if(isJuryClosed()){showView('testerView');const ci=juryCloseInfo();$('#testerSelect').value=currentTester;$('#testerSelect').disabled=!!guestTester;$('#productSelect').disabled=true;$('#sampleSelect').disabled=true;$('#sampleHero').style.display='none';$('#questions').style.display='none';$('.sample-actions').style.display='none';const vp=$('#validationPanel');vp.className='panel tester-closed-screen';vp.innerHTML=`<div class="lock">🔒</div><h2>Jury clôturé</h2><p>La session de dégustation est terminée. Vos réponses ont été enregistrées et sont définitivement verrouillées. Pour toute correction, adressez-vous au responsable du jury avant la clôture administrative.</p><span class="date">Fermé le ${escapeHtml(fmtCloseDate(ci.closedAt))}</span>`;return}else{$('#sampleHero').style.display='flex';$('#questions').style.display='grid';$('.sample-actions').style.display='flex';$('#productSelect').disabled=false;$('#sampleSelect').disabled=false;}const p=getProduct(currentProduct);if(!p)return;const sample=p.samples.find(s=>String(s.id)===String(currentSample))||p.samples[0];currentSample=sample.id;const a=ensureAnswer(currentTester,p.id,currentSample);updateTesterYouthUI(a);const locked=testerValidated(currentTester);$('#testerSelect').value=currentTester;$('#productSelect').value=currentProduct;syncSampleSelector();$('#sampleSelect').value=currentSample;const hero=$('#sampleHero');hero.style.background=`linear-gradient(135deg,${shade(p.color,-18)},${shade(p.color,12)})`;$('#productCode').textContent=p.name;$('#sampleTitle').textContent=`Échantillon ${currentSample}`;$('#sampleScore').textContent=fmt(calcScore(a));const qbox=$('#questions');qbox.innerHTML='';const activeQuestions=juryQuestions(state.config,p);activeQuestions.forEach((q,qi)=>{const card=document.createElement('article');card.className='panel question-card';card.dataset.question=qi;card.innerHTML=`<div class="q-head"><div class="q-num">${qi+1}</div><div class="q-title">${escapeHtml(q.title)}</div><div class="q-score">${a.choices[qi]==null?'—':fmt(q.weights[a.choices[qi]])} pt</div></div><div class="scale ${q.weights.length===6?'six':''}"></div><div class="remarks"><label>Remarque</label><textarea placeholder="Facultatif…">${escapeHtml(a.remarks[qi]||'')}</textarea></div><div class="criterion-quick"><div class="criterion-quick-title">Commentaires rapides pour ce critère</div><div class="criterion-quick-buttons"></div><div class="criterion-quick-help">Un clic ajoute le texte dans « Remarque ». Un second clic le retire.</div></div>`;const scale=card.querySelector('.scale');q.weights.forEach((w,idx)=>{const b=document.createElement('button');b.type='button';const face=testerYouthFace(idx,q.weights.length);b.className='choice'+testerYouthJarClass(idx,q.weights.length)+(a.choices[qi]===idx?' selected':'');b.innerHTML=`${face?`<div class="youth-face">${face}</div>`:''}<div class="pts">${fmt(w)}</div><div class="lbl">${escapeHtml(q.labels[idx]||'')}</div>`;b.disabled=locked;b.onclick=()=>{if(locked)return;a.choices[qi]=idx;saveState();renderSample()};scale.appendChild(b)});const ta=card.querySelector('textarea');ta.disabled=locked;ta.oninput=e=>{
  if(locked)return;
  a.remarks[qi]=e.target.value;
  const currentText=String(e.target.value||'').toLocaleLowerCase('fr');
  const kept=getQuickTags(a,qi).filter(tag=>currentText.includes(String(tag).toLocaleLowerCase('fr')));
  setCriterionQuickTags(a,qi,kept);
  saveState()
};
const qopts=criterionQuickOptions(qi,p,q),selectedQ=getQuickTags(a,qi),qquick=card.querySelector('.criterion-quick-buttons');
[...qopts.positive.map(tag=>({tag,kind:'positive'})),...qopts.negative.map(tag=>({tag,kind:'negative'}))].forEach(item=>{
  const qb=document.createElement('button');qb.type='button';qb.className='criterion-quick-btn';
  if(selectedQ.includes(item.tag))qb.classList.add(item.kind==='positive'?'selected-positive':'selected-negative');
  qb.textContent=item.tag;qb.disabled=locked;
  qb.onclick=()=>{if(locked)return;toggleCriterionQuickTag(a,qi,item.tag);saveState();renderSample()};
  qquick.appendChild(qb)
});
if(locked)card.classList.add('locked');qbox.appendChild(card)});
  const totalDone=testerCompleted(currentTester),totalAll=totalSamples();const vp=$('#validationPanel');if(locked){
  vp.className='panel validation-panel locked';
  vp.innerHTML=`<div class="validation-copy"><div class="validation-icon">🔒</div><div><strong>Test validé et verrouillé</strong><p>Vos ${totalAll} fiches sont enregistrées. Les notes ne peuvent plus être modifiées.</p><div class="locked-note">Validé le ${escapeHtml(formatValidationDate(state.testers[currentTester].validatedAt))}</div></div></div><button class="btn btn-primary" id="validatedOkBtn">OK</button>`;
  $('#validatedOkBtn').onclick=()=>{
    if(testerPreviewMode){
      exitTesterPreview();
      return;
    }
    renderHome();
    setTimeout(()=>toast('Test validé ✓ — retour à l’accueil'),120);
  };
}else if(totalAll>0&&totalDone===totalAll){vp.className='panel validation-panel ready';vp.innerHTML=`<div class="validation-copy"><div class="validation-icon">✓</div><div><strong>Test terminé</strong><p>Tout est complété.</p></div></div><button class="btn btn-primary" id="validateMyTestBtn">✓ Valider ce test</button>`;$('#validateMyTestBtn').onclick=()=>validateTesterFinal(currentTester)}else{vp.className='panel validation-panel';vp.innerHTML=`<div class="validation-copy"><div class="validation-icon">…</div><div><strong>Test en cours</strong><p>${totalDone}/${totalAll} échantillons complets. Le bouton de validation apparaîtra lorsque tout sera noté.</p></div></div>`}const done=complete(a);$('#completionStatus').className='status-chip'+(done?' done':'');$('#completionStatus').textContent=done?'Échantillon complet ✓':`À compléter — ${a.choices.filter(x=>x!=null).length}/${QUESTIONS.length} réponses`;const flat=flatSamples();const pos=flat.findIndex(x=>x.pid===currentProduct&&String(x.sid)===String(currentSample));$('#prevSample').disabled=pos<=0;
const nextTester=nextTesterNumber();
if(pos===flat.length-1){
  if(testerValidated(currentTester)){
    $('#nextSample').textContent='OK';
  }else if(totalAll>0&&totalDone===totalAll){
    $('#nextSample').textContent='✓ Valider ce test';
  }else{
    $('#nextSample').textContent='Terminer le test';
  }
}else{
  $('#nextSample').textContent='Suivant →';
}
}
function shade(hex,percent){const n=parseInt(hex.replace('#',''),16),amt=Math.round(2.55*percent),R=(n>>16)+amt,G=(n>>8&0x00FF)+amt,B=(n&0x0000FF)+amt;return '#'+(0x1000000+(R<255?(R<1?0:R):255)*0x10000+(G<255?(G<1?0:G):255)*0x100+(B<255?(B<1?0:B):255)).toString(16).slice(1)}
function flatSamples(){return state.config.products.flatMap(p=>p.samples.map(s=>({pid:p.id,sid:s.id})))}
function currentFlatIndex(){return flatSamples().findIndex(x=>x.pid===currentProduct&&String(x.sid)===String(currentSample))}
function validateCurrentSample(){const p=getProduct(currentProduct);if(!p)return true;const a=ensureAnswer(currentTester,p.id,currentSample);if(complete(a))return true;const missing=[];a.choices.forEach((v,i)=>{if(v==null)missing.push(i)});document.querySelectorAll('.question-card').forEach(c=>c.classList.remove('missing'));missing.forEach(i=>document.querySelector(`.question-card[data-question="${i}"]`)?.classList.add('missing'));$('#completionStatus').className='status-chip error';$('#completionStatus').textContent=`Impossible de continuer — ${a.choices.filter(x=>x!=null).length}/${QUESTIONS.length} réponses`;const first=document.querySelector(`.question-card[data-question="${missing[0]}"]`);setTimeout(()=>first?.scrollIntoView({behavior:'smooth',block:'center'}),50);alert(`Il manque ${missing.length} réponse${missing.length>1?'s':''}. Vous devez noter les ${QUESTIONS.length} critères avant de continuer.`);return false}

function scrollTesterToFirstQuestion(){
  requestAnimationFrame(()=>{
    setTimeout(()=>{
      const first=document.querySelector('#questions .question-card[data-question="0"]');
      if(first)first.scrollIntoView({behavior:'smooth',block:'start'});
    },40);
  });
}

function goToSample(pid,sid,{allowBackward=true}={}){
  const flat=flatSamples();
  const from=currentFlatIndex();
  const to=flat.findIndex(x=>x.pid===pid&&String(x.sid)===String(sid));
  if(to<0)return false;
  if(to>from&&!validateCurrentSample())return false;
  if(to<from&&!allowBackward&&!validateCurrentSample())return false;

  currentProduct=pid;
  currentSample=sid;
  renderTesterSelectors();
  renderSample();
  scrollTesterToFirstQuestion();
  return true;
}
function moveSample(delta){
  const flat=flatSamples();
  let i=currentFlatIndex();
  if(i<0||!flat.length)return;
  if(delta>0&&!validateCurrentSample())return;

  if(delta>0&&i===flat.length-1){
    const remaining=flat.length-testerCompleted(currentTester);

    if(remaining===0&&!testerValidated(currentTester)){
      /* V131 : plus d'étape intermédiaire "Terminer → Accueil".
         Le dernier bouton valide directement le test. */
      validateTesterFinal(currentTester);
      return;
    }

    if(testerValidated(currentTester)){
      renderHome();
      setTimeout(()=>toast('Test validé ✓ — retour à l’accueil'),120);
      return;
    }

    // S'il reste des fiches incomplètes, on revient directement à la première à compléter.
    const miss=firstIncompleteSample(currentTester);
    if(miss){
      currentProduct=miss.pid;
      currentSample=miss.sid;
      renderTesterSelectors();
      renderSample();
      scrollTesterToFirstQuestion();
      setTimeout(()=>toast(`${remaining} échantillon${remaining>1?'s':''} encore à compléter`),120);
      return;
    }

    renderHome();
    return;
  }

  i=Math.max(0,Math.min(flat.length-1,i+delta));
  currentProduct=flat[i].pid;
  currentSample=flat[i].sid;
  renderTesterSelectors();
  renderSample();
  scrollTesterToFirstQuestion();
}
function renderAdmin(){
  showView('adminView');
  $('#headerTitle').textContent=`Résultats — ${state.config.lotName}`;
  $('#headerSub').textContent='Administration des tests culinaires';
  const total=totalSamples(),done=totalCompleted(),max=state.config.testerCount*total;
  const finished=Array.from({length:state.config.testerCount},(_,i)=>i+1).filter(t=>testerCompleted(t)===total).length;
  const allComplete=max>0&&done===max;const validated=validatedCount();const completeSession=allComplete&&validated===state.config.testerCount;
  $('#resultsLotTitle').textContent=state.config.lotName||'Résultats du jury';
  $('#resultsLotSubtitle').textContent=state.config.subtitle||`${state.config.products.length} produit(s) · ${total} échantillon(s) · ${state.config.testerCount} testeur(s)`;
  const closed=isJuryClosed();
  $('#resultsStatusCard').classList.toggle('final',completeSession&&!closed);$('#resultsStatusCard').classList.toggle('closed',closed);
  $('#resultsStatusIcon').textContent=closed?'🔒':completeSession?'✓':'⏳';
  $('#resultsStatusTitle').textContent=closed?'Jury fermé — résultats définitifs':completeSession?'Jury terminé — prêt à fermer':allComplete?'Dégustations complètes — validations en attente':'Résultats provisoires';
  $('#resultsStatusDetail').textContent=closed?`Fermé le ${fmtCloseDate(juryCloseInfo().closedAt)} · les accès testeurs sont bloqués.`:completeSession?`${validated}/${state.config.testerCount} testeurs ont validé. Vous pouvez fermer officiellement le jury.`:allComplete?`${validated}/${state.config.testerCount} validations définitives reçues.`:`${finished}/${state.config.testerCount} testeurs ont complété leurs fiches · ${done}/${max||0} fiches complètes.`;
  $('#resultsNote').classList.toggle('final',completeSession);
  $('#resultsNote').textContent=closed?'Le jury est fermé : aucune note ne peut plus être modifiée. Complétez la fiche de clôture, générez le rapport final puis archivez le dossier.':completeSession?'Toutes les fiches sont complètes et validées. Fermez officiellement le jury pour verrouiller définitivement les accès testeurs.':allComplete?'Toutes les dégustations sont complètes, mais les résultats restent provisoires jusqu’à la validation définitive de chaque testeur.':'Les classements restent provisoires tant que tous les testeurs n’ont pas terminé. Une fiche incomplète n’entre pas dans les moyennes.';
  const closeBtn=$('#resultsCloseJuryBtn');if(closeBtn){closeBtn.disabled=!completeSession||closed;closeBtn.textContent=closed?'🔒 Jury fermé':'🔒 Fermer le jury';closeBtn.title=closed?`Fermé le ${fmtCloseDate(juryCloseInfo().closedAt)}`:completeSession?'Bloquer définitivement les accès testeurs':'Tous les testeurs doivent valider avant la fermeture';}
const rb=$('#reportBtn');if(rb){rb.textContent=completeSession?'📄 Rapport final':'📄 Rapport provisoire';rb.title=completeSession?'Générer le rapport final imprimable / PDF':'Générer un aperçu provisoire du rapport';}const mb=$('#minutesBtn');if(mb){const pvFinal=isJuryClosed()&&closureIsReady();mb.textContent=pvFinal?'📝 PV final':'📝 Projet de PV';mb.title=pvFinal?'Générer le procès-verbal final du jury':'Générer un projet de procès-verbal';}const db=$('#dossierBtn');if(db){const dFinal=isJuryClosed()&&closureIsReady()&&validated===state.config.testerCount;db.textContent=dFinal?'📚 Dossier final':'📚 Dossier provisoire';db.title=dFinal?'Générer le dossier complet final du jury':'Générer un dossier complet provisoire';}const sb=$('#summaryBtn');if(sb){const sFinal=isJuryClosed()&&closureIsReady()&&validated===state.config.testerCount;sb.textContent=sFinal?'📋 Synthèse finale':'📋 Synthèse jury';sb.title='Ouvrir une synthèse courte imprimable, avec option anonymisée';}const cb=$('#closureBtn');if(cb){cb.textContent=closureIsReady()?'✍️ Clôture renseignée ✓':'✍️ Fiche de clôture';cb.title=closureIsReady()?'Ouvrir ou modifier la fiche de clôture':'Renseigner date, lieu, participants et signatures';}const resetBtn=$('#resetAnswersBtn');if(resetBtn){resetBtn.style.display=closed?'none':'';}
  $('#adminKpis').innerHTML=`<div class="panel kpi"><small>Fiches terminées</small><strong>${done}</strong><span>sur ${max}</span></div><div class="panel kpi"><small>Tests validés</small><strong>${validated}</strong><span>sur ${state.config.testerCount}</span></div><div class="panel kpi"><small>Échantillons</small><strong>${total}</strong><span>${state.config.products.length} produit(s)</span></div><div class="panel kpi"><small>Avancement</small><strong>${max?Math.round(done/max*100):0} %</strong><span>${completeSession?'jury complet':'en cours'}</span></div>`;
  const tabs=$('#adminTabs');
  tabs.innerHTML=state.config.products.map(p=>`<button class="tab-btn ${adminProduct===p.id?'active':''}" data-id="${p.id}">${escapeHtml(p.name)}</button>`).join('')+`<button class="tab-btn ${adminProduct==='overall'?'active':''}" data-id="overall">Vue globale</button>`;
  tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{adminProduct=b.dataset.id;selectedAdminSample='';renderAdmin()});
  renderResultsWorkflow();renderRanking();renderProgress();renderOverall();renderQuickCommentsSummary();renderRemarks();syncSimpleResultsActions();loadReportNoteIntoForm();renderProductSheetStatus();
}
function sampleStats(p,s){
  let total=0,count=0,quickCommentCount=0,manualRemarkCount=0;
  const criterionTotals=Array(QUESTIONS.length).fill(0),criterionCounts=Array(QUESTIONS.length).fill(0);
  for(let t=1;t<=state.config.testerCount;t++){
    const a=state.testers[t]?.answers[sampleKey(p.id,s.id)];
    if(!a)continue;
    manualRemarkCount+=Array.from({length:QUESTIONS.length},(_,qi)=>manualRemarkText(a,qi)).filter(Boolean).length;
    quickCommentCount+=getQuickTags(a).length;
    if(!complete(a))continue;
    total+=calcScore(a);count++;
    QUESTIONS.forEach((q,qi)=>{const idx=a.choices?.[qi];if(idx!=null){criterionTotals[qi]+=q.weights[idx];criterionCounts[qi]++}});
  }
  const criterionAvg=criterionTotals.map((v,i)=>criterionCounts[i]?v/criterionCounts[i]:0);
  return{total,count,avg:count?total/count:0,criterionAvg,quickCommentCount,manualRemarkCount};
}
function renderRanking(){
  const box=$('#rankingCards');box.innerHTML='';
  if(adminProduct==='overall'){
    $('#rankingTitle').textContent='Classement global fournisseurs';
    const rows=overallRanking();
    if(!rows.length){box.innerHTML='<div class="results-empty">Aucun résultat disponible.</div>';renderSampleDetail(null,null);return}
    ensureOccenaSupplierScoreStyleV311();
    rows.forEach((r,i)=>box.insertAdjacentHTML('beforeend',`<div class="rank-card"><div class="rank-badge">${i+1}</div><div class="rank-main"><strong>${escapeHtml(r.supplier)}</strong><span>${r.samples} échantillon(s) · ${r.count} évaluation(s) complète(s)</span><div class="rank-progress"><i style="width:${Math.max(0,Math.min(100,r.avg/65*100))}%"></i></div></div><div class="rank-score"><strong>${r.count?fmt(supplierGlobalNote5(r.avg)):'—'}</strong><span>moy. /5</span></div>${occenaSupplierInlineHtmlV311(r.supplier)}</div>`));
    bindOccenaSupplierScoresV311(box);
    renderSampleDetail(null,null);return;
  }
  const p=getProduct(adminProduct)||state.config.products[0];if(!p)return;
  $('#rankingTitle').textContent=`Classement — ${p.name}`;
  const rows=p.samples.map(s=>({sampleObj:s,sample:s.id,supplier:s.supplier,...sampleStats(p,s)})).sort((a,b)=>b.avg-a.avg||b.count-a.count||String(a.sample).localeCompare(String(b.sample),undefined,{numeric:true}));
  if(!selectedAdminSample&&rows.length)selectedAdminSample=String(rows[0].sample);
  rows.forEach((r,i)=>{
    const selected=String(r.sample)===String(selectedAdminSample);
    box.insertAdjacentHTML('beforeend',`<button class="rank-card ${selected?'selected':''}" data-sample="${escapeHtml(String(r.sample))}"><div class="rank-badge">${i+1}</div><div class="rank-main"><strong>Échantillon ${escapeHtml(r.sample)} · ${escapeHtml(r.supplier||'—')}</strong><span>${r.count}/${state.config.testerCount} testeurs · total jury ${fmt(r.total)} pt</span><div class="rank-progress"><i style="width:${Math.max(0,Math.min(100,r.avg/65*100))}%"></i></div></div><div class="rank-score"><strong>${r.count?fmt(r.avg):'—'}</strong><span>moy. /65</span></div></button>`);
  });
  box.querySelectorAll('[data-sample]').forEach(b=>b.onclick=()=>{selectedAdminSample=b.dataset.sample;renderRanking();renderSampleDetail(p,p.samples.find(s=>String(s.id)===String(selectedAdminSample)));});
  renderSampleDetail(p,p.samples.find(s=>String(s.id)===String(selectedAdminSample))||p.samples[0]);
}
function renderSampleDetail(p,s){
  const box=$('#sampleDetail');if(!box)return;
  if(!p||!s){box.innerHTML='<div class="sample-detail-empty">Sélectionnez un produit pour afficher le détail d’un échantillon.</div>';return}
  const st=sampleStats(p,s);const maxes=QUESTIONS.map(q=>Math.max(...q.weights));
  box.innerHTML=`<div class="sample-detail-top"><div><div class="tag">${escapeHtml(p.name)}</div><h4>Échantillon ${escapeHtml(s.id)}</h4><p>Fournisseur : <strong>${escapeHtml(s.supplier||'—')}</strong></p></div><div class="detail-score"><strong>${st.count?fmt(st.avg):'—'}</strong><span>moyenne /65</span></div></div><div class="criteria-list">${QUESTIONS.map((q,i)=>{const avg=st.criterionAvg[i]||0,max=maxes[i]||1;return `<div class="criterion-row"><span>${criterionShortsForConfig(state.config,p)[i]||`Critère ${i+1}`}</span><div class="criterion-track"><i style="width:${Math.max(0,Math.min(100,avg/max*100))}%"></i></div><strong>${st.count?`${fmt(avg)}/${fmt(max)}`:'—'}</strong></div>`}).join('')}</div><div class="sample-quick-summary"><h5>Commentaires rapides</h5><div class="quick-summary">${(()=>{const qs=sampleQuickTagStats(p,s);return qs.length?qs.slice(0,10).map(x=>`<span class="quick-summary-chip">${escapeHtml(x.tag)} <strong>${x.count}</strong></span>`).join(''):'<span class="quick-summary-empty">Aucun commentaire rapide pour cet échantillon.</span>'})()}</div></div><div class="detail-meta"><div class="detail-mini"><strong>${st.count}/${state.config.testerCount}</strong><span>testeurs pris en compte</span></div><div class="detail-mini"><strong>${fmt(st.total)}</strong><span>total des points</span></div><div class="detail-mini"><strong>${st.quickCommentCount}</strong><span>commentaires rapides</span></div></div>`;
}
function renderProgress(){
  const box=$('#testerProgressBars');box.innerHTML='';const total=totalSamples();
  for(let t=1;t<=state.config.testerCount;t++){const d=testerCompleted(t),pct=total?d/total*100:0,valid=testerValidated(t);box.insertAdjacentHTML('beforeend',`<div class="compact-progress-row"><span>${escapeHtml(state.testers[t]?.name||`Testeur ${t}`)}${valid?' <span class="validation-mark">✓ validé</span>':''}</span><div class="bar"><span style="width:${pct}%"></span></div><strong>${d}/${total}</strong></div>`)}
}
function overallRanking(){
  const map=new Map();
  state.config.products.forEach(p=>p.samples.forEach(s=>{const r=sampleStats(p,s),k=s.supplier||'Sans fournisseur';const cur=map.get(k)||{supplier:k,total:0,count:0,samples:0};cur.total+=r.total;cur.count+=r.count;cur.samples+=1;map.set(k,cur)}));
  return [...map.values()].map(r=>({...r,avg:r.count?r.total/r.count:0})).sort((a,b)=>b.avg-a.avg||b.total-a.total||a.supplier.localeCompare(b.supplier));
}
function supplierGlobalNote5(avg65){
  return Number(avg65||0)/13;
}
function occenaSupplierKeyV311(name){
  return String(name||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
}
function occenaSupplierScoresV311(){
  if(!state.config)state.config={};
  if(!state.config.occenaControl||typeof state.config.occenaControl!=='object'){
    state.config.occenaControl={items:{},globalScore:'',updatedAt:''};
  }
  if(!state.config.occenaControl.supplierScores||typeof state.config.occenaControl.supplierScores!=='object'){
    state.config.occenaControl.supplierScores={};
  }
  return state.config.occenaControl.supplierScores;
}
function limitOccenaSupplierScoreV311(value){
  let raw=String(value??'').replace(/\s+/g,'').replace(/[^0-9,.+\-]/g,'');
  const sign=raw.startsWith('-')?'-':raw.startsWith('+')?'+':'';
  raw=raw.replace(/[+\-]/g,'');
  const m=raw.match(/^([^,.]*)([,.]?)(.*)$/);
  let left=String(m?.[1]||'').replace(/\D/g,'');
  const sep=String(m?.[2]||'');
  let right=String(m?.[3]||'').replace(/\D/g,'');
  const digits=(left+right).slice(0,5);
  const leftCount=Math.min(left.length,digits.length);
  left=digits.slice(0,leftCount);
  right=digits.slice(leftCount);
  let out=left;
  if(sep&&right)out+=sep+right;
  else if(sep&&left&&raw.endsWith(sep))out+=sep;
  if(sign&&out)out=sign+out;
  return out;
}
function occenaSupplierScoreV311(name){
  return String(occenaSupplierScoresV311()[occenaSupplierKeyV311(name)]||'');
}
function saveOccenaSupplierScoreV311(name,value,sync=false){
  const scores=occenaSupplierScoresV311();
  const key=occenaSupplierKeyV311(name);
  const clean=limitOccenaSupplierScoreV311(value);
  if(clean)scores[key]=clean;
  else delete scores[key];
  state.config.occenaControl.updatedAt=new Date().toISOString();
  saveState();
  if(sync&&typeof syncDirtyToCloud==='function'){
    Promise.resolve(syncDirtyToCloud()).catch(()=>{});
  }
  document.querySelectorAll('[data-occena-supplier-score]').forEach(el=>{
    if((el.getAttribute('data-occena-supplier-score')||'')===String(name||'')&&document.activeElement!==el){
      el.value=clean;
    }
  });
  return clean;
}
function occenaSupplierInlineHtmlV311(name){
  const value=occenaSupplierScoreV311(name);
  return `<div class="supplier-occena-v311"><span>OCCENA</span><div class="supplier-occena-entry-v312"><button type="button" data-occena-sign-v312="-" data-occena-sign-supplier-v312="${escapeHtml(name)}" aria-label="Mettre le score OCCENA en négatif">−</button><input type="text" inputmode="decimal" autocomplete="off" data-occena-supplier-score="${escapeHtml(name)}" value="${escapeHtml(value)}" placeholder="—" aria-label="Score OCCENA ${escapeHtml(name)}"><button type="button" data-occena-sign-v312="+" data-occena-sign-supplier-v312="${escapeHtml(name)}" aria-label="Mettre le score OCCENA en positif">+</button></div></div>`;
}
function setOccenaSupplierScoreDraftV313(name,value){
  const scores=occenaSupplierScoresV311();
  const key=occenaSupplierKeyV311(name);
  const clean=limitOccenaSupplierScoreV311(value);
  if(clean)scores[key]=clean;
  else delete scores[key];
  state.config.occenaControl.updatedAt=new Date().toISOString();

  /* V313 — pendant la frappe, écrire seulement l'état actif en local.
     Pas de saveState(), pas de reprise du jury, pas de rendu : le clavier garde
     le focus et Android ne remonte plus la page à chaque chiffre. */
  try{
    state.updatedAt=new Date().toISOString();
    localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  }catch(e){}
  return clean;
}
function rememberOccenaSupplierPositionV313(input){
  const row=input?.closest('.supplier-card,.rank-card');
  input.__occenaV313Y=window.scrollY||window.pageYOffset||0;
  input.__occenaV313Top=row?row.getBoundingClientRect().top:null;
}
function restoreOccenaSupplierPositionV313(input){
  if(!input)return;
  const y=Number(input.__occenaV313Y||0);
  const wanted=input.__occenaV313Top;
  const restore=()=>{
    const row=input.closest?.('.supplier-card,.rank-card');
    if(row&&wanted!==null&&wanted!==undefined){
      const now=row.getBoundingClientRect().top;
      const delta=now-wanted;
      if(Math.abs(delta)>2){window.scrollBy(0,delta);return;}
    }
    const cur=window.scrollY||window.pageYOffset||0;
    if(Math.abs(cur-y)>2)window.scrollTo(0,y);
  };
  requestAnimationFrame(restore);
  setTimeout(restore,30);
  setTimeout(restore,90);
  setTimeout(restore,180);
}
function bindOccenaSupplierScoresV311(root){
  (root||document).querySelectorAll('[data-occena-supplier-score]').forEach(input=>{
    if(input.__occenaV311Bound)return;
    input.__occenaV311Bound=true;
    input.onfocus=()=>{
      rememberOccenaSupplierPositionV313(input);
    };
    input.oninput=()=>{
      const supplier=input.getAttribute('data-occena-supplier-score')||'';
      const clean=setOccenaSupplierScoreDraftV313(supplier,input.value);
      if(input.value!==clean)input.value=clean;
      restoreOccenaSupplierPositionV313(input);
    };
    input.onchange=()=>{
      const supplier=input.getAttribute('data-occena-supplier-score')||'';
      const clean=saveOccenaSupplierScoreV311(supplier,input.value,true);
      input.value=clean;
      restoreOccenaSupplierPositionV313(input);
      toast('Score OCCENA enregistré ✓');
    };
  });
  (root||document).querySelectorAll('[data-occena-sign-v312]').forEach(btn=>{
    if(btn.__occenaSignV312Bound)return;
    btn.__occenaSignV312Bound=true;

    /* V314 — empêcher Android de déplacer la page quand on touche + / −.
       Le bouton ne prend jamais le focus : le champ OCCENA reste l'ancre active. */
    btn.onpointerdown=(e)=>{
      e.preventDefault();
      e.stopPropagation();
      const wrap=btn.closest('.supplier-occena-v311');
      const input=wrap?.querySelector('[data-occena-supplier-score]');
      if(input)rememberOccenaSupplierPositionV313(input);
    };

    btn.onclick=(e)=>{
      e.preventDefault();
      e.stopPropagation();

      const supplier=btn.getAttribute('data-occena-sign-supplier-v312')||'';
      const sign=btn.getAttribute('data-occena-sign-v312')||'';
      const wrap=btn.closest('.supplier-occena-v311');
      const input=wrap?.querySelector('[data-occena-supplier-score]');
      if(!input)return;

      rememberOccenaSupplierPositionV313(input);

      let body=String(input.value||'').replace(/^[+\-]/,'');
      let clean='';
      if(!body){
        input.value=sign;
        restoreOccenaSupplierPositionV313(input);
        try{input.focus({preventScroll:true});}catch(err){try{input.focus();}catch(_){}}
        return;
      }

      /* Pas de saveState(), pas de sync cloud ici : uniquement le brouillon local.
         La sauvegarde complète se fera quand le champ sera quitté. */
      clean=setOccenaSupplierScoreDraftV313(supplier,sign+body);

      document.querySelectorAll('[data-occena-supplier-score]').forEach(el=>{
        if((el.getAttribute('data-occena-supplier-score')||'')===supplier)el.value=clean;
      });

      try{input.focus({preventScroll:true});}catch(err){try{input.focus();}catch(_){}}
      restoreOccenaSupplierPositionV313(input);
      setTimeout(()=>restoreOccenaSupplierPositionV313(input),40);
      setTimeout(()=>restoreOccenaSupplierPositionV313(input),120);
    };
  });
}
function ensureOccenaSupplierScoreStyleV311(){
  if(document.getElementById('occenaSupplierScoreStyleV311'))return;
  const s=document.createElement('style');
  s.id='occenaSupplierScoreStyleV311';
  s.textContent='.supplier-card{align-items:center}.supplier-occena-v311{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-width:106px}.supplier-occena-v311>span{font-size:9px;font-weight:850;letter-spacing:.04em;color:#6a7d89}.supplier-occena-entry-v312{display:flex;align-items:center;gap:2px}.supplier-occena-entry-v312 button{width:24px;height:28px;padding:0;border:0;background:transparent;color:#426276;font-size:18px;font-weight:900;line-height:1;cursor:pointer;touch-action:manipulation}.supplier-occena-entry-v312 button:active{transform:scale(.92)}.supplier-occena-v311 input{width:62px;padding:3px 1px;border:0;border-bottom:1px solid #b8c8d2;border-radius:0;background:transparent;text-align:center;font-size:15px;font-weight:900;color:#173f5c;outline:none}.supplier-occena-v311 input:focus{border-bottom-color:#173f5c}.rank-card .supplier-occena-v311{margin-left:8px}@media(max-width:700px){.supplier-occena-v311{min-width:98px}.supplier-occena-entry-v312 button{width:22px;height:30px}.supplier-occena-v311 input{width:54px;font-size:14px}}';
  document.head.appendChild(s);
}
function renderOverall(){
  const b=$('#overallCards');if(!b)return;b.innerHTML='';const rows=overallRanking();
  ensureOccenaSupplierScoreStyleV311();
  if(!rows.length){b.innerHTML='<div class="results-empty">Aucun résultat disponible.</div>';return}
  rows.forEach((r,i)=>b.insertAdjacentHTML('beforeend',`<div class="supplier-card"><div class="supplier-rank">${i+1}</div><div class="supplier-main"><strong>${escapeHtml(r.supplier)}</strong><span>${r.samples} échantillon(s) · ${r.count} évaluation(s)</span></div><div class="supplier-score"><strong>${r.count?fmt(supplierGlobalNote5(r.avg)):'—'}</strong><span>moy. /5</span></div>${occenaSupplierInlineHtmlV311(r.supplier)}</div>`));
  bindOccenaSupplierScoresV311(b);
}

function collectRemarks(){
  const rows=[];
  for(let t=1;t<=state.config.testerCount;t++){
    state.config.products.forEach(p=>{
      if(adminProduct!=='overall'&&adminProduct!==p.id)return;
      p.samples.forEach(s=>{
        const a=state.testers[t]?.answers[sampleKey(p.id,s.id)];
        if(!a)return;
        for(let qi=0;qi<QUESTIONS.length;qi++){
          const txt=manualRemarkText(a,qi);
          if(!txt)continue;
          const idx=a.choices?.[qi];
          rows.push({
            tester:state.testers[t]?.name||`Testeur ${t}`,
            product:p.name,
            sample:s.id,
            supplier:s.supplier||'—',
            criterion:criterionShortsForConfig(state.config,p)[qi]||`Critère ${qi+1}`,
            score:idx==null?'—':`${fmt(QUESTIONS[qi].weights[idx])} pt`,
            remark:txt
          });
        }
      });
    });
  }
  return rows;
}
function renderQuickCommentsSummary(){
  const box=$('#quickCommentsSummary'),badge=$('#quickCommentsResultBadge');if(!box||!badge)return;
  const rows=collectQuickTagStats(),total=rows.reduce((n,x)=>n+x.count,0);
  badge.textContent=`${total} sélection${total>1?'s':''}`;
  box.innerHTML=rows.length?rows.slice(0,18).map(x=>`<span class="quick-summary-chip">${escapeHtml(x.tag)} <strong>${x.count}</strong></span>`).join(''):'<span class="quick-summary-empty">Aucun commentaire rapide dans cette vue.</span>';
}
function renderRemarks(){
  const box=$('#remarksCards');if(!box)return;const rows=collectRemarks();$('#remarksCountBadge').textContent=`${rows.length} remarque${rows.length>1?'s':''}`;box.innerHTML='';
  if(!rows.length){box.innerHTML='<div class="results-empty" style="grid-column:1/-1">Aucune remarque libre saisie pour cette vue.</div>';return}
  rows.forEach(r=>box.insertAdjacentHTML('beforeend',`<article class="remark-card"><div class="remark-card-head"><strong>${escapeHtml(r.tester)}</strong><span>${escapeHtml(r.score)}</span></div><div class="remark-context">${escapeHtml(r.product)} · Éch. ${escapeHtml(r.sample)} · ${escapeHtml(r.supplier)} · ${escapeHtml(r.criterion)}</div><div class="remark-text">${escapeHtml(r.remark)}</div></article>`));
}
function exportCsv(){
  const headers=Array.from({length:5},(_,i)=>`Q${i+1}`);
  const rows=[['Lot','Testeur','Test validé','Date validation','Produit','Échantillon','Fournisseur',...headers,'Total',...headers.map(x=>`Remarque ${x}`),'Commentaires rapides']];
  for(let t=1;t<=state.config.testerCount;t++)state.config.products.forEach(p=>p.samples.forEach(s=>{
    const a=state.testers[t]?.answers[sampleKey(p.id,s.id)];if(!a)return;
    const names=criterionShortsForConfig(state.config,p);
    const scores=a.choices.map((idx,q)=>idx==null?'':QUESTIONS[q].weights[idx]);
    const free=QUESTIONS.map((_,qi)=>manualRemarkText(a,qi));
    rows.push([state.config.lotName,state.testers[t]?.name||`Testeur ${t}`,testerValidated(t)?'Oui':'Non',state.testers[t]?.validatedAt||'',p.name,s.id,s.supplier,...scores,calcScore(a),...free,QUESTIONS.map((_,qi)=>getQuickTags(a,qi).length?`${names[qi]||`Critère ${qi+1}`}: ${getQuickTags(a,qi).join(', ')}`:'').filter(Boolean).join(' | ')])
  }));
  const csv='\ufeff'+rows.map(r=>r.map(csvCell).join(';')).join('\n');download(new Blob([csv],{type:'text/csv;charset=utf-8'}),`resultats-${slug(state.config.lotName)}.csv`);toast('CSV créé')
}

function csvCell(v){const s=String(v??'');return /[;"\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}
function slug(s){return String(s||'test-culinaire').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase()}
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
function backup(){download(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),`sauvegarde-${slug(state.config.lotName)}.json`);toast('Sauvegarde créée')}
function restore(file){const r=new FileReader();r.onload=()=>{try{const o=JSON.parse(r.result);if(!o?.config?.products||!o?.testers)throw new Error();state=o;saveState();currentTester=1;currentProduct=state.config.products[0]?.id||'';currentSample=state.config.products[0]?.samples[0]?.id||'';adminProduct=currentProduct;renderHome();toast('Sauvegarde restaurée')}catch(e){alert('Ce fichier ne correspond pas à une sauvegarde valide de cette application.')}};r.readAsText(file)}

function openProtectedResetModal(){
  if(isJuryClosed()){
    alert('Le jury est fermé. Les réponses ne peuvent plus être effacées.');
    return;
  }

  const word=$('#resetConfirmWord'),pin=$('#resetAdminPin'),pinField=$('#resetPinField'),err=$('#resetErrorMsg'),btn=$('#confirmReset');
  if(word)word.value='';
  if(pin)pin.value='';
  if(err)err.textContent='';

  const needPin=(typeof securityEnabled==='function'&&securityEnabled());
  if(pinField)pinField.style.display=needPin?'block':'none';
  if(btn)btn.disabled=true;

  $('#resetModal').classList.add('show');
  setTimeout(()=>word?.focus(),80);
}

function closeProtectedResetModal(){
  $('#resetModal').classList.remove('show');
  if($('#resetConfirmWord'))$('#resetConfirmWord').value='';
  if($('#resetAdminPin'))$('#resetAdminPin').value='';
  if($('#resetErrorMsg'))$('#resetErrorMsg').textContent='';
  if($('#confirmReset'))$('#confirmReset').disabled=true;
}

function updateProtectedResetButton(){
  const typed=String($('#resetConfirmWord')?.value||'').trim().toUpperCase();
  const needPin=(typeof securityEnabled==='function'&&securityEnabled());
  const pin=String($('#resetAdminPin')?.value||'').trim();
  const ready=typed==='EFFACER'&&(!needPin||/^\d{4,8}$/.test(pin));
  if($('#confirmReset'))$('#confirmReset').disabled=!ready;
}

async function confirmProtectedReset(){
  const err=$('#resetErrorMsg');
  if(err)err.textContent='';

  const typed=String($('#resetConfirmWord')?.value||'').trim().toUpperCase();
  if(typed!=='EFFACER'){
    if(err)err.textContent='Écrivez exactement EFFACER pour confirmer.';
    return;
  }

  if(typeof securityEnabled==='function'&&securityEnabled()){
    const pin=String($('#resetAdminPin')?.value||'').trim();
    if(!/^\d{4,8}$/.test(pin)){
      if(err)err.textContent='Saisissez votre code PIN administrateur.';
      return;
    }
    const ok=await verifyPin(pin);
    if(!ok){
      if(err)err.textContent='Code PIN incorrect. Les réponses n’ont pas été effacées.';
      $('#resetAdminPin').value='';
      $('#resetAdminPin').focus();
      updateProtectedResetButton();
      return;
    }
  }

  if($('#confirmReset')){
    $('#confirmReset').disabled=true;
    $('#confirmReset').textContent='Effacement…';
  }

  try{
    await clearAnswers();
    closeProtectedResetModal();
  }finally{
    if($('#confirmReset'))$('#confirmReset').textContent='Effacer définitivement';
  }
}

function clearAnswers(){if(isJuryClosed()){alert('Le jury est fermé. Les réponses ne peuvent plus être effacées.');closeProtectedResetModal();return}for(let t=1;t<=state.config.testerCount;t++){state.testers[t].answers={};state.testers[t].validatedAt=null}saveState();renderAdmin();toast('Réponses effacées — jury remis à zéro')}


function loadArchives(){try{const a=JSON.parse(localStorage.getItem(ARCHIVE_STORAGE_KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
function saveArchives(a){localStorage.setItem(ARCHIVE_STORAGE_KEY,JSON.stringify(a))}


function ensureClosure(st=state){
  if(!st.config.closure)st.config.closure={};
  const c=st.config.closure;
  if(!c.members||!Array.isArray(c.members)){
    c.members=Array.from({length:Number(st.config.testerCount||0)},(_,i)=>({
      testerNo:i+1,
      name:st.testers?.[i+1]?.name||st.config.testerNames?.[i]||`Testeur ${i+1}`,
      role:'',
      present:true
    }));
  }
  return c;
}
function normalizeClosureMembers(){
  const c=ensureClosure();
  const count=Number(state.config.testerCount||0);
  const old=new Map((c.members||[]).map(x=>[Number(x.testerNo),x]));
  c.members=Array.from({length:count},(_,i)=>{
    const n=i+1,prev=old.get(n)||{};
    return{
      testerNo:n,
      name:state.testers?.[n]?.name||state.config.testerNames?.[i]||`Testeur ${n}`,
      role:prev.role||'',
      present:prev.present!==false
    };
  });
  return c;
}
function closureHasUsefulData(st=state){
  const c=st?.config?.closure||{};
  return !!(c.date||c.place||c.chair||c.coSigner||c.notes||c.chairSignature||c.coSignature||(c.members||[]).some(x=>x.role||x.present===false));
}
function closureMissingFieldsFrom(c){
  const missing=[];
  if(!String(c?.date||'').trim())missing.push({key:'date',label:'Date de dégustation',id:'closureDate'});
  if(!String(c?.place||'').trim())missing.push({key:'place',label:'Lieu',id:'closurePlace'});
  if(!String(c?.chair||'').trim())missing.push({key:'chair',label:'Responsable / président du jury',id:'closureChair'});
  return missing;
}
function closureMissingFields(st=state){
  return closureMissingFieldsFrom(st?.config?.closure||{});
}
function closureIsReady(st=state){
  return closureMissingFields(st).length===0;
}
function renderClosureStatus(c=state?.config?.closure||{}){
  const missing=closureMissingFieldsFrom(c);
  const ready=missing.length===0;
  const card=$('#closureStatusCard');
  const title=$('#closureStatusTitle');
  const detail=$('#closureStatusDetail');
  const list=$('#closureMissingList');

  card?.classList.toggle('ready',ready);
  card?.classList.toggle('incomplete',!ready);

  ['closureDate','closurePlace','closureChair'].forEach(id=>{
    document.getElementById(id)?.closest('.field')?.classList.remove('closure-required-missing');
  });
  missing.forEach(x=>{
    document.getElementById(x.id)?.closest('.field')?.classList.add('closure-required-missing');
  });

  if(title)title.textContent=ready?'Fiche prête ✓':'À compléter';

  if(detail){
    if(ready){
      detail.textContent=isJuryClosed()
        ?`Jury fermé le ${fmtCloseDate(juryCloseInfo().closedAt)} · fiche prête pour le rapport et l’archive.`
        :'La fiche est complète et sera reprise dans le rapport final.';
    }else{
      detail.textContent='La fiche est enregistrée, mais il manque encore au moins un champ obligatoire.';
    }
  }

  if(list){
    list.textContent=ready
      ?'✓ Les 3 champs obligatoires sont renseignés.'
      :`Il manque : ${missing.map(x=>x.label).join(' · ')}`;
  }

  return ready;
}

function todayIsoLocal(){
  const d=new Date(),off=d.getTimezoneOffset();
  return new Date(d.getTime()-off*60000).toISOString().slice(0,10);
}
function formatClosureDate(v){
  if(!v)return '—';
  try{return new Date(`${v}T12:00:00`).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'})}catch(e){return v}
}
function renderClosure(){
  updateHeader();showView('closureView');
  $('#headerTitle').textContent='Fiche de clôture';
  $('#headerSub').textContent=state.config.lotName||'Jury Marchés';
  const c=normalizeClosureMembers();
  $('#closureLotTitle').textContent=state.config.lotName||'Fiche de clôture du jury';
  $('#closureLotSubtitle').textContent=state.config.subtitle||'Informations administratives et signatures du jury';
  $('#closureDate').value=c.date||todayIsoLocal();
  $('#closurePlace').value=c.place||'';
  $('#closureChair').value=c.chair||'';
  $('#closureChairRole').value=c.chairRole||'';
  $('#closureCoSigner').value=c.coSigner||'';
  $('#closureCoSignerRole').value=c.coSignerRole||'';
  $('#closureNotes').value=c.notes||'';
  const members=$('#closureMembers');members.innerHTML='';
  c.members.forEach((m,i)=>{
    const row=document.createElement('div');row.className='closure-member';
    row.innerHTML=`<input type="checkbox" data-cl-pres="${i}" ${m.present!==false?'checked':''}><div class="name">${escapeHtml(m.name)}</div><input type="text" data-cl-role="${i}" value="${escapeHtml(m.role||'')}" placeholder="Fonction / établissement">`;
    members.appendChild(row);
  });
  renderClosureStatus(c);
  setupSignatureCanvas('chairSignature',c.chairSignature||'');
  setupSignatureCanvas('coSignature',c.coSignature||'');
  setClosureSaveIndicator('✓ Enregistré automatiquement');
}
function captureClosureForm(){
  const c=normalizeClosureMembers();
  c.date=$('#closureDate').value||'';
  c.place=$('#closurePlace').value.trim();
  c.chair=$('#closureChair').value.trim();
  c.chairRole=$('#closureChairRole').value.trim();
  c.coSigner=$('#closureCoSigner').value.trim();
  c.coSignerRole=$('#closureCoSignerRole').value.trim();
  c.notes=$('#closureNotes').value.trim();
  c.members.forEach((m,i)=>{
    const p=document.querySelector(`[data-cl-pres="${i}"]`),r=document.querySelector(`[data-cl-role="${i}"]`);
    m.present=p?!!p.checked:true;m.role=r?r.value.trim():'';
  });
  c.chairSignature=signatureCanvasData('chairSignature');
  c.coSignature=signatureCanvasData('coSignature');
  c.updatedAt=new Date().toISOString();
  state.config.closure=c;
  return c;
}
let closureAutosaveTimer=null;
function setClosureSaveIndicator(text){
  const b=$('#saveClosureBtn');
  if(b)b.textContent=text;
}
function scheduleClosureAutosave(preserveScrollY=null){
  clearTimeout(closureAutosaveTimer);
  setClosureSaveIndicator('Enregistrement automatique…');

  const keepY=Number.isFinite(Number(preserveScrollY))?Number(preserveScrollY):null;
  const restorePosition=()=>{
    if(keepY===null)return;
    requestAnimationFrame(()=>{
      const current=window.scrollY||window.pageYOffset||0;
      if(Math.abs(current-keepY)>2)window.scrollTo(0,keepY);
    });
  };

  closureAutosaveTimer=setTimeout(async()=>{
    try{
      const c=captureClosureForm();
      saveState();
      renderClosureStatus(c);
      setClosureSaveIndicator('✓ Enregistré automatiquement');

      /* V286 — une signature ne doit jamais faire remonter la fiche.
         On remet immédiatement la page exactement à la position où la personne
         a signé, sans recharger ni rerendre la fiche. */
      restorePosition();

      if(typeof syncDirtyToCloud==='function'){
        try{await syncDirtyToCloud()}catch(e){}
      }
    }catch(e){
      console.warn('Enregistrement automatique de la clôture impossible',e);
      setClosureSaveIndicator('Enregistrer la fiche');
    }
  },keepY===null?500:40);
}

async function saveClosure(){
  const c=captureClosureForm();
  saveState();

  const ready=renderClosureStatus(c);

  if(typeof syncDirtyToCloud==='function'){
    try{await syncDirtyToCloud()}catch(e){}
  }

  setClosureSaveIndicator('✓ Enregistré automatiquement');

  if(ready){
    toast('Fiche de clôture complète et enregistrée ✓');
  }else{
    const missing=closureMissingFieldsFrom(c);
    toast(`Fiche enregistrée — il manque : ${missing.map(x=>x.label).join(', ')}`);
    const first=missing[0]?.id&&document.getElementById(missing[0].id);
    if(first){
      setTimeout(()=>{
        first.scrollIntoView({behavior:'smooth',block:'center'});
        first.focus();
      },120);
    }
  }
}
function signatureCanvasData(id){
  const canvas=document.getElementById(id);
  if(!canvas||!canvas.dataset.hasInk)return '';
  return canvas.toDataURL('image/png');
}
function setupSignatureCanvas(id,dataUrl){
  const canvas=document.getElementById(id);if(!canvas)return;
  const rect=canvas.getBoundingClientRect(),ratio=Math.max(1,window.devicePixelRatio||1);
  canvas.width=Math.max(600,Math.round(rect.width*ratio));
  canvas.height=Math.max(220,Math.round(165*ratio));
  const ctx=canvas.getContext('2d');ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=3*ratio;ctx.strokeStyle='#142f45';
  canvas.dataset.hasInk='';
  if(dataUrl){
    const img=new Image();img.onload=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);canvas.dataset.hasInk='1'};img.src=dataUrl;
  }else ctx.clearRect(0,0,canvas.width,canvas.height);
  if(canvas.dataset.bound==='1')return;
  canvas.dataset.bound='1';
  let drawing=false,last=null,signatureScrollY=0;
  const isReceptionSignature=id==='receptionSignature';
  const point=e=>{
    const r=canvas.getBoundingClientRect(),touch=e.touches?.[0]||e.changedTouches?.[0]||e;
    return{x:(touch.clientX-r.left)*(canvas.width/r.width),y:(touch.clientY-r.top)*(canvas.height/r.height)}
  };
  const start=e=>{
    e.preventDefault();
    drawing=true;
    signatureScrollY=window.scrollY||window.pageYOffset||0;
    last=point(e);
    canvas.dataset.hasInk='1';
    try{if(e.pointerId!=null)canvas.setPointerCapture(e.pointerId)}catch(err){}
  };
  const move=e=>{
    if(!drawing)return;
    e.preventDefault();
    const p=point(e);
    ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p;
  };
  const end=e=>{
    if(!drawing)return;
    e.preventDefault();
    drawing=false;last=null;
    try{if(e.pointerId!=null&&canvas.hasPointerCapture?.(e.pointerId))canvas.releasePointerCapture(e.pointerId)}catch(err){}
    if(isReceptionSignature){
      /* V240 — la signature chauffeur reste exactement à l'endroit où elle a été faite.
         On mémorise seulement l'image ; aucune clôture ni aucun rendu ne doit faire remonter la page. */
      try{
        if(receptionDraft)receptionDraft.driverSignature=signatureCanvasData('receptionSignature');
      }catch(err){}
      const y=signatureScrollY;
      requestAnimationFrame(()=>{
        if(Math.abs((window.scrollY||window.pageYOffset||0)-y)>2)window.scrollTo(0,y);
      });
      return;
    }

    /* V286 — responsable, second signataire et signatures des testeurs :
       conserver la position exacte de l'écran pendant l'enregistrement. */
    const y=signatureScrollY;
    requestAnimationFrame(()=>{
      if(Math.abs((window.scrollY||window.pageYOffset||0)-y)>2)window.scrollTo(0,y);
    });
    scheduleClosureAutosave(y);
  };
  canvas.addEventListener('pointerdown',start);
  canvas.addEventListener('pointermove',move);
  canvas.addEventListener('pointerup',end);
  canvas.addEventListener('pointercancel',end);
  if(!isReceptionSignature)canvas.addEventListener('pointerleave',end);
}
function clearSignature(id){
  const c=document.getElementById(id);if(!c)return;c.getContext('2d').clearRect(0,0,c.width,c.height);c.dataset.hasInk='';
  if(id==='receptionSignature'){
    try{if(receptionDraft)receptionDraft.driverSignature=''}catch(e){}
    return;
  }
  scheduleClosureAutosave();
}
function closureReport(){
  captureClosureForm();saveState();openCurrentReport();
}

function stateTotalSamples(st){return (st?.config?.products||[]).reduce((n,p)=>n+(p.samples||[]).length,0)}
function stateCompleteAnswer(a){return !!a&&Array.isArray(a.choices)&&a.choices.length===QUESTIONS.length&&a.choices.every(x=>x!==null&&x!==undefined)}
function stateAnswerScore(a){return (a?.choices||[]).reduce((sum,idx,q)=>sum+(idx==null?0:(QUESTIONS[q]?.weights?.[idx]||0)),0)}
function stateValidatedCount(st){let n=0;for(let t=1;t<=Number(st?.config?.testerCount||0);t++)if(st?.testers?.[t]?.validatedAt)n++;return n}
function stateCompletedCount(st){
  let n=0;
  for(let t=1;t<=Number(st?.config?.testerCount||0);t++){
    for(const p of st?.config?.products||[])for(const sm of p.samples||[]){
      const a=st?.testers?.[t]?.answers?.[`${p.id}__${sm.id}`];
      if(stateCompleteAnswer(a))n++;
    }
  }
  return n;
}
function stateSampleStats(st,p,sm){
  let total=0,count=0,remarkCount=0;
  const criterionTotals=Array(QUESTIONS.length).fill(0),criterionCounts=Array(QUESTIONS.length).fill(0);
  for(let t=1;t<=Number(st?.config?.testerCount||0);t++){
    const a=st?.testers?.[t]?.answers?.[`${p.id}__${sm.id}`];
    if(!a)continue;
    remarkCount+=(a.remarks||[]).slice(0,QUESTIONS.length).filter(x=>String(x||'').trim()).length+getQuickTags(a).length;
    if(!stateCompleteAnswer(a))continue;
    total+=stateAnswerScore(a);count++;
    QUESTIONS.forEach((q,qi)=>{
      const idx=a.choices?.[qi];
      if(idx!=null){criterionTotals[qi]+=q.weights[idx];criterionCounts[qi]++}
    });
  }
  return{
    total,count,avg:count?total/count:0,remarkCount,
    criterionAvg:criterionTotals.map((v,i)=>criterionCounts[i]?v/criterionCounts[i]:0)
  };
}
function stateSupplierRanking(st){
  const map=new Map();
  for(const p of st?.config?.products||[])for(const sm of p.samples||[]){
    const k=sm.supplier||'Sans fournisseur', ss=stateSampleStats(st,p,sm);
    const cur=map.get(k)||{supplier:k,total:0,count:0,samples:0};
    cur.total+=ss.total;cur.count+=ss.count;cur.samples++;map.set(k,cur);
  }
  return [...map.values()].map(x=>({...x,avg:x.count?x.total/x.count:0}))
    .sort((a,b)=>b.avg-a.avg||b.total-a.total||a.supplier.localeCompare(b.supplier));
}

function stateRemarks(st){
  const rows=[];
  for(let t=1;t<=Number(st?.config?.testerCount||0);t++){
    for(const p of st?.config?.products||[]){
      for(const sm of p.samples||[]){
        const a=st?.testers?.[t]?.answers?.[`${p.id}__${sm.id}`];
        if(!a)continue;
        for(let qi=0;qi<QUESTIONS.length;qi++){
          const remark=manualRemarkText(a,qi);
          if(!remark)continue;
          const idx=a.choices?.[qi];
          rows.push({
            tester:st?.testers?.[t]?.name||`Testeur ${t}`,
            product:p.name,
            sample:sm.id,
            supplier:sm.supplier||'—',
            criterion:criterionShortsForConfig(st?.config,p)[qi]||`Critère ${qi+1}`,
            score:idx==null?'—':`${fmt(QUESTIONS[qi].weights[idx])} pt`,
            remark
          });
        }
      }
    }
  }
  return rows;
}
function reportEsc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function reportDate(v){try{return new Date(v||Date.now()).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}catch(e){return ''}}


/* ===== V168 — Fiches d'évaluation produit ===== */
let activeProductSheetId='';

function productSheetKey(pid,sid){return `${String(pid)}__${String(sid)}`}
function productSheetStore(st=state){
  if(!st?.config)return {};
  if(!st.config.productSheets || typeof st.config.productSheets!=='object')st.config.productSheets={};
  return st.config.productSheets;
}
function receptionDefaultsForSample(st,p,sm){
  const receptions=Array.isArray(st?.config?.receptions)?st.config.receptions:[];
  const supplier=String(sm?.supplier||'');
  for(let i=receptions.length-1;i>=0;i--){
    const r=receptions[i];
    if(supplier && String(r?.supplier||'')!==supplier)continue;
    const line=(r?.lines||[]).find(x=>String(x.productId||'')===String(p?.id||'') || String(x.productName||'')===String(p?.name||''));
    if(!line || line.received===false)continue;
    return{
      receptionFound:true,
      receptionDate:r?.date||'',
      receptionTime:r?.time||'',
      receptionEstablishment:r?.establishment||'',
      receptionSupplier:r?.supplier||'',
      receptionVehicleTemp:r?.vehicleTemp??'',
      receptionDriverName:r?.driverName||'',
      receptionReceiverName:r?.receiverName||'',
      deliveryTemp:line.productTemp??'',
      receptionInteriorTemp:line.interiorTemp??'',
      packagingConformity:line.packaging==='non-conforme'?'non':'oui',
      receptionPackaging:line.packaging||'',
      dlc:line.dlc||'',
      receptionDecision:line.decision||'',
      receptionObservations:line.observations||''
    };
  }
  return{};
}
function syncReceptionIntoProductSheet(rec,d={}){
  if(!rec||typeof rec!=='object')return rec;
  /* V228 — toutes les informations disponibles sur la fiche de réception
     sont reprises automatiquement dans la fiche produit. */
  const receptionFields=[
    'receptionFound','receptionDate','receptionTime','receptionEstablishment',
    'receptionSupplier','receptionVehicleTemp','receptionDriverName',
    'receptionReceiverName','receptionInteriorTemp','receptionPackaging',
    'receptionDecision','receptionObservations'
  ];
  for(const key of receptionFields){
    if(Object.prototype.hasOwnProperty.call(d,key))rec[key]=d[key];
  }
  if(d.deliveryTemp!==undefined && d.deliveryTemp!==null && String(d.deliveryTemp).trim()!==''){
    rec.deliveryTemp=String(d.deliveryTemp);
  }
  if(d.packagingConformity)rec.packagingConformity=d.packagingConformity;
  if(d.dlc)rec.dlc=d.dlc;
  /* Une observation de réception reste visible séparément pour ne pas écraser
     une observation complémentaire saisie dans la fiche produit. */
  return rec;
}
function ensureProductSheetRecord(st,p,sm){
  const store=productSheetStore(st),k=productSheetKey(p.id,sm.id);
  const d=receptionDefaultsForSample(st,p,sm);
  if(store[k]){
    const rec=syncReceptionIntoProductSheet(store[k],d);
    /* V252 — si aucune observation n'est saisie, RAS est utilisé automatiquement. */
    if(!String(rec.observations||'').trim())rec.observations='RAS';
    return rec;
  }
  store[k]={
    productId:p.id,sampleId:sm.id,supplier:sm.supplier||'',
    brand:'',characteristics:'',labeling:'',weight:'',
    technicalSheet:'',deliveryTempConformity:'',
    packagingConformity:d.packagingConformity||'',
    manufacturingDate:'',ddm:'',dlc:d.dlc||'',supplierLot:'',
    deliveryTemp:d.deliveryTemp??'',observations:d.receptionObservations||'RAS'
  };
  return syncReceptionIntoProductSheet(store[k],d);
}
function productSheetStats(st,p,sm){
  const stats=stateSampleStats(st,p,sm);
  const maxes=QUESTIONS.map(q=>Math.max(...q.weights));
  const names=criterionShortsForConfig(st.config,p);
  return{
    count:stats.count,
    avg65:stats.count?stats.avg:0,
    note5:stats.count?(stats.avg/65*5):0,
    criteria:(stats.criterionAvg||[]).map((v,i)=>({name:names[i]||`Critère ${i+1}`,avg:v,max:maxes[i]||1}))
  };
}
function productSheetMissingFields(st,p,sm){
  const r=ensureProductSheetRecord(st,p,sm);
  const missing=[];
  const required=[
    ['brand','Marque'],
    ['characteristics','Caractéristiques'],
    ['labeling','Étiquetage'],
    ['weight','Poids / grammage'],
    ['technicalSheet','Conformité à la fiche technique'],
    ['deliveryTempConformity','Conformité de la température à la livraison'],
    ['packagingConformity','Conformité emballage / conditionnement'],
    ['deliveryTemp','Température du produit à la livraison'],
    ['supplierLot','N° de lot fournisseur'],
    ['observations','Observations (écrire RAS s’il n’y en a aucune)']
  ];
  for(const [key,label] of required){
    if(!String(r?.[key]??'').trim())missing.push({key,label});
  }
  /* V241 — pour la fiche produit, au moins une des deux dates commerciales
     est obligatoire : DDM OU DLC. Une seule suffit. La date de fabrication
     reste facultative et ne remplace pas cette exigence. */
  if(!String(r.ddm||'').trim() && !String(r.dlc||'').trim()){
    missing.push({key:'traceabilityDate',label:'Au moins une date : DDM ou DLC'});
  }
  /* V252 — le résultat sensoriel est repris automatiquement du jury.
     Ce n'est pas un champ à saisir : il ne doit donc jamais compter comme
     élément manquant ni bloquer la fiche produit. */
  return missing;
}
function productSheetFilled(rec,st=null,p=null,sm=null){
  if(st&&p&&sm)return productSheetMissingFields(st,p,sm).length===0;
  return ['brand','characteristics','labeling','weight','technicalSheet','deliveryTempConformity','packagingConformity','supplierLot','deliveryTemp','observations']
    .every(k=>String(rec?.[k]??'').trim()) &&
    !!(String(rec?.ddm||'').trim()||String(rec?.dlc||'').trim());
}
function productSheetsValidation(st=state){
  const issues=[];
  for(const p of st?.config?.products||[]){
    for(const sm of p.samples||[]){
      const missing=productSheetMissingFields(st,p,sm);
      if(missing.length)issues.push({productId:p.id,productName:p.name||'Produit',sampleId:sm.id,supplier:sm.supplier||'Fournisseur',missing});
    }
  }
  return{ok:issues.length===0,issues};
}
function productSheetsProgress(st=state){
  let total=0,filled=0;
  for(const p of st?.config?.products||[])for(const sm of p.samples||[]){
    total++;
    if(productSheetMissingFields(st,p,sm).length===0)filled++;
  }
  return{total,filled};
}
function productSheetBlockingMessage(validation,actionLabel='continuer'){
  const issues=validation?.issues||[];
  const lines=[];
  for(const issue of issues.slice(0,6)){
    lines.push(`• ${issue.productName} — ${issue.supplier} : ${issue.missing.map(x=>x.label).join(', ')}`);
  }
  if(issues.length>6)lines.push(`• … et ${issues.length-6} autre(s) fiche(s) incomplète(s).`);
  return `Impossible de ${actionLabel} : les fiches produits doivent être complètes.\n\n${lines.join('\n')}`;
}
function ensureProductSheetsComplete(actionLabel='continuer'){
  try{captureProductSheetForm()}catch(e){}
  const validation=productSheetsValidation(state);
  if(validation.ok)return true;
  const first=validation.issues[0];
  alert(productSheetBlockingMessage(validation,actionLabel));
  activeProductSheetId=first.productId;
  openProductSheets();
  setTimeout(()=>{
    const box=$('#productSheetContent');
    const card=box?findProductSheetCard(box,first.sampleId):null;
    if(!card)return;
    card.classList.add('has-missing');
    const firstMissing=first.missing[0]?.key;
    let target=null;
    if(firstMissing==='traceabilityDate'){
      target=card.querySelector('[data-ps-field="ddm"],[data-ps-field="dlc"]');
    }else{
      target=card.querySelector(`[data-ps-field="${firstMissing}"]`);
    }
    target?.focus?.();
    card.scrollIntoView({behavior:'smooth',block:'center'});
  },120);
  return false;
}
function renderProductSheetStatus(){
  const b=$('#productSheetsBtn');if(!b)return;
  const x=productSheetsProgress(state);
  b.textContent=`📋 Fiches produits${x.total?` (${x.filled}/${x.total})`:''}`;
}
function openProductSheets(){
  if(!state?.config?.products?.length){alert('Aucun produit dans ce jury.');return}
  if(!activeProductSheetId || !state.config.products.some(p=>String(p.id)===String(activeProductSheetId)))activeProductSheetId=state.config.products[0].id;
  showView('productSheetsView');
  $('#headerTitle').textContent='Fiches produits';
  $('#headerSub').textContent=state.config.lotName||'Jury Marchés';
  renderProductSheets();
}
function findProductSheetCard(box,sid){
  return [...box.querySelectorAll('[data-ps-sample]')].find(el=>String(el.dataset.psSample)===String(sid))||null;
}
function renderProductSheets(){
  const tabs=$('#productSheetTabs'),box=$('#productSheetContent');
  if(!tabs||!box)return;
  tabs.innerHTML=(state.config.products||[]).map((p,i)=>`<button type="button" class="${String(p.id)===String(activeProductSheetId)?'active':''}" data-product-sheet-tab="${escapeHtml(String(p.id))}">${i+1}. ${escapeHtml(p.name||`Produit ${i+1}`)}</button>`).join('');
  tabs.querySelectorAll('[data-product-sheet-tab]').forEach(b=>b.onclick=()=>{captureProductSheetForm();activeProductSheetId=b.dataset.productSheetTab;renderProductSheets()});
  const p=state.config.products.find(x=>String(x.id)===String(activeProductSheetId))||state.config.products[0];
  if(!p){box.innerHTML='';return}
  const rows=(p.samples||[]).map(sm=>{
    const r=ensureProductSheetRecord(state,p,sm),st=productSheetStats(state,p,sm);
    const missing=productSheetMissingFields(state,p,sm);
    return `<article class="product-sheet-sample ${missing.length?'has-missing':''}" data-ps-sample="${escapeHtml(String(sm.id))}">
      <div class="product-sheet-sample-head">
        <div><strong>${escapeHtml(sm.supplier||'Fournisseur')} · Échantillon ${escapeHtml(sm.id)}</strong><span>Informations reprises dans l’annexe du rapport final</span></div>
        <span class="product-sheet-status ${missing.length?'':'ready'}">${missing.length?`${missing.length} élément${missing.length>1?'s':''} manquant${missing.length>1?'s':''}`:'Complet ✓'}</span>
      </div>
      <div class="product-sheet-grid">
        <div class="field"><label>Marque</label><input data-ps-field="brand" value="${escapeHtml(r.brand||'')}" placeholder="Marque"></div>
        <div class="field wide"><label>Caractéristiques</label><input data-ps-field="characteristics" value="${escapeHtml(r.characteristics||'')}" placeholder="Calibre, origine, nature…"></div>
        <div class="field"><label>Étiquetage</label><select data-ps-field="labeling"><option value="">—</option><option value="conforme">Conforme</option><option value="non-conforme">Non conforme</option></select></div>
        <div class="field"><label>Poids / grammage</label><input data-ps-field="weight" value="${escapeHtml(r.weight||'')}" placeholder="Ex. 2,5 kg"></div>
        <div class="field"><label>Conforme à la fiche technique</label><select data-ps-field="technicalSheet"><option value="">—</option><option value="oui">Oui</option><option value="non">Non</option></select></div>
        <div class="field"><label>Température à la livraison conforme</label><select data-ps-field="deliveryTempConformity"><option value="">—</option><option value="oui">Oui</option><option value="non">Non</option></select></div>
        <div class="field"><label>Emballage / conditionnement conforme</label><select data-ps-field="packagingConformity"><option value="">—</option><option value="oui">Oui</option><option value="non">Non</option></select></div>
        <div class="field"><label>T° produit à la livraison <span class="small">· reprise de la réception</span></label><select data-ps-field="deliveryTemp">${receptionTemperatureOptions(r.deliveryTemp??'')}</select></div>
        <div class="field"><label>Date de fabrication</label><input type="date" data-ps-field="manufacturingDate" value="${escapeHtml(r.manufacturingDate||'')}"></div>
        <div class="field"><label>DDM / utilisation optimale</label><input type="date" data-ps-field="ddm" value="${escapeHtml(r.ddm||'')}"></div>
        <div class="field"><label>DLC — Date limite de consommation</label><input type="date" data-ps-field="dlc" value="${escapeHtml(r.dlc||'')}"></div>
        <div class="field"><label>N° de lot fournisseur</label><input data-ps-field="supplierLot" value="${escapeHtml(r.supplierLot||'')}" placeholder="N° de lot"></div>
        <div class="field full"><label>Observations</label><textarea data-ps-field="observations" placeholder="Observations éventuelles">${escapeHtml(r.observations||'')}</textarea></div>
      </div>
      ${r.receptionFound?`<div class="product-sheet-auto" style="margin-top:10px">
        <strong>🚚 Données reprises automatiquement de la fiche de réception</strong>
        <div class="criterion-mini">
          <span>Date : ${escapeHtml(formatClosureDate(r.receptionDate)||'—')} ${escapeHtml(r.receptionTime||'')}</span>
          <span>Fournisseur : ${escapeHtml(r.receptionSupplier||sm.supplier||'—')}</span>
          <span>T° véhicule : ${escapeHtml(String(r.receptionVehicleTemp??'')||'—')} °C</span>
          <span>T° produit : ${escapeHtml(String(r.deliveryTemp??'')||'—')} °C</span>
          <span>T° intérieur : ${escapeHtml(String(r.receptionInteriorTemp??'')||'—')} °C</span>
          <span>DLC / DDM : ${escapeHtml(r.dlc?formatClosureDate(r.dlc):'—')}</span>
          <span>Emballage : ${escapeHtml(r.receptionPackaging==='non-conforme'?'Non conforme':r.receptionPackaging==='conforme'?'Conforme':r.receptionPackaging||'—')}</span>
          <span>Décision : ${escapeHtml(r.receptionDecision==='refus'?'Refus':r.receptionDecision==='acceptation'?'Acceptation':r.receptionDecision||'—')}</span>
          <span>Livreur : ${escapeHtml(r.receptionDriverName||'—')}</span>
          <span>Réceptionnaire : ${escapeHtml(r.receptionReceiverName||'—')}</span>
          <span>Observation réception : ${escapeHtml(r.receptionObservations||'RAS')}</span>
        </div>
      </div>`:''}
      <div class="product-sheet-auto">
        <strong>Résultats sensoriels repris automatiquement : ${st.count?`${fmt(st.avg65)} /65 · ${fmt(st.note5)} /5`:'aucune évaluation complète pour le moment'}</strong>
        <div class="criterion-mini">${st.criteria.map(c=>`<span>${escapeHtml(c.name)} : ${st.count?`${fmt(c.avg)}/${fmt(c.max)}`:'—'}</span>`).join('')}</div>
      </div>
    </article>`;
  }).join('');
  box.innerHTML=`<section class="panel product-sheet-card"><h3>${escapeHtml(p.name||'Produit')}</h3><div class="sub">Une annexe produit regroupera tous les fournisseurs/échantillons ci-dessous.</div><div class="product-sheet-required-note">Tous les champs sont obligatoires pour le dossier final. Pour les dates, renseignez au moins <strong>la DDM ou la DLC</strong> : une seule des deux suffit. La date de fabrication est facultative. S’il n’y a aucune observation, « RAS » est ajouté automatiquement.</div>${rows||'<div class="results-empty">Aucun échantillon.</div>'}</section>`;
  for(const sm of p.samples||[]){
    const card=findProductSheetCard(box,sm.id);if(!card)continue;
    const r=ensureProductSheetRecord(state,p,sm);
    for(const field of ['labeling','technicalSheet','deliveryTempConformity','packagingConformity']){
      const el=card.querySelector(`[data-ps-field="${field}"]`);if(el)el.value=r[field]||'';
    }

    /* V252 — signaler clairement en rouge chaque champ obligatoire manquant. */
    const missing=productSheetMissingFields(state,p,sm);
    card.querySelectorAll('.field.missing-field').forEach(el=>el.classList.remove('missing-field'));
    card.querySelector('.product-sheet-auto')?.classList.remove('missing-auto');

    for(const item of missing){
      if(item.key==='traceabilityDate'){
        for(const key of ['ddm','dlc']){
          card.querySelector(`[data-ps-field="${key}"]`)?.closest('.field')?.classList.add('missing-field');
        }
      }else{
        card.querySelector(`[data-ps-field="${item.key}"]`)?.closest('.field')?.classList.add('missing-field');
      }
    }

    /* Dès qu'une valeur est renseignée, le rouge disparaît sur le champ. */
    card.querySelectorAll('[data-ps-field]').forEach(el=>{
      const clearMissing=()=>{
        const key=el.dataset.psField;
        if((key==='ddm'||key==='dlc') && String(el.value||'').trim()){
          for(const dateKey of ['ddm','dlc']){
            card.querySelector(`[data-ps-field="${dateKey}"]`)?.closest('.field')?.classList.remove('missing-field');
          }
        }else if(String(el.value||'').trim()){
          el.closest('.field')?.classList.remove('missing-field');
        }
      };
      el.addEventListener('input',clearMissing);
      el.addEventListener('change',clearMissing);
    });
  }
}
function captureProductSheetForm(){
  const box=$('#productSheetContent');if(!box||!state?.config)return;
  const p=state.config.products.find(x=>String(x.id)===String(activeProductSheetId));if(!p)return;
  for(const sm of p.samples||[]){
    const card=findProductSheetCard(box,sm.id);if(!card)continue;
    const r=ensureProductSheetRecord(state,p,sm);
    card.querySelectorAll('[data-ps-field]').forEach(el=>{r[el.dataset.psField]=el.value??''});
    /* V252 — Observations : vide = RAS automatiquement avant enregistrement. */
    if(!String(r.observations||'').trim()){
      r.observations='RAS';
      const obs=card.querySelector('[data-ps-field="observations"]');
      if(obs)obs.value='RAS';
    }
  }
}
async function saveProductSheets(){
  captureProductSheetForm();saveState();
  if(typeof syncDirtyToCloud==='function'){try{await syncDirtyToCloud()}catch(e){}}

  const products=state?.config?.products||[];
  const currentIndex=products.findIndex(p=>String(p.id)===String(activeProductSheetId));
  const currentProduct=currentIndex>=0?products[currentIndex]:null;
  const currentComplete=!!currentProduct && (currentProduct.samples||[])
    .every(sm=>productSheetMissingFields(state,currentProduct,sm).length===0);

  const validation=productSheetsValidation(state);
  renderProductSheetStatus();

  /* V241 — quand le produit affiché est complet, passer automatiquement
     au produit suivant pour éviter de rester sur "Riz" après enregistrement. */
  if(currentComplete && currentIndex>=0 && currentIndex<products.length-1){
    const next=products[currentIndex+1];
    activeProductSheetId=next.id;
    renderProductSheets();
    requestAnimationFrame(()=>{
      const tabs=$('#productSheetTabs');
      const content=$('#productSheetContent');
      (tabs||content)?.scrollIntoView?.({behavior:'smooth',block:'start'});
    });
    toast(`${currentProduct.name||'Produit'} enregistré ✓ → ${next.name||'Produit suivant'}`);
    return;
  }

  /* V252 — sur la dernière fiche seulement, si tout le dossier produit est
     complet, Enregistrer ramène directement à l’accueil. */
  if(currentComplete && currentIndex===products.length-1 && validation.ok){
    renderHome();
    toast('Toutes les fiches produits sont complètes et enregistrées ✓');
    return;
  }

  renderProductSheets();
  if(validation.ok){
    toast('Fiches produits complètes et enregistrées ✓');
  }else{
    alert(`Brouillon enregistré. Il reste ${validation.issues.length} fiche(s) produit incomplète(s).\n\nLe rapport final, le dossier complet, l’archivage et l’envoi par mail resteront bloqués tant que tout n’est pas complété.`);
  }
}
function closeProductSheets(){captureProductSheetForm();saveState();renderAdmin()}

function productSheetAnnexHtml(st){
  const products=st?.config?.products||[];
  if(!products.length)return '';
  const out=[];

  products.forEach((p,pi)=>{
    const samples=p.samples||[];
    for(let offset=0;offset<samples.length;offset+=3){
      const group=samples.slice(offset,offset+3);
      const pageNo=Math.floor(offset/3)+1;
      const pageTotal=Math.max(1,Math.ceil(samples.length/3));

      const blocks=group.map(sm=>{
        const r=ensureProductSheetRecord(st,p,sm),ss=productSheetStats(st,p,sm);
        const yn=v=>v==='oui'?'OUI':v==='non'?'NON':'—';
        const labeling=r.labeling==='conforme'?'Conforme':r.labeling==='non-conforme'?'Non conforme':'—';

        return `<article class="product-annex-supplier product-annex-card">
          <div class="product-annex-head">
            <div>
              <h3>${reportEsc(sm.supplier||'Fournisseur')}</h3>
              <span>Échantillon ${reportEsc(sm.id)}</span>
            </div>
            <div class="product-annex-note5">
              <small>Note /5</small>
              <strong>${ss.count?fmt(ss.note5):'—'}</strong>
            </div>
          </div>

          <table><tbody>
            <tr><th>Marque</th><td>${reportEsc(r.brand||'—')}</td><th>Poids / grammage</th><td>${reportEsc(r.weight||'—')}</td></tr>
            <tr><th>Caractéristiques</th><td colspan="3">${reportEsc(r.characteristics||'—')}</td></tr>
            <tr><th>Étiquetage</th><td>${reportEsc(labeling)}</td><th>N° lot fournisseur</th><td>${reportEsc(r.supplierLot||'—')}</td></tr>
            <tr><th>Fiche technique</th><td>${yn(r.technicalSheet)}</td><th>T° livraison conforme</th><td>${yn(r.deliveryTempConformity)}${String(r.deliveryTemp||'').trim()?` · ${reportEsc(r.deliveryTemp)} °C`:''}</td></tr>
            <tr><th>Emballage / conditionnement</th><td>${yn(r.packagingConformity)}</td><th>Date fabrication</th><td>${reportEsc(r.manufacturingDate?formatClosureDate(r.manufacturingDate):'—')}</td></tr>
            <tr><th>DDM / utilisation optimale</th><td>${reportEsc(r.ddm?formatClosureDate(r.ddm):'—')}</td><th>DLC</th><td>${reportEsc(r.dlc?formatClosureDate(r.dlc):'—')}</td></tr>
            <tr><th>Observations</th><td colspan="3">${reportEsc(r.observations||'—')}</td></tr>
            ${r.receptionFound?`<tr><th>Réception</th><td colspan="3">${reportEsc(formatClosureDate(r.receptionDate))} ${reportEsc(r.receptionTime||'')} · T° véhicule ${reportEsc(String(r.receptionVehicleTemp??'')||'—')} °C · T° produit ${reportEsc(String(r.deliveryTemp??'')||'—')} °C · T° intérieur ${reportEsc(String(r.receptionInteriorTemp??'')||'—')} °C · ${reportEsc(r.receptionDecision==='refus'?'Refus':'Acceptation')}</td></tr>`:''}
          </tbody></table>

          <div class="product-annex-score">
            <strong>Résultat sensoriel du jury : ${ss.count?`${fmt(ss.avg65)} /65`:'—'}</strong>
            <div>${ss.criteria.map(c=>`${reportEsc(c.name)} : ${ss.count?`${fmt(c.avg)}/${fmt(c.max)}`:'—'}`).join(' · ')}</div>
          </div>
        </article>`;
      }).join('');

      out.push(`<section class="section page-break product-eval-annex product-eval-page">
        <div class="section-kicker">Fiches d’évaluation des échantillons</div>
        <h2>${reportEsc(p.name||`Produit ${pi+1}`)}</h2>
        <div class="small-note">Trois fiches maximum par page. Toutes les informations enregistrées sont conservées.</div>
        <div class="product-eval-stack">${blocks||'<div class="empty-note">Aucun fournisseur / échantillon.</div>'}</div>
        ${pageTotal>1?`<div class="product-eval-page-no">Page ${pageNo}/${pageTotal} pour cet article</div>`:''}
      </section>`);
    }
  });

  return out.join('');
}
function reportPdfProductSheetCardV284(doc,st,p,sm,x,y,w,h){
  const r=ensureProductSheetRecord(st,p,sm),ss=productSheetStats(st,p,sm);
  const yn=v=>v==='oui'?'OUI':v==='non'?'NON':'—';
  const labeling=r.labeling==='conforme'?'Conforme':r.labeling==='non-conforme'?'Non conforme':'—';

  doc.setDrawColor(185,207,224);
  doc.setFillColor(251,253,254);
  doc.roundedRect(x,y,w,h,2,2,'FD');

  doc.setFillColor(232,242,248);
  doc.rect(x,y,w,10,'F');

  doc.setFont('helvetica','bold');
  doc.setFontSize(8.5);
  doc.setTextColor(23,79,120);
  doc.text(String(sm.supplier||'Fournisseur'),x+3,y+5.7,{maxWidth:w-42});

  doc.setFont('helvetica','normal');
  doc.setFontSize(6.7);
  doc.setTextColor(82,111,132);
  doc.text('Échantillon '+String(sm.id||''),x+3,y+8.7);

  doc.setFont('helvetica','bold');
  doc.setFontSize(13);
  doc.setTextColor(18,51,90);
  doc.text(ss.count?fmt(ss.note5):'—',x+w-4,y+6.5,{align:'right'});
  doc.setFontSize(5.6);
  doc.setTextColor(92,113,128);
  doc.text('NOTE /5',x+w-4,y+9,{align:'right'});

  const rows=[
    ['Marque',r.brand||'—','Poids / grammage',r.weight||'—'],
    ['Caractéristiques',r.characteristics||'—','',''],
    ['Étiquetage',labeling,'N° lot fournisseur',r.supplierLot||'—'],
    ['Fiche technique',yn(r.technicalSheet),'T° livraison conforme',yn(r.deliveryTempConformity)+(String(r.deliveryTemp||'').trim()?(' · '+r.deliveryTemp+' °C'):'')],
    ['Emballage / conditionnement',yn(r.packagingConformity),'Date fabrication',r.manufacturingDate?formatClosureDate(r.manufacturingDate):'—'],
    ['DDM / utilisation optimale',r.ddm?formatClosureDate(r.ddm):'—','DLC',r.dlc?formatClosureDate(r.dlc):'—'],
    ['Observations',r.observations||'—','','']
  ];

  const widths=[35,55,37,w-127];
  let yy=y+12;
  const rowH=5.8;
  doc.setFontSize(5.7);

  rows.forEach(row=>{
    let xx=x;
    row.forEach((val,i)=>{
      const ww=widths[i];
      doc.setDrawColor(214,226,233);
      if(i===0||i===2){
        doc.setFillColor(241,247,250);
        doc.rect(xx,yy,ww,rowH,'FD');
        doc.setFont('helvetica','bold');
        doc.setTextColor(82,111,132);
      }else{
        doc.rect(xx,yy,ww,rowH);
        doc.setFont('helvetica','normal');
        doc.setTextColor(49,73,91);
      }
      if(val)doc.text(doc.splitTextToSize(String(val),ww-2).slice(0,2),xx+1,yy+2.6,{maxWidth:ww-2});
      xx+=ww;
    });
    yy+=rowH;
  });

  if(r.receptionFound){
    doc.setFont('helvetica','bold');doc.setFontSize(5.8);doc.setTextColor(82,111,132);
    doc.text('Réception',x+2,yy+3);
    doc.setFont('helvetica','normal');doc.setTextColor(49,73,91);
    const reception=`${formatClosureDate(r.receptionDate)} ${r.receptionTime||''} · T° véhicule ${String(r.receptionVehicleTemp??'')||'—'} °C · T° produit ${String(r.deliveryTemp??'')||'—'} °C · T° intérieur ${String(r.receptionInteriorTemp??'')||'—'} °C · ${r.receptionDecision==='refus'?'Refus':'Acceptation'}`;
    doc.text(doc.splitTextToSize(reception,w-42).slice(0,2),x+37,yy+3,{maxWidth:w-39});
    yy+=8;
  }

  const sy=y+h-10;
  doc.setDrawColor(207,222,231);doc.line(x+3,sy-2,x+w-3,sy-2);
  doc.setFont('helvetica','bold');doc.setFontSize(6.7);doc.setTextColor(23,58,97);
  doc.text('Résultat sensoriel : '+(ss.count?fmt(ss.avg65)+' /65':'—'),x+3,sy+1);
  doc.setFont('helvetica','normal');doc.setFontSize(5.5);doc.setTextColor(92,113,128);
  const crit=ss.criteria.map(c=>c.name+' '+(ss.count?fmt(c.avg)+'/'+fmt(c.max):'—')).join(' · ');
  doc.text(doc.splitTextToSize(crit,w-6).slice(0,2),x+3,sy+5,{maxWidth:w-6});
}
function appendProductSheetsPdf(doc,st){
  const products=st?.config?.products||[];

  products.forEach((p,pi)=>{
    const samples=p.samples||[];

    for(let offset=0;offset<samples.length;offset+=3){
      doc.addPage();
      let y=24;

      doc.setFont('helvetica','bold');
      doc.setFontSize(8.5);
      doc.setTextColor(49,90,120);
      doc.text('Fiches d’évaluation des échantillons',14,y);
      doc.setDrawColor(154,177,195);
      doc.line(68,y-1,196,y-1);

      y+=9;
      doc.setFontSize(19);
      doc.setTextColor(18,51,90);
      doc.text(String(p.name||`Produit ${pi+1}`),14,y);

      y+=8;
      doc.setFont('helvetica','normal');
      doc.setFontSize(6.7);
      doc.setTextColor(92,113,128);
      doc.text('Trois fiches maximum par page · toutes les informations enregistrées sont conservées.',14,y);
      y+=6;

      const group=samples.slice(offset,offset+3);
      const gap=4,cardH=73;
      group.forEach((sm,idx)=>{
        reportPdfProductSheetCardV284(doc,st,p,sm,14,y+idx*(cardH+gap),182,cardH);
      });
    }
  });
}

function reportReceptionAnnex(st){
  const receptions=Array.isArray(st?.config?.receptions)?st.config.receptions.filter(Boolean):[];
  if(!receptions.length)return '';

  const out=[];
  for(let offset=0;offset<receptions.length;offset+=3){
    const group=receptions.slice(offset,offset+3);
    const pageNo=Math.floor(offset/3)+1;
    const pageTotal=Math.ceil(receptions.length/3);

    const cards=group.map((r,idx)=>{
      const lines=(r.lines||[]).filter(x=>x.received!==false);
      const rows=lines.map(line=>`<tr>
        <td>${reportEsc(line.productName||'—')}</td>
        <td>${reportEsc(r.vehicleTemp||'—')}</td>
        <td>${reportEsc(line.productTemp||'—')}</td>
        <td>${reportEsc(line.interiorTemp||'—')}</td>
        <td>${reportEsc(line.dlc?formatClosureDate(line.dlc):'')}</td>
        <td>${reportEsc(line.packaging==='non-conforme'?'NON CONFORME':'Conforme')}</td>
        <td>${line.decision==='refus'?'':'X'}</td>
        <td>${line.decision==='refus'?'X':''}</td>
        <td>${reportEsc(line.observations||'')}</td>
      </tr>`).join('');

      return `<article class="reception-annex-card">
        <div class="reception-annex-head">
          <div><strong>${reportEsc(r.supplier||'Fournisseur')}</strong><span>Réception ${offset+idx+1}/${receptions.length}</span></div>
          <div>${reportEsc(formatClosureDate(r.date))} · ${reportEsc(r.time||'—')}</div>
        </div>

        <table class="reception-meta-table"><tbody>
          <tr><th>Établissement</th><td colspan="3">${reportEsc(r.establishment||'—')}</td></tr>
          <tr><th>Lot</th><td>${reportEsc(st.config?.lotName||'—')}</td><th>Fournisseur</th><td>${reportEsc(r.supplier||'—')}</td></tr>
          <tr><th>Date</th><td>${reportEsc(formatClosureDate(r.date))}</td><th>Heure</th><td>${reportEsc(r.time||'—')}</td></tr>
          <tr><th>Livreur</th><td>${reportEsc(r.driverName||'—')}</td><th>Agent réceptionnaire</th><td>${reportEsc(r.receiverName||'—')}</td></tr>
        </tbody></table>

        <table class="reception-report-table">
          <thead><tr><th>Produit</th><th>T° véhicule</th><th>T° produit</th><th>T° intérieur</th><th>DLC / DDM</th><th>Emballage</th><th>Accept.</th><th>Refus</th><th>Observations</th></tr></thead>
          <tbody>${rows||'<tr><td colspan="9">Aucun produit renseigné.</td></tr>'}</tbody>
        </table>

        <div class="reception-signature-report compact">
          <strong>Signature du livreur</strong>
          ${r.driverSignature?`<img src="${r.driverSignature}" alt="Signature du livreur">`:'<span>Signature non disponible</span>'}
        </div>
      </article>`;
    }).join('');

    out.push(`<section class="section page-break reception-annex reception-annex-page reception-count-${group.length}">
      <div class="section-kicker">Annexe — contrôle de réception</div>
      <h2>Relevé de réception des échantillons</h2>
      <div class="small-note">Les relevés sont regroupés sur une ou deux pages quand le volume le permet, sans supprimer aucune donnée.</div>
      <div class="reception-annex-stack">${cards}</div>
      ${pageTotal>1?`<div class="reception-page-no">Page ${pageNo}/${pageTotal} des relevés</div>`:''}
    </section>`);
  }

  return out.join('');
}
function reportPdfReceptionCardV284(doc,st,r,index,total,x,y,w,h){
  doc.setDrawColor(185,207,224);
  doc.setFillColor(251,253,254);
  doc.roundedRect(x,y,w,h,2,2,'FD');

  doc.setFillColor(232,242,248);
  doc.rect(x,y,w,9,'F');

  doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.setTextColor(23,79,120);
  doc.text(String(r.supplier||'Fournisseur'),x+3,y+5.8,{maxWidth:w-45});
  doc.setFont('helvetica','normal');doc.setFontSize(6.3);doc.setTextColor(82,111,132);
  doc.text('Réception '+index+'/'+total,x+w-3,y+5.8,{align:'right'});

  let yy=y+13;
  doc.setFontSize(6.2);doc.setTextColor(49,73,91);
  doc.text('Établissement : '+String(r.establishment||'—'),x+3,yy);
  doc.text('Lot : '+String(st.config?.lotName||'—'),x+w/2,yy);
  yy+=4;
  doc.text('Date : '+String(formatClosureDate(r.date))+' '+String(r.time||''),x+3,yy);
  doc.text('Livreur : '+String(r.driverName||'—')+' · Agent : '+String(r.receiverName||'—'),x+w/2,yy);
  yy+=5;

  const lines=(r.lines||[]).filter(v=>v.received!==false);
  const headers=['Produit','T° véh.','T° prod.','T° int.','DLC/DDM','Emballage','A','R','Observations'];
  const widths=[31,14,14,14,24,24,8,8,45];
  const rowH=5.6;

  let xx=x;
  doc.setFillColor(241,247,250);doc.setFont('helvetica','bold');doc.setFontSize(5.1);doc.setTextColor(70,94,111);
  headers.forEach((hdr,i)=>{
    doc.rect(xx,yy,widths[i],rowH,'FD');
    doc.text(hdr,xx+1,yy+3.5,{maxWidth:widths[i]-2});
    xx+=widths[i];
  });
  yy+=rowH;

  doc.setFont('helvetica','normal');doc.setFontSize(5.2);doc.setTextColor(49,73,91);
  lines.forEach(line=>{
    const vals=[
      line.productName||'—',
      r.vehicleTemp||'—',
      line.productTemp||'—',
      line.interiorTemp||'—',
      line.dlc?formatClosureDate(line.dlc):'',
      line.packaging==='non-conforme'?'Non conf.':'Conforme',
      line.decision==='refus'?'':'X',
      line.decision==='refus'?'X':'',
      line.observations||''
    ];
    xx=x;
    vals.forEach((val,i)=>{
      doc.rect(xx,yy,widths[i],rowH);
      doc.text(doc.splitTextToSize(String(val),widths[i]-2).slice(0,2),xx+1,yy+3.5,{maxWidth:widths[i]-2});
      xx+=widths[i];
    });
    yy+=rowH;
  });

  const sigY=y+h-13;
  doc.setFont('helvetica','bold');doc.setFontSize(5.8);doc.setTextColor(82,111,132);
  doc.text('Signature du livreur',x+3,sigY+5);
  if(r.driverSignature){
    try{doc.addImage(r.driverSignature,'PNG',x+40,sigY,40,11);}catch(e){}
  }else{
    doc.setFont('helvetica','normal');doc.setTextColor(120,132,140);
    doc.text('Signature non disponible',x+40,sigY+5);
  }
}
function appendReceptionAnnexPdf(doc,st){
  const receptions=Array.isArray(st?.config?.receptions)?st.config.receptions.filter(Boolean):[];
  if(!receptions.length)return;

  for(let offset=0;offset<receptions.length;offset+=3){
    doc.addPage();
    let y=24;

    doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.setTextColor(49,90,120);
    doc.text('Annexe — contrôle de réception',14,y);
    doc.setDrawColor(154,177,195);doc.line(61,y-1,196,y-1);

    y+=9;
    doc.setFontSize(19);doc.setTextColor(18,51,90);
    doc.text('Relevé de réception des échantillons',14,y);

    y+=8;
    doc.setFont('helvetica','normal');doc.setFontSize(6.7);doc.setTextColor(92,113,128);
    doc.text('Relevés regroupés sans suppression des informations de réception.',14,y);
    y+=6;

    const group=receptions.slice(offset,offset+3);
    const gap=4,cardH=73;
    group.forEach((rec,idx)=>{
      reportPdfReceptionCardV284(doc,st,rec,offset+idx+1,receptions.length,14,y+idx*(cardH+gap),182,cardH);
    });
  }
}



function pvDate(v){
  if(!v)return '—';
  try{
    const value=String(v).length===10?`${v}T12:00:00`:v;
    return new Date(value).toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'})
  }catch(e){return String(v)}
}
function pvProductRanking(st,p){
  const out=[];
  for(const sm of p.samples||[]){
    let total=0,count=0;
    for(let t=1;t<=Number(st.config?.testerCount||0);t++){
      const a=st.testers?.[t]?.answers?.[`${p.id}__${sm.id}`];
      if(!stateCompleteAnswer(a))continue;
      total+=stateAnswerScore(a);count++
    }
    out.push({sample:sm.id||'',supplier:sm.supplier||'—',count,avg:count?total/count:0})
  }
  return out.sort((a,b)=>b.avg-a.avg||String(a.sample).localeCompare(String(b.sample),'fr',{numeric:true}))
}
function pvMembers(st){
  const c=st.config?.closure||{};
  if(Array.isArray(c.members)&&c.members.length){
    return c.members.filter(x=>x.present!==false).map(x=>({
      name:x.name||`Testeur ${x.testerNo||''}`,role:x.role||''
    }))
  }
  return Array.from({length:Number(st.config?.testerCount||0)},(_,i)=>({
    name:st.testers?.[i+1]?.name||st.config?.testerNames?.[i]||`Testeur ${i+1}`,role:''
  }))
}
function openJuryMinutes(st,sourceLabel='Jury'){
  if(!st?.config?.products?.length){alert('Aucun jury à présenter dans le procès-verbal.');return}
  const w=window.open('','_blank');
  if(!w){alert('Le navigateur a bloqué l’ouverture du procès-verbal. Autorisez les fenêtres contextuelles pour cette page.');return}

  const cfg=st.config||{},c=cfg.closure||{},members=pvMembers(st);
  const products=cfg.products||[],totalSamples=stateTotalSamples(st);
  const suppliers=stateSupplierRanking(st),market=cfg.marketRef||{};
  const closedAt=cfg.juryClose?.closedAt||'';
  const isFinal=!!closedAt&&closureIsReady(st);
  const status=isFinal?'PROCÈS-VERBAL FINAL':'PROJET DE PROCÈS-VERBAL';
  const generatedAt=new Date().toISOString();

  const memberRows=members.length?members.map((m,i)=>`
    <tr><td class="rank">${i+1}</td><td><strong>${reportEsc(m.name)}</strong></td><td>${reportEsc(m.role||'—')}</td></tr>`
  ).join(''):'<tr><td colspan="3">Aucun membre renseigné.</td></tr>';

  const supplierRows=suppliers.length?suppliers.map((r,i)=>`
    <tr><td class="rank">${i+1}</td><td><strong>${reportEsc(r.supplier)}</strong></td><td>${r.count}</td><td class="score">${r.count?fmt(supplierGlobalNote5(r.avg)):'—'}</td></tr>`
  ).join(''):'<tr><td colspan="4">Aucun résultat exploitable.</td></tr>';

  const productSections=products.map((p,pi)=>{
    const rows=pvProductRanking(st,p);
    return `<section class="section">
      <div class="section-title">${pi+1}. ${reportEsc(p.code?`${p.code} — `:'')}${reportEsc(p.name||`Produit ${pi+1}`)}</div>
      <table><thead><tr><th>Rang</th><th>N° échantillon</th><th>Fournisseur</th><th>Évaluations</th><th>Moyenne /65</th></tr></thead><tbody>
      ${rows.map((r,i)=>`<tr><td class="rank">${i+1}</td><td><strong>${reportEsc(r.sample)}</strong></td><td>${reportEsc(r.supplier)}</td><td>${r.count}</td><td class="score">${r.count?fmt(r.avg):'—'}</td></tr>`).join('')}
      </tbody></table>
    </section>`
  }).join('');

  const observations=c.notes?reportEsc(c.notes).replace(/\n/g,'<br>'):'Aucune observation générale renseignée.';

  const html=`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${reportEsc(status)} — ${reportEsc(cfg.lotName||'Jury')}</title><style>
  @page{size:A4 portrait;margin:13mm}
  *{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#233746;margin:0;background:#fff;font-size:10px;line-height:1.35}
  .page{max-width:190mm;margin:0 auto}.printbar{position:sticky;top:0;z-index:10;background:#173f5c;color:#fff;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.printbar button{border:0;border-radius:7px;padding:7px 10px;font-weight:700;cursor:pointer}
  .header{border-bottom:3px solid #173f5c;padding-bottom:8px;margin-bottom:12px}.kicker{font-size:8px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:#5f7483}.header h1{margin:4px 0 2px;font-size:20px;color:#173f5c}.header h2{margin:0;font-size:12px;font-weight:500;color:#526b7a}.status{display:inline-block;margin-top:7px;border-radius:999px;padding:4px 8px;font-size:8px;font-weight:700;background:${isFinal?'#e5f5ed':'#fff0d8'};color:${isFinal?'#166f50':'#8b5b00'}}
  .warn{border:1px solid #efd19b;background:#fff7e8;color:#765519;padding:7px 8px;border-radius:7px;margin:8px 0;font-size:8px}
  .info{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:12px}.info div{border:1px solid #dfe6eb;border-radius:7px;padding:7px 8px}.info small{display:block;text-transform:uppercase;font-size:7px;font-weight:700;color:#788994;letter-spacing:.05em}.info strong{display:block;font-size:10px;margin-top:2px;color:#2c4d63}
  .section{margin:12px 0;break-inside:avoid}.section-title{font-size:12px;font-weight:700;color:#173f5c;border-left:4px solid #2c7ea8;padding:4px 7px;background:#f4f8fa;margin-bottom:6px}
  table{width:100%;border-collapse:collapse}th,td{border:1px solid #dfe6eb;padding:5px 6px;text-align:left;vertical-align:top}th{background:#f2f5f7;text-transform:uppercase;font-size:7px;letter-spacing:.04em;color:#647784}.rank{width:34px;text-align:center;font-weight:700}.score{text-align:right;font-weight:700;color:#174e70}
  .observations{border:1px solid #dfe6eb;border-radius:7px;padding:9px;min-height:58px}.note{font-size:8px;color:#667985;margin-top:5px}
  .signatures{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}.sig{border:1px solid #cfd9df;border-radius:8px;padding:8px;min-height:95px}.sig strong{display:block;font-size:9px;color:#2f5268}.sig span{display:block;font-size:8px;color:#70818c;margin-top:2px}.sig img{display:block;max-width:100%;height:62px;object-fit:contain;margin-top:4px}
  .footer{margin-top:14px;border-top:1px solid #d8e0e5;padding-top:6px;display:flex;justify-content:space-between;gap:10px;font-size:7px;color:#7a8993}
  @media print{.printbar{display:none}.page{max-width:none}.section{break-inside:avoid}}
  </style></head><body>
  <div class="printbar"><strong>${reportEsc(status)}</strong><button onclick="window.print()">Imprimer / Enregistrer en PDF</button></div>
  <main class="page">
    <header class="header">
      <div class="kicker">Jury Marchés · Tests culinaires · ${reportEsc(sourceLabel)}</div>
      <h1>${reportEsc(status)}</h1>
      <h2>${reportEsc(cfg.lotName||'Jury')}${cfg.subtitle?` — ${reportEsc(cfg.subtitle)}`:''}</h2>
      <span class="status">${isFinal?'Jury fermé et clôture renseignée':'Document provisoire'}</span>
    </header>

    ${!isFinal?`<div class="warn"><strong>Document provisoire :</strong> le procès-verbal devient final lorsque le jury est officiellement fermé et que la fiche de clôture contient au minimum la date, le lieu et le responsable du jury.</div>`:''}

    <section class="info">
      <div><small>Date du jury</small><strong>${reportEsc(pvDate(c.date))}</strong></div>
      <div><small>Lieu</small><strong>${reportEsc(c.place||'—')}</strong></div>
      <div><small>Responsable / président</small><strong>${reportEsc(c.chair||'—')}${c.chairRole?` — ${reportEsc(c.chairRole)}`:''}</strong></div>
      <div><small>Second signataire</small><strong>${reportEsc(c.coSigner||'—')}${c.coSignerRole?` — ${reportEsc(c.coSignerRole)}`:''}</strong></div>
      <div><small>Produits / échantillons</small><strong>${products.length} produit(s) · ${totalSamples} échantillon(s)</strong></div>
      <div><small>Fermeture officielle</small><strong>${closedAt?reportEsc(reportDate(closedAt)):'—'}</strong></div>
      ${market.lot?`<div style="grid-column:1/-1"><small>Référence marché</small><strong>Lot ${reportEsc(market.lot)}${market.family?` — ${reportEsc(market.family)}`:''}</strong></div>`:''}
    </section>

    <section class="section">
      <div class="section-title">Membres présents</div>
      <table><thead><tr><th>N°</th><th>Nom</th><th>Fonction / établissement</th></tr></thead><tbody>${memberRows}</tbody></table>
    </section>

    <section class="section">
      <div class="section-title">Synthèse finale des fournisseurs</div>
      <table><thead><tr><th>Rang</th><th>Fournisseur</th><th>Évaluations</th><th>Moyenne /5</th></tr></thead><tbody>${supplierRows}</tbody></table>
      ${products.length>1?'<div class="note">Cette synthèse globale regroupe plusieurs produits. Le détail par produit ci-dessous reste la lecture de référence pour chaque article testé.</div>':''}
    </section>

    ${productSections}

    <section class="section">
      <div class="section-title">Observations générales du jury</div>
      <div class="observations">${observations}</div>
    </section>

    <section class="signatures">
      <div class="sig"><strong>Responsable / président du jury</strong><span>${reportEsc(c.chair||'Nom non renseigné')}</span>${c.chairSignature?`<img src="${c.chairSignature}" alt="Signature du responsable">`:''}</div>
      <div class="sig"><strong>Second signataire</strong><span>${reportEsc(c.coSigner||'Nom non renseigné')}</span>${c.coSignature?`<img src="${c.coSignature}" alt="Signature du second signataire">`:''}</div>
    </section>

    <footer class="footer"><span>PV généré le ${reportEsc(reportDate(generatedAt))}</span><span>${reportEsc(cfg.lotName||'')}</span></footer>
  </main></body></html>`;

  w.document.open();w.document.write(html);w.document.close();w.focus()
}
function openCurrentMinutes(){openJuryMinutes(state,'Jury actif')}
function openArchiveMinutes(id){
  const rec=loadArchives().find(x=>x.id===id);
  if(!rec?.state){alert('Archive introuvable.');return}
  openJuryMinutes(rec.state,'Archive clôturée')
}


function dossierTimeline(st){
  const events=[];
  const cfg=st.config||{};
  if(cfg.juryLaunch?.openedAt)events.push({at:cfg.juryLaunch.openedAt,label:'Ouverture officielle du jury',detail:'Les accès testeurs ont été ouverts.'});
  for(let t=1;t<=Number(cfg.testerCount||0);t++){
    const v=st.testers?.[t]?.validatedAt;
    if(v)events.push({at:v,label:`Validation — ${st.testers?.[t]?.name||`Testeur ${t}`}`,detail:`Testeur ${t} a validé et verrouillé sa fiche.`})
  }
  if(cfg.juryClose?.closedAt)events.push({at:cfg.juryClose.closedAt,label:'Fermeture officielle du jury',detail:'Les accès testeurs ont été verrouillés.'});
  if(cfg.closure?.updatedAt)events.push({at:cfg.closure.updatedAt,label:'Fiche de clôture enregistrée',detail:'Les informations administratives et signatures ont été enregistrées.'});
  if(cfg._archive?.archivedAt)events.push({at:cfg._archive.archivedAt,label:'Archivage du jury',detail:'Le dossier a été conservé dans les archives de l’application.'});
  return events.sort((a,b)=>String(a.at||'').localeCompare(String(b.at||'')))
}
function dossierCriteriaAverages(st){
  const sums=Array(QUESTIONS.length).fill(0),counts=Array(QUESTIONS.length).fill(0);
  for(const p of st.config?.products||[])for(const sm of p.samples||[])for(let t=1;t<=Number(st.config?.testerCount||0);t++){
    const a=st.testers?.[t]?.answers?.[`${p.id}__${sm.id}`];
    if(!stateCompleteAnswer(a))continue;
    a.choices.forEach((idx,qi)=>{
      if(idx==null)return;
      sums[qi]+=QUESTIONS[qi].weights[idx];counts[qi]++
    })
  }
  const names=criterionShortsForConfig(st?.config);return sums.map((s,i)=>({name:names[i]||`Critère ${i+1}`,avg:counts[i]?s/counts[i]:0,count:counts[i],max:Math.max(...QUESTIONS[i].weights)}))
}
function openJuryDossier(st,sourceLabel='Jury'){
  if(!st?.config?.products?.length){alert('Aucun jury à présenter dans le dossier.');return}
  const w=window.open('','_blank');
  if(!w){alert('Le navigateur a bloqué l’ouverture du dossier. Autorisez les fenêtres contextuelles pour cette page.');return}

  const cfg=st.config||{},c=cfg.closure||{},members=pvMembers(st);
  const products=cfg.products||[],totalSamples=stateTotalSamples(st);
  const expected=totalSamples*Number(cfg.testerCount||0);
  const completed=stateCompletedCount(st),validated=stateValidatedCount(st);
  const suppliers=stateSupplierRanking(st),remarks=stateRemarks(st),timeline=dossierTimeline(st);
  const criteria=dossierCriteriaAverages(st),market=cfg.marketRef||{};
  const closed=!!cfg.juryClose?.closedAt,ready=closureIsReady(st),isFinal=closed&&ready&&validated===Number(cfg.testerCount||0);
  const status=isFinal?'DOSSIER FINAL DU JURY':'DOSSIER PROVISOIRE DU JURY';
  const generatedAt=new Date().toISOString();

  const memberRows=members.length?members.map((m,i)=>`<tr><td>${i+1}</td><td><strong>${reportEsc(m.name)}</strong></td><td>${reportEsc(m.role||'—')}</td></tr>`).join(''):'<tr><td colspan="3">Aucun membre renseigné.</td></tr>';
  const supplierRows=suppliers.length?suppliers.map((r,i)=>`<tr><td class="rank">${i+1}</td><td><strong>${reportEsc(r.supplier)}</strong></td><td>${r.samples}</td><td>${r.count}</td><td class="score">${r.count?fmt(supplierGlobalNote5(r.avg)):'—'}</td></tr>`).join(''):'<tr><td colspan="5">Aucun résultat exploitable.</td></tr>';
  const criterionCards=criteria.map(x=>`<div class="criterion"><small>${reportEsc(x.name)}</small><strong>${x.count?fmt(x.avg):'—'}</strong><span>/ ${fmt(x.max)} · ${x.count} notes</span></div>`).join('');
  const timelineRows=timeline.length?timeline.map(e=>`<div class="timeline-row"><div class="time">${reportEsc(reportDate(e.at))}</div><div><strong>${reportEsc(e.label)}</strong><span>${reportEsc(e.detail)}</span></div></div>`).join(''):'<div class="empty">Aucun événement enregistré.</div>';

  const productSections=products.map((p,pi)=>{
    const rows=pvProductRanking(st,p);
    return `<section class="section page-break-avoid">
      <div class="section-title">Résultats détaillés — ${pi+1}. ${reportEsc(p.code?`${p.code} — `:'')}${reportEsc(p.name||`Produit ${pi+1}`)}</div>
      <table><thead><tr><th>Rang</th><th>Échantillon</th><th>Fournisseur</th><th>Évaluations</th><th>Moyenne /65</th></tr></thead><tbody>
      ${rows.map((r,i)=>`<tr><td class="rank">${i+1}</td><td><strong>${reportEsc(r.sample)}</strong></td><td>${reportEsc(r.supplier)}</td><td>${r.count}</td><td class="score">${r.count?fmt(r.avg):'—'}</td></tr>`).join('')}
      </tbody></table>
    </section>`
  }).join('');

  const remarkRows=remarks.length?remarks.map(r=>`<tr><td>${reportEsc(r.tester)}</td><td>${reportEsc(r.product)}</td><td>${reportEsc(r.sample)}</td><td>${reportEsc(r.supplier)}</td><td>${reportEsc(r.criterion)}</td><td>${reportEsc(r.remark)}</td></tr>`).join(''):'<tr><td colspan="6">Aucune remarque saisie.</td></tr>';
  const observations=c.notes?reportEsc(c.notes).replace(/\n/g,'<br>'):'Aucune observation générale renseignée.';
  const reportNote=String(cfg.reportNote||'').trim();

  const html=`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${reportEsc(status)} — ${reportEsc(cfg.lotName||'Jury')}</title><style>
  @page{size:A4 portrait;margin:12mm}
  *{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#223746;margin:0;background:#eef3f7;font-size:9px;line-height:1.4}
  .toolbar{position:sticky;top:0;z-index:10;background:#173f5c;color:#fff;padding:8px 12px;display:flex;justify-content:space-between;align-items:center}.toolbar button{border:0;border-radius:7px;padding:7px 10px;font-weight:700;cursor:pointer}
  .page{max-width:190mm;margin:14px auto;background:#fff;padding:14mm;box-shadow:0 10px 30px rgba(20,47,67,.10)}
  .cover{min-height:245mm;display:flex;flex-direction:column;justify-content:space-between}.cover-main{margin-top:28mm}.kicker{font-size:8px;text-transform:uppercase;letter-spacing:.15em;color:#71838f;font-weight:700}.cover h1{font-size:27px;color:#173f5c;margin:7px 0 4px}.cover h2{font-size:14px;color:#526b7a;font-weight:500;margin:0}.conf{margin-top:12px;display:inline-block;border-radius:999px;background:#fff0f0;color:#9c2930;padding:5px 8px;font-size:8px;font-weight:700}.cover-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:22px}.cover-cell{border:1px solid #dfe6eb;border-radius:8px;padding:8px}.cover-cell small{display:block;text-transform:uppercase;font-size:7px;color:#7b8a94;font-weight:700}.cover-cell strong{display:block;margin-top:3px;font-size:10px;color:#31546a}.cover-foot{border-top:2px solid #2c7ea8;padding-top:7px;color:#71818b;font-size:8px;display:flex;justify-content:space-between}
  .section{margin:12px 0}.section-title{font-size:12px;font-weight:700;color:#173f5c;border-left:4px solid #2c7ea8;background:#f4f8fa;padding:5px 7px;margin-bottom:7px}.page-break{break-before:page;page-break-before:always}.page-break-avoid{break-inside:avoid;page-break-inside:avoid}
  table{width:100%;border-collapse:collapse}th,td{border:1px solid #dfe6eb;padding:5px 6px;text-align:left;vertical-align:top}th{background:#f2f5f7;text-transform:uppercase;font-size:7px;letter-spacing:.04em;color:#637682}.rank{width:34px;text-align:center;font-weight:700}.score{text-align:right;font-weight:700;color:#174e70}
  .criteria{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.criterion{border:1px solid #dfe6eb;border-radius:8px;padding:7px;background:#fafcfd}.criterion small{display:block;text-transform:uppercase;font-size:7px;color:#74858f;font-weight:700}.criterion strong{display:block;font-size:16px;color:#174e70;margin-top:3px}.criterion span{font-size:7px;color:#7b8a94}
  .timeline{display:grid;gap:6px}.timeline-row{display:grid;grid-template-columns:105px 1fr;gap:8px;border-left:3px solid #cbdbe5;padding:3px 0 3px 8px}.timeline-row .time{font-size:8px;font-weight:700;color:#4d6878}.timeline-row strong{display:block;font-size:9px;color:#2d5066}.timeline-row span{display:block;font-size:8px;color:#75858f;margin-top:1px}
  .observations{border:1px solid #dfe6eb;border-radius:8px;padding:9px;min-height:55px}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}.sig{border:1px solid #cfd9df;border-radius:8px;padding:8px;min-height:95px}.sig strong{display:block;font-size:9px;color:#2f5268}.sig span{display:block;font-size:8px;color:#70818c;margin-top:2px}.sig img{display:block;max-width:100%;height:62px;object-fit:contain;margin-top:4px}
  .warning{border:1px solid #efd19b;background:#fff7e8;color:#765519;padding:7px 8px;border-radius:7px;margin:8px 0}.note{font-size:8px;color:#667985;margin-top:5px}.empty{color:#71818c;padding:7px}
  @media print{body{background:#fff}.toolbar{display:none}.page{max-width:none;margin:0;box-shadow:none;padding:0}.cover{min-height:270mm}}
  </style></head><body>
  <div class="toolbar"><strong>${reportEsc(status)}</strong><button onclick="window.print()">Imprimer / Enregistrer tout le dossier en PDF</button></div>

  <main class="page cover">
    <div class="cover-main">
      <div class="kicker">Jury Marchés · Tests culinaires · ${reportEsc(sourceLabel)}</div>
      <h1>${reportEsc(status)}</h1>
      <h2>${reportEsc(cfg.lotName||'Jury')}${cfg.subtitle?` — ${reportEsc(cfg.subtitle)}`:''}</h2>
      <span class="conf">CONFIDENTIEL — contient la correspondance fournisseurs / échantillons</span>
      <div class="cover-grid">
        <div class="cover-cell"><small>Date du jury</small><strong>${reportEsc(pvDate(c.date))}</strong></div>
        <div class="cover-cell"><small>Lieu</small><strong>${reportEsc(c.place||'—')}</strong></div>
        <div class="cover-cell"><small>Responsable</small><strong>${reportEsc(c.chair||'—')}${c.chairRole?` — ${reportEsc(c.chairRole)}`:''}</strong></div>
        <div class="cover-cell"><small>Composition</small><strong>${products.length} produit(s) · ${totalSamples} échantillon(s) · ${cfg.testerCount||0} testeur(s)</strong></div>
        <div class="cover-cell"><small>Fiches complètes</small><strong>${completed}/${expected||0}</strong></div>
        <div class="cover-cell"><small>Validations définitives</small><strong>${validated}/${cfg.testerCount||0}</strong></div>
        ${market.lot?`<div class="cover-cell" style="grid-column:1/-1"><small>Référence marché</small><strong>Lot ${reportEsc(market.lot)}${market.family?` — ${reportEsc(market.family)}`:''}</strong></div>`:''}
      </div>
      ${!isFinal?`<div class="warning"><strong>Dossier provisoire :</strong> il devient final lorsque le jury est fermé, que la fiche de clôture est complète et que tous les testeurs ont validé.</div>`:''}
    </div>
    <div class="cover-foot"><span>Généré le ${reportEsc(reportDate(generatedAt))}</span><span>${reportEsc(cfg.lotName||'')}</span></div>
  </main>

  <main class="page page-break">
    <section class="section">
      <div class="section-title">1. Traçabilité chronologique du jury</div>
      <div class="timeline">${timelineRows}</div>
    </section>

    <section class="section page-break-avoid">
      <div class="section-title">2. Membres présents</div>
      <table><thead><tr><th>N°</th><th>Nom</th><th>Fonction / établissement</th></tr></thead><tbody>${memberRows}</tbody></table>
    </section>

    <section class="section page-break-avoid">
      <div class="section-title">3. Synthèse globale des fournisseurs</div>
      <table><thead><tr><th>Rang</th><th>Fournisseur</th><th>Échantillons</th><th>Évaluations</th><th>Moyenne /5</th></tr></thead><tbody>${supplierRows}</tbody></table>
      ${products.length>1?'<div class="note">La synthèse globale regroupe plusieurs produits. Les résultats détaillés par produit constituent la lecture de référence pour chaque article.</div>':''}
    </section>

    <section class="section page-break-avoid">
      <div class="section-title">4. Moyennes par critère</div>
      <div class="criteria">${criterionCards}</div>
    </section>

    ${productSections}

    ${reportNote?`<section class="section page-break-avoid">
      <div class="section-title">Note complémentaire / précision technique</div>
      <div class="observations">${reportEsc(reportNote).replace(/\n/g,'<br>')}</div>
    </section>`:''}

    <section class="section page-break">
      <div class="section-title">5. Remarques détaillées du jury</div>
      <table><thead><tr><th>Testeur</th><th>Produit</th><th>Échantillon</th><th>Fournisseur</th><th>Critère</th><th>Remarque</th></tr></thead><tbody>${remarkRows}</tbody></table>
    </section>

    <section class="section page-break-avoid">
      <div class="section-title">6. Observations générales et clôture</div>
      <div class="observations">${observations}</div>
      <div class="signatures">
        <div class="sig"><strong>Responsable / président du jury</strong><span>${reportEsc(c.chair||'Nom non renseigné')}${c.chairRole?` — ${reportEsc(c.chairRole)}`:''}</span>${c.chairSignature?`<img src="${c.chairSignature}" alt="Signature du responsable">`:''}</div>
        <div class="sig"><strong>Second signataire</strong><span>${reportEsc(c.coSigner||'Nom non renseigné')}${c.coSignerRole?` — ${reportEsc(c.coSignerRole)}`:''}</span>${c.coSignature?`<img src="${c.coSignature}" alt="Signature du second signataire">`:''}</div>
      </div>
    </section>

    <section class="section page-break-avoid">
      <div class="section-title">7. Barème utilisé</div>
      <table><thead><tr><th>Critère</th><th>Maximum</th></tr></thead><tbody>
      ${QUESTIONS.map((q,i)=>`<tr><td>${reportEsc(criterionShortsForConfig(st.config)[i]||`Critère ${i+1}`)}</td><td>${fmt(Math.max(...q.weights))} points</td></tr>`).join('')}
      <tr><td><strong>Total</strong></td><td><strong>65 points</strong></td></tr>
      </tbody></table>
    </section>
  </main></body></html>`;

  w.document.open();w.document.write(html);w.document.close();w.focus()
}
function openCurrentDossier(){if(!ensureProductSheetsComplete('ouvrir le dossier complet'))return;openJuryDossier(state,'Jury actif')}
function openArchiveDossier(id){
  const rec=loadArchives().find(x=>x.id===id);
  if(!rec?.state){alert('Archive introuvable.');return}
  openJuryDossier(rec.state,'Archive clôturée')
}


function summaryKeyRemarks(st,limit=8){
  const all=stateRemarks(st);
  if(!all.length)return [];
  const bySample=new Map();
  all.forEach(r=>{
    const k=`${r.product}__${r.sample}`;
    const arr=bySample.get(k)||[];
    arr.push(r);bySample.set(k,arr)
  });
  const ordered=[...bySample.values()].sort((a,b)=>b.length-a.length);
  const out=[];
  for(const group of ordered){
    for(const r of group){
      out.push(r);
      if(out.length>=limit)return out
    }
  }
  return out
}
function openJurySummary(st,sourceLabel='Jury'){
  if(!st?.config?.products?.length){alert('Aucun jury à présenter dans la synthèse.');return}
  const w=window.open('','_blank');
  if(!w){alert('Le navigateur a bloqué l’ouverture de la synthèse. Autorisez les fenêtres contextuelles pour cette page.');return}

  const cfg=st.config||{},c=cfg.closure||{},products=cfg.products||[];
  const totalSamples=stateTotalSamples(st),validated=stateValidatedCount(st),completed=stateCompletedCount(st);
  const expected=totalSamples*Number(cfg.testerCount||0);
  const supplierRank=stateSupplierRanking(st),criteria=dossierCriteriaAverages(st);
  const remarks=summaryKeyRemarks(st,8),market=cfg.marketRef||{};
  const isFinal=!!cfg.juryClose?.closedAt&&closureIsReady(st)&&validated===Number(cfg.testerCount||0);
  const title=isFinal?'SYNTHÈSE FINALE DU JURY':'SYNTHÈSE PROVISOIRE DU JURY';

  const productCards=products.map((p,pi)=>{
    const rows=pvProductRanking(st,p);
    return `<section class="product-card">
      <div class="product-head"><strong>${pi+1}. ${reportEsc(p.code?`${p.code} — `:'')}${reportEsc(p.name||`Produit ${pi+1}`)}</strong><span>${rows.length} échantillon(s)</span></div>
      <table><thead><tr><th>#</th><th>Éch.</th><th class="supplier-col">Fournisseur</th><th>/65</th></tr></thead><tbody>
      ${rows.map((r,i)=>`<tr><td>${i+1}</td><td><strong>${reportEsc(r.sample)}</strong></td><td class="supplier-col">${reportEsc(r.supplier)}</td><td class="score">${r.count?fmt(r.avg):'—'}</td></tr>`).join('')}
      </tbody></table>
    </section>`
  }).join('');

  const supplierRows=supplierRank.length?supplierRank.map((r,i)=>`
    <tr><td>${i+1}</td><td class="supplier-col"><strong>${reportEsc(r.supplier)}</strong></td><td>${r.samples}</td><td>${r.count}</td><td class="score">${r.count?fmt(supplierGlobalNote5(r.avg)):'—'}</td></tr>`
  ).join(''):'<tr><td colspan="5">Aucun résultat exploitable.</td></tr>';

  const criteriaCards=criteria.map(x=>`<div class="criterion"><small>${reportEsc(x.name)}</small><strong>${x.count?fmt(x.avg):'—'}</strong><span>/ ${fmt(x.max)}</span></div>`).join('');

  const remarkRows=remarks.length?remarks.map(r=>`
    <div class="remark"><strong>${reportEsc(r.product)} · Éch. ${reportEsc(r.sample)}</strong><span class="supplier-col"> · ${reportEsc(r.supplier)}</span><br>${reportEsc(r.remark)}</div>`
  ).join(''):'<div class="empty">Aucune remarque saisie.</div>';

  const html=`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${reportEsc(title)} — ${reportEsc(cfg.lotName||'Jury')}</title><style>
  @page{size:A4 landscape;margin:9mm}
  *{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#243746;margin:0;background:#eef3f7;font-size:8px;line-height:1.25}
  .toolbar{position:sticky;top:0;z-index:10;background:#173f5c;color:#fff;padding:7px 10px;display:flex;justify-content:space-between;gap:8px;align-items:center}.toolbar .actions{display:flex;gap:6px}.toolbar button{border:0;border-radius:6px;padding:6px 9px;font-weight:700;cursor:pointer}
  .page{max-width:277mm;margin:10px auto;background:#fff;padding:8mm;box-shadow:0 8px 24px rgba(20,47,67,.10)}
  .header{display:grid;grid-template-columns:1.4fr .6fr;gap:10px;border-bottom:3px solid #173f5c;padding-bottom:7px}.kicker{text-transform:uppercase;letter-spacing:.13em;color:#6b7d89;font-size:7px;font-weight:700}.header h1{font-size:18px;color:#173f5c;margin:3px 0}.header h2{font-size:10px;color:#526b7a;margin:0;font-weight:500}.status{text-align:right}.status strong{display:inline-block;border-radius:999px;padding:4px 7px;background:${isFinal?'#e5f5ed':'#fff0d8'};color:${isFinal?'#166f50':'#8b5b00'};font-size:7px}.status span{display:block;margin-top:5px;color:#72838f}
  .meta{display:grid;grid-template-columns:repeat(6,1fr);gap:5px;margin:7px 0}.meta div{border:1px solid #dfe6eb;border-radius:6px;padding:5px 6px}.meta small{display:block;text-transform:uppercase;color:#798994;font-size:6px;font-weight:700}.meta strong{display:block;font-size:8px;color:#31536a;margin-top:2px}
  .criteria{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin-bottom:7px}.criterion{border:1px solid #dfe6eb;border-radius:6px;padding:5px;background:#fafcfd;text-align:center}.criterion small{display:block;text-transform:uppercase;color:#74858f;font-size:6px;font-weight:700}.criterion strong{font-size:13px;color:#174e70}.criterion span{font-size:6px;color:#71818b}
  .main-grid{display:grid;grid-template-columns:1.15fr 1.85fr;gap:8px;align-items:start}.card{border:1px solid #dfe6eb;border-radius:7px;padding:6px}.card-title{font-size:9px;font-weight:700;color:#173f5c;border-left:3px solid #2c7ea8;padding:3px 5px;background:#f4f8fa;margin-bottom:5px}
  .products{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}.product-card{border:1px solid #dfe6eb;border-radius:6px;overflow:hidden;break-inside:avoid}.product-head{display:flex;justify-content:space-between;gap:5px;background:#f4f8fa;padding:5px}.product-head strong{font-size:8px;color:#254e68}.product-head span{font-size:6px;color:#71818b}
  table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #e4eaee;padding:3px 4px;text-align:left}th{text-transform:uppercase;font-size:6px;color:#687b87;background:#fafbfc}.score{text-align:right;font-weight:700;color:#174e70}
  .remarks{display:grid;grid-template-columns:1fr 1fr;gap:4px}.remark{border:1px solid #e0e7eb;border-radius:5px;padding:4px;color:#526875}.remark strong{color:#2f5268}.obs{border:1px solid #dfe6eb;border-radius:6px;padding:5px;min-height:34px;color:#526875}
  .footer{display:flex;justify-content:space-between;gap:8px;border-top:1px solid #dce4e9;margin-top:7px;padding-top:4px;color:#7a8993;font-size:6px}
  body.anonymized .supplier-col{display:none!important}
  @media print{body{background:#fff}.toolbar{display:none}.page{max-width:none;margin:0;box-shadow:none;padding:0}}
  </style></head><body>
  <div class="toolbar"><strong>${reportEsc(title)}</strong><div class="actions"><button onclick="document.body.classList.toggle('anonymized');this.textContent=document.body.classList.contains('anonymized')?'Afficher fournisseurs':'Version anonymisée'">Version anonymisée</button><button onclick="window.print()">Imprimer / PDF</button></div></div>
  <main class="page">
    <header class="header"><div><div class="kicker">Jury Marchés · Tests culinaires · ${reportEsc(sourceLabel)}</div><h1>${reportEsc(title)}</h1><h2>${reportEsc(cfg.lotName||'Jury')}${cfg.subtitle?` — ${reportEsc(cfg.subtitle)}`:''}</h2></div><div class="status"><strong>${isFinal?'FINAL':'PROVISOIRE'}</strong><span>${market.lot?`Référence marché : lot ${reportEsc(market.lot)}`:''}</span></div></header>

    <section class="meta">
      <div><small>Date</small><strong>${reportEsc(pvDate(c.date))}</strong></div>
      <div><small>Lieu</small><strong>${reportEsc(c.place||'—')}</strong></div>
      <div><small>Responsable</small><strong>${reportEsc(c.chair||'—')}</strong></div>
      <div><small>Testeurs</small><strong>${cfg.testerCount||0}</strong></div>
      <div><small>Fiches complètes</small><strong>${completed}/${expected||0}</strong></div>
      <div><small>Validations</small><strong>${validated}/${cfg.testerCount||0}</strong></div>
    </section>

    <section class="criteria">${criteriaCards}</section>

    <section class="main-grid">
      <div>
        <div class="card">
          <div class="card-title">Synthèse fournisseurs</div>
          <table><thead><tr><th>Rang</th><th class="supplier-col">Fournisseur</th><th>Échant.</th><th>Éval.</th><th>/5</th></tr></thead><tbody>${supplierRows}</tbody></table>
          ${products.length>1?'<div style="font-size:6px;color:#74858f;margin-top:4px">Cette synthèse regroupe plusieurs produits. Lire le détail par produit pour l’interprétation.</div>':''}
        </div>
        <div class="card" style="margin-top:6px"><div class="card-title">Observations générales</div><div class="obs">${c.notes?reportEsc(c.notes).replace(/\n/g,'<br>'):'Aucune observation générale.'}</div></div>
        <div class="card" style="margin-top:6px"><div class="card-title">Remarques marquantes</div><div class="remarks">${remarkRows}</div></div>
      </div>
      <div class="products">${productCards}</div>
    </section>

    <footer class="footer"><span>Document généré le ${reportEsc(reportDate(new Date().toISOString()))}</span><span>Barème total : 65 points</span></footer>
  </main></body></html>`;

  w.document.open();w.document.write(html);w.document.close();w.focus()
}
function openCurrentSummary(){openJurySummary(state,'Jury actif')}
function openArchiveSummary(id){
  const rec=loadArchives().find(x=>x.id===id);
  if(!rec?.state){alert('Archive introuvable.');return}
  openJurySummary(rec.state,'Archive clôturée')
}


function reportRankWithTies(rows,getScore){
  let previous=null,rank=0;
  return rows.map((row,i)=>{
    const score=Number(getScore(row)||0);
    if(previous===null || Math.abs(score-previous)>0.000001)rank=i+1;
    previous=score;
    return {...row,rank};
  });
}
function reportNote5(total,max){
  return max>0?(Number(total||0)/max*5):0;
}
function reportSupplierComments(st,p,sm){
  const positive=new Map(),negative=new Map(),manual=[];
  for(let t=1;t<=Number(st?.config?.testerCount||0);t++){
    const a=st?.testers?.[t]?.answers?.[`${p.id}__${sm.id}`];
    if(!a)continue;
    const questions=juryQuestions(st.config,p);
    for(let qi=0;qi<questions.length;qi++){
      const q=questions[qi]||QUESTIONS[qi];
      const opts=criterionQuickOptions(qi,p,q);
      const posSet=new Set((opts.positive||[]).map(x=>String(x).toLocaleLowerCase('fr')));
      const negSet=new Set((opts.negative||[]).map(x=>String(x).toLocaleLowerCase('fr')));
      getQuickTags(a,qi).forEach(tag=>{
        const clean=String(tag||'').trim();
        if(!clean)return;
        const low=clean.toLocaleLowerCase('fr');
        if(posSet.has(low))positive.set(clean,(positive.get(clean)||0)+1);
        else if(negSet.has(low))negative.set(clean,(negative.get(clean)||0)+1);
      });
      const m=manualRemarkText(a,qi);
      if(m)manual.push(m);
    }
  }
  const order=m=>[...m.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'fr')).map(x=>x[0]);
  return{
    positive:order(positive).slice(0,7),
    negative:order(negative).slice(0,7),
    manual:[...new Set(manual.map(x=>String(x).trim()).filter(Boolean))].slice(0,7)
  };
}
function openJuryReport(st,sourceLabel='Jury en cours'){
  if(!st?.config?.products?.length){alert('Aucun jury à reporter.');return}

  const products=st.config.products||[];
  const testerCount=Number(st.config.testerCount||0);
  const totalSamples=stateTotalSamples(st);
  const expected=totalSamples*testerCount;
  const completed=stateCompletedCount(st);
  const validated=stateValidatedCount(st);
  const isFinal=expected>0&&completed===expected&&validated===testerCount;
  const market=st.config.marketRef||{};
  const reportNote=String(st.config?.reportNote||'').trim();
  const juryConclusion=String(st.config?.juryConclusion||'').trim();
  const generatedAt=new Date().toISOString();
  const closure=st.config?.closure||{};
  const reportStatus=isFinal?(st.config?.juryClose?.closedAt?'RAPPORT FINAL — JURY FERMÉ':'RAPPORT FINAL'):'RAPPORT PROVISOIRE';

  const scoreMaxPerSample=65;
  const maxPerProduct=testerCount*scoreMaxPerSample;
  const maxLot=maxPerProduct*products.length;
  const productNames=products.map((p,i)=>p.name||`Article ${i+1}`);

  /* Correspondance fournisseur / échantillon par article */
  const suppliers=[...new Set(products.flatMap(p=>(p.samples||[]).map(sm=>sm.supplier||'Sans fournisseur')))]
    .sort((a,b)=>a.localeCompare(b,'fr'));

  const supplierRows=suppliers.map(supplier=>{
    const perProduct=products.map(p=>{
      const samples=(p.samples||[]).filter(sm=>(sm.supplier||'Sans fournisseur')===supplier);
      const total=samples.reduce((sum,sm)=>sum+stateSampleStats(st,p,sm).total,0);
      return{
        samples:samples.map(sm=>String(sm.id)).join(', '),
        total
      };
    });
    const total=perProduct.reduce((s,x)=>s+x.total,0);
    return{supplier,perProduct,total,note5:reportNote5(total,maxLot)};
  }).sort((a,b)=>b.total-a.total||a.supplier.localeCompare(b.supplier,'fr'));

  const rankedLot=reportRankWithTies(supplierRows,r=>r.total);

  const correspondenceRows=suppliers.map(supplier=>`<tr>
    <td><strong>${reportEsc(supplier)}</strong></td>
    ${products.map(p=>{
      const ids=(p.samples||[])
        .filter(sm=>(sm.supplier||'Sans fournisseur')===supplier)
        .map(sm=>String(sm.id));
      return `<td>${ids.length?reportEsc(ids.join(', ')):'—'}</td>`;
    }).join('')}
  </tr>`).join('');

  /* Un chapitre par article — V282 : cartes côte à côte et densité adaptative */
  const productSections=products.map((p,pi)=>{
    const supplierStats=(p.samples||[]).map(sm=>{
      const stats=stateSampleStats(st,p,sm);
      return{
        supplier:sm.supplier||'Sans fournisseur',
        sample:String(sm.id),
        total:stats.total,
        note5:reportNote5(stats.total,maxPerProduct),
        stats,
        comments:reportSupplierComments(st,p,sm)
      };
    }).sort((a,b)=>b.total-a.total||a.supplier.localeCompare(b.supplier,'fr'));

    const ranked=reportRankWithTies(supplierStats,r=>r.total);
    const density=ranked.length<=5?'normal':ranked.length<=8?'compact':'dense';

    const rows=ranked.map(r=>`<tr>
      <td class="rank">${r.rank}</td>
      <td><strong>${reportEsc(r.supplier)}</strong></td>
      <td>${reportEsc(r.sample)}</td>
      <td class="score">${fmt(r.total)} / ${fmt(maxPerProduct)}</td>
      <td class="score">${fmt(r.note5)}</td>
    </tr>`).join('');

    const sectionList=(title,items,cls)=>{
      const body=items.length
        ?`<ul>${items.map(x=>`<li>${reportEsc(x)}</li>`).join('')}</ul>`
        :'<div class="comment-empty">Aucun</div>';
      return `<div class="comment-section ${cls}">
        <div class="comment-title">${title}</div>
        ${body}
      </div>`;
    };

    const commentBlocks=ranked.map(r=>`<article class="supplier-comment-card">
      <div class="supplier-comment-head"><strong>${reportEsc(r.supplier)}</strong><span>Échantillon ${reportEsc(r.sample)}</span></div>
      ${sectionList('Arguments positifs',r.comments.positive,'positive')}
      ${sectionList('Arguments négatifs',r.comments.negative,'negative')}
      ${sectionList('Remarques libres',r.comments.manual,'manual')}
    </article>`).join('');

    return `<section class="section product-section page-break density-${density}" data-supplier-count="${ranked.length}">
      <div class="section-kicker">${pi+1}. Article testé</div>
      <h2>${reportEsc(p.name||`Article ${pi+1}`)}</h2>
      ${p.code?`<div class="article-code">Référence / code : ${reportEsc(p.code)}</div>`:''}
      <table class="ranking-table">
        <thead><tr><th>Classement</th><th>Fournisseur</th><th>N° échantillon</th><th>Score / ${fmt(maxPerProduct)}</th><th>Note /5</th></tr></thead>
        <tbody>${rows||'<tr><td colspan="5">Aucun résultat.</td></tr>'}</tbody>
      </table>
      <div class="article-comments-grid">
        ${commentBlocks||'<div class="empty-note">Aucun commentaire saisi pour cet article.</div>'}
      </div>
    </section>`;
  }).join('');

  /* Synthèse générale, comme l'ancien rapport : 3 articles côte à côte */
  const lotHeaderProducts=products.map(p=>`<th>${reportEsc(p.name||'Article')}</th>`).join('');
  const lotRows=rankedLot.map(r=>`<tr>
    <td class="rank">${r.rank}</td>
    <td><strong>${reportEsc(r.supplier)}</strong></td>
    ${r.perProduct.map(x=>`<td>${fmt(x.total)}</td>`).join('')}
    <td class="score">${fmt(r.total)} / ${fmt(maxLot)}</td>
    <td class="score">${fmt(r.note5)}</td>
  </tr>`).join('');

  const closureMembers=(closure.members||[]).filter(x=>x.present!==false);
  const closureSection=closureHasUsefulData(st)?`<section class="section page-break closure-report-page">
    <div class="section-kicker">Clôture administrative</div>
    <h2>Fiche de clôture du jury</h2>
    <div class="closure-report-subtitle">Validation administrative et traçabilité du jury.</div>
    <table class="closure-report-table"><tbody>
      <tr><th>Date de dégustation</th><td>${reportEsc(formatClosureDate(closure.date))}</td><th>Lieu</th><td>${reportEsc(closure.place||'—')}</td></tr>
      <tr><th>Responsable du jury</th><td>${reportEsc(closure.chair||'—')}</td><th>Fonction</th><td>${reportEsc(closure.chairRole||'—')}</td></tr>
      <tr><th>Second signataire</th><td>${reportEsc(closure.coSigner||'—')}</td><th>Fonction</th><td>${reportEsc(closure.coSignerRole||'—')}</td></tr>
      <tr><th>Membres présents</th><td colspan="3">${closureMembers.length?closureMembers.map(x=>`${reportEsc(x.name)}${x.role?` — ${reportEsc(x.role)}`:''}`).join('<br>'):'—'}</td></tr>
      <tr><th>Observations générales</th><td colspan="3">${closure.notes?reportEsc(closure.notes).replace(/\n/g,'<br>'):'Aucune observation générale.'}</td></tr>
    </tbody></table>
    ${closure.chairSignature||closure.coSignature?`<div class="closure-report-signatures">
      <div><strong>Responsable du jury</strong>${closure.chairSignature?`<img src="${closure.chairSignature}" alt="Signature responsable">`:'<span>Signature non renseignée</span>'}</div>
      <div><strong>Second signataire</strong>${closure.coSignature?`<img src="${closure.coSignature}" alt="Signature second signataire">`:'<span>Signature non renseignée</span>'}</div>
    </div>`:''}
  </section>`:'';
  const receptionSection=reportReceptionAnnex(st);
  const productSheetsSection=productSheetAnnexHtml(st);

  const reportTitle=`Rapport sensoriel — ${st.config.lotName||'Jury Marchés'}`;
  const html=`<!doctype html><html lang="fr"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${reportEsc(reportTitle)}</title>
  <style>
    :root{--blue:#1c789d;--navy:#19384d;--ink:#1f2933;--muted:#667784;--line:#cfd9df;--soft:#f6fafc;--green:#137653;--red:#a43c3c}
    *{box-sizing:border-box}
    body{margin:0;background:#eef2f5;color:var(--ink);font-family:Arial,Helvetica,sans-serif}
    .toolbar{position:sticky;top:0;z-index:10;display:flex;justify-content:flex-end;gap:8px;padding:10px 16px;background:#fff;border-bottom:1px solid var(--line)}
    button{border:0;border-radius:9px;padding:10px 14px;font-weight:700;cursor:pointer}.primary{background:var(--blue);color:#fff}.secondary{background:#eef3f6;color:#29485b}
    .page{max-width:920px;margin:18px auto;background:#fff;padding:40px 48px;box-shadow:0 14px 34px rgba(24,45,60,.10)}
    .cover{min-height:930px;display:flex;flex-direction:column;justify-content:flex-start;padding-top:54px}
    h1{font-size:34px;line-height:1.16;margin:0 0 10px;color:#12335a;letter-spacing:-.02em}
    h2{font-size:23px;margin:5px 0 14px;color:#273b49}
    .subtitle{font-size:17px;color:#2f4658;line-height:1.5;margin-bottom:52px}
    .intro{font-size:12px;line-height:1.72;padding:0;margin:0 0 54px;color:#31495b}
    .intro strong{color:#173a61}
    .recap-title{display:flex;align-items:center;justify-content:center;gap:15px;text-align:center;font-size:14px;font-weight:800;color:#173a61;margin:0 0 18px}
    .recap-title:before,.recap-title:after{content:"";height:1px;background:#9ab1c3;flex:1 1 70px;max-width:90px}
    .cover table{font-size:10.5px;margin-top:0;border-color:#aebfcc}
    .cover th{background:#edf4f8;color:#173a61;font-size:10px;padding:10px 7px;line-height:1.35}
    .cover td{padding:9px 7px}
    .cover td:first-child{color:#173a61}
    .cover .small-note{margin-top:12px;font-size:9px;color:#5c7180;line-height:1.45}
    .section{margin-top:28px}
    .page-break{break-before:page;page-break-before:always}
    .section-kicker{font-size:10px;font-weight:800;color:var(--blue);letter-spacing:.08em;text-transform:uppercase}
    .article-code{font-size:10px;color:var(--muted);margin:-7px 0 12px}
    table{width:100%;border-collapse:collapse;font-size:10px;margin-top:10px}
    th,td{border:1px solid #9baab3;padding:7px 6px;text-align:center;vertical-align:middle}
    th{background:#f3f6f8;font-weight:800}
    td:first-child,.rank{font-weight:800}
    .score{font-weight:800;white-space:nowrap}
    .recap-title{text-align:center;font-size:12px;font-weight:800;margin:18px 0 7px}
    .product-section{padding-top:48px;min-height:900px;break-inside:auto}
    .product-section .section-kicker{display:flex;align-items:center;gap:12px;color:#315a78}
    .product-section .section-kicker:after{content:"";height:1px;background:#9ab1c3;flex:1}
    .product-section h2{font-size:31px;color:#12335a;margin:8px 0 4px}
    .product-section .article-code{font-size:11px;margin:0 0 15px;color:#617789}
    .ranking-table{margin-bottom:15px}
    .article-comments-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:16px;align-items:start}
    .supplier-comment-card{border:1px solid #b9cfe0;border-radius:9px;overflow:hidden;background:#fbfdfe;break-inside:avoid;page-break-inside:avoid}
    .supplier-comment-head{display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;padding:8px 10px;background:#e8f2f8;color:#174f78}
    .supplier-comment-head strong{font-size:13px}.supplier-comment-head span{font-size:9.5px;color:#526f84}
    .comment-section{padding:7px 10px;border-top:1px solid #d9e5ec}
    .comment-title{font-size:10px;font-weight:800;margin:0 0 4px}
    .comment-section.positive .comment-title{color:#24704f}.comment-section.positive .comment-title:before{content:"+ ";font-weight:900}
    .comment-section.negative .comment-title{color:#b13b3b}.comment-section.negative .comment-title:before{content:"− ";font-weight:900}
    .comment-section.manual .comment-title{color:#5b7085}.comment-section.manual .comment-title:before{content:"• "}
    .comment-section ul{margin:3px 0 0 17px;padding:0;font-size:9.5px;line-height:1.34}
    .comment-empty{font-size:8.8px;color:#8a98a2;font-style:italic}
    .density-normal .supplier-comment-card:last-child:nth-child(odd){grid-column:1/-1}
    .density-compact .article-comments-grid{gap:7px}.density-compact .supplier-comment-head{padding:6px 8px}.density-compact .supplier-comment-head strong{font-size:11px}.density-compact .comment-section{padding:5px 8px}.density-compact .comment-title{font-size:8.8px}.density-compact .comment-section ul{font-size:8.1px;line-height:1.24}
    .density-dense .article-comments-grid{gap:5px}.density-dense .supplier-comment-head{padding:5px 7px}.density-dense .supplier-comment-head strong{font-size:10px}.density-dense .supplier-comment-head span{font-size:7.5px}.density-dense .comment-section{padding:4px 7px}.density-dense .comment-title{font-size:8px}.density-dense .comment-section ul{font-size:7.3px;line-height:1.18;margin-left:14px}
    ul{margin:4px 0 7px 19px;padding:0;font-size:10.5px;line-height:1.45}
    .lot-summary{padding-top:58px;min-height:880px}
    .lot-summary .section-kicker{color:#315a78}
    .lot-summary h2{font-size:28px!important;color:#12335a;margin:8px 0 22px!important}
    .lot-summary table{font-size:11px}
    .lot-summary th{background:#eaf3f8;color:#173a61;padding:10px 7px}
    .lot-summary td{padding:11px 7px}
    .jury-conclusion-report{margin-top:28px;border:1px solid #b9cfe0;border-radius:10px;background:#f7fbfd;padding:14px 16px;break-inside:avoid}
    .jury-conclusion-title{font-size:13px;font-weight:800;color:#173a61;margin-bottom:8px}
    .jury-conclusion-text{font-size:10.5px;line-height:1.55;color:#31495b;white-space:normal}
    .empty-note{font-size:10px;color:var(--muted);font-style:italic;margin-top:14px}
    .report-note{padding:14px 16px;border:1px solid #cfdbe2;border-left:5px solid var(--blue);background:#f7fbfd;font-size:11px;line-height:1.55}
    .lot-summary h2{text-align:left}
    .footer{margin-top:30px;padding-top:10px;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:10px;color:var(--muted);font-size:9px}
    .small-note{font-size:9px;color:var(--muted);line-height:1.45;margin-top:8px}
    .closure-report-page{padding-top:58px;min-height:880px}
    .closure-report-page h2{font-size:29px;color:#12335a;margin:8px 0 5px}
    .closure-report-subtitle{font-size:10px;color:#6a7f8d;margin-bottom:20px}
    .closure-report-table{font-size:10.5px;margin-top:0}
    .closure-report-table th{background:#eef5f9;color:#315a78;text-align:left}
    .closure-report-table td{text-align:left;padding:10px}
    .closure-report-signatures{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px}
    .closure-report-signatures>div{border:1px solid #c7dbe7;border-radius:9px;padding:9px;min-height:82px}
    .closure-report-signatures strong{display:block;font-size:9px;color:#315a78}
    .closure-report-signatures img{display:block;max-width:100%;height:55px;object-fit:contain;margin-top:4px}
    .closure-report-signatures span{font-size:8px;color:#7a8c98}

    .reception-annex-page{padding-top:48px;min-height:900px}
    .reception-annex-page h2{font-size:28px;color:#12335a;margin:8px 0 5px}
    .reception-annex-stack{display:grid;grid-template-columns:1fr;gap:10px;margin-top:15px}
    .reception-annex-card{border:1px solid #b9cfe0;border-radius:9px;overflow:hidden;background:#fbfdfe;break-inside:avoid;page-break-inside:avoid}
    .reception-annex-head{display:flex;justify-content:space-between;align-items:baseline;gap:10px;background:#e8f2f8;padding:7px 9px;color:#174f78}
    .reception-annex-head strong{display:block;font-size:11px}.reception-annex-head span{display:block;font-size:7.5px;color:#728897}.reception-annex-head>div:last-child{font-size:8px;color:#526f84}
    .reception-meta-table{font-size:7.2px;margin:0}.reception-meta-table th,.reception-meta-table td{padding:3px 4px;text-align:left}
    .reception-report-table{font-size:6.7px;margin:0}.reception-report-table th,.reception-report-table td{padding:3px 2px}
    .reception-signature-report.compact{margin:0;border:0;border-top:1px solid #d8e4eb;border-radius:0;padding:4px 8px;min-height:28px;display:flex;align-items:center;gap:10px}
    .reception-signature-report.compact strong{font-size:7.5px}.reception-signature-report.compact img{max-width:120px;max-height:26px;margin:0}.reception-signature-report.compact span{font-size:7px;margin:0}
    .reception-page-no,.product-eval-page-no{text-align:right;font-size:8px;color:#7a8c98;margin-top:7px}
    .reception-count-3 .reception-annex-stack{gap:7px}.reception-count-3 .reception-annex-head{padding:5px 8px}.reception-count-3 .reception-meta-table{font-size:6.6px}.reception-count-3 .reception-report-table{font-size:6.1px}

    .product-eval-page{padding-top:42px;min-height:900px}
    .product-eval-page h2{font-size:27px;color:#12335a;margin:8px 0 4px}
    .product-eval-stack{display:grid;grid-template-columns:1fr;gap:9px;margin-top:14px}
    .product-annex-card{margin:0!important;border:1px solid #b9cfe0;border-radius:9px;overflow:hidden;background:#fbfdfe;break-inside:avoid;page-break-inside:avoid}
    .product-annex-head{display:flex;align-items:center;justify-content:space-between;gap:12px;background:#e8f2f8;padding:6px 9px}
    .product-annex-head h3{margin:0!important;font-size:10.5px!important;color:#174f78!important}.product-annex-head span{font-size:7.5px!important;color:#6b8190!important}
    .product-annex-note5{min-width:68px;border-left:1px solid #c7dbe7;text-align:center;padding-left:10px}
    .product-annex-note5 small{display:block;font-size:7px;text-transform:uppercase;color:#718695}
    .product-annex-note5 strong{display:block!important;font-size:20px!important;line-height:1;color:#12335a!important;margin-top:2px}
    .product-annex-card table{font-size:6.9px!important;margin:0}.product-annex-card th,.product-annex-card td{padding:3px 4px!important;text-align:left!important}.product-annex-card th{width:19%;background:#f1f6f9;color:#526f84}
    .product-annex-score{margin:0!important;border-left:0!important;border-top:1px solid #d8e4eb;background:#f7fbfd!important;padding:5px 8px!important;font-size:6.8px!important;line-height:1.35!important}
    .product-annex-score strong{display:block;color:#214d68;font-size:7.2px}

    @media print{
      @page{size:A4 portrait;margin:12mm}
      body{background:#fff}
      .toolbar{display:none!important}
      .page{max-width:none;margin:0;padding:0;box-shadow:none}
      .cover{min-height:260mm;padding-top:15mm}
      .page-break{break-before:page;page-break-before:always}
      .product-section{break-inside:auto;page-break-inside:auto;padding-top:14mm;min-height:auto}
      .supplier-comment-card{break-inside:avoid;page-break-inside:avoid}
      .lot-summary{padding-top:16mm;min-height:250mm}
      .closure-report-page{padding-top:16mm;min-height:250mm}
      .reception-annex-page{padding-top:13mm;min-height:250mm}
      .product-eval-page{padding-top:12mm;min-height:250mm}
      .reception-annex-card,.product-annex-card{break-inside:avoid;page-break-inside:avoid}
      table{break-inside:auto}
      tr{break-inside:avoid;page-break-inside:avoid}
    }
    @media(max-width:720px){
      .page{margin:0;padding:22px 15px;box-shadow:none}
      .cover{min-height:auto}
      h1{font-size:25px}
      table{font-size:8px}
      th,td{padding:5px 3px}
    }
  </style></head><body>
    <div class="toolbar">
      <button class="secondary" onclick="window.close()">Fermer</button>
      <button class="primary" onclick="window.print()">🖨️ Imprimer / Enregistrer en PDF</button>
    </div>

    <main class="page">
      <section class="cover">
        <h1>${reportEsc(reportTitle)}</h1>
        <div class="subtitle">${reportEsc(productNames.join(' · '))}</div>

        <div class="intro">
          <strong>Organisation du test :</strong> ${testerCount} testeur${testerCount>1?'s':''} évaluent les ${products.length} article${products.length>1?'s':''} du lot avec le même barème sensoriel de 65 points par article.<br>
          <strong>Barème :</strong> Couleur 10 · Texture 10 · Aspect visuel 10 · Odeur 10 · Goût 25.<br>
          <strong>Capacité maximale :</strong> ${fmt(maxPerProduct)} points par fournisseur et par article, soit ${fmt(maxLot)} points pour l’ensemble du lot.<br>
          ${isFinal
            ?'<strong>Validation du rapport :</strong> rapport définitif après validation de l’ensemble des testeurs.'
            :'<strong>Attention :</strong> rapport provisoire tant que tous les testeurs n’ont pas terminé et validé leur test.'}
          ${market.lot?`<br><strong>Référence marché :</strong> lot ${reportEsc(market.lot)}${market.family?` · ${reportEsc(market.family)}`:''}.`:''}
        </div>

        <div class="recap-title">Tableau récapitulatif — Fournisseurs / numéros d’échantillons</div>
        <table>
          <thead><tr><th>Fournisseur</th>${products.map(p=>`<th>${reportEsc(p.name||'Article')}<br>N° échantillon</th>`).join('')}</tr></thead>
          <tbody>${correspondenceRows||'<tr><td colspan="2">Aucune correspondance.</td></tr>'}</tbody>
        </table>
        <div class="small-note">Les mêmes testeurs participent à l’ensemble des articles du lot afin de rendre la comparaison cohérente.</div>
      </section>

      ${productSections}

      <section class="section lot-summary page-break">
        <div class="section-kicker">Synthèse du lot</div>
        <h2>Résultats complets — ${reportEsc(productNames.join(', '))}</h2>
        <table>
          <thead><tr><th>Classement</th><th>Fournisseur</th>${lotHeaderProducts}<th>Total / ${fmt(maxLot)}</th><th>Note /5</th></tr></thead>
          <tbody>${lotRows||'<tr><td colspan="5">Aucun résultat.</td></tr>'}</tbody>
        </table>
        <div class="small-note">La note sur 5 est calculée automatiquement : total obtenu ÷ total maximal × 5.</div>
        ${juryConclusion?`<div class="jury-conclusion-report">
          <div class="jury-conclusion-title">Conclusion / rapport du jury</div>
          <div class="jury-conclusion-text">${reportEsc(juryConclusion).replace(/\n/g,'<br>')}</div>
        </div>`:''}
      </section>

      ${closureSection}

      ${reportNote?`<section class="section page-break">
        <div class="section-kicker">Note explicative / conformité</div>
        <h2>Observation complémentaire</h2>
        <div class="report-note">${reportEsc(reportNote).replace(/\n/g,'<br>')}</div>
      </section>`:''}

      ${receptionSection}
      ${productSheetsSection}

      <footer class="footer">
        <span>Document généré le ${reportEsc(reportDate(generatedAt))}</span>
        <span>${reportEsc(st.config.lotName||'Jury Marchés')} · ${testerCount} testeur${testerCount>1?'s':''}</span>
      </footer>
    </main>
  </body></html>`;

  const w=window.open('','_blank');
  if(!w){
    alert('Le navigateur a bloqué l’ouverture du rapport. Autorisez les fenêtres contextuelles pour cette page.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
}


function reportPdfSafeName(s){
  return String(s||'rapport')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-zA-Z0-9_-]+/g,'-')
    .replace(/^-+|-+$/g,'')
    .slice(0,70)||'rapport';
}
function reportPdfLines(doc,text,maxWidth){
  return doc.splitTextToSize(String(text||''),maxWidth);
}
function reportPdfNeedPage(doc,y,needed=18){
  if(y+needed>282){
    doc.addPage();
    return 18;
  }
  return y;
}
function reportPdfTitle(doc,title,y){
  y=reportPdfNeedPage(doc,y,20);
  doc.setFont('helvetica','bold');
  doc.setFontSize(15);
  doc.text(String(title||''),14,y);
  doc.setFont('helvetica','normal');
  return y+8;
}
function reportPdfParagraph(doc,text,y,{size=10,bold=false,indent=0}={}){
  y=reportPdfNeedPage(doc,y,16);
  doc.setFont('helvetica',bold?'bold':'normal');
  doc.setFontSize(size);
  const lines=reportPdfLines(doc,text,182-indent);
  lines.forEach(line=>{
    y=reportPdfNeedPage(doc,y,6);
    doc.text(line,14+indent,y);
    y+=5;
  });
  doc.setFont('helvetica','normal');
  return y+2;
}
function reportPdfSimpleTable(doc,headers,rows,y,widths=null){
  const pageW=210, left=14, usable=182;
  const cols=headers.length;
  const ws=widths&&widths.length===cols?widths:Array(cols).fill(usable/cols);
  const rowH=8;

  const drawHeader=()=>{
    y=reportPdfNeedPage(doc,y,rowH+4);
    let x=left;
    doc.setFont('helvetica','bold');
    doc.setFontSize(8);
    headers.forEach((h,i)=>{
      doc.rect(x,y-rowH+2,ws[i],rowH);
      const lines=reportPdfLines(doc,h,ws[i]-3).slice(0,2);
      doc.text(lines,x+1.5,y-2.2);
      x+=ws[i];
    });
    doc.setFont('helvetica','normal');
    y+=2;
  };

  drawHeader();
  doc.setFontSize(8);

  rows.forEach(row=>{
    y=reportPdfNeedPage(doc,y,rowH+4);
    if(y===18)drawHeader();
    let x=left;
    row.forEach((cell,i)=>{
      doc.rect(x,y-rowH+2,ws[i],rowH);
      const lines=reportPdfLines(doc,String(cell??''),ws[i]-3).slice(0,2);
      doc.text(lines,x+1.5,y-2.2);
      x+=ws[i];
    });
    y+=rowH;
  });

  return y+4;
}
function reportPdfLabelLineV281(doc,label,text,y){
  doc.setFontSize(9);
  doc.setTextColor(23,58,97);
  doc.setFont('helvetica','bold');
  doc.text(label,14,y);
  const x=14+doc.getTextWidth(label)+1.5;
  doc.setFont('helvetica','normal');
  doc.setTextColor(49,73,91);
  const lines=doc.splitTextToSize(String(text||''),196-x);
  doc.text(lines,x,y);
  return y+Math.max(7,lines.length*5);
}
function reportPdfFirstPageTableV281(doc,products,suppliers,y){
  const left=14,usable=182,first=52;
  const n=Math.max(1,products.length),other=(usable-first)/n;
  const widths=[first,...Array(n).fill(other)];
  const headerH=16,rowH=10;
  doc.setDrawColor(174,191,204);doc.setLineWidth(.25);
  let x=left;
  doc.setFillColor(237,244,248);
  doc.setFont('helvetica','bold');doc.setTextColor(23,58,97);doc.setFontSize(8.5);
  doc.rect(x,y,widths[0],headerH,'FD');
  doc.text('Fournisseur',x+widths[0]/2,y+9.5,{align:'center'});
  x+=widths[0];
  products.forEach((p,i)=>{
    doc.rect(x,y,widths[i+1],headerH,'FD');
    doc.text(String(p.name||('Article '+(i+1))),x+widths[i+1]/2,y+6,{align:'center',maxWidth:widths[i+1]-4});
    doc.setFontSize(7.5);
    doc.text('N° échantillon',x+widths[i+1]/2,y+11.5,{align:'center'});
    doc.setFontSize(8.5);
    x+=widths[i+1];
  });
  let yy=y+headerH;
  suppliers.forEach(supplier=>{
    x=left;
    doc.setFont('helvetica','bold');doc.setTextColor(23,58,97);
    doc.rect(x,yy,widths[0],rowH);
    doc.text(String(supplier),x+widths[0]/2,yy+6.5,{align:'center',maxWidth:widths[0]-4});
    x+=widths[0];
    doc.setFont('helvetica','normal');doc.setTextColor(49,73,91);
    products.forEach((p,i)=>{
      const ids=(p.samples||[]).filter(sm=>(sm.supplier||'Sans fournisseur')===supplier).map(sm=>String(sm.id));
      doc.rect(x,yy,widths[i+1],rowH);
      doc.text(ids.length?ids.join(', '):'—',x+widths[i+1]/2,yy+6.5,{align:'center'});
      x+=widths[i+1];
    });
    yy+=rowH;
  });
  return yy;
}

function reportPdfCommentCardDataV282(doc,r,width,density){
  const font=density==='dense'?6.2:density==='compact'?6.8:7.5;
  const lineH=density==='dense'?2.8:density==='compact'?3.1:3.4;
  const textW=width-8;
  const groups=[
    {title:'Arguments positifs',items:r.comments?.positive||[],rgb:[36,112,79]},
    {title:'Arguments négatifs',items:r.comments?.negative||[],rgb:[177,59,59]},
    {title:'Remarques libres',items:r.comments?.manual||[],rgb:[91,112,133]}
  ];
  let h=9;
  const prepared=groups.map(g=>{
    const items=g.items.length?g.items:['Aucun'];
    const lines=[];
    items.forEach(item=>{
      const wrapped=doc.splitTextToSize((g.items.length?'• ':'')+String(item),textW);
      wrapped.forEach(x=>lines.push(x));
    });
    h+=4+Math.max(lineH,lines.length*lineH)+2;
    return {...g,lines};
  });
  return{font,lineH,h,groups:prepared};
}
function reportPdfDrawCommentCardV282(doc,r,x,y,w,density,forcedH=null){
  const data=reportPdfCommentCardDataV282(doc,r,w,density);
  const h=Math.max(data.h,forcedH||0);
  doc.setDrawColor(185,207,224);doc.setFillColor(251,253,254);doc.roundedRect(x,y,w,h,2,2,'FD');
  doc.setFillColor(232,242,248);doc.rect(x,y,w,8,'F');
  doc.setTextColor(23,79,120);doc.setFont('helvetica','bold');doc.setFontSize(density==='dense'?7.5:8.5);
  doc.text(String(r.supplier||''),x+3,y+5.2,{maxWidth:w-28});
  doc.setFont('helvetica','normal');doc.setFontSize(density==='dense'?6.3:7.1);doc.setTextColor(82,111,132);
  doc.text('Éch. '+String(r.sample||''),x+w-3,y+5.2,{align:'right'});
  let yy=y+12;
  data.groups.forEach(g=>{
    doc.setFont('helvetica','bold');doc.setFontSize(data.font);doc.setTextColor(...g.rgb);
    doc.text(g.title,x+3,yy);yy+=3.5;
    doc.setFont('helvetica','normal');doc.setTextColor(49,73,91);
    g.lines.forEach(line=>{doc.text(line,x+4,yy,{maxWidth:w-8});yy+=data.lineH;});
    yy+=2;
  });
  return h;
}
function reportPdfProductCardsV282(doc,ranked,y){
  const count=ranked.length;if(!count)return y;
  const density=count<=5?'normal':count<=8?'compact':'dense';
  const gap=5,left=14,usable=182,colW=(usable-gap)/2;
  let i=0;
  while(i<count){
    const lastSingle=(density==='normal'&&count%2===1&&i===count-1);
    if(lastSingle){
      const h=reportPdfCommentCardDataV282(doc,ranked[i],usable,density).h;
      if(y+h>282){doc.addPage();y=18;}
      reportPdfDrawCommentCardV282(doc,ranked[i],left,y,usable,density,h);
      y+=h+5;i++;continue;
    }
    const a=ranked[i],b=ranked[i+1];
    const ha=reportPdfCommentCardDataV282(doc,a,colW,density).h;
    const hb=b?reportPdfCommentCardDataV282(doc,b,colW,density).h:0;
    const rowH=Math.max(ha,hb);
    if(y+rowH>282){doc.addPage();y=18;}
    reportPdfDrawCommentCardV282(doc,a,left,y,colW,density,rowH);
    if(b)reportPdfDrawCommentCardV282(doc,b,left+colW+gap,y,colW,density,rowH);
    y+=rowH+5;i+=2;
  }
  return y;
}
function reportPdfConclusionBoxV282(doc,text,y){
  const lines=doc.splitTextToSize(String(text||''),174);
  const h=14+Math.max(8,lines.length*4.2);
  if(y+h>282){doc.addPage();y=24;}
  doc.setDrawColor(185,207,224);doc.setFillColor(247,251,253);doc.roundedRect(14,y,182,h,2,2,'FD');
  doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(23,58,97);doc.text('Conclusion / rapport du jury',18,y+7);
  doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(49,73,91);doc.text(lines,18,y+13);
  return y+h+4;
}

function appendClosurePdfV284(doc,st){
  if(!closureHasUsefulData(st))return;
  const c=st?.config?.closure||{};
  doc.addPage();

  let y=28;
  doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.setTextColor(49,90,120);
  doc.text('Clôture administrative',14,y);
  doc.setDrawColor(154,177,195);doc.line(50,y-1,196,y-1);

  y+=10;
  doc.setFontSize(20);doc.setTextColor(18,51,90);
  doc.text('Fiche de clôture du jury',14,y);

  y+=8;
  doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(92,113,128);
  doc.text('Validation administrative et traçabilité du jury.',14,y);
  y+=9;

  const rows=[
    ['Date de dégustation',formatClosureDate(c.date),'Lieu',c.place||'—'],
    ['Responsable du jury',c.chair||'—','Fonction',c.chairRole||'—'],
    ['Second signataire',c.coSigner||'—','Fonction',c.coSignerRole||'—']
  ];
  const widths=[40,51,40,51],rowH=11;

  rows.forEach(row=>{
    let x=14;
    row.forEach((val,i)=>{
      doc.setDrawColor(199,219,231);
      if(i===0||i===2){
        doc.setFillColor(241,247,250);doc.rect(x,y,widths[i],rowH,'FD');
        doc.setFont('helvetica','bold');doc.setTextColor(82,111,132);
      }else{
        doc.rect(x,y,widths[i],rowH);
        doc.setFont('helvetica','normal');doc.setTextColor(49,73,91);
      }
      doc.setFontSize(7);
      doc.text(doc.splitTextToSize(String(val||'—'),widths[i]-4).slice(0,2),x+2,y+5,{maxWidth:widths[i]-4});
      x+=widths[i];
    });
    y+=rowH;
  });

  y+=10;
  doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(23,58,97);
  doc.text('Membres présents',14,y);y+=6;

  const members=(c.members||[]).filter(x=>x.present!==false).map(x=>x.name+(x.role?' — '+x.role:''));
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(49,73,91);
  const memberLines=doc.splitTextToSize(members.length?members.join(' · '):'—',182);
  doc.text(memberLines,14,y);y+=memberLines.length*4+9;

  doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(23,58,97);
  doc.text('Observations générales',14,y);y+=6;
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(49,73,91);
  const obs=doc.splitTextToSize(c.notes||'Aucune observation générale.',182);
  doc.text(obs,14,y);y+=obs.length*4+10;

  if(c.chairSignature||c.coSignature){
    doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(82,111,132);
    doc.text('Responsable du jury',14,y);
    doc.text('Second signataire',108,y);
    try{if(c.chairSignature)doc.addImage(c.chairSignature,'PNG',14,y+3,70,24);}catch(e){}
    try{if(c.coSignature)doc.addImage(c.coSignature,'PNG',108,y+3,70,24);}catch(e){}
  }
}

async function buildReportPdfBlob(st=state){
  const JsPDF=window.jspdf?.jsPDF;
  if(!JsPDF)throw new Error('Le module PDF n’est pas chargé. Vérifiez la connexion Internet puis réessayez.');

  const doc=new JsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  const products=st.config?.products||[];
  const testerCount=Number(st.config?.testerCount||0);
  const maxPerProduct=testerCount*65;
  const maxLot=maxPerProduct*products.length;
  const reportNote=String(st.config?.reportNote||'').trim();
  const juryConclusion=String(st.config?.juryConclusion||'').trim();

  const totalSamplesPdf=(st.config?.products||[]).reduce((n,p)=>n+(p.samples||[]).length,0);
  const expectedPdf=totalSamplesPdf*testerCount;
  const completedPdf=stateCompletedCount(st);
  const validatedPdf=stateValidatedCount(st);
  const isFinalPdf=expectedPdf>0&&completedPdf===expectedPdf&&validatedPdf===testerCount;

  const suppliers=[...new Set(products.flatMap(p=>(p.samples||[]).map(sm=>sm.supplier||'Sans fournisseur')))]
    .sort((a,b)=>a.localeCompare(b,'fr'));

  let y=30;
  doc.setTextColor(18,51,90);
  doc.setFont('helvetica','bold');
  doc.setFontSize(20);
  doc.text(`Rapport sensoriel — ${st.config?.lotName||'Jury Marchés'}`,14,y,{maxWidth:182});
  y+=11;

  doc.setFont('helvetica','normal');
  doc.setFontSize(12);
  doc.setTextColor(47,70,88);
  const subtitle=products.map((p,i)=>p.name||`Article ${i+1}`).join(' · ');
  doc.text(subtitle,14,y,{maxWidth:182});
  y+=20;

  y=reportPdfLabelLineV281(
    doc,'Organisation du test :',
    `${testerCount} testeur${testerCount>1?'s':''} évaluent les ${products.length} article${products.length>1?'s':''} du lot avec le même barème sensoriel de 65 points par article.`,y
  );
  y=reportPdfLabelLineV281(doc,'Barème :','Couleur 10 · Texture 10 · Aspect visuel 10 · Odeur 10 · Goût 25.',y);
  y=reportPdfLabelLineV281(
    doc,'Capacité maximale :',
    `${maxPerProduct} points par fournisseur et par article, soit ${maxLot} points pour l’ensemble du lot.`,y
  );
  y=reportPdfLabelLineV281(
    doc,isFinalPdf?'Validation du rapport :':'Attention :',
    isFinalPdf?'rapport définitif après validation de l’ensemble des testeurs.':'rapport provisoire tant que tous les testeurs n’ont pas terminé et validé leur test.',y
  );

  y+=15;
  const sectionTitle='Tableau récapitulatif — Fournisseurs / numéros d’échantillons';
  doc.setFont('helvetica','bold');doc.setFontSize(12.5);doc.setTextColor(23,58,97);
  const tw=doc.getTextWidth(sectionTitle),cx=105;
  doc.setDrawColor(154,177,195);doc.setLineWidth(.3);
  doc.line(14,y-1,Math.max(14,cx-tw/2-6),y-1);
  doc.line(Math.min(196,cx+tw/2+6),y-1,196,y-1);
  doc.text(sectionTitle,cx,y,{align:'center'});
  y+=9;

  y=reportPdfFirstPageTableV281(doc,products,suppliers,y);
  y+=8;
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(92,113,128);
  doc.text('Les mêmes testeurs participent à l’ensemble des articles du lot afin de rendre la comparaison cohérente.',14,y,{maxWidth:182});

  // Chapitre par article — V282 : même présentation pour chaque article, jusqu'à 10 fournisseurs
  products.forEach((p,pi)=>{
    doc.addPage(); y=26;
    doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.setTextColor(49,90,120);
    doc.text(`${pi+1}. Article testé`,14,y);
    doc.setDrawColor(154,177,195);doc.line(42,y-1,196,y-1);
    y+=10;
    doc.setFont('helvetica','bold');doc.setFontSize(21);doc.setTextColor(18,51,90);
    doc.text(String(p.name||`Article ${pi+1}`),14,y);
    y+=7;
    if(p.code){
      doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(97,119,137);
      doc.text('Référence / code : '+String(p.code),14,y);y+=7;
    }

    const rows=(p.samples||[]).map(sm=>{
      const stats=stateSampleStats(st,p,sm);
      return{
        supplier:sm.supplier||'Sans fournisseur',
        sample:String(sm.id),
        total:stats.total,
        note5:reportNote5(stats.total,maxPerProduct),
        comments:reportSupplierComments(st,p,sm)
      };
    }).sort((a,b)=>b.total-a.total||a.supplier.localeCompare(b.supplier,'fr'));

    const ranked=reportRankWithTies(rows,r=>r.total);
    y=reportPdfSimpleTable(
      doc,
      ['Classement','Fournisseur','N° échantillon',`Score / ${maxPerProduct}`,'Note /5'],
      ranked.map(r=>[r.rank,r.supplier,r.sample,`${fmt(r.total)} / ${fmt(maxPerProduct)}`,fmt(r.note5)]),
      y,
      [25,62,31,40,24]
    );
    y=reportPdfProductCardsV282(doc,ranked,y+4);
  });

  // Synthèse du lot — V282 : page harmonisée
  doc.addPage(); y=32;
  doc.setFont('helvetica','bold');doc.setFontSize(20);doc.setTextColor(18,51,90);
  doc.text('Résultats complets — '+products.map(p=>p.name||'Article').join(', '),14,y,{maxWidth:182});
  y+=14;

  const supplierRows=suppliers.map(supplier=>{
    const perProduct=products.map(p=>{
      const samples=(p.samples||[]).filter(sm=>(sm.supplier||'Sans fournisseur')===supplier);
      return samples.reduce((sum,sm)=>sum+stateSampleStats(st,p,sm).total,0);
    });
    const total=perProduct.reduce((s,n)=>s+n,0);
    return{supplier,perProduct,total,note5:reportNote5(total,maxLot)};
  }).sort((a,b)=>b.total-a.total||a.supplier.localeCompare(b.supplier,'fr'));

  const rankedLot=reportRankWithTies(supplierRows,r=>r.total);
  const sumHeaders=['Rang','Fournisseur',...products.map(p=>p.name||'Article'),'Total','/5'];
  const fixed=15+45+30+20;
  const per=(182-fixed)/Math.max(1,products.length);
  const sumWidths=[15,45,...Array(products.length).fill(per),30,20];
  y=reportPdfSimpleTable(
    doc,
    sumHeaders,
    rankedLot.map(r=>[r.rank,r.supplier,...r.perProduct.map(n=>fmt(n)),`${fmt(r.total)} / ${fmt(maxLot)}`,fmt(r.note5)]),
    y,
    sumWidths
  );
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(92,113,128);
  doc.text('La note sur 5 est calculée automatiquement : total obtenu ÷ total maximal × 5.',14,y+2);
  y+=10;
  if(juryConclusion)y=reportPdfConclusionBoxV282(doc,juryConclusion,y);

  // Fiche de clôture directement après la synthèse et la conclusion.
  appendClosurePdfV284(doc,st);

  if(reportNote){
    doc.addPage(); y=24;
    y=reportPdfTitle(doc,'Note explicative / conformité',y);
    y=reportPdfParagraph(doc,reportNote,y,{size:10});
  }

  // Annexes de réception signées
  appendReceptionAnnexPdf(doc,st);

  // Fiches d'évaluation produit
  appendProductSheetsPdf(doc,st);

  // Pied de page sur toutes les pages
  const pages=doc.getNumberOfPages();
  for(let i=1;i<=pages;i++){
    doc.setPage(i);
    doc.setFont('helvetica','normal');
    doc.setFontSize(8);
    doc.text(`${st.config?.lotName||'Jury Marchés'} — page ${i}/${pages}`,14,290);
  }

  const filename=`rapport-sensoriel-${reportPdfSafeName(st.config?.lotName||'jury')}.pdf`;
  return {blob:doc.output('blob'),filename,pages};
}
async function emailCurrentReport(){
  if(!ensureProductSheetsComplete('envoyer le rapport final'))return;

  const btn=$('#simpleResultsEmailBtn');
  const old=btn?.textContent||'📧 Envoyer le rapport final';

  /* Ouvrir une fenêtre immédiatement pendant le clic utilisateur pour éviter
     que Chrome bloque Gmail après la génération asynchrone du PDF. */
  let gmailWindow=null;
  try{
    gmailWindow=window.open('about:blank','_blank');
  }catch(e){}

  try{
    if(btn){
      btn.disabled=true;
      btn.textContent='⏳ Création du rapport final…';
    }

    const {blob,filename}=await buildReportPdfBlob(state);

    /* Télécharger le PDF afin qu'il puisse être joint dans Gmail. */
    const fileUrl=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=fileUrl;
    a.download=filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(fileUrl),10000);

    const lot=state.config?.lotName||'Jury Marchés';
    const subject=`Rapport final — ${lot}`;
    const body=`Bonjour,

Veuillez trouver le rapport final du jury « ${lot} ».

Le fichier PDF « ${filename} » vient d’être téléchargé sur cet appareil. Merci de le joindre à ce message avant l’envoi.

Cordialement`;

    const gmailUrl='https://mail.google.com/mail/?view=cm&fs=1&su='+
      encodeURIComponent(subject)+'&body='+encodeURIComponent(body);

    if(gmailWindow && !gmailWindow.closed){
      gmailWindow.location.href=gmailUrl;
    }else{
      gmailWindow=window.open(gmailUrl,'_blank');
    }

    if(!gmailWindow){
      alert('Le rapport final a bien été téléchargé, mais Chrome a bloqué l’ouverture de Gmail. Autorisez les fenêtres pop-up puis réessayez.');
      return;
    }

    toast('Rapport final téléchargé · Gmail ouvert ✓');
  }catch(e){
    try{if(gmailWindow&&!gmailWindow.closed)gmailWindow.close();}catch(_){}
    console.error(e);
    alert(`Impossible de préparer le rapport final. ${e?.message||e}`);
  }finally{
    if(btn){
      btn.disabled=false;
      btn.textContent=old;
    }
  }
}

function openCurrentReport(){if(!ensureProductSheetsComplete('générer le rapport final'))return;openJuryReport(state,'Jury actif')}
function openArchiveReport(id){const rec=loadArchives().find(x=>x.id===id);if(!rec)return;openJuryReport(rec.state,'Archive clôturée')}

function archivedTotalSamples(st){return (st?.config?.products||[]).reduce((n,p)=>n+(p.samples||[]).length,0)}
function archivedComplete(a){return !!a&&Array.isArray(a.choices)&&a.choices.length===QUESTIONS.length&&a.choices.every(x=>x!==null&&x!==undefined)}
function archivedScore(a){return (a?.choices||[]).reduce((sum,idx,q)=>sum+(idx==null?0:(QUESTIONS[q]?.weights?.[idx]||0)),0)}
function archivedSupplierRanking(st){const map=new Map();for(const p of st?.config?.products||[])for(const sm of p.samples||[]){const k=sm.supplier||'Sans fournisseur';let cur=map.get(k)||{supplier:k,total:0,count:0,samples:0};cur.samples++;for(let t=1;t<=Number(st.config.testerCount||0);t++){const a=st.testers?.[t]?.answers?.[`${p.id}__${sm.id}`];if(archivedComplete(a)){cur.total+=archivedScore(a);cur.count++}}map.set(k,cur)}return [...map.values()].map(x=>({...x,avg:x.count?x.total/x.count:0})).sort((a,b)=>b.avg-a.avg||b.total-a.total||a.supplier.localeCompare(b.supplier))}

function archivedRemarks(st){
  const rows=[];
  for(let t=1;t<=Number(st?.config?.testerCount||0);t++){
    for(const p of st?.config?.products||[]){
      for(const sm of p.samples||[]){
        const a=st?.testers?.[t]?.answers?.[`${p.id}__${sm.id}`];
        if(!a)continue;
        for(let qi=0;qi<QUESTIONS.length;qi++){
          const txt=manualRemarkText(a,qi);
          if(!txt)continue;
          rows.push({
            tester:st?.testers?.[t]?.name||`Testeur ${t}`,
            product:p.name,
            sample:sm.id,
            supplier:sm.supplier||'—',
            criterion:criterionShortsForConfig(st?.config,p)[qi]||`Critère ${qi+1}`,
            remark:txt
          });
        }
      }
    }
  }
  return rows;
}
function formatArchiveDate(v){try{return new Date(v).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}catch(e){return String(v||'')}}
function archiveCurrentJury(){if(!ensureProductSheetsComplete('archiver le jury'))return;const m=juryMetrics();if(!(m.max>0&&m.done===m.max&&m.validated===state.config.testerCount)){alert('Le jury ne peut être archivé que lorsque tous les testeurs ont terminé et validé leur test.');return}if(!isJuryClosed()){alert('Fermez d’abord officiellement le jury.');return}if(!closureIsReady()){alert('Complétez d’abord la fiche de clôture : date, lieu et responsable du jury.');renderClosure();return}const previous=state.config?._archive||{};if(previous.archivedAt&&!confirm('Ce jury est déjà archivé. Mettre à jour son archive avec les résultats actuels ?'))return;const now=new Date().toISOString();const id=previous.archiveId||((typeof crypto!=='undefined'&&crypto.randomUUID)?crypto.randomUUID():`archive_${Date.now()}`);state.config._archive={archiveId:id,archivedAt:now,cloudSessionId:(typeof cloudCfg!=='undefined'&&cloudCfg.sessionId)?cloudCfg.sessionId:(previous.cloudSessionId||null)};saveState();const rec={id,archivedAt:now,cloudSessionId:state.config._archive.cloudSessionId,state:deepClone(state)};const list=loadArchives();const i=list.findIndex(x=>x.id===id);if(i>=0)list[i]=rec;else list.unshift(rec);saveArchives(list.slice(0,100));renderAdmin();toast(previous.archivedAt?'Archive mise à jour ✓':'Jury archivé ✓')}

function statsFilterValues(){
  return{
    year:$('#statsYear')?.value||'',
    product:$('#statsProduct')?.value||'',
    supplier:$('#statsSupplier')?.value||''
  }
}
function statsArchiveDate(rec){
  return rec?.state?.config?.closure?.date||rec?.state?.config?.juryClose?.closedAt||rec?.archivedAt||''
}
function statsFillSelect(id,values,placeholder){
  const s=$(id);if(!s)return;const old=s.value;
  s.innerHTML=`<option value="">${escapeHtml(placeholder)}</option>`+values.map(v=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
  if(values.includes(old))s.value=old
}
function statsBaseArchives(){
  return loadArchives().sort((a,b)=>String(statsArchiveDate(a)).localeCompare(String(statsArchiveDate(b))))
}
function populateStatsFilters(){
  const all=statsBaseArchives();
  const years=[...new Set(all.map(archiveYear).filter(Boolean))].sort((a,b)=>b.localeCompare(a));
  const products=[...new Set(all.flatMap(archiveProducts))].sort((a,b)=>a.localeCompare(b,'fr'));
  const suppliers=[...new Set(all.flatMap(archiveSuppliers))].sort((a,b)=>a.localeCompare(b,'fr'));
  statsFillSelect('#statsYear',years,'Toutes les années');
  statsFillSelect('#statsProduct',products,'Tous les produits');
  statsFillSelect('#statsSupplier',suppliers,'Tous les fournisseurs')
}
function statsRows(){
  const f=statsFilterValues(),archives=statsBaseArchives();
  const rows=[];
  archives.forEach(rec=>{
    if(f.year&&archiveYear(rec)!==f.year)return;
    const st=rec.state||{},cfg=st.config||{};
    for(const p of cfg.products||[]){
      if(f.product&&String(p.name||'')!==f.product)continue;
      for(const sm of p.samples||[]){
        if(f.supplier&&String(sm.supplier||'')!==f.supplier)continue;
        for(let t=1;t<=Number(cfg.testerCount||0);t++){
          const a=st.testers?.[t]?.answers?.[`${p.id}__${sm.id}`];
          if(!archivedComplete(a))continue;
          const criteria=QUESTIONS.map((q,qi)=>{
            const idx=a.choices?.[qi];
            return idx==null?null:q.weights[idx]
          });
          rows.push({
            archiveId:rec.id,
            archivedAt:rec.archivedAt||'',
            date:statsArchiveDate(rec),
            year:archiveYear(rec),
            lot:cfg.lotName||'',
            product:p.name||'Sans produit',
            sample:sm.id||'',
            supplier:sm.supplier||'Sans fournisseur',
            tester:t,
            score:archivedScore(a),
            criteriaNames:criterionShortsForConfig(cfg,p),
            criteria
          })
        }
      }
    }
  });
  return rows
}
function statsArchivesForFilters(rows){
  return [...new Set(rows.map(r=>r.archiveId))]
}
function avgNums(arr){return arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:0}
function statsAggregateBy(rows,key){
  const map=new Map();
  rows.forEach(r=>{
    const k=String(r[key]||'—');
    const x=map.get(k)||{name:k,total:0,count:0,juries:new Set(),samples:new Set(),last:''};
    x.total+=r.score;x.count++;x.juries.add(r.archiveId);x.samples.add(`${r.archiveId}__${r.product}__${r.sample}`);
    if(String(r.date||'')>String(x.last||''))x.last=r.date||'';
    map.set(k,x)
  });
  return [...map.values()].map(x=>({
    ...x,avg:x.count?x.total/x.count:0,juryCount:x.juries.size,sampleCount:x.samples.size
  })).sort((a,b)=>b.avg-a.avg||b.count-a.count||a.name.localeCompare(b.name,'fr'))
}
function statsJuryTimeline(rows){
  const map=new Map();
  rows.forEach(r=>{
    const x=map.get(r.archiveId)||{id:r.archiveId,lot:r.lot,date:r.date,total:0,count:0};
    x.total+=r.score;x.count++;if(!x.date)x.date=r.date;if(!x.lot)x.lot=r.lot;map.set(r.archiveId,x)
  });
  return [...map.values()].map(x=>({...x,avg:x.count?x.total/x.count:0}))
    .sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')))
}
function statsFormatDate(v){
  if(!v)return '—';
  try{return new Date(String(v).length===10?`${v}T12:00:00`:v).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'2-digit'})}catch(e){return String(v)}
}
function renderStatsBars(target,items,maxItems=10){
  const box=$(target);if(!box)return;
  if(!items.length){box.innerHTML='<div class="stats-empty">Aucune donnée avec les filtres actuels.</div>';return}
  box.innerHTML=items.slice(0,maxItems).map(x=>`<div class="stats-bar-row">
    <div class="label"><strong title="${escapeHtml(x.name)}">${escapeHtml(x.name)}</strong><span>${x.count} évaluation${x.count>1?'s':''} · ${x.juryCount} jury${x.juryCount>1?'s':''}</span></div>
    <div class="stats-bar"><i style="width:${Math.max(0,Math.min(100,(x.avg/65)*100))}%"></i></div>
    <div class="stats-value"><strong>${fmt(x.avg)}</strong><span>/65</span></div>
  </div>`).join('')
}
function renderStats(){
  updateHeader();showView('statsView');$('#headerTitle').textContent='Statistiques';$('#headerSub').textContent='Analyse des jurys archivés';
  populateStatsFilters();
  const f=statsFilterValues(),rows=statsRows(),juryIds=statsArchivesForFilters(rows);
  const suppliers=statsAggregateBy(rows,'supplier'),products=statsAggregateBy(rows,'product'),timeline=statsJuryTimeline(rows);
  const uniqueProducts=[...new Set(rows.map(r=>r.product))],uniqueSuppliers=[...new Set(rows.map(r=>r.supplier))];
  const overall=avgNums(rows.map(r=>r.score));
  $('#statsJuries').textContent=juryIds.length;
  $('#statsEvaluations').textContent=rows.length;
  $('#statsProducts').textContent=uniqueProducts.length;
  $('#statsSuppliers').textContent=uniqueSuppliers.length;
  $('#statsOverallAvg').textContent=rows.length?fmt(overall):'—';
  const scope=[];
  if(f.year)scope.push(f.year);if(f.product)scope.push(f.product);if(f.supplier)scope.push(f.supplier);
  $('#statsScopeTitle').textContent=scope.length?scope.join(' · '):'Toutes les archives';
  $('#statsScopeDetail').textContent=rows.length?`${rows.length} évaluation${rows.length>1?'s':''} complète${rows.length>1?'s':''} issue${rows.length>1?'s':''} de ${juryIds.length} jury${juryIds.length>1?'s':''}.`:'Aucune évaluation complète ne correspond aux filtres actuels.';
  $('#statsSupplierCountLabel').textContent=`${suppliers.length} fournisseur${suppliers.length>1?'s':''}`;
  $('#statsProductCountLabel').textContent=`${products.length} produit${products.length>1?'s':''}`;
  renderStatsBars('#statsSupplierBars',suppliers,12);
  renderStatsBars('#statsProductBars',products,12);

  const critMax=[10,10,10,10,25];
  const crit=critMax.map((max,qi)=>{
    const vals=rows.map(r=>r.criteria?.[qi]).filter(v=>v!==null&&v!==undefined);
    const seen=[...new Set(rows.map(r=>r.criteriaNames?.[qi]).filter(Boolean))];
    const name=seen.length===1?seen[0]:seen.length>1?`Critère ${qi+1} (variable)`:criterionShortsForConfig(state.config)[qi]||`Critère ${qi+1}`;
    return{name,avg:avgNums(vals),max,count:vals.length}
  });
  $('#statsCriteria').innerHTML=crit.map(c=>`<div class="criterion-stat"><small>${escapeHtml(c.name)}</small><strong>${c.count?fmt(c.avg):'—'}</strong><span>/ ${c.max} · ${c.count} notes</span></div>`).join('');

  const tl=$('#statsTimeline');
  if(!timeline.length)tl.innerHTML='<div class="stats-empty">Aucun jury à afficher.</div>';
  else tl.innerHTML=timeline.map(x=>`<div class="timeline-row"><div class="timeline-date">${escapeHtml(statsFormatDate(x.date))}</div><div class="timeline-main"><strong title="${escapeHtml(x.lot)}">${escapeHtml(x.lot||'Jury')}</strong><div class="stats-bar"><i style="width:${Math.max(0,Math.min(100,(x.avg/65)*100))}%"></i></div></div><div class="timeline-score">${fmt(x.avg)}/65</div></div>`).join('');

  const tbody=$('#statsSupplierTable');
  tbody.innerHTML=suppliers.length?suppliers.map(x=>`<tr><td><strong>${escapeHtml(x.name)}</strong></td><td>${x.juryCount}</td><td>${x.sampleCount}</td><td>${x.count}</td><td class="num">${fmt(x.avg)}</td><td>${escapeHtml(statsFormatDate(x.last))}</td></tr>`).join(''):'<tr><td colspan="6" class="stats-empty">Aucune donnée.</td></tr>';
}
function resetStats(){
  ['#statsYear','#statsProduct','#statsSupplier'].forEach(id=>{const e=$(id);if(e)e.value=''});
  renderStats()
}
function exportStatsCsv(){
  const rows=statsRows();
  if(!rows.length){alert('Aucune statistique à exporter avec les filtres actuels.');return}
  const suppliers=statsAggregateBy(rows,'supplier');
  const out=[['Fournisseur','Jurys','Échantillons','Évaluations','Moyenne /65','Dernier jury']];
  suppliers.forEach(x=>out.push([x.name,x.juryCount,x.sampleCount,x.count,fmt(x.avg),statsFormatDate(x.last)]));
  const csv=out.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(';')).join('\n');
  download(new Blob(["\ufeff"+csv],{type:'text/csv;charset=utf-8'}),`statistiques-tests-culinaires-${new Date().toISOString().slice(0,10)}.csv`);
  toast('Statistiques exportées en CSV ✓')
}

function archiveYear(rec){
  const d=rec?.state?.config?.closure?.date||rec?.state?.config?.juryClose?.closedAt||rec?.archivedAt;
  if(!d)return '';
  const m=String(d).match(/^(\d{4})/);if(m)return m[1];
  try{return String(new Date(d).getFullYear())}catch(e){return ''}
}
function archiveLotKey(rec){
  const c=rec?.state?.config||{};
  const explicit=String(c.marketRef?.lot||'').trim();
  if(explicit)return explicit;
  const m=String(c.lotName||'').match(/\blot\s*([0-9A-Za-z-]+)/i);
  return m?m[1]:String(c.lotName||'').trim();
}
function archiveLotLabel(rec){
  const c=rec?.state?.config||{},k=archiveLotKey(rec);
  if(!k)return c.lotName||'Sans lot';
  return /^lot\b/i.test(String(k))?String(k):`Lot ${k}`;
}
function archiveProducts(rec){return [...new Set((rec?.state?.config?.products||[]).map(p=>String(p.name||'').trim()).filter(Boolean))]}
function archiveSuppliers(rec){return [...new Set((rec?.state?.config?.products||[]).flatMap(p=>(p.samples||[]).map(s=>String(s.supplier||'').trim())).filter(Boolean))]}
function archiveFilterValues(){
  return{
    q:($('#archiveSearch')?.value||'').trim().toLowerCase(),
    year:$('#archiveYearFilter')?.value||'',
    lot:$('#archiveLotFilter')?.value||'',
    product:$('#archiveProductFilter')?.value||'',
    supplier:$('#archiveSupplierFilter')?.value||'',
    sort:$('#archiveSort')?.value||'recent'
  }
}
function fillArchiveSelect(id,values,placeholder){
  const sel=$(id);if(!sel)return;
  const old=sel.value;
  sel.innerHTML=`<option value="">${escapeHtml(placeholder)}</option>`+values.map(x=>`<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`).join('');
  if(values.includes(old))sel.value=old;
}
function populateArchiveFilters(all){
  const years=[...new Set(all.map(archiveYear).filter(Boolean))].sort((a,b)=>b.localeCompare(a));
  const lots=[...new Set(all.map(r=>archiveLotKey(r)).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'fr',{numeric:true}));
  const products=[...new Set(all.flatMap(archiveProducts))].sort((a,b)=>a.localeCompare(b,'fr'));
  const suppliers=[...new Set(all.flatMap(archiveSuppliers))].sort((a,b)=>a.localeCompare(b,'fr'));
  fillArchiveSelect('#archiveYearFilter',years,'Toutes');
  const lotSel=$('#archiveLotFilter');if(lotSel){const old=lotSel.value;lotSel.innerHTML='<option value="">Tous</option>'+lots.map(x=>`<option value="${escapeHtml(x)}">${escapeHtml(/^lot\b/i.test(x)?x:`Lot ${x}`)}</option>`).join('');if(lots.includes(old))lotSel.value=old}
  fillArchiveSelect('#archiveProductFilter',products,'Tous');
  fillArchiveSelect('#archiveSupplierFilter',suppliers,'Tous');
}
function archiveMatches(rec,f){
  const st=rec.state||{},cfg=st.config||{};
  if(f.year&&archiveYear(rec)!==f.year)return false;
  if(f.lot&&archiveLotKey(rec)!==f.lot)return false;
  if(f.product&&!archiveProducts(rec).includes(f.product))return false;
  if(f.supplier&&!archiveSuppliers(rec).includes(f.supplier))return false;
  if(f.q){
    const hay=[
      cfg.lotName,cfg.subtitle,cfg.closure?.place,cfg.closure?.chair,cfg.closure?.coSigner,
      ...archiveProducts(rec),...archiveSuppliers(rec)
    ].join(' ').toLowerCase();
    if(!hay.includes(f.q))return false;
  }
  return true;
}
function archiveSortRows(rows,sort){
  const out=[...rows];
  if(sort==='old')out.sort((a,b)=>String(a.archivedAt||'').localeCompare(String(b.archivedAt||'')));
  else if(sort==='lot')out.sort((a,b)=>archiveLotKey(a).localeCompare(archiveLotKey(b),'fr',{numeric:true})||String(b.archivedAt||'').localeCompare(String(a.archivedAt||'')));
  else if(sort==='title')out.sort((a,b)=>String(a.state?.config?.lotName||'').localeCompare(String(b.state?.config?.lotName||''),'fr')||String(b.archivedAt||'').localeCompare(String(a.archivedAt||'')));
  else out.sort((a,b)=>String(b.archivedAt||'').localeCompare(String(a.archivedAt||'')));
  return out;
}
function renderArchiveFilterChips(f){
  const box=$('#archiveFilterChips');if(!box)return;
  const chips=[];
  if(f.q)chips.push(`Recherche : “${f.q}”`);
  if(f.year)chips.push(`Année : ${f.year}`);
  if(f.lot)chips.push(`Lot : ${f.lot}`);
  if(f.product)chips.push(`Produit : ${f.product}`);
  if(f.supplier)chips.push(`Fournisseur : ${f.supplier}`);
  box.innerHTML=chips.length?chips.map(x=>`<span class="archive-filter-chip">${escapeHtml(x)}</span>`).join(''):'<span style="font-size:9px;color:var(--muted)">Aucun filtre actif.</span>';
}
function renderArchives(){
  setTimeout(()=>{
    const b=$('#archiveCurrentFromArchivesBtn');
    if(!b)return;
    const archived=!!state.config?._archive?.archivedAt;
    const ready=isJuryClosed()&&closureIsReady();
    b.style.display=state?.config?.products?.length?'':'none';
    b.disabled=!ready;
    b.textContent=archived?'🗂️ Mettre à jour l’archive du jury actuel':'🗂️ Archiver le jury actuel';
    b.title=archived?'Mettre à jour l’archive':
      !isJuryClosed()?'Fermez d’abord officiellement le jury':
      !closureIsReady()?'Complétez d’abord la fiche de clôture':
      'Conserver le jury actuel dans les archives';
  },0);

  updateHeader();showView('archivesView');$('#headerTitle').textContent='Archives des jurys';$('#headerSub').textContent='Historique filtrable des tests culinaires';
  const all=loadArchives();
  populateArchiveFilters(all);
  const f=archiveFilterValues();
  let rows=archiveSortRows(all.filter(r=>archiveMatches(r,f)),f.sort);
  const allYears=[...new Set(all.map(archiveYear).filter(Boolean))];
  const allLots=[...new Set(all.map(archiveLotKey).filter(Boolean))];
  const allSuppliers=[...new Set(all.flatMap(archiveSuppliers))];
  $('#archiveCount').textContent=all.length;
  $('#archiveShownCount').textContent=rows.length;
  $('#archiveYearCount').textContent=allYears.length;
  $('#archiveLotCount').textContent=allLots.length;
  $('#archiveSupplierCount').textContent=allSuppliers.length;
  $('#archiveFilterSummary').textContent=rows.length===all.length?`${all.length} archive${all.length>1?'s':''}`:`${rows.length} sur ${all.length} archive${all.length>1?'s':''}`;
  $('#archiveResultsLabel').textContent=rows.length?`${rows.length} jury${rows.length>1?'s':''} affiché${rows.length>1?'s':''}`:'Aucun résultat';
  renderArchiveFilterChips(f);
  const list=$('#archiveList');list.innerHTML='';
  if(!rows.length){
    list.innerHTML=`<div class="panel archive-empty">${all.length?'Aucune archive ne correspond aux filtres actuels.<br><small>Essayez de retirer un filtre ou de réinitialiser la recherche.</small>':'Aucun jury archivé pour le moment.<br><small>Un jury apparaît ici après fermeture, clôture et archivage.</small>'}</div>`;
    return;
  }
  let currentYear=null;
  rows.forEach(rec=>{
    const st=rec.state||{},year=archiveYear(rec)||'Sans année';
    if(f.sort==='recent'||f.sort==='old'){
      if(year!==currentYear){currentYear=year;list.insertAdjacentHTML('beforeend',`<div class="archive-year-title"><strong>${escapeHtml(year)}</strong><span>${rows.filter(x=>(archiveYear(x)||'Sans année')===year).length} jury(s)</span></div>`)}
    }
    const total=archivedTotalSamples(st),remarks=archivedRemarks(st),ranking=archivedSupplierRanking(st),products=archiveProducts(rec),suppliers=archiveSuppliers(rec);
    const card=document.createElement('article');card.className='panel archive-card';card.dataset.archiveId=rec.id;
    card.innerHTML=`<div class="archive-card-top"><div><div class="eyebrow">Archivé le ${escapeHtml(formatArchiveDate(rec.archivedAt))}<span class="archive-year-mark">${escapeHtml(year)}</span></div><h3>${escapeHtml(st.config?.lotName||'Jury sans nom')}</h3><p>${escapeHtml(st.config?.subtitle||'')}</p></div><span class="archive-badge">✓ Clôturé</span></div>
    <div class="archive-meta"><span class="archive-chip">${st.config?.products?.length||0} produit(s)</span><span class="archive-chip">${total} échantillon(s)</span><span class="archive-chip">${st.config?.testerCount||0} testeur(s)</span><span class="archive-chip">${remarks.length} remarque(s)</span>${st.config?.closure?.date?`<span class="archive-chip">Clôture ${escapeHtml(formatClosureDate(st.config.closure.date))}</span>`:''}${st.config?.closure?.place?`<span class="archive-chip">${escapeHtml(st.config.closure.place)}</span>`:''}</div>
    <div class="archive-meta archive-extra-meta">${products.slice(0,5).map(x=>`<span class="archive-chip">Produit · ${escapeHtml(x)}</span>`).join('')}${suppliers.slice(0,5).map(x=>`<span class="archive-chip">Fournisseur · ${escapeHtml(x)}</span>`).join('')}</div>
    <div class="archive-card-actions simple">
      <button class="btn btn-primary btn-small" data-archive-toggle="${rec.id}">Voir les résultats</button>
      <button class="btn btn-secondary btn-small" data-archive-report="${rec.id}">📄 PDF</button>
      <button class="btn btn-ghost btn-small" data-archive-more="${rec.id}">⋯ Plus d’options</button>
    </div>
    <div class="archive-more-options">
      <button class="btn btn-secondary btn-small" data-archive-dossier="${rec.id}">📚 Dossier complet</button>
      <button class="btn btn-secondary btn-small" data-archive-summary="${rec.id}">📋 Synthèse</button>
      <button class="btn btn-secondary btn-small" data-archive-minutes="${rec.id}">📝 Procès-verbal</button>
      <button class="btn btn-ghost btn-small" data-archive-export="${rec.id}">Exporter JSON</button>
      <button class="btn btn-ghost btn-small" data-archive-copy="${rec.id}">Reprendre comme modèle</button>
      <button class="btn btn-danger btn-small" data-archive-delete="${rec.id}">Supprimer</button>
    </div>
    <div class="archive-detail"><div class="archive-detail-grid"><div class="archive-mini-panel"><h4>Classement global fournisseurs</h4><div class="archive-ranking">${ranking.length?ranking.slice(0,8).map((r,i)=>`<div class="archive-rank-row"><div class="n">${i+1}</div><div><strong>${escapeHtml(r.supplier)}</strong><br><span>${r.count} évaluation(s)</span></div><div class="archive-score">${r.count?fmt(supplierGlobalNote5(r.avg)):'—'}/5</div></div>`).join(''):'<span style="font-size:11px;color:var(--muted)">Aucun résultat.</span>'}</div></div><div class="archive-mini-panel"><h4>Remarques du jury</h4><div class="archive-remarks-preview">${remarks.length?remarks.slice(0,8).map(x=>`<div class="archive-remark"><strong>${escapeHtml(x.tester)}</strong> · ${escapeHtml(x.product)} · Éch. ${escapeHtml(x.sample)}<br>${escapeHtml(x.remark)}</div>`).join(''):'<span style="font-size:11px;color:var(--muted)">Aucune remarque.</span>'}${remarks.length>8?`<span style="font-size:10px;color:var(--muted)">+ ${remarks.length-8} autre(s) remarque(s)</span>`:''}</div></div></div></div>`;
    list.appendChild(card)
  });
  list.querySelectorAll('[data-archive-toggle]').forEach(b=>b.onclick=()=>{const c=b.closest('.archive-card');c.classList.toggle('open');b.textContent=c.classList.contains('open')?'Masquer les résultats':'Voir les résultats'});
  list.querySelectorAll('[data-archive-more]').forEach(b=>b.onclick=()=>{const c=b.closest('.archive-card');c.classList.toggle('more-open');b.textContent=c.classList.contains('more-open')?'Masquer les options':'⋯ Plus d’options'});
  list.querySelectorAll('[data-archive-dossier]').forEach(b=>b.onclick=()=>openArchiveDossier(b.dataset.archiveDossier));
  list.querySelectorAll('[data-archive-summary]').forEach(b=>b.onclick=()=>openArchiveSummary(b.dataset.archiveSummary));
  list.querySelectorAll('[data-archive-report]').forEach(b=>b.onclick=()=>openArchiveReport(b.dataset.archiveReport));
  list.querySelectorAll('[data-archive-minutes]').forEach(b=>b.onclick=()=>openArchiveMinutes(b.dataset.archiveMinutes));
  list.querySelectorAll('[data-archive-export]').forEach(b=>b.onclick=()=>exportArchive(b.dataset.archiveExport));
  list.querySelectorAll('[data-archive-copy]').forEach(b=>b.onclick=()=>duplicateArchive(b.dataset.archiveCopy));
  list.querySelectorAll('[data-archive-delete]').forEach(b=>b.onclick=()=>deleteArchive(b.dataset.archiveDelete))
}
function resetArchiveFilters(){
  ['#archiveSearch','#archiveYearFilter','#archiveLotFilter','#archiveProductFilter','#archiveSupplierFilter'].forEach(id=>{const e=$(id);if(e)e.value=''});
  const s=$('#archiveSort');if(s)s.value='recent';
  renderArchives()
}
function filteredArchiveRows(){
  const all=loadArchives(),f=archiveFilterValues();
  return archiveSortRows(all.filter(r=>archiveMatches(r,f)),f.sort)
}
function exportArchiveListCsv(){
  const rows=filteredArchiveRows();
  if(!rows.length){alert('Aucune archive à exporter avec les filtres actuels.');return}
  const out=[['Année','Date archivage','Lot','Intitulé','Produits','Fournisseurs','Testeurs','Échantillons','Remarques','Lieu','Responsable']];
  rows.forEach(rec=>{
    const st=rec.state||{},cfg=st.config||{};
    out.push([
      archiveYear(rec),formatArchiveDate(rec.archivedAt),archiveLotKey(rec),cfg.lotName||'',archiveProducts(rec).join(' | '),archiveSuppliers(rec).join(' | '),
      cfg.testerCount||0,archivedTotalSamples(st),archivedRemarks(st).length,cfg.closure?.place||'',cfg.closure?.chair||''
    ])
  });
  const csv=out.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(';')).join('\n');
  download(new Blob(["\ufeff"+csv],{type:'text/csv;charset=utf-8'}),`archives-jurys-${new Date().toISOString().slice(0,10)}.csv`);
  toast(`${rows.length} archive${rows.length>1?'s':''} exportée${rows.length>1?'s':''} en CSV`)
}
function exportArchive(id){const rec=loadArchives().find(x=>x.id===id);if(!rec)return;download(new Blob([JSON.stringify(rec,null,2)],{type:'application/json'}),`archive-${slug(rec.state?.config?.lotName||'jury')}.json`);toast('Archive exportée')}
function deleteArchive(id){const rec=loadArchives().find(x=>x.id===id);if(!rec)return;if(!confirm(`Supprimer définitivement l’archive « ${rec.state?.config?.lotName||'Jury'} » ?`))return;saveArchives(loadArchives().filter(x=>x.id!==id));renderArchives();toast('Archive supprimée')}
async function duplicateArchive(id){
  const rec=loadArchives().find(x=>x.id===id);
  if(!rec?.state?.config){alert('Archive introuvable.');return}
  if(!confirm('Créer un nouveau jury vierge à partir de ce paramétrage ?\n\nLes anciennes notes ne seront pas recopiées.'))return;

  // Reprendre uniquement le paramétrage : ne jamais recopier l’état de fermeture,
  // la fiche de clôture, l’ouverture précédente ni le marqueur d’archive.
  const cfg=deepClone(rec.state.config);
  delete cfg._archive;
  delete cfg.closure;
  delete cfg.juryLaunch;
  delete cfg.juryClose;
  delete cfg._juryInstanceId;
  delete cfg.juryInstanceId;
  cfg._juryInstanceId=uid('jury');
  cfg.criteria=normalizeCriteria(cfg.criteria);
  cfg.testerCount=Math.max(1,Number(cfg.testerCount||1));
  cfg.testerNames=Array.from({length:cfg.testerCount},(_,i)=>cfg.testerNames?.[i]||`Testeur ${i+1}`);

  if(typeof disconnectCloud==='function'&&typeof cloudReady!=='undefined'&&cloudReady){
    try{await disconnectCloud()}catch(e){console.warn('Déconnexion cloud non bloquante',e)}
  }

  state=makeInitialState(cfg);
  saveState();
  currentTester=1;
  currentProduct=state.config.products[0]?.id||'';
  currentSample=state.config.products[0]?.samples[0]?.id||'';
  adminProduct=currentProduct;
  renderHome();
  toast('Nouveau jury créé à partir de l’archive ✓');
}
function copyArchiveAsNew(id){return duplicateArchive(id)}

$('#homeBtn').onclick=renderHome;$('#archivesBtn').onclick=renderArchives;$('#archivesHomeBtn').onclick=renderHome;$('#archivesBackHubBtn').onclick=()=>renderHome();$('#archiveMoreFiltersBtn').onclick=()=>toggleArchiveFilters();
$('#closureBackBtn').onclick=()=>{captureClosureForm();saveState();renderAdmin()};
$('#saveClosureBtn').onclick=saveClosure;
['closureDate','closurePlace','closureChair','closureChairRole','closureCoSigner','closureCoSignerRole','closureNotes'].forEach(id=>{
  const el=$('#'+id);
  if(el){
    el.addEventListener('input',scheduleClosureAutosave);
    el.addEventListener('change',scheduleClosureAutosave);
  }
});
const closureMembersEl=$('#closureMembers');
if(closureMembersEl){
  closureMembersEl.addEventListener('input',scheduleClosureAutosave);
  closureMembersEl.addEventListener('change',scheduleClosureAutosave);
}
$('#closureMinutesBtn').onclick=()=>{captureClosureForm();saveState();openCurrentMinutes()};
$('#closureDossierBtn').onclick=()=>{captureClosureForm();saveState();openCurrentDossier()};
$('#closureSummaryBtn').onclick=()=>{captureClosureForm();saveState();openCurrentSummary()};
$('#closureReportBtn').onclick=closureReport;
$('#clearChairSignature').onclick=()=>clearSignature('chairSignature');
$('#clearCoSignature').onclick=()=>clearSignature('coSignature');
$('#archiveSearch').oninput=renderArchives;
$('#archiveYearFilter').onchange=renderArchives;
$('#archiveLotFilter').onchange=renderArchives;
$('#archiveProductFilter').onchange=renderArchives;
$('#archiveSupplierFilter').onchange=renderArchives;
$('#archiveSort').onchange=renderArchives;
$('#archiveResetFiltersBtn').onclick=resetArchiveFilters;
$('#archiveExportListBtn').onclick=exportArchiveListCsv;
$('#statsYear').onchange=renderStats;
$('#statsProduct').onchange=renderStats;
$('#statsSupplier').onchange=renderStats;
$('#statsResetBtn').onclick=resetStats;
$('#statsCsvBtn').onclick=exportStatsCsv;
$('#statsHomeBtn').onclick=renderHome;
$('#archiveCurrentFromArchivesBtn').onclick=archiveCurrentJury;$('#samplesSetupBtn').onclick=openSampleSetup;(function(){
  // v206 — « Préparer le jury » : moins sensible pendant le défilement tactile.
  // On supprime l'ouverture directe sur touchend : le bouton s'ouvre uniquement
  // sur un vrai clic/tap, et un petit glissement vertical annule l'ouverture.
  var b=$('#configureBtn');
  if(!b)return;
  var sx=0, sy=0, moved=false, blockClickUntil=0;
  var PREP_MOVE_TOLERANCE=5; // px : très léger glissement = défilement, pas ouverture
  var PREP_BLOCK_MS=450;
  b.style.touchAction='pan-y';
  b.addEventListener('touchstart',function(e){
    var t=e.touches&&e.touches[0];
    if(!t)return;
    sx=t.clientX; sy=t.clientY; moved=false;
  },{passive:true});
  b.addEventListener('touchmove',function(e){
    var t=e.touches&&e.touches[0];
    if(!t||moved)return;
    var dx=t.clientX-sx, dy=t.clientY-sy;
    if(Math.sqrt(dx*dx+dy*dy)>PREP_MOVE_TOLERANCE){
      moved=true;
      blockClickUntil=Date.now()+PREP_BLOCK_MS;
    }
  },{passive:true});
  b.addEventListener('touchend',function(){
    if(moved)blockClickUntil=Date.now()+PREP_BLOCK_MS;
  },{passive:true});
  b.addEventListener('touchcancel',function(){
    moved=true;
    blockClickUntil=Date.now()+PREP_BLOCK_MS;
  },{passive:true});
  b.onclick=function(e){
    if(moved || Date.now()<blockClickUntil){
      if(e){ e.preventDefault?.(); e.stopPropagation?.(); }
      moved=false;
      return false;
    }
    return prepareJuryFromHomeV181(e);
  };
})();$('#prepareJuryCancelBtn').onclick=closePrepareJuryChooser;$('#juryBtn').onclick=openJuryFlow;$('#statsBtn').onclick=renderStats;$('#dashboardNewJuryBtn').onclick=prepareJuryFromHomeV181;$('#dashboardAllArchivesBtn').onclick=renderArchives;$('#launchHomeBtn').onclick=renderHome;$('#launchEditBtn').onclick=openConfig;$('#officialLaunchBtn').onclick=officialLaunch;$('#launchQrBtn').onclick=()=>renderQrCodes('launchView');$('#launchCloudBtn').onclick=()=>typeof quickSharePhones==='function'?quickSharePhones():null;$('#configPrintArticlesBtn').onclick=printArticleNumbers;$('#configEmailArticlesBtn').onclick=emailArticleNumbersPdf;$('#configPreparePhonesBtn').onclick=preparePhonesFromConfig;$('#configQrBtn').onclick=openConfigQrCodes;$('#configEmailQrPdfBtn').onclick=sendQrPdfFromConfig;$('#juryChooserBackBtn').onclick=renderHome;$('#projectionBackBtn').onclick=returnFromProjection;$('#projectionPrevBtn').onclick=()=>setProjectionSlide(projectionSlideIndex-1);$('#projectionNextBtn').onclick=()=>setProjectionSlide(projectionSlideIndex+1);$('#projectionPauseBtn').onclick=toggleProjectionRotation;$('#projectionFullscreenBtn').onclick=toggleProjectionFullscreen;$('#exitTesterPreviewBtn').onclick=exitTesterPreview;
$('#closeJuryBtn').onclick=closeJuryOfficially;$('#resultsCloseJuryBtn').onclick=closeJuryOfficially;
$('#juryHomeBtn').onclick=renderHome;$('#juryQrBtn').onclick=openQrCodesFromJury;$('#juryProjectionBtn').onclick=openProjectionView;$('#juryTesterPreviewBtn').onclick=startTesterPreview;$('#juryResultsBtn').onclick=()=>openSimplifiedResults();$('#juryShareBtn').onclick=()=>typeof renderCloudPage==='function'?renderCloudPage():null;$('#resultsBtn').onclick=()=>openSimplifiedResults();$('#homeArchivesMiniBtn').onclick=()=>renderArchives();$('#backupBtn').onclick=backup;$('#restoreBtn').onclick=()=>$('#restoreFile').click();$('#restoreFile').onchange=e=>{if(e.target.files[0])restore(e.target.files[0]);e.target.value=''};
$('#sampleAddProductBtn')?.addEventListener('click',addSetupProduct);$('#sampleAddSupplierBtn')?.addEventListener('click',addSetupSupplier);$('#sampleSetupBackBtn').onclick=renderHome;$('#homeReceptionBtn').onclick=openReceptionFromHome;$('#homeReceptionHistoryBtn').onclick=openReceptionHistoryFromHome;$('#homeProductSheetsBtnV174').onclick=openProductSheetsFromHomeV174;$('#productLotCancelV174').onclick=closeProductLotModalV174;$('#receptionLotCancelBtn').onclick=closeReceptionLotPicker;$('#receptionHistoryCancelBtn').onclick=closeReceptionHistoryPicker;$('#configReceptionBtn').onclick=()=>openReceptionView(-1);$('#receptionBackBtn').onclick=closeReceptionView;$('#receptionChangeLotBtn').onclick=changeReceptionLot;$('#receptionNewBtn').onclick=newReceptionForm;$('#receptionPrintBtn').onclick=printReceptionPaper;$('#receptionPdfBtn').onclick=downloadReceptionPaperPdf;$('#receptionSaveBtn').onclick=saveReceptionForm;$('#clearReceptionSignature').onclick=()=>clearSignature('receptionSignature');$('#sampleSetupContinueBtn').onclick=()=>commitSampleMaster({continueToJury:true});$('#cancelConfigTopBtn').onclick=cancelCreateJury;$('#addProductBtn').onclick=addProduct;$('#blankTestBtn').onclick=showBlankLotEntry;$('#blankLotConfirmBtn').onclick=createBlankDraftFromName;$('#blankLotName').addEventListener('keydown',e=>{if(e.key==='Enter')createBlankDraftFromName()});$('#marketLotSelect').onchange=updateMarketLotInfo;$('#useMarketLotBtn').onclick=()=>flashCreateButton($('#useMarketLotBtn'),'✓ CRÉATION EN COURS…',prepareMarketLot);$('#customTemplateSelect').onchange=updateCustomTemplateButtons;$('#useCustomTemplateBtn').onclick=useCustomTemplate;$('#addCustomToMarketBtn').onclick=addSelectedCustomTemplateToMarket;$('#saveCustomTemplateBtn').onclick=saveCurrentDraftAsCustomTemplate;$('#deleteCustomTemplateBtn').onclick=deleteCustomTemplate;$('#useArchiveTemplateBtn').onclick=useArchiveTemplate;const testerCountInput=$('#cfgTesterCount');
const syncTesterCountFromField=()=>{
  if(!draftConfig)return;
  syncTopDraft();
  renderTesterNames();
  renderDraftSummary();
};
testerCountInput.onchange=syncTesterCountFromField;$('#cfgLotName').oninput=()=>{syncTopDraft();renderDraftSummary()};$('#cfgSubtitle').oninput=()=>{syncTopDraft();renderDraftSummary()};$('#saveConfigBtn').onclick=applyDraft;$('#cancelConfigBtn').onclick=cancelCreateJury;$('#previewConfigBtn').onclick=openConfigPreview;
$('#closeConfigPreviewBtn').onclick=closeConfigPreview;
$('#configPreviewModal').onclick=e=>{if(e.target.id==='configPreviewModal')closeConfigPreview()};
$('#testerHomeBtn').onclick=()=>testerPreviewMode?exitTesterPreview():renderHome();$('#bottomHomeBtn').onclick=()=>testerPreviewMode?exitTesterPreview():renderHome();$('#testerSelect').onchange=e=>{currentTester=Number(e.target.value);renderSample()};$('#productSelect').onchange=e=>{const targetPid=e.target.value;const target=getProduct(targetPid)?.samples?.[0];if(!target){e.target.value=currentProduct;return}if(!goToSample(targetPid,target.id))e.target.value=currentProduct};$('#sampleSelect').onchange=e=>{const target=e.target.value;if(!goToSample(currentProduct,target))e.target.value=currentSample};$('#prevSample').onclick=()=>moveSample(-1);$('#nextSample').onclick=()=>moveSample(1);
$('#simpleResultsPdfBtn').onclick=()=>openCurrentReport();$('#productSheetsBtn').onclick=()=>openProductSheets();$('#productSheetsBackBtn').onclick=()=>closeProductSheets();$('#productSheetsHomeBtn').onclick=()=>{captureProductSheetForm();saveState();renderHome()};$('#saveProductSheetsBtn').onclick=()=>saveProductSheets();$('#simpleResultsEmailBtn').onclick=()=>emailCurrentReport();$('#simpleResultsMoreBtn').onclick=()=>toggleSimpleResultsDetails();$('#hubResultsBtn').onclick=()=>openSimplifiedResults();$('#hubArchivesBtn').onclick=()=>renderArchives();$('#hubHomeBtn').onclick=()=>renderHome();$('#resultsBackHubBtn').onclick=()=>renderHome();$('#saveReportNoteBtn').onclick=()=>saveReportNote();$('#clearReportNoteBtn').onclick=()=>clearReportNote();$('#reportNoteInput').oninput=()=>{const s=$('#reportNoteState');if(s){s.textContent='À enregistrer';s.classList.add('changed')}};$('#adminHomeBtn').onclick=renderHome;$('#csvBtn').onclick=exportCsv;$('#closureBtn').onclick=renderClosure;$('#minutesBtn').onclick=openCurrentMinutes;$('#dossierBtn').onclick=openCurrentDossier;$('#summaryBtn').onclick=openCurrentSummary;$('#reportBtn').onclick=openCurrentReport;$('#resetAnswersBtn').onclick=openProtectedResetModal;$('#cancelReset').onclick=closeProtectedResetModal;$('#confirmReset').onclick=confirmProtectedReset;$('#resetConfirmWord').oninput=updateProtectedResetButton;$('#resetAdminPin').oninput=updateProtectedResetButton;$('#resetModal').onclick=e=>{if(e.target.id==='resetModal')closeProtectedResetModal()};
renderHome();
