const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {entries,isSchoolEmail}=require('../js/44-establishment-integration.js');
const {resolveTarget}=require('../js/43-school-phone-bridge.js');
const products=[{name:'Carottes'}];
const state=(id,name,extra={})=>({config:{_preparedId:id,lotName:name,products,...extra},testers:{}});
const school=(s,st)=>({school:s,label:'Établissement '+s,enabled:true,payload:{jm_test_culinaire_prepared_v97:JSON.stringify([{id:st.config._preparedId,state:st}]),jm_test_culinaire_param_v2:JSON.stringify(st),jm_test_culinaire_sample_lot_history_v178:JSON.stringify([{id:'sample',lotName:st.config.lotName,products}])}});
test('general chooser keeps equal lot names separate by establishment, without duplicate sample choices',()=>{
 const rows=[school('S1',state('one','Lot 12')),school('S2',state('two','Lot 12'))];
 const list=entries(rows,'prepare');assert.equal(list.length,2);assert.deepEqual(list.map(r=>r.school),['S1','S2']);assert.deepEqual(list.map(r=>r.id),['one','two']);
 assert.equal(list[0].label,'Établissement S1');
 assert.equal(entries([{...rows[0],enabled:false}],'prepare').length,0);
});
test('closed and archived jurys stay out of preparation but remain in results',()=>{
 const row=school('S1',state('closed','Lot terminé',{juryClose:{closedAt:'2026-10-30'}}));
 assert.equal(entries([row],'prepare').length,0);assert.equal(entries([row],'results')[0].status,'Jury terminé');
 row.payload.jm_test_culinaire_archives_v1=JSON.stringify([{id:'archive',state:state('archive','Lot archivé',{_archive:{archivedAt:'2026-10-30',finalLocked:true}})}]);
 assert.equal(entries([row],'results').find(r=>r.kind==='archive').status,'Archivé');
});
test('empty schools do not generate fictitious lot entries',()=>{
 assert.deepEqual(entries([{school:'S1',label:'S1',enabled:true,payload:{}}],'prepare'),[]);
});
test('opening a school jury selects only the requested record and fails if it was removed',()=>{
 const p=[{id:'p1',state:state('p1','Lot 1')}],h=[{id:'h1'}],a=[{id:'a1'}];
 assert.equal(resolveTarget({id:'p1',kind:'prepared'},p,h,a),p[0]);
 assert.equal(resolveTarget({id:'h1',kind:'sampleLot'},p,h,a),h[0]);
 assert.equal(resolveTarget({id:'a1',kind:'archive'},p,h,a),a[0]);
 assert.throws(()=>resolveTarget({id:'another-school',kind:'prepared'},p,h,a),/retiré/);
 assert.equal(resolveTarget({view:'home'},p,h,a),null);
});
test('school account recognition is limited to the configured trial addresses',()=>{
 assert.ok(isSchoolEmail('jury-test1@mailo.com'));assert.ok(isSchoolEmail('JURY-TEST12@MAILO.COM'));
 assert.equal(isSchoolEmail('jury-test13@mailo.com'),false);assert.equal(isSchoolEmail('jeanmoulin33210@gmail.com'),false);
});
test('normal result controls initialize when the retired report-note button is absent',()=>{
 const line=fs.readFileSync(path.join(__dirname,'../js/05-application-principale.js'),'utf8').split('\n').find(l=>l.startsWith("$('#simpleResultsPdfBtn').onclick"));
 const nodes=new Map();const ctx={$:id=>{if(id==='#saveReportNoteBtn')return null;if(!nodes.has(id))nodes.set(id,{});return nodes.get(id)}};
 for(const match of line.matchAll(/\.(?:onclick|oninput|onchange)=(\w+);/g))ctx[match[1]]=()=>{};
 vm.runInNewContext(line,ctx);assert.equal(typeof nodes.get('#csvBtn').onclick,'function');assert.equal(typeof nodes.get('#closureBtn').onclick,'function');
});
