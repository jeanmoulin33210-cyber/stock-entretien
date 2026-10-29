const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const dir=path.join(__dirname,'../js');
const api=require(path.join(dir,'40-school-trial.js'));
test('production phone preparation creates one school session, reuses it, and produces a tester-only link',async()=>{
 const diag=fs.readFileSync(path.join(dir,'17-v32-diagnostic-securite-supabase-final.js'),'utf8');
 const cloud=fs.readFileSync(path.join(dir,'06-v20-partage-securise-supabase-auth.js'),'utf8');
 const extract=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
 const calls=[];const backend={rpc:async(name,args)=>{calls.push({name,args});return {data:{ok:true}}},auth:{getSession:async()=>({data:{session:{user:{id:'school1'}}}})}};
 const client=api.schoolClient(backend,'S1');let token='stable-school-token';
 const ctx={window:{},console,crypto:require('node:crypto').webcrypto,URL,location:{href:'about:srcdoc'},
  state:{config:{_preparedId:'jury1',products:[{id:'p1',samples:[{id:'12'}]}],testerCount:1,testerNames:['T1']},testers:{}},cloudCfg:{},cloudClient:client,cloudReady:false,cloudRole:null,
  DEFAULT_SUPABASE_URL:'https://project.supabase.co',DEFAULT_SUPABASE_KEY:'publishable',
  launchShareReady:()=>ctx.cloudReady&&!!ctx.state.config._phoneShareSignature,phoneSharePrepared:cfg=>!!cfg._phoneShareSignature,
  ensureJuryInstanceId:()=>{},launchBlockingError:()=>'',getRawAdminTokenV20:()=>token,setStoredAdminToken:t=>{token=t},randomSecret:()=> 'new-token',secureHash:async s=>s,
  currentJuryShareSessionId:()=>ctx.state.config._shareSessionId||'',ensureTesterCodes:()=>({'1':'tester-code'}),originalSaveState:()=>calls.push({name:'local-save'}),upsertPreparedJury:()=>{},currentJuryPhase:()=> 'prep',
  $:()=>null,saveCloudCfg:()=>{},buildCloudClient:()=>{},setCloudStatus:()=>{},ensureCloudAuth:async()=>{},joinSecureSession:async()=>calls.push({name:'rejoin'}),subscribeCloud:async()=>{},pushAllAnswers:async()=>{},
  makePublicCloudConfig:()=>({}),rememberCloudAccessCodesV339:()=>{},phoneShareSignature:()=> 'prepared-signature',syncDirtyToCloud:async()=>{},hashJson:JSON.stringify,renderLaunchView:()=>{},toast:()=>{},
  alert:m=>{throw Error(m)},deepClone:structuredClone,currentShareBuildV279:()=> '338',testerAccessCode:()=> 'tester-code',document:{getElementById:()=>null},disconnectCloud:async()=>{ctx.cloudReady=false},
  renderConfigPhoneShare:()=>{},restoreConfigPhonePosition:()=>{},rememberConfigPhonePosition:()=>null,renderConfig:()=>{},draftConfig:null};
 vm.createContext(ctx);
 const sources=[extract(diag,'async function ensurePhoneShareCredentials()','async function recoverRunningShareFromCachedAuthV258()'),
  extract(cloud,'async function createSecureCloudSession()','let lastAccessCodesSessionV339='),
  extract(diag,"async function quickSharePhones(origin='launch')",'async function createFreshSecureSessionV32()'),
  extract(cloud,'function currentBaseUrl()','function getRawAdminTokenV20()'),extract(cloud,'function shareUrl(testerNo=null)','async function copyText(')];
 vm.runInContext(sources.join('\n'),ctx);
 await ctx.quickSharePhones();const sid=ctx.state.config._shareSessionId;
 assert.ok(sid);assert.equal(ctx.state.config._phoneShareSignature,'prepared-signature');
 const create=calls.filter(c=>c.name==='school_trial_create_secure_session');assert.equal(create.length,1);assert.equal(create[0].args.p_school,'S1');assert.equal(create[0].args.p_session_id,sid);
 const u=new URL(ctx.shareUrl(1));assert.equal(u.pathname,'/stock-entretien/tests-culinaires.html');assert.equal(u.searchParams.get('session'),sid);assert.equal(u.searchParams.get('tester'),'1');
 assert.equal(u.searchParams.get('accessCode'),'tester-code');assert.equal(u.searchParams.has('adminToken'),false);assert.equal(u.searchParams.has('ownerToken'),false);
 await ctx.quickSharePhones();assert.equal(calls.filter(c=>c.name==='school_trial_create_secure_session').length,1);
 ctx.cloudReady=false;await ctx.quickSharePhones();assert.equal(ctx.state.config._shareSessionId,sid);assert.ok(calls.some(c=>c.name==='rejoin'));
});
test('school client scopes jury creation and preserves normal response transport',async()=>{
 const calls=[];const actual={rpc:async(...x)=>{calls.push(x);return {data:{ok:true}}},from:table=>({table,owner:actual}),auth:{getSession:async()=>({data:{session:{user:{id:'school-user'}}}}),signOut(){throw Error('unexpected signout')}}};
 const c=api.schoolClient(actual,'S1');
 await c.rpc('test_culinaire_create_secure_session',{p_session_id:'new-jury',p_school:'S2'});
 assert.equal(calls[0][0],'school_trial_create_secure_session');assert.equal(calls[0][1].p_school,'S1');
 await c.rpc('test_culinaire_join_session',{p_session_id:'new-jury'});assert.equal(calls[1][0],'test_culinaire_join_session');
 assert.equal(c.from('test_culinaire_reponses').owner,actual);
 assert.equal((await c.auth.getSession()).data.session.user.id,'school-user');
 await assert.rejects(c.auth.signOut(),/hors du jury/);
 await assert.rejects(c.auth.signInAnonymously(),/hors du jury/);
});
test('school snapshots retain jury credentials across reloads without storing account sessions',()=>{
 const p=api.seed('S1');p.jm_test_culinaire_admin_token_v1='jury-secret';assert.ok(api.validPayload(p));
 p['jm-school-trial-auth-v452']='account-session';assert.equal(api.validPayload(p),false);
 const boot=fs.readFileSync(path.join(dir,'00-school-trial-sandbox.js'),'utf8');
 assert.ok(boot.includes("'jm_test_culinaire_admin_token_v1'"));
 assert.equal(boot.includes("['configPreparePhonesBtn','configQrBtn'"),false);
 assert.equal(boot.includes("'officialLaunchBtn','launchCloudBtn'"),false);
});
test('bridge reconnects the exact jury and retrieves tester answers when reopening',async()=>{
 const calls=[];const client={marker:'school-client'};
 const root={__JURY_DEMO_BOOT:{school:'S1',nonce:'n1'},__JURY_SCHOOL_TRIAL_ACTIVE:true,parent:{JurySchoolTrialV452:{clientForSchool(s,n){assert.equal(s,'S1');assert.equal(n,'n1');return client;}}}};
 const status={textContent:'● Local'};
 const ctx={window:root,document:{getElementById:()=>status},state:{config:{_shareSessionId:'same-jury'}},cloudCfg:{},DEFAULT_SUPABASE_URL:'https://project.supabase.co',DEFAULT_SUPABASE_KEY:'public',
  phoneSharePrepared:()=>true,currentJuryShareSessionId:()=> 'same-jury',ensurePreparedShareConnected:async()=>calls.push('connect'),fetchCloudState:async()=>calls.push('answers'),
  automaticOwnerWorkspaceV352:()=>{throw Error('legacy mirror used')},ownerWorkspaceBusyV352:false,setCloudStatus:()=>{}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(dir,'43-school-phone-bridge.js'),'utf8'),ctx);
 assert.equal(root.JuryAccountV385.client,client);assert.equal(status.textContent,'● Espace établissement');
 assert.equal(await root.JuryAccountV385.restore(),true);assert.deepEqual(calls,['connect','answers']);
 assert.equal(ctx.ownerWorkspaceBusyV352,true);await ctx.automaticOwnerWorkspaceV352();
 await assert.rejects(root.JuryAccountV385.signout(),/Fermez le jury/);
});
