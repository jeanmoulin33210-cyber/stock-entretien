const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),{webcrypto}=require('crypto');
const source=fs.readFileSync(require('path').join(__dirname,'../js/35-owner-account.js'),'utf8').replace('  mount();','  API.__test={setMode,submit,extraAccountClient,finishExtra};');
function fixture({confirm=true,pin=true}={}){
 const nodes=new Map(),events=[],opts=[];let member=false,encrypted=null,confirmed=confirm;
 const element=id=>{if(!nodes.has(id))nodes.set(id,{value:'',checked:true,hidden:false,style:{},classList:{add(){},remove(){}},querySelectorAll:()=>[],focus(){}});return nodes.get(id);};
 const value={v:1,hub:{url:'https://avhyoujlplwkuccvhnvz.supabase.co',sessionId:'675ee51b-915e-416a-ac45-349d6a69f524'},adminToken:'a'.repeat(64),ownerToken:'b'.repeat(64)};
 const config={security:{ownerTokenHash:'hash:owner:'+value.ownerToken,adminTokenHash:'hash:admin:'+value.adminToken}};
 const makeClient=(isMain=false)=>({
  auth:{stopAutoRefresh(){},signUp:async args=>{events.push('signup');encrypted=args.options.data.jm_tc_owner_v385;return {data:{session:confirm?{}:null}}},signInWithPassword:async()=>{events.push('signin');return {data:{}}},getUser:async()=>({data:{user:{id:isMain?'owner':'second',email:isMain?'owner@example.test':'second@example.test',email_confirmed_at:confirmed?'2026-10-29':null,user_metadata:{jm_tc_owner_v385:encrypted}}}}),signOut:async o=>{assert.equal(o.scope,'local');events.push(isMain?'MAIN-SIGNOUT':'extra-signout');return {};},updateUser:async()=>{events.push('MAIN-UPDATE');throw Error('unexpected');}},
  from:table=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:table==='test_culinaire_sessions'?{config}:(isMain||member?{role:'admin'}:null)})}),
  rpc:async()=>{events.push('join-admin');member=true;return {}}
 });
 const main=makeClient(true),extra=makeClient();
 const ctx={crypto:webcrypto,TextEncoder,TextDecoder,Uint8Array,btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary'),console,
 document:{getElementById:element},localStorage:{getItem:()=>null},URL,URLSearchParams,
 DEFAULT_SUPABASE_URL:value.hub.url,DEFAULT_SUPABASE_KEY:'publishable-key',isSecurityOwner:()=>true,
 verifyPin:async()=>pin,secureHash:async s=>'hash:'+s,storedAdminToken:()=>value.adminToken,storedOwnerToken:()=>value.ownerToken,
 supabase:{createClient:(url,key,options)=>{opts.push(options);return extra}},
 JuryOwnerSyncV357:{accountContext:async()=>({descriptor:value.hub,client:main})}};
 ctx.window=ctx;vm.createContext(ctx);vm.runInContext(source,ctx);const api=ctx.JuryAccountV385;api.client=main;api.email='owner@example.test';
 const enter=()=>{api.__test.setMode('extra');element('accountEmailV385').value='second@example.test';element('accountPasswordV385').value='Separate-test-password-123';element('accountConfirmV385').value='Separate-test-password-123';element('accountPinV385').value='1234';};
 enter();return {api,main,extra,nodes,element,events,opts,enter,confirm:()=>confirmed=true};
}
(async()=>{
 let f=fixture();await f.api.__test.submit({preventDefault(){}});assert.equal(f.api.client,f.main);assert.equal(f.api.email,'owner@example.test');assert(!f.events.includes('MAIN-SIGNOUT'));assert(!f.events.includes('MAIN-UPDATE'));assert(f.events.includes('join-admin'));assert(f.events.includes('extra-signout'));assert.equal(f.opts[0].auth.persistSession,false);assert.equal(f.opts[0].auth.autoRefreshToken,false);assert.match(f.element('accountMessageV385').textContent,/Second accès activé/);
 f=fixture({confirm:false});await f.api.__test.submit({preventDefault(){}});assert.deepEqual(f.events,['signup']);assert.equal(f.api.client,f.main);assert.equal(f.element('accountConfirmationV385').hidden,false);f.confirm();await f.api.__test.submit({preventDefault(){}});assert.equal(f.api.client,f.main);assert(f.events.includes('signin'));assert(f.events.includes('join-admin'));
 f=fixture({pin:false});await f.api.__test.submit({preventDefault(){}});assert(!f.events.includes('signup'));assert.equal(f.api.client,f.main);
 f=fixture();f.element('accountEmailV385').value='owner@example.test';await f.api.__test.submit({preventDefault(){}});assert(!f.events.includes('signup'));assert(!f.events.includes('MAIN-UPDATE'));
 console.log('PASS: separate auth, owner stays connected, email confirmation required, PIN required, current account protected');
})().catch(e=>{console.error(e);process.exit(1)});

