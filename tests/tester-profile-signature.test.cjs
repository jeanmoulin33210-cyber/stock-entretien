const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const core=require('../js/36-tester-signature.js');
const image='data:image/png;base64,aGVsbG8=';
const st={config:{_juryInstanceId:'D',testerCount:1,closure:{members:[{testerNo:1,name:'Alice',role:'Ancienne fonction',signature:image}]}},testers:{1:{name:'Alice',validatedAt:'2026-10-27',answers:{a:{remarks:[]}}}}};
assert.equal(core.list(st).length,1);assert.equal(core.list(st)[0].legacy,true);
core.attach(st,1,{image,name:'Alice',function:'Cheffe <cuisine>',establishment:'Lycée Jean Moulin',signedAt:'2026-10-27T16:00:00Z'},7);
assert.equal(core.list(st).length,1,'phone signature supersedes the legacy signature');
assert.equal(core.list(st)[0].legacy,undefined);assert.equal(core.list(st)[0].establishment,'Lycée Jean Moulin');
const synced=JSON.parse(JSON.stringify(st));assert.equal(core.read(synced,1).function,'Cheffe <cuisine>');
assert.equal((core.html(synced).match(/<img/g)||[]).length,1);assert.match(core.html(synced),/Cheffe &lt;cuisine&gt;/);assert.match(core.html(synced),/Lycée Jean Moulin/);
// Existing signed tests without profile fields remain readable, unchanged.
const historical=JSON.parse(JSON.stringify(st));core.attach(historical,1,{image,name:'Alice',signedAt:'2026-10-27T15:00:00Z'},7);assert.ok(core.read(historical,1));
// Exercise the real tester modal, including required profile fields, drawing and transport.
const fields={function:{value:'',focus(){}},establishment:{value:'',focus(){}}},message={textContent:''},buttons={clear:{},cancel:{},sign:{}};
const profile={style:{},querySelector:s=>s.includes('function')?fields.function:fields.establishment};
const canvas={getContext:()=>({beginPath(){},moveTo(){},lineTo(){},stroke(){},clearRect(){}}),getBoundingClientRect:()=>({left:0,top:0,width:600,height:220}),setPointerCapture(){},before(){},toDataURL:()=>image};
const dialog={style:{},showModal(){},querySelector:s=>s==='canvas'?canvas:s==='[data-message]'?message:buttons[s.match(/data-(\w+)/)?.[1]],close(){this.closed=true;this.onclose?.()},remove(){}};
const draft=JSON.parse(JSON.stringify(st));draft.testers[1].validatedAt=null;draft.config.closure.members=[];let validated=0;
const ctx={window:{},state:draft,currentTester:1,QUESTIONS:Array(5),document:{getElementById:()=>null,createElement:tag=>tag==='dialog'?dialog:profile,body:{appendChild(){}}},validateTesterFinal:n=>{validated++;draft.testers[n].validatedAt='2026-10-27T16:00:01Z';},testerValidated:n=>!!draft.testers[n].validatedAt,testerMustWaitForLaunch:()=>false,isJuryClosed:()=>false,totalSamples:()=>1,testerCompleted:()=>1,renderValidatedTesterFinal(){},unlockTester(){},renderSample(){},saveState(){},console,Date};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../js/36-tester-signature.js'),'utf8'),ctx);ctx.window.validateTesterFinal(1);
buttons.sign.onclick();assert.equal(validated,0);assert.match(message.textContent,/fonction/);
fields.function.value='Chef de cuisine';buttons.sign.onclick();assert.equal(validated,0);assert.match(message.textContent,/établissement/);
fields.establishment.value='Lycée Jean Moulin';buttons.sign.onclick();assert.equal(validated,0);assert.match(message.textContent,/signature/);
canvas.onpointerdown({preventDefault(){},pointerId:1,clientX:10,clientY:20});canvas.onpointermove({clientX:130,clientY:40});canvas.onpointerup();buttons.sign.onclick();assert.equal(validated,1);assert.equal(core.read(draft,1).function,'Chef de cuisine');assert.equal(core.read(draft,1).establishment,'Lycée Jean Moulin');assert.equal(dialog.closed,true);
// The production closure member normalizer reuses the profile and preserves administrator edits.
const main=fs.readFileSync(require('node:path').join(__dirname,'../js/05-application-principale.js'),'utf8');ctx.ensureClosure=()=>draft.config.closure;vm.runInContext(main.slice(main.indexOf('function normalizeClosureMembers()'),main.indexOf('function closureMissingFields',main.indexOf('function normalizeClosureMembers()'))),ctx);
const c=ctx.normalizeClosureMembers();assert.equal(c.members[0].role,'Chef de cuisine — Lycée Jean Moulin');c.members[0].role='Fonction corrigée';assert.equal(ctx.normalizeClosureMembers().members[0].role,'Fonction corrigée');
// No legacy editable canvas is appended. Premium report gets one signature page entry.
const legacy=fs.readFileSync(require('node:path').join(__dirname,'../js/28-v274-dossier-resultats-2025.js'),'utf8'),add=legacy.slice(legacy.indexOf('function addMemberSignatures(){'),legacy.indexOf('var rawRenderClosure='));assert.ok(!add.includes('<canvas'));
const premium=fs.readFileSync(require('node:path').join(__dirname,'../js/32-v338-rapport-sensoriel-premium.js'),'utf8'),pa=premium.indexOf('function testerSignaturePagesV397('),pe=premium.indexOf('function closurePage(',pa);const reportCtx={window:{testerSignaturesV393:core.list},chunks:(a,n)=>[a],page:(title,body)=>body,h:()=>'',E:s=>String(s),D:s=>s};vm.createContext(reportCtx);vm.runInContext(premium.slice(pa,pe),reportCtx);const report=reportCtx.testerSignaturePagesV397(st);assert.equal((report.match(/<img/g)||[]).length,1);assert.ok(report.includes('Lycée Jean Moulin'));
console.log('PASS required tester profile, signed answer transport, historical signature preservation, single closure signature, member defaults and premium report');
