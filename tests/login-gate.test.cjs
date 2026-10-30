const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {needsLogin}=require('../js/00-login-gate.js');
test('normal, owner, and establishment entry require account identification',()=>{
 for(const search of ['', '?schoolLogin=1','?ownerToken=old-proof','?adminToken=old-proof','?tester=0','?tester=-1','?tester=no'])assert.equal(needsLogin(search,false),true);
});
test('tester QR codes and the already authorized establishment iframe bypass the login screen',()=>{
 assert.equal(needsLogin('?session=uuid&tester=1&accessCode=secret',false),false);
 assert.equal(needsLogin('?tester=20',false),false);assert.equal(needsLogin('',true),false);
});
test('gate hides the application until explicitly released and can be locked again on signout',()=>{
 const classes=new Set(['login-required-v457']);const html={classList:{add:(...v)=>v.forEach(x=>classes.add(x)),remove:(...v)=>v.forEach(x=>classes.delete(x))}};
 const root={};const ctx={window:root,document:{documentElement:html},location:{search:''},URLSearchParams};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/00-login-gate.js'),'utf8'),ctx);
 assert.equal(root.JuryLoginGateV457.locked,true);root.JuryLoginGateV457.formReady();assert.ok(classes.has('login-form-ready-v457'));
 root.JuryLoginGateV457.release();assert.equal(root.JuryLoginGateV457.locked,false);assert.equal(classes.has('login-required-v457'),false);
 root.JuryLoginGateV457.lock();assert.ok(classes.has('login-required-v457'));assert.equal(classes.has('login-form-ready-v457'),false);
});
test('tester startup removes the default closed gate before application code starts',()=>{
 const classes=new Set(['login-required-v457']);const root={};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/00-login-gate.js'),'utf8'),{window:root,document:{documentElement:{classList:{add:(...v)=>v.forEach(x=>classes.add(x)),remove:(...v)=>v.forEach(x=>classes.delete(x))}}},location:{search:'?tester=2&session=example'},URLSearchParams});
 assert.equal(root.JuryLoginGateV457.locked,false);assert.equal(classes.size,0);
});
