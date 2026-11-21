'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const core=require('../js/36-tester-signature.js');
const source=fs.readFileSync(require('node:path').join(__dirname,'../js/36-tester-signature.js'),'utf8');
const SID='74016e94-0000-4000-8000-000000000000', JURY='jury_mwq2mlp7_ihk40',PREPARED='prepared_mwq2mlp7_dty6e';
const config={
  _juryInstanceId:JURY,juryInstanceId:JURY,_preparedId:PREPARED,
  _shareSessionId:SID,lotName:'Lot 101 — Test101',lotNumber:'101',
  testerCount:1,products:[{id:'p-signed',samples:[{id:'22'}]}],
  closure:{members:[{testerNo:1,name:'Testeur 1',role:'',present:true}]}
};
const baseSignature={
  image:'data:image/png;base64,aGVsbG8=',name:'Testeur 1',testerNo:1,
  jury:JURY,function:'Élève',establishment:'Lycée Jean Moulin',
  signedAt:'2026-11-21T07:16:34.300Z'
};
const rows=[
 {tester_no:1,product_id:'__meta__',sample_id:'__validation__',
  remarks:['2026-11-21T07:16:34.313Z']},
 {tester_no:1,product_id:'p-signed',sample_id:'22',
  remarks:['','','','','','','','__TC_SIGNATURE_V393__:'+JSON.stringify(baseSignature)]}
];
const prepared=()=>({config:JSON.parse(JSON.stringify(config)),
  testers:{1:{name:'Testeur 1',answers:{},validatedAt:null}}});
assert.equal(core.closureSignatureRowV648(rows,prepared(),1).function,'Élève');
assert.equal(core.closureSignatureRowV648(rows,prepared(),2),null);
assert.equal(core.closureSignatureRowV648(rows.slice(1),prepared(),1),null,'No official validation, no signature exposure');
assert.equal(core.closureSignatureRowV648(rows.map(r=>r.sample_id==='22'?
  {...r,product_id:'p-other'}:r),prepared(),1),null,'Do not accept another product');
assert.equal(core.closureSignatureRowV648(rows.map(r=>r.sample_id==='22'?
  {...r,remarks:['__TC_SIGNATURE_V393__:'+JSON.stringify({...baseSignature,jury:'jury-other'})]}:r),
  prepared(),1),null,'Do not accept another jury');
assert.equal(core.sameClosureJuryV648(config,{...config},SID),true);
assert.equal(core.sameClosureJuryV648(config,{...config,_juryInstanceId:'jury-other'},SID),false);
assert.equal(core.sameClosureJuryV648(config,{...config,lotNumber:'102'},SID),false);

async function testRecovery({alreadyAllowed=false,typedRole='',wrongJury=false,deny=false}={}){
 const state=prepared();
 const input={value:typedRole},host={innerHTML:''},view={classList:{contains:()=>true}};
 let joins=0,reads=0,dirty=0,joined=alreadyAllowed;
 const remote=JSON.parse(JSON.stringify(config));
 if(wrongJury)remote._juryInstanceId='jury-other';
 const cloudClient={
  rpc:async(name,params)=>{
    assert.equal(name,'test_culinaire_join_session');
    assert.equal(params.p_session_id,SID);
    assert.equal(params.p_code,'admin-secret');
    assert.equal(params.p_tester_no,null);
    joins++;
    if(deny)return {data:null,error:{message:'invalid_access_code'}};
    joined=true;return {data:[{role:'admin',tester_no:null}],error:null};
  },
  from:table=>({
    select(){
      return {eq(key,val){
        assert.equal(key,'session_id');assert.equal(val,SID);
        return {
          maybeSingle:async()=>{
            assert.equal(table,'test_culinaire_sessions');
            return {data:joined?{config:remote}:null,error:null};
          },
          then:(resolve,reject)=>{
            reads++;
            assert.equal(table,'test_culinaire_reponses');
            return Promise.resolve({data:rows,error:null}).then(resolve,reject);
          }
        };
      }};
    }
  })
 };
 const ctx={
  window:{addEventListener(){},scrollTo(){}},state,document:{
    getElementById:id=>id==='closureView'?view:id==='closureTesterSignaturesV393'?host:null,
    querySelector:sel=>sel==='[data-cl-role="0"]'?input:null,activeElement:null
  },
  currentTester:1,cloudRole:'admin',cloudClient,cloudReady:true,
  getRawAdminTokenV20:()=> 'admin-secret',
  scheduleClosureAutosave:()=>dirty++,
  validateTesterFinal(){},renderValidatedTesterFinal(){},scrollTesterToFinalScore(){},unlockTester(){},
  console,Date,URLSearchParams,location:{search:''},setTimeout,Promise
 };
 vm.createContext(ctx);
 vm.runInContext(source,ctx);
 const result=await ctx.window.recoverClosureSignaturesV648();
 return {result,input,host,joins,reads,dirty};
}
(async()=>{
 const recovered=await testRecovery();
 assert.equal(recovered.result,true);
 assert.equal(recovered.joins,1,'Owner joins the specific protected jury using its admin code');
 assert.equal(recovered.reads,1);
 assert.match(recovered.host.innerHTML,/Signatures des testeurs/);
 assert.match(recovered.host.innerHTML,/Élève/);
 assert.match(recovered.host.innerHTML,/Lycée Jean Moulin/);
 assert.match(recovered.host.innerHTML,/data:image\/png;base64/);
 assert.equal(recovered.input.value,'Élève — Lycée Jean Moulin');

 const keepEdit=await testRecovery({typedRole:'Fonction corrigée'});
 assert.equal(keepEdit.result,true);
 assert.equal(keepEdit.input.value,'Fonction corrigée','Never replace text typed in closure');

 const wrong=await testRecovery({wrongJury:true});
 assert.equal(wrong.result,false);
 assert.equal(wrong.host.innerHTML,'','Do not leak signature from a different jury');
 const unauthorized=await testRecovery({deny:true});
 assert.equal(unauthorized.result,false);
 assert.equal(unauthorized.host.innerHTML,'','No access without administrative proof');
 console.log('PASS signed profile recovery after owner reload, user edits preserved, identity and access isolation');
})().catch(e=>{console.error(e);process.exitCode=1;});
