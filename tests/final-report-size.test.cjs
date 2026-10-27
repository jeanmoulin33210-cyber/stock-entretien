const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const target=fs.existsSync(path.join(__dirname,'../js/05-application-principale.js'))?path.join(__dirname,'../js/05-application-principale.js'):path.join(__dirname,'main406.js');
const s=fs.readFileSync(target,'utf8');const code=s.slice(s.indexOf('async function emailCurrentReport(){'),s.indexOf('\nasync function confirmReportSentAndArchive'));
async function check(size,allowed){
let downloads=0,saves=0,closed=0,alerts=[];const popup={closed:false,location:{},close(){closed++}},button={textContent:'Envoyer',dataset:{},classList:{add(){},remove(){}}};
const c={state:{config:{lotName:'Test'}},ensureProductSheetsComplete:()=>true,$:()=>button,window:{open:()=>popup},buildReportPdfBlob:async()=>({blob:{size},filename:'rapport.pdf'}),URL:{createObjectURL:()=>{downloads++;return 'blob:test'},revokeObjectURL(){}},document:{createElement:()=>({click(){},remove(){}}),body:{appendChild(){}}},setTimeout(){},saveState(){saves++},toast(){},alert:m=>alerts.push(m),console:{error(){}}};vm.createContext(c);vm.runInContext(code,c);await c.emailCurrentReport();
assert.equal(downloads,allowed?1:0);assert.equal(saves,allowed?1:0);assert.equal(!!c.state.config._finalReportPreparedAt,allowed);assert.equal(closed,allowed?0:1);assert.equal(button.disabled,false);if(!allowed)assert.equal(alerts.length,1);
}
(async()=>{await check(4999999,true);await check(5000000,true);await check(5000001,false);await check(0,false);await check(NaN,false);console.log('Final report: 5 MB boundary, invalid PDF and no false sent state passed')})().catch(e=>{console.error(e);process.exit(1)});
