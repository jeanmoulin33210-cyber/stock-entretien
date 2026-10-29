const assert=require('node:assert/strict');
const {seal,unseal,validWorkspace,validAccountPassword}=require('../js/35-owner-account.js');
(async()=>{
 for(const value of ['Abcdefg1','École123','ABCD1234'])assert.equal(validAccountPassword(value),true);
 for(const value of ['Abcdef1','abcdefgh','Abcdefgh','abcdefg1','12345678',''])assert.equal(validAccountPassword(value),false);

 const original={v:1,hub:{url:'https://project.supabase.co',sessionId:'675ee51b-915e-416a-ac45-349d6a69f524'},adminToken:'a'.repeat(48),ownerToken:'b'.repeat(48)};
 const cipher=await seal(original,'test-password-12345');
 assert.deepEqual(await unseal(cipher,'test-password-12345'),original);
 assert(!JSON.stringify(cipher).includes(original.ownerToken));
 await assert.rejects(unseal(cipher,'wrong-password'));
 const corrupt={...cipher,ciphertext:(cipher.ciphertext[0]==='A'?'B':'A')+cipher.ciphertext.slice(1)};
 await assert.rejects(unseal(corrupt,'test-password-12345'));
 assert.throws(()=>validWorkspace({...original,ownerToken:'!'+original.ownerToken},original.hub.url));
 assert.throws(()=>validWorkspace(original,'https://attacker.supabase.co'));
 assert.deepEqual(validWorkspace(original,original.hub.url),original);
 console.log('PASS encrypted workspace round trip, wrong password, tamper rejection, project isolation, strict owner proof');
})().catch(e=>{console.error(e);process.exit(1)});
