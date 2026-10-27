const assert=require('node:assert/strict');
const {read,attach,clear,html}=require('../js/36-tester-signature.js');
const image='data:image/png;base64,aGVsbG8=';
const st={config:{juryInstanceId:'jury-D'},testers:{1:{name:'Alice <test>',answers:{a:{choices:[1,2],remarks:['Très bon','','','','','quick','validation']}}}}};
attach(st,1,{image,name:st.testers[1].name,signedAt:'2026-10-27T14:00:00Z'},7);
assert.equal(read(st,1),null,'unsigned validation must not expose a signature');
st.testers[1].validatedAt='2026-10-27T14:00:01Z';
// Simulate the actual answer-row JSON transport and reconstruction on another device.
const remote={config:{...st.config},testers:{1:{validatedAt:st.testers[1].validatedAt,answers:JSON.parse(JSON.stringify(st.testers[1].answers))}}};
assert.equal(read(remote,1).image,image);
assert.equal(remote.testers[1].answers.a.remarks[0],'Très bon');
assert.equal(remote.testers[1].answers.a.remarks[6],'validation');
assert.match(html(remote),/Alice &lt;test&gt;/);
remote.config.juryInstanceId='jury-E';assert.equal(read(remote,1),null,'signature must not cross juries');
remote.config.juryInstanceId='jury-D';
attach(remote,1,{image:'data:image/svg+xml;base64,bad',signedAt:'2026-10-27'},7);assert.equal(read(remote,1),null);
clear(st,1);assert.equal(read(st,1),null);assert.equal(st.testers[1].answers.a.remarks[0],'Très bon');
console.log('Signature transport, validation, jury isolation, safe rendering and unlock: OK');
