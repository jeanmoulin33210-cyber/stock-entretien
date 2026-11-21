'use strict';
const assert=require('node:assert/strict');
const {recoverVerifiedResultsV649}=require('../js/33-owner-sync.js');

const cfg={
 _preparedId:'prepared-101',_juryInstanceId:'jury-101',juryInstanceId:'jury-101',
 _shareSessionId:'74016e94-627d-4ff0-b747-e8bf21c105b2',
 lotName:'Lot 101 — Test101',lotNumber:'101',testerCount:1,
 products:[{id:'p1',samples:[{id:'22'}]}],
 juryLaunch:{openedAt:'2026-11-21T07:15:42.675Z',sessionId:'74016e94-627d-4ff0-b747-e8bf21c105b2'},
 closure:{date:'2026-11-21',notes:'Texte de clôture à conserver'}
};
const closed={...cfg,juryClose:{closedAt:'2026-11-21T07:16:34.998Z'},
 _validatedTestersV333:{1:'2026-11-21T07:16:34.313Z'},
 closure:{date:'2026-11-21',notes:'Ancien texte du serveur'}};
const prepared=()=>({config:structuredClone(cfg),testers:{1:{name:'Testeur 1',validatedAt:null,answers:{}}}});
const signed='__TC_SIGNATURE_V393__:'+JSON.stringify({image:'data:image/png;base64,aGVsbG8='});
const answer={tester_no:1,product_id:'p1',sample_id:'22',
 choices:[3,3,3,3,3],remarks:['bonne texture','','','','','','',signed]};
const marker={tester_no:1,product_id:'__meta__',sample_id:'__validation__',remarks:['2026-11-21T07:16:34.313Z']};

const recovered=recoverVerifiedResultsV649(prepared(),closed,[marker,answer]);
assert.ok(recovered,'A server-complete validated jury must be recovered');
assert.equal(recovered.testers[1].validatedAt,marker.remarks[0]);
assert.deepEqual(recovered.testers[1].answers.p1__22.choices,[3,3,3,3,3]);
assert.equal(recovered.config.juryClose.closedAt,closed.juryClose.closedAt);
assert.equal(recovered.config.closure.notes,'Texte de clôture à conserver','Edited closure not overwritten');
assert.equal(recovered.testers[1].answers.p1__22.remarks[0],'bonne texture');
assert.equal(recovered.testers[1].answers.p1__22.remarks[7],'','Protected signature must not leak into owner catalogue');

assert.equal(recoverVerifiedResultsV649(prepared(),{...closed,_juryInstanceId:'different'},[marker,answer]),null,'wrong jury refused');
assert.equal(recoverVerifiedResultsV649(prepared(),{...closed,_preparedId:'different'},[marker,answer]),null,'wrong preparation refused');
assert.equal(recoverVerifiedResultsV649(prepared(),{...closed,_shareSessionId:'another'},[marker,answer]),null,'wrong server session refused');
assert.equal(recoverVerifiedResultsV649(prepared(),{...closed,lotNumber:'102'},[marker,answer]),null,'wrong lot refused');
const withoutProof={...closed,_validatedTestersV333:{}};
assert.equal(recoverVerifiedResultsV649(prepared(),withoutProof,[answer]),null,'no server validation');
assert.equal(recoverVerifiedResultsV649(prepared(),closed,[marker,{...answer,choices:[3,3,null,3,3]}]),null,'incomplete answers not considered complete');
assert.equal(recoverVerifiedResultsV649(prepared(),closed,[marker,{...answer,product_id:'other'}]),null,'answers from another product refused');
const independent=prepared();
independent.config._shareSessionId='another-jury-session';
assert.equal(recoverVerifiedResultsV649(independent,closed,[marker,answer]),null,'wrong linked session refused');
console.log('PASS owner Results recover authenticated complete jury and preserve closure, no cross-jury false OK');
